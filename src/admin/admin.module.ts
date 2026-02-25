import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';

@Module({
    controllers: [AdminController],
    providers: [AdminService, AuditLogService, LedgerService],
})
export class AdminModule { }
