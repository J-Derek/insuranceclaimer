import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('initiate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Initiate M-Pesa STK Push for a claim' })
    async initiate(
        @Body() body: { claimId: string },
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.paymentsService.initiatePayment(body.claimId, tenantId);
    }

    @Post('mpesa/callback')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'M-Pesa payment callback webhook (from Safaricom)' })
    async mpesaCallback(@Body() body: any) {
        return this.paymentsService.handleMpesaCallback(body);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.CLAIMS_ADJUSTER)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'List all payments' })
    async findAll(@CurrentUser('tenantId') tenantId: string) {
        return this.paymentsService.findAll(tenantId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get payment details' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.paymentsService.findOne(id, tenantId);
    }
}
