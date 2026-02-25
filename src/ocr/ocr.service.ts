import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OcrService {
    private readonly logger = new Logger(OcrService.name);

    constructor(
        private prisma: PrismaService,
        @InjectQueue('ocr-processing') private ocrQueue: Queue,
    ) { }

    async triggerProcessing(documentId: string, tenantId: string) {
        const document = await this.prisma.claimDocument.findUnique({
            where: { id: documentId },
            include: { claim: { select: { tenantId: true } } },
        });

        if (!document || document.claim.tenantId !== tenantId) {
            throw new NotFoundException('Document not found');
        }

        await this.ocrQueue.add('process-document', {
            documentId: document.id,
            storageKey: document.storageKey,
            claimId: document.claimId,
        });

        return { message: 'OCR processing queued', documentId };
    }

    async getResults(documentId: string, tenantId: string) {
        const document = await this.prisma.claimDocument.findUnique({
            where: { id: documentId },
            include: { claim: { select: { tenantId: true } } },
        });

        if (!document || document.claim.tenantId !== tenantId) {
            throw new NotFoundException('Document not found');
        }

        return {
            documentId: document.id,
            fileName: document.fileName,
            ocrStatus: document.ocrStatus,
            ocrResult: document.ocrResult,
        };
    }
}
