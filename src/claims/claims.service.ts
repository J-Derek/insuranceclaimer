import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ClaimStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';
import { StorageService } from '../common/services/storage.service';
import { CreateClaimDto, UpdateClaimDto, TransitionClaimDto, QueryClaimsDto } from './dto/create-claim.dto';
import { isValidTransition, canRoleTransition, requiresReason } from './claims-state.machine';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ClaimsService {
    private readonly logger = new Logger(ClaimsService.name);

    constructor(
        private prisma: PrismaService,
        private auditLog: AuditLogService,
        private ledger: LedgerService,
        private storage: StorageService,
        @InjectQueue('fraud-scoring') private fraudQueue: Queue,
        @InjectQueue('ocr-processing') private ocrQueue: Queue,
    ) { }

    async create(
        dto: CreateClaimDto,
        userId: string,
        tenantId: string,
    ) {
        // Verify policy exists, belongs to user, and is active
        const policy = await this.prisma.policy.findFirst({
            where: {
                id: dto.policyId,
                tenantId,
                userId,
                status: 'ACTIVE',
                deletedAt: null,
            },
        });

        if (!policy) {
            throw new BadRequestException('Policy not found, inactive, or does not belong to you');
        }

        // Generate claim number
        const claimNumber = await this.generateClaimNumber();

        const claim = await this.prisma.claim.create({
            data: {
                tenantId,
                policyId: dto.policyId,
                claimantId: userId,
                claimNumber,
                type: dto.type,
                status: ClaimStatus.DRAFT,
                description: dto.description,
                incidentDate: new Date(dto.incidentDate),
                claimAmount: dto.claimAmount,
                channel: dto.channel || 'WEB',
            },
            include: {
                policy: { select: { policyNumber: true, type: true } },
            },
        });

        // Create initial status history
        await this.prisma.claimStatusHistory.create({
            data: {
                claimId: claim.id,
                toStatus: ClaimStatus.DRAFT,
                changedById: userId,
            },
        });

        await this.auditLog.log({
            tenantId,
            userId,
            action: 'CLAIM_CREATED',
            entityType: 'Claim',
            entityId: claim.id,
            newValue: { claimNumber, type: dto.type, amount: dto.claimAmount },
        });

        await this.ledger.addEntry({
            tenantId,
            eventType: 'CLAIM_CREATED',
            entityType: 'Claim',
            entityId: claim.id,
            payload: { claimNumber, type: dto.type, amount: dto.claimAmount },
        });

        return claim;
    }

    async findAll(query: QueryClaimsDto, userId: string, role: string, tenantId: string) {
        const where: any = { tenantId, deletedAt: null };

        // Policyholder can only see own claims
        if (role === Role.POLICYHOLDER) {
            where.claimantId = userId;
        }

        // Adjuster sees assigned claims
        if (role === Role.CLAIMS_ADJUSTER) {
            where.assignedAdjusterId = userId;
        }

        // Apply filters
        if (query.status) where.status = query.status;
        if (query.type) where.type = query.type;
        if (query.channel) where.channel = query.channel;
        if (query.assignedTo) where.assignedAdjusterId = query.assignedTo;
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
        }

        const [claims, total] = await Promise.all([
            this.prisma.claim.findMany({
                where,
                skip: query.skip,
                take: query.limit,
                orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
                include: {
                    policy: { select: { policyNumber: true, type: true } },
                    claimant: { select: { firstName: true, lastName: true, email: true } },
                    fraudScore: { select: { overallScore: true, riskLevel: true } },
                },
            }),
            this.prisma.claim.count({ where }),
        ]);

        return paginatedResponse(claims, total, query);
    }

    async findOne(id: string, userId: string, role: string, tenantId: string) {
        const claim = await this.prisma.claim.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                policy: { select: { policyNumber: true, type: true, coverageAmount: true } },
                claimant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                assignedAdjuster: { select: { id: true, firstName: true, lastName: true } },
                documents: {
                    select: { id: true, fileName: true, fileType: true, fileSizeBytes: true, ocrStatus: true, createdAt: true },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                    include: { changedBy: { select: { firstName: true, lastName: true } } },
                },
                fraudScore: true,
                payments: { select: { id: true, amount: true, status: true, method: true, paidAt: true } },
            },
        });

        if (!claim) throw new NotFoundException('Claim not found');

        // Policyholder can only view own claims
        if (role === Role.POLICYHOLDER && claim.claimantId !== userId) {
            throw new ForbiddenException('You can only view your own claims');
        }

        return claim;
    }

    async update(id: string, dto: UpdateClaimDto, userId: string, tenantId: string) {
        const claim = await this.prisma.claim.findFirst({
            where: { id, tenantId, claimantId: userId, status: ClaimStatus.DRAFT, deletedAt: null },
        });

        if (!claim) {
            throw new BadRequestException('Claim not found or cannot be edited (only DRAFT claims are editable)');
        }

        const updatedClaim = await this.prisma.claim.update({
            where: { id },
            data: {
                description: dto.description,
                claimAmount: dto.claimAmount,
                incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
            },
        });

        return updatedClaim;
    }

    async transition(
        id: string,
        dto: TransitionClaimDto,
        userId: string,
        role: string,
        tenantId: string,
    ) {
        const claim = await this.prisma.claim.findFirst({
            where: { id, tenantId, deletedAt: null },
        });

        if (!claim) throw new NotFoundException('Claim not found');

        // Validate transition
        if (!isValidTransition(claim.status, dto.toStatus)) {
            throw new BadRequestException(
                `Invalid transition: ${claim.status} → ${dto.toStatus}`,
            );
        }

        if (!canRoleTransition(claim.status, dto.toStatus, role)) {
            throw new ForbiddenException(
                `Role ${role} cannot perform transition: ${claim.status} → ${dto.toStatus}`,
            );
        }

        // Require reason for rejections and disputes
        if (requiresReason(dto.toStatus) && !dto.reason) {
            throw new BadRequestException(`Reason is required for ${dto.toStatus} status`);
        }

        const oldStatus = claim.status;

        // Update claim
        const updateData: any = { status: dto.toStatus };
        if (dto.approvedAmount !== undefined) updateData.approvedAmount = dto.approvedAmount;

        const updatedClaim = await this.prisma.claim.update({
            where: { id },
            data: updateData,
        });

        // Record status history
        await this.prisma.claimStatusHistory.create({
            data: {
                claimId: id,
                fromStatus: oldStatus,
                toStatus: dto.toStatus,
                changedById: userId,
                reason: dto.reason,
            },
        });

        // Audit and ledger
        await this.auditLog.log({
            tenantId,
            userId,
            action: 'CLAIM_STATUS_CHANGED',
            entityType: 'Claim',
            entityId: id,
            oldValue: { status: oldStatus },
            newValue: { status: dto.toStatus, reason: dto.reason },
        });

        await this.ledger.addEntry({
            tenantId,
            eventType: 'CLAIM_STATUS_CHANGED',
            entityType: 'Claim',
            entityId: id,
            payload: { from: oldStatus, to: dto.toStatus, reason: dto.reason },
        });

        // Side effects
        if (dto.toStatus === ClaimStatus.SUBMITTED) {
            // Auto-transition to UNDER_REVIEW could happen here
        }

        if (dto.toStatus === ClaimStatus.FRAUD_CHECK) {
            await this.fraudQueue.add('score-claim', {
                claimId: id,
                claimantId: claim.claimantId,
                amount: Number(claim.claimAmount),
                type: claim.type,
                tenantId,
            });
        }

        return updatedClaim;
    }

    async uploadDocument(
        claimId: string,
        file: { buffer: Buffer; originalname: string; mimetype: string },
        userId: string,
        tenantId: string,
    ) {
        const claim = await this.prisma.claim.findFirst({
            where: { id: claimId, tenantId, deletedAt: null },
        });

        if (!claim) throw new NotFoundException('Claim not found');

        // Upload to S3
        const { storageKey, size } = await this.storage.upload(
            file.buffer,
            file.originalname,
            file.mimetype,
        );

        const document = await this.prisma.claimDocument.create({
            data: {
                claimId,
                fileName: file.originalname,
                fileType: file.mimetype,
                fileSizeBytes: size,
                storageKey,
                uploadedById: userId,
                ocrStatus: 'PENDING',
            },
        });

        // Queue OCR processing
        await this.ocrQueue.add('process-document', {
            documentId: document.id,
            storageKey,
            claimId,
        });

        await this.auditLog.log({
            tenantId,
            userId,
            action: 'DOCUMENT_UPLOADED',
            entityType: 'ClaimDocument',
            entityId: document.id,
            newValue: { fileName: file.originalname, claimId },
        });

        return document;
    }

    async getDocuments(claimId: string, tenantId: string) {
        const claim = await this.prisma.claim.findFirst({
            where: { id: claimId, tenantId, deletedAt: null },
        });
        if (!claim) throw new NotFoundException('Claim not found');

        return this.prisma.claimDocument.findMany({
            where: { claimId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getHistory(claimId: string, tenantId: string) {
        const claim = await this.prisma.claim.findFirst({
            where: { id: claimId, tenantId, deletedAt: null },
        });
        if (!claim) throw new NotFoundException('Claim not found');

        return this.prisma.claimStatusHistory.findMany({
            where: { claimId },
            orderBy: { createdAt: 'desc' },
            include: { changedBy: { select: { firstName: true, lastName: true, role: true } } },
        });
    }

    private async generateClaimNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const lastClaim = await this.prisma.claim.findFirst({
            where: { claimNumber: { startsWith: `KS-${year}` } },
            orderBy: { claimNumber: 'desc' },
            select: { claimNumber: true },
        });

        let sequence = 1;
        if (lastClaim) {
            const parts = lastClaim.claimNumber.split('-');
            sequence = parseInt(parts[2], 10) + 1;
        }

        return `KS-${year}-${sequence.toString().padStart(6, '0')}`;
    }
}
