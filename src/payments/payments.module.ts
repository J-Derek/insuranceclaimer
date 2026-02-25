import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';

@Module({
    controllers: [PaymentsController],
    providers: [PaymentsService, AuditLogService, LedgerService],
    exports: [PaymentsService],
})
export class PaymentsModule { }
