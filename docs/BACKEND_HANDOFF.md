``````````````````````# KlaimSwift Insurance Claims System — Full Backend Handoff

> **Purpose:** This document describes EVERYTHING implemented in the backend so that a frontend framework and approach can be chosen. Share this with ChatGPT or any advisor to evaluate the best frontend stack.

---

## 1. PROJECT OVERVIEW

**KlaimSwift** is an insurance claims processing system for the Kenyan market.

- **Target:** 100k+ users, 30M+ claims/year
- **Regulator:** Insurance Regulatory Authority (IRA) of Kenya
- **Key integrations:** M-Pesa (Safaricom Daraja API), WhatsApp Business API, Africa's Talking (USSD/SMS)
- **Goals:** Reduce claim processing from weeks to 2-3 days, reduce fraud by 40%, full digital claim lifecycle

---

## 2. BACKEND TECH STACK (Fully Implemented)

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | 20 LTS |
| **Framework** | NestJS | 10.3 |
| **Language** | TypeScript | 5.3 |
| **Database** | PostgreSQL | 16 |
| **ORM** | Prisma | 5.10 |
| **Cache/Queue** | Redis + BullMQ | Redis 7, BullMQ 5 |
| **Object Storage** | S3-compatible (MinIO locally, AWS S3 prod) | — |
| **Auth** | JWT (access + refresh tokens) via Passport.js | — |
| **API Style** | REST with OpenAPI/Swagger auto-docs | — |
| **Containerization** | Docker + Docker Compose | — |
| **CI/CD** | GitHub Actions | — |

---

## 3. DATABASE SCHEMA — 14 Entities

### Enums (14 total)
```
Role: POLICYHOLDER | CLAIMS_ADJUSTER | FRAUD_ANALYST | ACTUARY | ADMIN | REGULATOR
PolicyType: MEDICAL | MOTOR | PROPERTY | LIFE | ACCIDENT
PolicyStatus: ACTIVE | EXPIRED | CANCELLED | SUSPENDED
ClaimType: MEDICAL | MOTOR | PROPERTY | LIFE | ACCIDENT
ClaimStatus: DRAFT | SUBMITTED | UNDER_REVIEW | FRAUD_CHECK | APPROVED | REJECTED | INVESTIGATION | PAYMENT_PENDING | SETTLED | DISPUTED | CLOSED | ARCHIVED
ClaimChannel: WEB | MOBILE | WHATSAPP | USSD
OcrStatus: PENDING | PROCESSING | COMPLETED | FAILED
RiskLevel: CRITICAL | HIGH | MEDIUM | LOW
PaymentMethod: MPESA | BANK_TRANSFER
PaymentStatus: PENDING | PROCESSING | COMPLETED | FAILED | REVERSED
NotificationType: SMS | EMAIL | WHATSAPP | PUSH
NotificationStatus: PENDING | SENT | DELIVERED | FAILED
WebhookProvider: MPESA | WHATSAPP | AFRICAS_TALKING
WebhookStatus: RECEIVED | PROCESSED | FAILED
```

### Entities
| Entity | Key Fields | Notes |
|---|---|---|
| **Tenant** | id, name, code, config (JSON) | Multi-tenant isolation |
| **User** | email, phone (+254…), nationalId, passwordHash, role, refreshTokenHash, resetTokenHash | Soft delete, unique per tenant+email |
| **Policy** | policyNumber, type, coverageAmount, premiumAmount, startDate, endDate, status | Linked to User |
| **Claim** | claimNumber (KS-YYYY-NNNNNN), type, status, description, incidentDate, claimAmount, approvedAmount, channel, processingDays | Core entity. 12-state lifecycle |
| **ClaimDocument** | fileName, fileType, fileSizeBytes, storageKey (S3), ocrStatus, ocrResult (JSONB) | Uploaded files for each claim |
| **ClaimStatusHistory** | fromStatus, toStatus, changedById, reason | Append-only transition log |
| **FraudScore** | overallScore (0-100), riskLevel, velocityScore, patternScore, amountScore, factors (JSONB), isOverridden, overrideReason | One per claim |
| **Payment** | amount, currency (KES), method (MPESA), mpesaTransactionId, mpesaReceiptNumber, status, idempotencyKey | M-Pesa integration |
| **AuditLog** | action, entityType, entityId, oldValue (JSONB), newValue (JSONB), ipAddress, userAgent | Human-readable audit trail |
| **LedgerEntry** | sequenceNumber, eventType, entityType, entityId, payload (JSONB), previousHash, currentHash | Hash-chained immutable ledger (blockchain alternative) |
| **Notification** | type (SMS/EMAIL/WHATSAPP/PUSH), title, body, status | Multi-channel notifications |
| **ActuarialMetrics** | periodStart, periodEnd, claimType, totalClaims, totalAmount, avgSeverity, claimFrequency, lossRatio, reserveEstimate, fraudRate | Aggregated analytics snapshots |
| **IntegrationWebhook** | provider, eventType, payload (JSONB), status, idempotencyKey | Raw webhook payload storage |

