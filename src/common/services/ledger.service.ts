import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LedgerService {
    private readonly logger = new Logger(LedgerService.name);

    constructor(private prisma: PrismaService) { }

    async addEntry(params: {
        tenantId: string;
        eventType: string;
        entityType: string;
        entityId: string;
        payload: any;
    }): Promise<void> {
        const { tenantId, eventType, entityType, entityId, payload } = params;

        try {
            const lastEntry = await this.prisma.ledgerEntry.findFirst({
                where: { tenantId },
                orderBy: { sequenceNumber: 'desc' },
                select: { sequenceNumber: true, currentHash: true },
            });

            const sequenceNumber = lastEntry ? lastEntry.sequenceNumber + 1 : 1;
            const previousHash =
                lastEntry?.currentHash || this.genesisHash(tenantId);

            const currentHash = this.computeHash(
                sequenceNumber,
                eventType,
                entityId,
                payload,
                previousHash,
            );

            await this.prisma.ledgerEntry.create({
                data: {
                    tenantId,
                    sequenceNumber,
                    eventType,
                    entityType,
                    entityId,
                    payload,
                    previousHash,
                    currentHash,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to add ledger entry: ${error}`);
            throw error;
        }
    }

    async verifyIntegrity(tenantId: string): Promise<{
        valid: boolean;
        totalEntries: number;
        invalidAtSequence?: number;
    }> {
        const entries = await this.prisma.ledgerEntry.findMany({
            where: { tenantId },
            orderBy: { sequenceNumber: 'asc' },
        });

        if (entries.length === 0) {
            return { valid: true, totalEntries: 0 };
        }

        let expectedPreviousHash = this.genesisHash(tenantId);

        for (const entry of entries) {
            if (entry.previousHash !== expectedPreviousHash) {
                return {
                    valid: false,
                    totalEntries: entries.length,
                    invalidAtSequence: entry.sequenceNumber,
                };
            }

            const expectedCurrentHash = this.computeHash(
                entry.sequenceNumber,
                entry.eventType,
                entry.entityId,
                entry.payload,
                entry.previousHash,
            );

            if (entry.currentHash !== expectedCurrentHash) {
                return {
                    valid: false,
                    totalEntries: entries.length,
                    invalidAtSequence: entry.sequenceNumber,
                };
            }

            expectedPreviousHash = entry.currentHash;
        }

        return { valid: true, totalEntries: entries.length };
    }

    private genesisHash(tenantId: string): string {
        return createHash('sha256')
            .update(`GENESIS:${tenantId}`)
            .digest('hex');
    }

    private computeHash(
        sequenceNumber: number,
        eventType: string,
        entityId: string,
        payload: any,
        previousHash: string,
    ): string {
        const data = `${sequenceNumber}:${eventType}:${entityId}:${JSON.stringify(payload)}:${previousHash}:${Date.now()}`;
        return createHash('sha256').update(data).digest('hex');
    }
}
