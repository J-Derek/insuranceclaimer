import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ClaimsService } from './claims.service';
import { CreateClaimDto, UpdateClaimDto, TransitionClaimDto, QueryClaimsDto } from './dto/create-claim.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Claims')
@Controller('claims')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ClaimsController {
    constructor(private readonly claimsService: ClaimsService) { }

    @Post()
    @Roles(Role.POLICYHOLDER)
    @ApiOperation({ summary: 'Create a new claim' })
    async create(
        @Body() dto: CreateClaimDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.create(dto, userId, tenantId);
    }

    @Get()
    @ApiOperation({ summary: 'List claims (filtered by role)' })
    async findAll(
        @Query() query: QueryClaimsDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.findAll(query, userId, role, tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get claim details' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.findOne(id, userId, role, tenantId);
    }

    @Patch(':id')
    @Roles(Role.POLICYHOLDER)
    @ApiOperation({ summary: 'Update a draft claim' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateClaimDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.update(id, dto, userId, tenantId);
    }

    @Post(':id/submit')
    @Roles(Role.POLICYHOLDER)
    @ApiOperation({ summary: 'Submit a draft claim for processing' })
    async submit(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.transition(
            id,
            { toStatus: 'SUBMITTED' as any },
            userId,
            role,
            tenantId,
        );
    }

    @Post(':id/transition')
    @Roles(Role.CLAIMS_ADJUSTER, Role.FRAUD_ANALYST, Role.ADMIN)
    @ApiOperation({ summary: 'Transition claim status' })
    async transition(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: TransitionClaimDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.transition(id, dto, userId, role, tenantId);
    }

    @Post(':id/documents')
    @Roles(Role.POLICYHOLDER, Role.CLAIMS_ADJUSTER)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload document to claim' })
    async uploadDocument(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser('id') userId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.uploadDocument(id, file, userId, tenantId);
    }

    @Get(':id/documents')
    @ApiOperation({ summary: 'List claim documents' })
    async getDocuments(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.getDocuments(id, tenantId);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'Get claim status history' })
    async getHistory(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.getHistory(id, tenantId);
    }

    @Post(':id/dispute')
    @Roles(Role.POLICYHOLDER)
    @ApiOperation({ summary: 'Dispute a claim decision' })
    async dispute(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { reason: string },
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.claimsService.transition(
            id,
            { toStatus: 'DISPUTED' as any, reason: body.reason },
            userId,
            role,
            tenantId,
        );
    }
}
