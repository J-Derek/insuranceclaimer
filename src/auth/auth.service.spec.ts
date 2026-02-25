import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../common/services/audit-log.service';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: any;
    let jwtService: any;
    let auditLog: any;

    const mockUser = {
        id: 'user-uuid-1',
        tenantId: 'tenant-uuid-1',
        email: 'test@example.com',
        phone: '+254712345678',
        passwordHash: '$2b$12$hash',
        firstName: 'Test',
        lastName: 'User',
        role: 'POLICYHOLDER',
        isActive: true,
        refreshTokenHash: null,
        resetTokenHash: null,
        resetTokenExpiry: null,
    };

    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            tenant: {
                findUnique: jest.fn().mockResolvedValue({ id: 'tenant-uuid-1' }),
                create: jest.fn(),
            },
        };

        jwtService = {
            signAsync: jest.fn().mockResolvedValue('mock-token'),
            verify: jest.fn(),
        };

        auditLog = { log: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prisma },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
                { provide: AuditLogService, useValue: auditLog },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('register', () => {
        it('should register a new user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue({
                id: 'new-uuid',
                email: 'new@example.com',
                firstName: 'New',
                lastName: 'User',
                phone: '+254712345678',
                role: 'POLICYHOLDER',
                createdAt: new Date(),
            });

            const result = await service.register({
                email: 'new@example.com',
                password: 'SecurePass123!',
                firstName: 'New',
                lastName: 'User',
                phone: '+254712345678',
            }, 'tenant-uuid-1');

            expect(result.email).toBe('new@example.com');
            expect(result.role).toBe('POLICYHOLDER');
            expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'USER_REGISTERED',
            }));
        });

        it('should reject duplicate email', async () => {
            prisma.user.findUnique.mockResolvedValue(mockUser);

            await expect(
                service.register({
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '+254712345678',
                }, 'tenant-uuid-1'),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should return tokens for valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('SecurePass123!', 12);
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hashedPassword });
            prisma.user.update.mockResolvedValue(mockUser);

            const result = await service.login({
                email: 'test@example.com',
                password: 'SecurePass123!',
            }, 'tenant-uuid-1');

            expect(result.accessToken).toBe('mock-token');
            expect(result.refreshToken).toBe('mock-token');
            expect(result.user.email).toBe('test@example.com');
        });

        it('should reject invalid password', async () => {
            const hashedPassword = await bcrypt.hash('CorrectPass123!', 12);
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hashedPassword });

            await expect(
                service.login({ email: 'test@example.com', password: 'WrongPass123!' }, 'tenant-uuid-1'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should reject non-existent user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(
                service.login({ email: 'nouser@example.com', password: 'Pass123!' }, 'tenant-uuid-1'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should reject inactive user', async () => {
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

            await expect(
                service.login({ email: 'test@example.com', password: 'Pass123!' }, 'tenant-uuid-1'),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refreshTokens', () => {
        it('should detect token reuse and invalidate sessions', async () => {
            jwtService.verify.mockReturnValue({ sub: 'user-uuid-1' });
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                refreshTokenHash: 'stored-hash-that-does-not-match',
            });
            prisma.user.update.mockResolvedValue(mockUser);

            await expect(
                service.refreshTokens('reused-refresh-token'),
            ).rejects.toThrow(UnauthorizedException);

            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { refreshTokenHash: null },
                }),
            );
        });
    });

    describe('forgotPassword', () => {
        it('should always return success message (no email enumeration)', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.forgotPassword('nonexistent@example.com', 'tenant-uuid-1');
            expect(result.message).toContain('If the email exists');
        });
    });

    describe('resetPassword', () => {
        it('should reject expired token', async () => {
            prisma.user.findFirst.mockResolvedValue(null);

            await expect(
                service.resetPassword('expired-token', 'NewPass123!'),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
