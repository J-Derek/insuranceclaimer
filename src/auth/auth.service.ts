import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Default tenant ID for single-tenant development
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private auditLog: AuditLogService,
    ) { }

    async register(dto: RegisterDto, tenantId: string = DEFAULT_TENANT_ID) {
        const existing = await this.prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: dto.email } },
        });

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const rounds = this.configService.get<number>('bcrypt.rounds') || 12;
        const passwordHash = await bcrypt.hash(dto.password, rounds);

        // Ensure tenant exists
        await this.ensureTenant(tenantId);

        const user = await this.prisma.user.create({
            data: {
                tenantId,
                email: dto.email,
                phone: dto.phone,
                nationalId: dto.nationalId,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                role: 'POLICYHOLDER',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        await this.auditLog.log({
            tenantId,
            userId: user.id,
            action: 'USER_REGISTERED',
            entityType: 'User',
            entityId: user.id,
            newValue: { email: dto.email, role: 'POLICYHOLDER' },
        });

        return user;
    }

    async login(dto: LoginDto, tenantId: string = DEFAULT_TENANT_ID) {
        const user = await this.prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: dto.email } },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role, tenantId);

        // Store refresh token hash
        const refreshHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshTokenHash: refreshHash,
                lastLoginAt: new Date(),
            },
        });

        await this.auditLog.log({
            tenantId,
            userId: user.id,
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: user.id,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 900, // 15 minutes in seconds
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
            });

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isActive || !user.refreshTokenHash) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Verify token matches stored hash
            const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
            if (tokenHash !== user.refreshTokenHash) {
                // Possible token reuse attack — invalidate all tokens
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { refreshTokenHash: null },
                });
                throw new UnauthorizedException('Token reuse detected — all sessions invalidated');
            }

            // Rotate: issue new tokens, invalidate old
            const tokens = await this.generateTokens(user.id, user.email, user.role, user.tenantId);
            const newHash = createHash('sha256').update(tokens.refreshToken).digest('hex');

            await this.prisma.user.update({
                where: { id: user.id },
                data: { refreshTokenHash: newHash },
            });

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: 900,
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) throw error;
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null },
        });

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            await this.auditLog.log({
                tenantId: user.tenantId,
                userId,
                action: 'USER_LOGOUT',
                entityType: 'User',
                entityId: userId,
            });
        }
    }

    async forgotPassword(email: string, tenantId: string = DEFAULT_TENANT_ID) {
        const user = await this.prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email } },
        });

        // Always return success to prevent email enumeration
        if (!user) return { message: 'If the email exists, a reset link has been sent' };

        const token = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetTokenHash: tokenHash,
                resetTokenExpiry: expiry,
            },
        });

        // TODO: Queue notification job to send reset email/SMS
        this.logger.log(`Password reset token generated for user ${user.id}: ${token}`);

        return { message: 'If the email exists, a reset link has been sent' };
    }

    async resetPassword(token: string, newPassword: string) {
        const tokenHash = createHash('sha256').update(token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                resetTokenHash: tokenHash,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const rounds = this.configService.get<number>('bcrypt.rounds') || 12;
        const passwordHash = await bcrypt.hash(newPassword, rounds);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetTokenHash: null,
                resetTokenExpiry: null,
                refreshTokenHash: null, // Force re-login on all devices
            },
        });

        await this.auditLog.log({
            tenantId: user.tenantId,
            userId: user.id,
            action: 'PASSWORD_RESET',
            entityType: 'User',
            entityId: user.id,
        });

        return { message: 'Password reset successful. Please login with your new password.' };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                nationalId: true,
                dateOfBirth: true,
                role: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });

        if (!user) throw new UnauthorizedException('User not found');
        return user;
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: string,
        tenantId: string,
    ) {
        const payload = { sub: userId, email, role, tenantId };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: this.configService.get<string>('jwt.accessExpiry') || '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
                expiresIn: this.configService.get<string>('jwt.refreshExpiry') || '7d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async ensureTenant(tenantId: string) {
        const exists = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!exists) {
            await this.prisma.tenant.create({
                data: {
                    id: tenantId,
                    name: 'Default Tenant',
                    code: 'DEFAULT',
                },
            });
        }
    }
}
