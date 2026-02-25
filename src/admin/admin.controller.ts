import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'List all users' })
    async listUsers(@CurrentUser('tenantId') tenantId: string) {
        return this.adminService.listUsers(tenantId);
    }

    @Patch('users/:id/role')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Assign role to user' })
    async assignRole(
        @Param('id', ParseUUIDPipe) userId: string,
        @Body() body: { role: Role },
        @CurrentUser('id') adminId: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.adminService.assignRole(userId, body.role, adminId, tenantId);
    }

    @Get('analytics/claims')
    @Roles(Role.ADMIN, Role.ACTUARY)
    @ApiOperation({ summary: 'Claims analytics dashboard' })
    async claimsAnalytics(@CurrentUser('tenantId') tenantId: string) {
        return this.adminService.getClaimsAnalytics(tenantId);
    }

    @Get('analytics/actuarial')
    @Roles(Role.ACTUARY)
    @ApiOperation({ summary: 'Actuarial metrics and analysis' })
    async actuarialMetrics(@CurrentUser('tenantId') tenantId: string) {
        return this.adminService.getActuarialMetrics(tenantId);
    }

    @Get('analytics/fraud')
    @Roles(Role.ADMIN, Role.FRAUD_ANALYST)
    @ApiOperation({ summary: 'Fraud analytics overview' })
    async fraudAnalytics(@CurrentUser('tenantId') tenantId: string) {
        return this.adminService.getFraudAnalytics(tenantId);
    }

    @Get('audit-logs')
    @Roles(Role.ADMIN, Role.REGULATOR)
    @ApiOperation({ summary: 'View audit trail' })
    async auditLogs(
        @CurrentUser('tenantId') tenantId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.adminService.getAuditLogs(tenantId, page, limit);
    }

    @Get('ledger/verify')
    @Roles(Role.ADMIN, Role.REGULATOR)
    @ApiOperation({ summary: 'Verify cryptographic ledger integrity' })
    async verifyLedger(@CurrentUser('tenantId') tenantId: string) {
        return this.adminService.verifyLedger(tenantId);
    }
}
