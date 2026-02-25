import { Controller, Get, Post, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('OCR')
@Controller('ocr')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class OcrController {
    constructor(private readonly ocrService: OcrService) { }

    @Post('process/:documentId')
    @Roles(Role.CLAIMS_ADJUSTER, Role.ADMIN)
    @ApiOperation({ summary: 'Trigger OCR processing for a document' })
    async process(
        @Param('documentId', ParseUUIDPipe) documentId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.ocrService.triggerProcessing(documentId, tenantId);
    }

    @Get('results/:documentId')
    @ApiOperation({ summary: 'Get OCR processing results' })
    async getResults(
        @Param('documentId', ParseUUIDPipe) documentId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.ocrService.getResults(documentId, tenantId);
    }
}
