import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { OcrProcessor } from './ocr.processor';
import { StorageService } from '../common/services/storage.service';

@Module({
    imports: [BullModule.registerQueue({ name: 'ocr-processing' })],
    controllers: [OcrController],
    providers: [OcrService, OcrProcessor, StorageService],
    exports: [OcrService],
})
export class OcrModule { }
