# Auth Flow — KlaimSwift Backend

## Token Architecture

```
┌──────────┐    POST /auth/login     ┌──────────────┐
│  Client  │ ──────────────────────► │  Auth Service │
│          │ ◄────────────────────── │              │
│          │  { accessToken,         │  - Validate  │
│          │    refreshToken }       │  - Hash check│
└─────┬────┘                        │  - Issue JWT │
      │                             └──────────────┘
      │
      │  Authorization: Bearer <accessToken>
      │
      ▼
┌──────────────────────────┐
│   Protected Endpoints    │
│                          │
│  JwtAuthGuard            │
│  → Validates token       │
│  → Extracts user         │
│  → Checks expiry         │
│                          │
│  RolesGuard              │
│  → Checks @Roles()       │
│  → Enforces RBAC         │
└──────────────────────────┘
```

## Token Specifications

| Token | Algorithm | Expiry | Storage |
|---|---|---|---|
| **Access Token** | HS256 | 15 minutes | Client memory (never localStorage) |
| **Refresh Token** | HS256 | 7 days | httpOnly cookie + DB record |
| **Password Reset Token** | Random 64-byte hex | 1 hour | DB (hashed) |

## JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "juma@example.com",
  "role": "POLICYHOLDER",
  "tenantId": "tenant-uuid",
  "iat": 1714000000,
  "exp": 1714000900
}
```

## Authentication Flows

### Registration
```
1. POST /auth/register
2. Validate input (email unique per tenant, password strength)
3. Hash password (bcrypt, 12 rounds)
4. Create User record (role: POLICYHOLDER by default)
5. Return user data (no auto-login; require explicit login)
```

### Login
```
1. POST /auth/login { email, password }
2. Find user by email + tenantId
3. Verify password hash (bcrypt.compare)
4. Generate access token (15 min)
5. Generate refresh token (7 days)
6. Store refresh token hash in DB (user.refreshTokenHash)
7. Set refresh token as httpOnly, secure, sameSite cookie
8. Return { accessToken, refreshToken, expiresIn, user }
9. AuditLog: LOGIN event
```

### Token Refresh (Rotation)
```
1. POST /auth/refresh (refresh token from cookie)
2. Verify refresh token signature
3. Check token exists in DB (not revoked)
4. Issue NEW access token + NEW refresh token
5. Invalidate OLD refresh token (rotation prevents replay)
6. Store NEW refresh token hash in DB
7. Return new tokens
```

### Logout
```
1. POST /auth/logout (requires valid access token)
2. Clear refresh token from DB
3. Clear httpOnly cookie
4. AuditLog: LOGOUT event
```

### Password Reset
```
1. POST /auth/forgot-password { email }
2. Generate crypto-random 64-byte hex token
3. Hash token, store in DB with 1-hour expiry
4. Queue notification: send reset email/SMS
5. Return 200 (always, even if email not found — timing attack prevention)

6. POST /auth/reset-password { token, newPassword }
7. Find user by hashed token + check expiry
8. Hash new password (bcrypt, 12 rounds)
9. Update password, clear reset token
10. Invalidate all refresh tokens (force re-login)
11. AuditLog: PASSWORD_RESET event
```

## RBAC — Role-Based Access Control

### Role Hierarchy

| Role | Permissions |
|---|---|
| **POLICYHOLDER** | Create/view own claims, upload docs, dispute, view own payments |
| **CLAIMS_ADJUSTER** | All policyholder + review claims, approve/reject, view assigned claims |
| **FRAUD_ANALYST** | All adjuster + view fraud scores, override scores, investigation tools |
| **ACTUARY** | View analytics, actuarial metrics, trend reports (read-only) |
| **ADMIN** | Full system access, user management, role assignment, tenant config |
| **REGULATOR** | View audit logs, compliance reports, industry metrics (read-only) |

### Guard Implementation

```typescript
// Usage in controller
@Get('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async listUsers() { ... }

// Multiple roles
@Get('fraud/scores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FRAUD_ANALYST, Role.ADMIN)
async listScores() { ... }
```

### Tenant Isolation

Every query includes `tenantId` from the JWT payload:
```typescript
// Automatic tenant scoping
const claims = await prisma.claim.findMany({
  where: { tenantId: user.tenantId, ...filters }
});
```

## Security Measures

1. **Password Policy:** Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special
2. **Rate Limiting:** Login: 5/min, Reset: 3/5min
3. **Token Rotation:** Every refresh invalidates previous token
4. **Refresh Token Family:** If a revoked token is reused → invalidate ALL tokens for user
5. **Cookie Flags:** httpOnly, secure, sameSite=strict
6. **Timing Attack Prevention:** Constant-time password comparison
