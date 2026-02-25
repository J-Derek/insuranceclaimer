import { Test, TestingModule } from '@nestjs/testing';
import { LedgerService } from './ledger.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LedgerService', () => {
    let service: LedgerService;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            ledgerEntry: {
                findFirst: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LedgerService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<LedgerService>(LedgerService);
    });

    describe('addEntry', () => {
        it('should create genesis entry when ledger is empty', async () => {
            prisma.ledgerEntry.findFirst.mockResolvedValue(null);
            prisma.ledgerEntry.create.mockResolvedValue({});

            await service.addEntry({
                tenantId: 'tenant-1',
                eventType: 'CLAIM_CREATED',
                entityType: 'Claim',
                entityId: 'claim-1',
                payload: { test: true },
            });

            expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        sequenceNumber: 1,
                        eventType: 'CLAIM_CREATED',
                    }),
                }),
            );
        });

        it('should chain from previous entry', async () => {
            prisma.ledgerEntry.findFirst.mockResolvedValue({
                sequenceNumber: 5,
                currentHash: 'prev-hash-123',
            });
            prisma.ledgerEntry.create.mockResolvedValue({});

            await service.addEntry({
                tenantId: 'tenant-1',
                eventType: 'STATUS_CHANGED',
                entityType: 'Claim',
                entityId: 'claim-2',
                payload: { from: 'DRAFT', to: 'SUBMITTED' },
            });

            expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        sequenceNumber: 6,
                        previousHash: 'prev-hash-123',
                    }),
                }),
            );
        });
    });

    describe('verifyIntegrity', () => {
        it('should return valid for empty ledger', async () => {
            prisma.ledgerEntry.findMany.mockResolvedValue([]);

            const result = await service.verifyIntegrity('tenant-1');
            expect(result.valid).toBe(true);
            expect(result.totalEntries).toBe(0);
        });
    });
});