### Key Relationships
- Tenant → (has many) Users, Policies, Claims, Payments, AuditLogs, LedgerEntries
- User → (has many) Policies, Claims (as claimant), Claims (as adjuster)
- Policy → (has many) Claims
- Claim → (has many) Documents, StatusHistory, Payments; (has one) FraudScore

### Indexes (30+)
- All queries tenant-scoped: `@@index([tenantId, status])`, `@@index([tenantId, createdAt])`
- Claim number: `@@unique([claimNumber])`
- Payment idempotency: `@@unique([idempotencyKey])`
- Ledger chain: `@@unique([tenantId, sequenceNumber])`

---

## 4. API ENDPOINTS — 40+ Routes

**Base URL:** `/api/v1`

### Auth (7 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register (Kenyan phone format: +254…) |
| POST | `/auth/login` | No | Login → returns accessToken + refreshToken |
| POST | `/auth/refresh` | No | Rotate refresh token |
| POST | `/auth/logout` | JWT | Invalidate refresh token |
| POST | `/auth/forgot-password` | No | Request reset email (timing-attack safe) |
| POST | `/auth/reset-password` | No | Reset with token |
| GET | `/auth/me` | JWT | Current user profile |

### Claims (9 endpoints)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/claims` | JWT | POLICYHOLDER | Create claim |
| GET | `/claims` | JWT | Any (filtered) | List claims (my claims / assigned / all) |
| GET | `/claims/:id` | JWT | Any | Claim details |
| PATCH | `/claims/:id` | JWT | POLICYHOLDER | Edit draft only |
| POST | `/claims/:id/submit` | JWT | POLICYHOLDER | Submit draft |
| POST | `/claims/:id/transition` | JWT | ADJUSTER/ANALYST/ADMIN | Change status |
| POST | `/claims/:id/documents` | JWT | POLICYHOLDER/ADJUSTER | Upload file (multipart) |
| GET | `/claims/:id/documents` | JWT | Any | List documents |
| GET | `/claims/:id/history` | JWT | Any | Status history |
| POST | `/claims/:id/dispute` | JWT | POLICYHOLDER | Dispute decision |

### Fraud (4 endpoints)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/fraud/scores` | JWT | ANALYST/ADMIN | All scores |
| GET | `/fraud/scores/:claimId` | JWT | ADJUSTER/ANALYST/ADMIN | Score for claim |
| POST | `/fraud/scores/:claimId/override` | JWT | ANALYST | Override score |
| GET | `/fraud/dashboard` | JWT | ANALYST/ADMIN | Dashboard stats |

### OCR (2 endpoints)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/ocr/process/:documentId` | JWT | ADJUSTER/ADMIN | Trigger OCR |
| GET | `/ocr/results/:documentId` | JWT | Any | Get OCR results |

### Payments (4 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/initiate` | JWT (ADMIN) | Trigger M-Pesa STK Push |
| POST | `/payments/mpesa/callback` | None (webhook) | Safaricom callback |
| GET | `/payments` | JWT | List payments |
| GET | `/payments/:id` | JWT | Payment details |

### Admin (7 endpoints)
| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/users` | JWT | ADMIN | List users |
| PATCH | `/admin/users/:id/role` | JWT | ADMIN | Assign role |
| GET | `/admin/analytics/claims` | JWT | ADMIN/ACTUARY | Claims analytics |
| GET | `/admin/analytics/actuarial` | JWT | ACTUARY | Actuarial metrics |
| GET | `/admin/analytics/fraud` | JWT | ADMIN/ANALYST | Fraud analytics |
| GET | `/admin/audit-logs` | JWT | ADMIN/REGULATOR | Audit trail |
| GET | `/admin/ledger/verify` | JWT | ADMIN/REGULATOR | Verify ledger integrity |

### Health (3 endpoints)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | DB health check |
| GET | `/health/ready` | No | K8s readiness probe |
| GET | `/health/live` | No | K8s liveness probe |

### Swagger
Auto-generated docs available at `http://localhost:3000/api`

