import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';
import { StorageService } from '../common/services/storage.service';
import { ClaimStatus, Role } from '@prisma/client';

describe('ClaimsService', () => {
    let service: ClaimsService;
    let prisma: any;

    const tenantId = 'tenant-uuid-1';
    const userId = 'user-uuid-1';

    const mockClaim = {
        id: 'claim-uuid-1',
        tenantId,
        policyId: 'policy-uuid-1',
        claimantId: userId,
        claimNumber: 'KS-2026-000001',
        type: 'MEDICAL',
        status: ClaimStatus.DRAFT,
        description: 'Test claim description here',
        incidentDate: new Date(),
        claimAmount: 50000,
        channel: 'WEB',
        deletedAt: null,
    };

    beforeEach(async () => {
        prisma = {
            claim: {
                create: jest.fn().mockResolvedValue(mockClaim),
                findFirst: jest.fn(),
                findMany: jest.fn().mockResolvedValue([mockClaim]),
                count: jest.fn().mockResolvedValue(1),
                update: jest.fn(),
            },
            claimStatusHistory: { create: jest.fn() },
            claimDocument: { findMany: jest.fn().mockResolvedValue([]) },
            policy: { findFirst: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClaimsService,
                { provide: PrismaService, useValue: prisma },
                { provide: AuditLogService, useValue: { log: jest.fn() } },
                { provide: LedgerService, useValue: { addEntry: jest.fn() } },
                { provide: StorageService, useValue: { upload: jest.fn() } },
                { provide: 'BullQueue_fraud-scoring', useValue: { add: jest.fn() } },
                { provide: 'BullQueue_ocr-processing', useValue: { add: jest.fn() } },
            ],
        }).compile();

        service = module.get<ClaimsService>(ClaimsService);
    });

    describe('create', () => {
        it('should reject claim with inactive policy', async () => {
            prisma.policy.findFirst.mockResolvedValue(null);

            await expect(
                service.create(
                    { policyId: 'bad-policy', type: 'MEDICAL' as any, description: 'Test claim description', incidentDate: '2026-02-20', claimAmount: 50000 },
                    userId,
                    tenantId,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('transition', () => {
        it('should reject invalid transitions', async () => {
            prisma.claim.findFirst.mockResolvedValue({ ...mockClaim, status: ClaimStatus.DRAFT });

            await expect(
                service.transition(
                    'claim-uuid-1',
                    { toStatus: ClaimStatus.APPROVED },
                    userId,
                    Role.POLICYHOLDER,
                    tenantId,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject unauthorized role transitions', async () => {
            prisma.claim.findFirst.mockResolvedValue({ ...mockClaim, status: ClaimStatus.FRAUD_CHECK });

            await expect(
                service.transition(
                    'claim-uuid-1',
                    { toStatus: ClaimStatus.APPROVED },
                    userId,
                    Role.POLICYHOLDER, // Policyholder cannot approve
                    tenantId,
                ),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should require reason for rejection', async () => {
            prisma.claim.findFirst.mockResolvedValue({ ...mockClaim, status: ClaimStatus.FRAUD_CHECK });

            await expect(
                service.transition(
                    'claim-uuid-1',
                    { toStatus: ClaimStatus.REJECTED },
                    userId,
                    Role.CLAIMS_ADJUSTER,
                    tenantId,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject non-existent claim', async () => {
            prisma.claim.findFirst.mockResolvedValue(null);

            await expect(
                service.transition(
                    'non-existent',
                    { toStatus: ClaimStatus.SUBMITTED },
                    userId,
                    Role.POLICYHOLDER,
                    tenantId,
                ),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('findOne', () => {
        it('should restrict policyholder to own claims', async () => {
            prisma.claim.findFirst.mockResolvedValue({
                ...mockClaim,
                claimantId: 'other-user-id', // Not the requesting user
            });

            await expect(
                service.findOne('claim-uuid-1', userId, Role.POLICYHOLDER, tenantId),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('update', () => {
        it('should only allow editing DRAFT claims', async () => {
            prisma.claim.findFirst.mockResolvedValue(null); // No DRAFT claim found

            await expect(
                service.update('claim-uuid-1', { description: 'Updated' }, userId, tenantId),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
