import {
    IsUUID,
    IsEnum,
    IsString,
    IsNumber,
    IsDateString,
    IsOptional,
    MinLength,
    MaxLength,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimType, ClaimChannel, ClaimStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateClaimDto {
    @ApiProperty()
    @IsUUID()
    policyId: string;

    @ApiProperty({ enum: ClaimType })
    @IsEnum(ClaimType)
    type: ClaimType;

    @ApiProperty({ example: 'Hospital visit for emergency treatment' })
    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    description: string;

    @ApiProperty({ example: '2026-02-20' })
    @IsDateString()
    incidentDate: string;

    @ApiProperty({ example: 50000 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(100000000)
    claimAmount: number;

    @ApiPropertyOptional({ enum: ClaimChannel, default: 'WEB' })
    @IsOptional()
    @IsEnum(ClaimChannel)
    channel?: ClaimChannel;
}

export class UpdateClaimDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(100000000)
    claimAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    incidentDate?: string;
}

export class TransitionClaimDto {
    @ApiProperty({ enum: ClaimStatus })
    @IsEnum(ClaimStatus)
    toStatus: ClaimStatus;

    @ApiPropertyOptional({ example: 45000 })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    approvedAmount?: number;

    @ApiPropertyOptional({ example: 'All documentation verified' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    reason?: string;
}

export class QueryClaimsDto extends PaginationDto {
    @ApiPropertyOptional({ enum: ClaimStatus })
    @IsOptional()
    @IsEnum(ClaimStatus)
    status?: ClaimStatus;

    @ApiPropertyOptional({ enum: ClaimType })
    @IsOptional()
    @IsEnum(ClaimType)
    type?: ClaimType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    assignedTo?: string;

    @ApiPropertyOptional({ enum: ClaimChannel })
    @IsOptional()
    @IsEnum(ClaimChannel)
    channel?: ClaimChannel;
}