---

## 5. RESPONSE FORMAT

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 },
  "requestId": "req_abc123"
}
```

### Error
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "must be a valid email" }],
  "requestId": "req_abc123",
  "timestamp": "2026-02-24T09:00:00Z",
  "path": "/api/v1/auth/register"
}
```

### Pagination
All list endpoints accept: `page`, `limit` (max 100), `sortBy`, `sortOrder` (asc/desc)

---

## 6. AUTH SYSTEM

- **Access Token:** JWT, 15-minute expiry, HS256
- **Refresh Token:** JWT, 7-day expiry, stored as SHA-256 hash in DB
- **Token Rotation:** Every refresh issues new tokens + invalidates old ones
- **Reuse Detection:** If a revoked refresh token is reused → ALL sessions for that user are revoked
- **Password:** bcrypt 12 rounds, requires uppercase + lowercase + digit + special char
- **Rate Limits:** Login: 5/min, Password reset: 3/5min
- **RBAC Roles:** POLICYHOLDER, CLAIMS_ADJUSTER, FRAUD_ANALYST, ACTUARY, ADMIN, REGULATOR

---

## 7. CLAIMS STATE MACHINE (12 States)

```
DRAFT → SUBMITTED → UNDER_REVIEW → FRAUD_CHECK → APPROVED → PAYMENT_PENDING → SETTLED → CLOSED → ARCHIVED
                                                 → REJECTED → DISPUTED → (back to UNDER_REVIEW)
                                                 → INVESTIGATION → APPROVED or REJECTED
```

### Role-Based Transitions
- POLICYHOLDER: submit, dispute
- CLAIMS_ADJUSTER: SUBMITTED→UNDER_REVIEW, UNDER_REVIEW→FRAUD_CHECK, FRAUD_CHECK→APPROVED/REJECTED
- FRAUD_ANALYST: FRAUD_CHECK→INVESTIGATION, INVESTIGATION→APPROVED/REJECTED
- ADMIN: All transitions

### Enforced Rules
- Only DRAFT claims are editable
- REJECTED/DISPUTED/INVESTIGATION require a reason
- ARCHIVED is terminal (no transitions out)
- Every transition creates ClaimStatusHistory + AuditLog + LedgerEntry

---

## 8. FRAUD ENGINE (BullMQ Worker)

Runs asynchronously when claim reaches FRAUD_CHECK status.

### 3 Scoring Dimensions (0-100 each)
1. **Velocity Score (30% weight):** Claims frequency in 30/90/365 days
2. **Amount Score (35% weight):** Deviation from historical average for claim type
3. **Pattern Score (35% weight):** Previous rejections, same-type clustering, past high scores

### Auto-flagging
- Score ≥ 70 → auto-transition to INVESTIGATION
- Score < 70 → remains in FRAUD_CHECK for manual review

### Override
- FRAUD_ANALYST can override score with a written reason (audit logged)

---

## 9. M-PESA PAYMENT FLOW

1. Claim approved → ADMIN triggers payment
2. Backend creates Payment record + calls Daraja STK Push
3. User receives M-Pesa prompt on phone
4. Safaricom calls `POST /payments/mpesa/callback`
5. Backend verifies idempotency key (prevent replay)
6. Updates Payment status → COMPLETED
7. Transitions Claim → SETTLED
8. Creates LedgerEntry (hash-chained)

---

## 10. HASH-CHAINED AUDIT LEDGER

Replaces blockchain with a cryptographic append-only log.

```
Entry N:
  currentHash = SHA-256(sequenceNumber + eventType + entityId + payload + previousHash + timestamp)
  previousHash = Entry(N-1).currentHash

Genesis:
  previousHash = SHA-256("GENESIS:" + tenantId)
```

Endpoint `GET /admin/ledger/verify` walks the entire chain and validates every hash.

---

## 11. FILE STRUCTURE (Backend)

