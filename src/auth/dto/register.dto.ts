import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsOptional,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'juma@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    @MaxLength(64)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: 'Password must contain uppercase, lowercase, digit, and special character',
    })
    password: string;

    @ApiProperty({ example: 'Juma' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    firstName: string;

    @ApiProperty({ example: 'Odhiambo' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    lastName: string;

    @ApiProperty({ example: '+254712345678' })
    @IsString()
    @Matches(/^\+254\d{9}$/, { message: 'Phone must be Kenyan format: +254XXXXXXXXX' })
    phone: string;

    @ApiPropertyOptional({ example: '12345678' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    nationalId?: string;

    @ApiPropertyOptional({ example: '1990-05-15' })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;
}
