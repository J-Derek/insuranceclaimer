import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Role, ClaimType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private prisma: PrismaService,
        private auditLog: AuditLogService,
        private ledger: LedgerService,
    ) { }

    async listUsers(tenantId: string) {
        return this.prisma.user.findMany({
            where: { tenantId, deletedAt: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async assignRole(userId: string, newRole: Role, adminId: string, tenantId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId, deletedAt: null },
        });

        if (!user) throw new NotFoundException('User not found');

        const oldRole = user.role;

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
        });

        await this.auditLog.log({
            tenantId,
            userId: adminId,
            action: 'ROLE_ASSIGNED',
            entityType: 'User',
            entityId: userId,
            oldValue: { role: oldRole },
            newValue: { role: newRole },
        });

        return updated;
    }

    async getClaimsAnalytics(tenantId: string) {
        const [
            totalClaims,
            byStatus,
            byType,
            avgProcessingDays,
            totalPayouts,
        ] = await Promise.all([
            this.prisma.claim.count({ where: { tenantId, deletedAt: null } }),

            this.prisma.claim.groupBy({
                by: ['status'],
                where: { tenantId, deletedAt: null },
                _count: true,
            }),

            this.prisma.claim.groupBy({
                by: ['type'],
                where: { tenantId, deletedAt: null },
                _count: true,
                _sum: { claimAmount: true },
            }),

            this.prisma.claim.aggregate({
                where: { tenantId, deletedAt: null, processingDays: { not: null } },
                _avg: { processingDays: true },
            }),

            this.prisma.payment.aggregate({
                where: { tenantId, status: 'COMPLETED' },
                _sum: { amount: true },
                _count: true,
            }),
        ]);

        return {
            totalClaims,
            byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
            byType: byType.map((t) => ({
                type: t.type,
                count: t._count,
                totalAmount: t._sum.claimAmount,
            })),
            avgProcessingDays: avgProcessingDays._avg.processingDays || 0,
            totalPayouts: {
                amount: totalPayouts._sum.amount || 0,
                count: totalPayouts._count,
            },
        };
    }

    async getActuarialMetrics(tenantId: string) {
        const metrics = await this.prisma.actuarialMetrics.findMany({
            where: { tenantId },
            orderBy: [{ periodEnd: 'desc' }, { claimType: 'asc' }],
            take: 50,
        });

        // Compute real-time summary
        const claimTypes = Object.values(ClaimType);
        const summaries = await Promise.all(
            claimTypes.map(async (type) => {
                const [claimStats, fraudStats] = await Promise.all([
                    this.prisma.claim.aggregate({
                        where: { tenantId, type, deletedAt: null },
                        _count: true,
                        _sum: { claimAmount: true, approvedAmount: true },
                        _avg: { claimAmount: true },
                    }),
                    this.prisma.fraudScore.count({
                        where: {
                            claim: { tenantId, type },
                            riskLevel: { in: ['CRITICAL', 'HIGH'] },
                        },
                    }),
                ]);

                const totalClaims = claimStats._count || 0;
                const totalClaimAmount = Number(claimStats._sum.claimAmount || 0);
                const totalApproved = Number(claimStats._sum.approvedAmount || 0);

                return {
                    claimType: type,
                    totalClaims,
                    totalClaimAmount,
                    totalApprovedAmount: totalApproved,
                    averageSeverity: Number(claimStats._avg.claimAmount || 0),
                    lossRatio: totalClaimAmount > 0 ? totalApproved / totalClaimAmount : 0,
                    flaggedClaims: fraudStats,
                    fraudRate: totalClaims > 0 ? (fraudStats / totalClaims) * 100 : 0,
                };
            }),
        );

        return { storedMetrics: metrics, realtimeSummary: summaries };
    }

    async getFraudAnalytics(tenantId: string) {
        const [total, byRiskLevel, recentFlags, overrideRate] = await Promise.all([
            this.prisma.fraudScore.count({ where: { claim: { tenantId } } }),

            this.prisma.fraudScore.groupBy({
                by: ['riskLevel'],
                where: { claim: { tenantId } },
                _count: true,
                _avg: { overallScore: true },
            }),

            this.prisma.fraudScore.findMany({
                where: { claim: { tenantId }, riskLevel: { in: ['CRITICAL', 'HIGH'] } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    claim: { select: { claimNumber: true, claimAmount: true, type: true } },
                },
            }),

            this.prisma.fraudScore.count({
                where: { claim: { tenantId }, isOverridden: true },
            }),
        ]);

        return {
            total,
            byRiskLevel: byRiskLevel.map((r) => ({
                riskLevel: r.riskLevel,
                count: r._count,
                avgScore: r._avg.overallScore,
            })),
            recentFlags,
            overrideRate: total > 0 ? ((overrideRate / total) * 100).toFixed(1) : '0.0',
        };
    }

    async getAuditLogs(tenantId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { user: { select: { firstName: true, lastName: true, role: true } } },
            }),
            this.prisma.auditLog.count({ where: { tenantId } }),
        ]);

        return { data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async verifyLedger(tenantId: string) {
        return this.ledger.verifyIntegrity(tenantId);
    }
}
