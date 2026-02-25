import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { RiskLevel, ClaimStatus } from '@prisma/client';

interface FraudScoringJob {
    claimId: string;
    claimantId: string;
    amount: number;
    type: string;
    tenantId: string;
}

@Processor('fraud-scoring')
export class FraudProcessor {
    private readonly logger = new Logger(FraudProcessor.name);

    constructor(private prisma: PrismaService) { }

    @Process('score-claim')
    async scoreClaim(job: Job<FraudScoringJob>) {
        const { claimId, claimantId, amount, type, tenantId } = job.data;
        this.logger.log(`Scoring claim ${claimId}`);

        try {
            // 1. Velocity check — how many claims in recent periods
            const velocityScore = await this.calculateVelocityScore(claimantId, tenantId);

            // 2. Amount anomaly check
            const amountScore = await this.calculateAmountScore(amount, type, tenantId);

            // 3. Pattern matching
            const patternScore = await this.calculatePatternScore(claimantId, type, tenantId);

            // 4. Weighted aggregate
            const overallScore = Math.round(
                velocityScore * 0.3 + amountScore * 0.35 + patternScore * 0.35,
            );

            // 5. Determine risk level
            const riskLevel = this.determineRiskLevel(overallScore);

            // 6. Persist fraud score
            await this.prisma.fraudScore.upsert({
                where: { claimId },
                create: {
                    claimId,
                    overallScore,
                    riskLevel,
                    factors: { velocityScore, amountScore, patternScore },
                    velocityScore,
                    patternScore,
                    amountScore,
                },
                update: {
                    overallScore,
                    riskLevel,
                    factors: { velocityScore, amountScore, patternScore },
                    velocityScore,
                    patternScore,
                    amountScore,
                },
            });

            // 7. Auto-flag if high risk
            if (overallScore >= 70) {
                await this.prisma.claim.update({
                    where: { id: claimId },
                    data: { status: ClaimStatus.INVESTIGATION },
                });

                await this.prisma.claimStatusHistory.create({
                    data: {
                        claimId,
                        fromStatus: ClaimStatus.FRAUD_CHECK,
                        toStatus: ClaimStatus.INVESTIGATION,
                        changedById: claimantId, // System action attributed to claimant for tracking
                        reason: `Auto-flagged: fraud score ${overallScore} (${riskLevel})`,
                    },
                });
            }

            this.logger.log(
                `Claim ${claimId} scored: ${overallScore} (${riskLevel})`,
            );

            return { claimId, overallScore, riskLevel };
        } catch (error) {
            this.logger.error(`Failed to score claim ${claimId}: ${error}`);
            throw error;
        }
    }

    private async calculateVelocityScore(
        claimantId: string,
        tenantId: string,
    ): Promise<number> {
        const now = new Date();

        const [claims30d, claims90d, claims365d] = await Promise.all([
            this.prisma.claim.count({
                where: {
                    claimantId,
                    tenantId,
                    createdAt: { gte: new Date(now.getTime() - 30 * 86400000) },
                    deletedAt: null,
                },
            }),
            this.prisma.claim.count({
                where: {
                    claimantId,
                    tenantId,
                    createdAt: { gte: new Date(now.getTime() - 90 * 86400000) },
                    deletedAt: null,
                },
            }),
            this.prisma.claim.count({
                where: {
                    claimantId,
                    tenantId,
                    createdAt: { gte: new Date(now.getTime() - 365 * 86400000) },
                    deletedAt: null,
                },
            }),
        ]);

        // Scoring: more claims in shorter periods = higher risk
        let score = 0;
        if (claims30d > 3) score += 40;
        else if (claims30d > 1) score += 20;

        if (claims90d > 5) score += 30;
        else if (claims90d > 2) score += 15;

        if (claims365d > 10) score += 30;
        else if (claims365d > 5) score += 15;

        return Math.min(score, 100);
    }

    private async calculateAmountScore(
        amount: number,
        type: string,
        tenantId: string,
    ): Promise<number> {
        // Get average claim amount for this type
        const avgResult = await this.prisma.claim.aggregate({
            where: { tenantId, type: type as any, deletedAt: null },
            _avg: { claimAmount: true },
            _max: { claimAmount: true },
        });

        const avg = Number(avgResult._avg.claimAmount || 0);
        const max = Number(avgResult._max.claimAmount || 0);

        if (avg === 0) return 20; // No historical data → low baseline risk

        const ratio = amount / avg;

        // Amount significantly above average
        if (ratio > 5) return 90;
        if (ratio > 3) return 70;
        if (ratio > 2) return 50;
        if (ratio > 1.5) return 30;

        return 10;
    }

    private async calculatePatternScore(
        claimantId: string,
        type: string,
        tenantId: string,
    ): Promise<number> {
        let score = 0;

        // Check for previous rejected/investigated claims
        const previousFlags = await this.prisma.claim.count({
            where: {
                claimantId,
                tenantId,
                deletedAt: null,
                status: { in: [ClaimStatus.REJECTED, ClaimStatus.INVESTIGATION] },
            },
        });

        if (previousFlags > 2) score += 40;
        else if (previousFlags > 0) score += 20;

        // Check for same-type claims in quick succession
        const sameTypeRecent = await this.prisma.claim.count({
            where: {
                claimantId,
                tenantId,
                type: type as any,
                createdAt: { gte: new Date(Date.now() - 60 * 86400000) },
                deletedAt: null,
            },
        });

        if (sameTypeRecent > 2) score += 30;
        else if (sameTypeRecent > 1) score += 15;

        // Check for previous fraud scores
        const prevHighScores = await this.prisma.fraudScore.count({
            where: {
                claim: { claimantId, tenantId },
                overallScore: { gte: 70 },
            },
        });

        if (prevHighScores > 0) score += 30;

        return Math.min(score, 100);
    }

    private determineRiskLevel(score: number): RiskLevel {
        if (score >= 85) return RiskLevel.CRITICAL;
        if (score >= 70) return RiskLevel.HIGH;
        if (score >= 50) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
}
