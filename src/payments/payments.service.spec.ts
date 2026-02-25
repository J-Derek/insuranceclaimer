import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let prisma: any;

    const tenantId = 'tenant-uuid-1';

    beforeEach(async () => {
        prisma = {
            claim: {
                findFirst: jest.fn(),
                update: jest.fn(),
            },
            claimStatusHistory: { create: jest.fn() },
            payment: {
                create: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
            },
            integrationWebhook: {
                create: jest.fn(),
                findFirst: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: prisma },
                { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue({}) } },
                { provide: AuditLogService, useValue: { log: jest.fn() } },
                { provide: LedgerService, useValue: { addEntry: jest.fn() } },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
    });

    describe('initiatePayment', () => {
        it('should reject payment for non-PAYMENT_PENDING claims', async () => {
            prisma.claim.findFirst.mockResolvedValue(null);

            await expect(
                service.initiatePayment('claim-uuid', tenantId),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject duplicate payment attempts', async () => {
            prisma.claim.findFirst.mockResolvedValue({
                id: 'claim-uuid',
                status: 'PAYMENT_PENDING',
                claimAmount: 50000,
                claimant: { id: 'user-1', phone: '+254712345678', firstName: 'Test' },
            });
            prisma.payment.findFirst.mockResolvedValue({ id: 'existing-payment' });

            await expect(
                service.initiatePayment('claim-uuid', tenantId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('handleMpesaCallback', () => {
        it('should reject invalid callback payload', async () => {
            await expect(
                service.handleMpesaCallback({ invalid: 'payload' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should detect and ignore duplicate callbacks (idempotency)', async () => {
            prisma.payment.findFirst.mockResolvedValue({
                id: 'payment-uuid',
                tenantId,
                claimId: 'claim-uuid',
                payeeId: 'user-uuid',
                amount: 50000,
            });
            prisma.integrationWebhook.findFirst.mockResolvedValue({
                id: 'existing-webhook',
                idempotencyKey: 'mpesa-checkout-123',
            });

            const result = await service.handleMpesaCallback({
                Body: {
                    stkCallback: {
                        CheckoutRequestID: 'checkout-123',
                        ResultCode: 0,
                        ResultDesc: 'Success',
                        CallbackMetadata: { Item: [] },
                    },
                },
            });

            expect(result.ResultCode).toBe(0);
            expect(prisma.payment.update).not.toHaveBeenCalled();
        });
    });
});
