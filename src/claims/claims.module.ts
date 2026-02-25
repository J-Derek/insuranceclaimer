import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { LedgerService } from '../common/services/ledger.service';
import { StorageService } from '../common/services/storage.service';

@Module({
    imports: [
        BullModule.registerQueue(
            { name: 'fraud-scoring' },
            { name: 'ocr-processing' },
        ),
        MulterModule.register({
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
        }),
    ],
    controllers: [ClaimsController],
    providers: [ClaimsService, AuditLogService, LedgerService, StorageService],
    exports: [ClaimsService],
})
export class ClaimsModule { }
