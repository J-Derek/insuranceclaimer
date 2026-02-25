import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role, RiskLevel } from '@prisma/client';
import { FraudService } from './fraud.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Fraud')
@Controller('fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class FraudController {
    constructor(private readonly fraudService: FraudService) { }

    @Get('scores')
    @Roles(Role.FRAUD_ANALYST, Role.ADMIN)
    @ApiOperation({ summary: 'List all fraud scores' })
    async getScores(
        @CurrentUser('tenantId') tenantId: string,
        @Query('riskLevel') riskLevel?: RiskLevel,
    ) {
        return this.fraudService.getScores(tenantId, riskLevel);
    }

    @Get('scores/:claimId')
    @Roles(Role.CLAIMS_ADJUSTER, Role.FRAUD_ANALYST, Role.ADMIN)
    @ApiOperation({ summary: 'Get fraud score for a specific claim' })
    async getScore(
        @Param('claimId', ParseUUIDPipe) claimId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.fraudService.getScoreByClaimId(claimId, tenantId);
    }

    @Post('scores/:claimId/override')
    @Roles(Role.FRAUD_ANALYST)
    @ApiOperation({ summary: 'Override fraud score for a claim' })
    async override(
        @Param('claimId', ParseUUIDPipe) claimId: string,
        @Body() body: { overrideReason: string; newRiskLevel: RiskLevel },
        @CurrentUser('id') userId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.fraudService.overrideScore(
            claimId,
            body.overrideReason,
            body.newRiskLevel,
            userId,
            tenantId,
        );
    }

    @Get('dashboard')
    @Roles(Role.FRAUD_ANALYST, Role.ADMIN)
    @ApiOperation({ summary: 'Fraud analytics dashboard' })
    async getDashboard(@CurrentUser('tenantId') tenantId: string) {
        return this.fraudService.getDashboard(tenantId);
    }
}
