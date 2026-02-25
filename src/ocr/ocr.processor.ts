import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/services/storage.service';

interface OcrJob {
    documentId: string;
    storageKey: string;
    claimId: string;
}

@Processor('ocr-processing')
export class OcrProcessor {
    private readonly logger = new Logger(OcrProcessor.name);

    constructor(
        private prisma: PrismaService,
        private storage: StorageService,
    ) { }

    @Process('process-document')
    async processDocument(job: Job<OcrJob>) {
        const { documentId, storageKey, claimId } = job.data;
        this.logger.log(`Processing OCR for document ${documentId}`);

        try {
            // Update status to PROCESSING
            await this.prisma.claimDocument.update({
                where: { id: documentId },
                data: { ocrStatus: 'PROCESSING' },
            });

            // Download file from S3
            const fileBuffer = await this.storage.download(storageKey);

            // Simulated OCR extraction
            // In production, this would call Tesseract, Google Vision, or AWS Textract
            const ocrResult = await this.simulateOcrExtraction(fileBuffer, storageKey);

            // Store OCR result
            await this.prisma.claimDocument.update({
                where: { id: documentId },
                data: {
                    ocrStatus: 'COMPLETED',
                    ocrResult: ocrResult,
                },
            });

            this.logger.log(`OCR completed for document ${documentId}`);
            return { documentId, status: 'COMPLETED', extractedFields: Object.keys(ocrResult) };
        } catch (error) {
            this.logger.error(`OCR failed for document ${documentId}: ${error}`);

            await this.prisma.claimDocument.update({
                where: { id: documentId },
                data: { ocrStatus: 'FAILED' },
            });

            throw error;
        }
    }

    private async simulateOcrExtraction(
        fileBuffer: Buffer,
        storageKey: string,
    ): Promise<any> {
        // Simulated extraction — in production, replace with actual OCR service
        const fileExtension = storageKey.split('.').pop()?.toLowerCase();

        const result: any = {
            extractedAt: new Date().toISOString(),
            fileType: fileExtension,
            fileSizeBytes: fileBuffer.length,
            confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
            extractedFields: {},
        };

        // Simulate extracting common insurance document fields
        if (['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension || '')) {
            result.extractedFields = {
                documentType: 'INSURANCE_CLAIM_FORM',
                patientName: 'Extracted from OCR',
                hospitalName: 'Extracted from OCR',
                dateOfService: new Date().toISOString().split('T')[0],
                totalAmount: Math.floor(Math.random() * 100000 + 5000),
                diagnosisCode: `ICD-${Math.floor(Math.random() * 999)}`,
                providerNumber: `PROV-${Math.floor(Math.random() * 9999)}`,
            };
        }

        return result;
    }
}
