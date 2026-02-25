import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';
import { FraudProcessor } from './fraud.processor';
import { AuditLogService } from '../common/services/audit-log.service';

@Module({
    imports: [BullModule.registerQueue({ name: 'fraud-scoring' })],
    controllers: [FraudController],
    providers: [FraudService, FraudProcessor, AuditLogService],
    exports: [FraudService],
})
export class FraudModule { }
