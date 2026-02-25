import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { ClaimStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private auditLog: AuditLogService,
        private ledger: LedgerService,
    ) { }

    async initiatePayment(claimId: string, tenantId: string) {
        const claim = await this.prisma.claim.findFirst({
            where: { id: claimId, tenantId, status: ClaimStatus.PAYMENT_PENDING, deletedAt: null },
            include: { claimant: { select: { id: true, phone: true, firstName: true } } },
        });

        if (!claim) {
            throw new BadRequestException('Claim not found or not in PAYMENT_PENDING status');
        }

        const amount = claim.approvedAmount || claim.claimAmount;

        // Generate idempotency key
        const idempotencyKey = createHash('sha256')
            .update(`${claimId}:${amount}:${Date.now()}`)
            .digest('hex');

        // Check for existing payment
        const existing = await this.prisma.payment.findFirst({
            where: { claimId, status: { in: ['PENDING', 'PROCESSING'] } },
        });

        if (existing) {
            throw new BadRequestException('Payment already in progress for this claim');
        }

        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                tenantId,
                claimId,
                payeeId: claim.claimant.id,
                amount: Number(amount),
                currency: 'KES',
                method: 'MPESA',
                status: PaymentStatus.PROCESSING,
                idempotencyKey,
            },
        });

        // Simulate M-Pesa STK Push (Daraja API)
        const mpesaResult = await this.triggerMpesaStkPush(
            claim.claimant.phone,
            Number(amount),
            payment.id,
        );

        await this.auditLog.log({
            tenantId,
            userId: claim.claimant.id,
            action: 'PAYMENT_INITIATED',
            entityType: 'Payment',
            entityId: payment.id,
            newValue: { amount: Number(amount), method: 'MPESA', claimId },
        });

        return {
            paymentId: payment.id,
            status: payment.status,
            amount: Number(amount),
            phone: claim.claimant.phone,
            mpesaCheckoutRequestId: mpesaResult.CheckoutRequestID,
        };
    }

    async handleMpesaCallback(body: any) {
        const { stkCallback } = body.Body || {};
        if (!stkCallback) {
            throw new BadRequestException('Invalid M-Pesa callback payload');
        }

        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

        this.logger.log(`M-Pesa callback: ${ResultCode} - ${ResultDesc}`);

        // Find payment by checkout request ID (stored in metadata)
        // In production, map CheckoutRequestID to payment via a lookup
        const payment = await this.prisma.payment.findFirst({
            where: { status: 'PROCESSING' },
            orderBy: { createdAt: 'desc' },
        });

        if (!payment) {
            this.logger.warn('No matching payment found for M-Pesa callback');
            // Still log the webhook
            await this.prisma.integrationWebhook.create({
                data: {
                    tenantId: payment?.tenantId || '00000000-0000-0000-0000-000000000001',
                    provider: 'MPESA',
                    eventType: 'STK_CALLBACK',
                    payload: body,
                    status: 'FAILED',
                    errorMessage: 'No matching payment found',
                    idempotencyKey: `mpesa-${CheckoutRequestID || Date.now()}`,
                },
            });
            return { ResultCode: 0, ResultDesc: 'Accepted' };
        }

        // Idempotency check
        const existingWebhook = await this.prisma.integrationWebhook.findFirst({
            where: { idempotencyKey: `mpesa-${CheckoutRequestID}` },
        });

        if (existingWebhook) {
            this.logger.warn('Duplicate M-Pesa callback detected — ignoring');
            return { ResultCode: 0, ResultDesc: 'Accepted' };
        }

        // Log webhook
        await this.prisma.integrationWebhook.create({
            data: {
                tenantId: payment.tenantId,
                provider: 'MPESA',
                eventType: 'STK_CALLBACK',
                payload: body,
                status: 'PROCESSED',
                processedAt: new Date(),
                idempotencyKey: `mpesa-${CheckoutRequestID}`,
            },
        });

        if (ResultCode === 0) {
            // Success
            const metadata = CallbackMetadata?.Item || [];
            const receiptNumber = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
            const transactionDate = metadata.find((i: any) => i.Name === 'TransactionDate')?.Value;

            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.COMPLETED,
                    mpesaReceiptNumber: receiptNumber?.toString(),
                    mpesaTransactionId: CheckoutRequestID,
                    paidAt: new Date(),
                },
            });

            // Update claim to SETTLED
            await this.prisma.claim.update({
                where: { id: payment.claimId },
                data: { status: ClaimStatus.SETTLED },
            });

            await this.prisma.claimStatusHistory.create({
                data: {
                    claimId: payment.claimId,
                    fromStatus: ClaimStatus.PAYMENT_PENDING,
                    toStatus: ClaimStatus.SETTLED,
                    changedById: payment.payeeId,
                    reason: `M-Pesa payment confirmed: ${receiptNumber}`,
                },
            });

            await this.ledger.addEntry({
                tenantId: payment.tenantId,
                eventType: 'PAYMENT_COMPLETED',
                entityType: 'Payment',
                entityId: payment.id,
                payload: {
                    amount: Number(payment.amount),
                    receiptNumber,
                    transactionId: CheckoutRequestID,
                },
            });
        } else {
            // Failed
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.FAILED },
            });
        }

        return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    async findAll(tenantId: string) {
        return this.prisma.payment.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                claim: { select: { claimNumber: true, type: true } },
                payee: { select: { firstName: true, lastName: true, phone: true } },
            },
        });
    }

    async findOne(id: string, tenantId: string) {
        const payment = await this.prisma.payment.findFirst({
            where: { id, tenantId },
            include: {
                claim: { select: { claimNumber: true, type: true, claimAmount: true, approvedAmount: true } },
                payee: { select: { firstName: true, lastName: true, email: true, phone: true } },
            },
        });

        if (!payment) throw new NotFoundException('Payment not found');
        return payment;
    }

    private async triggerMpesaStkPush(
        phone: string,
        amount: number,
        paymentId: string,
    ): Promise<{ CheckoutRequestID: string }> {
        // Simulated M-Pesa Daraja API STK Push
        // In production, this calls:
        // POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
        const config = this.configService.get('mpesa');

        this.logger.log(
            `Triggering M-Pesa STK Push: phone=${phone}, amount=${amount}, env=${config?.environment}`,
        );

        // Simulate response
        return {
            CheckoutRequestID: `ws_CO_${Date.now()}_${paymentId.substring(0, 8)}`,
        };
    }
}
