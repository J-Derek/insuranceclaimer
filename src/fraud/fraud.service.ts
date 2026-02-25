import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { RiskLevel } from '@prisma/client';

@Injectable()
export class FraudService {
    private readonly logger = new Logger(FraudService.name);

    constructor(
        private prisma: PrismaService,
        private auditLog: AuditLogService,
    ) { }

    async getScores(tenantId: string, riskLevel?: RiskLevel) {
        const where: any = { claim: { tenantId } };
        if (riskLevel) where.riskLevel = riskLevel;

        return this.prisma.fraudScore.findMany({
            where,
            orderBy: { overallScore: 'desc' },
            include: {
                claim: {
                    select: {
                        claimNumber: true,
                        type: true,
                        claimAmount: true,
                        status: true,
                        claimant: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
    }

    async getScoreByClaimId(claimId: string, tenantId: string) {
        const score = await this.prisma.fraudScore.findUnique({
            where: { claimId },
            include: {
                claim: {
                    select: {
                        tenantId: true,
                        claimNumber: true,
                        type: true,
                        claimAmount: true,
                    },
                },
                overriddenBy: { select: { firstName: true, lastName: true } },
            },
        });

        if (!score || score.claim.tenantId !== tenantId) {
            throw new NotFoundException('Fraud score not found');
        }

        return score;
    }

    async overrideScore(
        claimId: string,
        overrideReason: string,
        newRiskLevel: RiskLevel,
        userId: string,
        tenantId: string,
    ) {
        const score = await this.prisma.fraudScore.findUnique({
            where: { claimId },
            include: { claim: { select: { tenantId: true } } },
        });

        if (!score || score.claim.tenantId !== tenantId) {
            throw new NotFoundException('Fraud score not found');
        }

        const oldRiskLevel = score.riskLevel;

        const updated = await this.prisma.fraudScore.update({
            where: { claimId },
            data: {
                isOverridden: true,
                overriddenById: userId,
                overrideReason,
                riskLevel: newRiskLevel,
            },
        });

        await this.auditLog.log({
            tenantId,
            userId,
            action: 'FRAUD_SCORE_OVERRIDDEN',
            entityType: 'FraudScore',
            entityId: score.id,
            oldValue: { riskLevel: oldRiskLevel, isOverridden: false },
            newValue: { riskLevel: newRiskLevel, isOverridden: true, reason: overrideReason },
        });

        this.logger.warn(
            `Fraud score overridden for claim ${claimId}: ${oldRiskLevel} → ${newRiskLevel} by user ${userId}`,
        );

        return updated;
    }

    async getDashboard(tenantId: string) {
        const [total, critical, high, medium, low, overridden] = await Promise.all([
            this.prisma.fraudScore.count({ where: { claim: { tenantId } } }),
            this.prisma.fraudScore.count({ where: { claim: { tenantId }, riskLevel: 'CRITICAL' } }),
            this.prisma.fraudScore.count({ where: { claim: { tenantId }, riskLevel: 'HIGH' } }),
            this.prisma.fraudScore.count({ where: { claim: { tenantId }, riskLevel: 'MEDIUM' } }),
            this.prisma.fraudScore.count({ where: { claim: { tenantId }, riskLevel: 'LOW' } }),
            this.prisma.fraudScore.count({ where: { claim: { tenantId }, isOverridden: true } }),
        ]);

        const detectionRate = total > 0 ? ((critical + high) / total * 100).toFixed(1) : '0.0';

        return {
            total,
            byRiskLevel: { critical, high, medium, low },
            overridden,
            detectionRate: `${detectionRate}%`,
        };
    }
}