```
src/
├── main.ts                          # Bootstrap (Swagger, Helmet, CORS, pipes)
├── app.module.ts                    # Root module
├── health.controller.ts             # K8s probes
├── config/configuration.ts          # Typed env config
├── prisma/                          # Prisma module + service
├── common/
│   ├── decorators/                  # @Roles(), @CurrentUser()
│   ├── filters/                     # Global exception filter
│   ├── guards/                      # JwtAuthGuard, RolesGuard
│   ├── interceptors/                # Transform (envelope), Logging
│   ├── dto/                         # PaginationDto
│   └── services/                    # AuditLogService, LedgerService, StorageService (S3)
├── auth/                            # 7 endpoints
│   ├── auth.module/controller/service
│   ├── strategies/jwt.strategy.ts
│   └── dto/register, login, refresh, reset
├── claims/                          # 9 endpoints
│   ├── claims.module/controller/service
│   ├── claims-state.machine.ts      # State transition logic
│   └── dto/create, update, transition, query
├── fraud/                           # 4 endpoints
│   ├── fraud.module/controller/service
│   └── fraud.processor.ts           # BullMQ worker
├── ocr/                             # 2 endpoints
│   ├── ocr.module/controller/service
│   └── ocr.processor.ts             # BullMQ worker
├── payments/                        # 4 endpoints
│   ├── payments.module/controller/service
│   └── dto/initiate, callback
└── admin/                           # 7 endpoints
    └── admin.module/controller/service
```

---

## 12. SECURITY

- **OWASP Top 10** mitigations on all layers
- **Helmet** HTTP security headers
- **Rate limiting** via @nestjs/throttler + Redis
- **Input validation** via class-validator (whitelist mode, strip unknowns)
- **Parameterized queries** via Prisma (no raw SQL)
- **PII masking** in logs (phone, email, national ID)
- **Tenant isolation** on every database query
- **CORS** configured for allowed origins
- **Request ID** on every request/response

---

## 13. DEVOPS

- **Dockerfile:** Multi-stage build, non-root user, health check
- **docker-compose.yml:** PostgreSQL 16, Redis 7, MinIO, API service
- **GitHub Actions CI:** lint → test (with Postgres + Redis services) → build
- **.env.example:** All 30+ environment variables documented

---

## 14. TESTS (35 test cases)

| Suite | Tests | Coverage |
|---|---|---|
| Auth Service | 7 | Registration, login valid/invalid/inactive, token reuse detection, email enumeration |
| Claims Service | 5 | Invalid transitions, unauthorized roles, rejection without reason, data isolation |
| State Machine | 16 | All valid/invalid transitions, role authorization, terminal states |
| Payments | 4 | Invalid claims, duplicates, callback idempotency |
| Ledger | 3 | Genesis, hash chaining, empty verification |

---

## 15. FIGMA DESIGN REFERENCE (UI Screens)

From the Figma design analysis, the frontend needs these screens:

1. **Landing Page** — Hero, features, CTA
2. **Registration** — Multi-step form (personal info + KYC)
3. **Submit Claim** — Form with file uploads, policy selection
4. **M-Pesa Payment** — STK Push trigger, payment status
5. **Track Claims** — List view with filters, detail view, status timeline
6. **Fraud Dashboard** — Risk scores, charts, override panel
7. **Analytics Dashboard** — Claims stats, actuarial charts, trends
8. **Formulas / Actuarial** — GLM parameters, risk models display
9. **Admin Panel** — User management, role assignment, audit logs

---

## 16. WHAT THE FRONTEND NEEDS

1. **Consume REST API** at `/api/v1/*` with JWT Bearer auth
2. **Handle 6 user roles** with different views/permissions
3. **Real-time-ish updates** (polling or SSE for claim status changes)
4. **File upload** (multipart form-data for claim documents)
5. **Charts/visualizations** for fraud scores, analytics, actuarial data
6. **M-Pesa payment flow** (trigger + waiting for callback confirmation)
7. **Responsive** (mobile + desktop — many users will be on phones)
8. **Dark mode** support (from Figma design)
9. **Kenyan locale** (KES currency, +254 phone format, date formats)

---

## 17. QUESTIONS FOR FRONTEND FRAMEWORK DECISION

1. **SSR vs SPA?** — SEO matters for landing page, but dashboards are auth-gated
2. **Next.js vs Vite+React vs Vue vs Svelte?** — Consider team familiarity
3. **State management?** — TanStack Query for API cache, Zustand/Jotai for local state?
4. **Component library?** — shadcn/ui, Ant Design, MUI, Mantine, or custom?
5. **Charts?** — Recharts, Chart.js, Nivo, or Apache ECharts?
6. **Deployment?** — Vercel (Next.js), Cloudflare Pages, or serve from same Docker container?
7. **Mobile?** — PWA, React Native later, or Capacitor?
