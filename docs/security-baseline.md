# Security Baseline — KlaimSwift Backend

## OWASP Top 10 Mitigation

| # | Risk | Mitigation |
|---|---|---|
| A01 | Broken Access Control | JWT + RBAC guards on every route, tenant isolation in all queries |
| A02 | Cryptographic Failures | bcrypt password hashing, HTTPS-only, TLS 1.2+, AES-256 for sensitive data at rest |
| A03 | Injection | Prisma parameterized queries (never raw string SQL), class-validator input sanitization |
| A04 | Insecure Design | State machine enforcement, defense-in-depth (guard + service + DB constraints) |
| A05 | Security Misconfiguration | Helmet middleware, no default credentials in production, env validation at startup |
| A06 | Vulnerable Components | npm audit in CI, Dependabot alerts, pin dependencies |
| A07 | Auth Failures | Token rotation, refresh token families, rate limiting on auth endpoints |
| A08 | Data Integrity Failures | Hash-chained audit ledger, signed M-Pesa callbacks, HMAC webhook verification |
| A09 | Logging & Monitoring | Structured JSON logging, PII masking, audit trail for all state changes |
| A10 | SSRF | No user-controlled URLs in server requests, S3 pre-signed URLs for downloads |

## HTTP Security Headers (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
```

## XSS Mitigation

1. **Input validation:** All DTOs use class-validator with whitelist mode (strip unknown properties)
2. **Output encoding:** JSON responses (no HTML rendering on backend)
3. **Content-Security-Policy:** Strict CSP via Helmet
4. **No innerHTML:** Backend-only project, but API responses are sanitized

## CSRF Strategy

For the REST API backend:
- **Cookie-based auth with SameSite=Strict** → CSRF token not needed for same-origin
- **Custom header verification:** All mutating requests must include `X-Requested-With: XMLHttpRequest`
- **Double Submit Cookie pattern** as fallback if cookie auth crosses subdomains

## SQL Injection Prevention

1. **Prisma ORM:** All queries are parameterized by default
2. **No raw queries:** Avoid `$queryRaw` unless absolutely necessary; always use `$queryRaw` with template literals (auto-parameterized)
3. **Input validation:** All user inputs validated and typed before reaching the database layer

## Secrets Management

| Environment | Strategy |
|---|---|
| **Development** | `.env` file (gitignored) |
| **CI/CD** | GitHub Secrets |
| **Staging** | Kubernetes Secrets (encrypted at rest) |
| **Production** | HashiCorp Vault or AWS Secrets Manager |

### Rotation Policy
- JWT secrets: Rotate every 90 days
- Database passwords: Rotate every 60 days
- API keys (M-Pesa, WhatsApp): Per provider policy
- S3 access keys: Rotate every 90 days

## Rate Limiting

Implemented via `@nestjs/throttler` with Redis storage for distributed rate limiting.

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 1000, limit: 3 },    // 3/sec per IP
        { name: 'medium', ttl: 60000, limit: 60 },  // 60/min per IP
        { name: 'long', ttl: 3600000, limit: 1000 }, // 1000/hr per IP
      ],
      storage: new ThrottlerStorageRedisService(redis),
    }),
  ],
})
```

Endpoint-specific overrides:
```typescript
@Throttle({ short: { ttl: 60000, limit: 5 } })  // 5/min for login
@Post('auth/login')
```

## Input Validation

```typescript
// All DTOs use class-validator decorators
class CreateClaimDto {
  @IsUUID()
  policyId: string;

  @IsEnum(ClaimType)
  type: ClaimType;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsDateString()
  incidentDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100000000)
  claimAmount: number;
}
```

Global validation pipe with `whitelist: true, forbidNonWhitelisted: true, transform: true`.

## Request ID Tracing

Every request gets a unique `requestId` (UUID v4):
- Generated in middleware
- Attached to all log entries
- Returned in all API responses
- Propagated to async workers via job metadata

## PII Protection

| Data | Storage | Logging |
|---|---|---|
| Password | bcrypt hash only | Never logged |
| National ID | Encrypted at rest (AES-256) | Masked (last 4 digits) |
| Phone number | Plain text (needed for M-Pesa) | Masked (last 4 digits) |
| Email | Plain text | Masked (first 2 chars + domain) |
| M-Pesa receipt | Plain text | Full (not PII) |

## Network Security

1. **HTTPS only** — HTTP redirects to HTTPS
2. **TLS 1.2+** — Older protocols rejected
3. **Internal traffic** — Kubernetes internal DNS, no public exposure for DB/Redis
4. **M-Pesa callback** — IP whitelist (Safaricom IPs) + HMAC signature verification
5. **WhatsApp webhook** — Signature verification (X-Hub-Signature-256)
