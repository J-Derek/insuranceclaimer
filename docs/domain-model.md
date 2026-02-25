# Domain Model — KlaimSwift Insurance Claims System

## Bounded Contexts

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    AUTH       │  │   CLAIMS     │  │    FRAUD     │
│              │  │              │  │              │
│ User         │  │ Claim        │  │ FraudScore   │
│ Role         │  │ ClaimDoc     │  │ RiskProfile  │
│ Tenant       │  │ StatusHistory│  │              │
│ Session      │  │ Policy       │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PAYMENTS    │  │  ANALYTICS   │  │   AUDIT      │
│              │  │              │  │              │
│ Payment      │  │ Actuarial    │  │ AuditLog     │
│ Transaction  │  │ Metrics      │  │ LedgerEntry  │
│              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Entity Definitions

### User (Aggregate Root)
- `id` — UUID, primary key
- `tenantId` — FK to Tenant (multi-tenant isolation)
- `email` — Unique per tenant
- `phone` — Kenyan format (+254...)
- `nationalId` — National ID number
- `passwordHash` — bcrypt hashed
- `firstName`, `lastName`
- `dateOfBirth`
- `roleId` — FK to Role
- `isActive` — Soft-active flag
- `lastLoginAt`
- Timestamps: `createdAt`, `updatedAt`, `deletedAt` (soft delete)

### Role
- `id` — UUID
- `name` — Enum: POLICYHOLDER, CLAIMS_ADJUSTER, FRAUD_ANALYST, ADMIN, ACTUARY, REGULATOR
- `permissions` — JSON array of permission strings
- `tenantId` — FK to Tenant

### Tenant
- `id` — UUID
- `name` — Insurance company name
- `code` — Unique short code
- `isActive`
- `config` — JSONB (tenant-specific settings)
- Timestamps

### Policy
- `id` — UUID
- `tenantId` — FK
- `userId` — FK to policyholder
- `policyNumber` — Unique, human-readable
- `type` — Enum: MEDICAL, MOTOR, PROPERTY, LIFE, ACCIDENT
- `coverageAmount` — Decimal
- `premiumAmount` — Decimal
- `startDate`, `endDate`
- `status` — Enum: ACTIVE, EXPIRED, CANCELLED, SUSPENDED
- Timestamps

### Claim (Aggregate Root)
- `id` — UUID
- `tenantId` — FK
- `policyId` — FK
- `claimantId` — FK to User
- `claimNumber` — Unique, auto-generated (e.g., KS-2026-000001)
- `type` — Enum: MEDICAL, MOTOR, PROPERTY, LIFE, ACCIDENT
- `status` — Enum (see Claims Lifecycle doc)
- `description` — Text
- `incidentDate`
- `claimAmount` — Decimal (requested)
- `approvedAmount` — Decimal (adjuster-approved, nullable)
- `channel` — Enum: WEB, MOBILE, WHATSAPP, USSD
- `assignedAdjusterId` — FK to User (nullable)
- `processingDays` — Integer (computed)
- Timestamps, soft delete

### ClaimDocument
- `id` — UUID
- `claimId` — FK
- `fileName`
- `fileType` — MIME type
- `fileSizeBytes`
- `storageKey` — S3 object key
- `storageUrl` — Pre-signed URL (generated on access)
- `ocrStatus` — Enum: PENDING, PROCESSING, COMPLETED, FAILED
- `ocrResult` — JSONB (extracted text/metadata)
- `uploadedById` — FK to User
- Timestamps

### ClaimStatusHistory
- `id` — UUID
- `claimId` — FK
- `fromStatus` — Previous status (nullable for initial)
- `toStatus` — New status
- `changedById` — FK to User
- `reason` — Text (nullable)
- `createdAt`

### FraudScore
- `id` — UUID
- `claimId` — FK (unique)
- `overallScore` — Integer 0-100
- `riskLevel` — Enum: CRITICAL, HIGH, MEDIUM, LOW
- `factors` — JSONB (breakdown of scoring factors)
- `velocityScore` — Integer (rapid claim frequency)
- `patternScore` — Integer (matches known fraud patterns)
- `amountScore` — Integer (unusual claim amounts)
- `isOverridden` — Boolean
- `overriddenById` — FK to User (nullable)
- `overrideReason` — Text (nullable)
- Timestamps

### Payment
- `id` — UUID
- `tenantId` — FK
- `claimId` — FK
- `payeeId` — FK to User
- `amount` — Decimal
- `currency` — Default KES
- `method` — Enum: MPESA, BANK_TRANSFER
- `mpesaTransactionId` — String (from M-Pesa callback)
- `mpesaReceiptNumber` — String
- `status` — Enum: PENDING, PROCESSING, COMPLETED, FAILED, REVERSED
- `idempotencyKey` — Unique string
- `paidAt` — Timestamp (nullable)
- Timestamps

### AuditLog
- `id` — UUID
- `tenantId` — FK
- `userId` — FK (who performed action)
- `action` — String (e.g., CLAIM_CREATED, STATUS_CHANGED)
- `entityType` — String (e.g., Claim, Payment)
- `entityId` — UUID (FK to entity)
- `oldValue` — JSONB (nullable)
- `newValue` — JSONB (nullable)
- `ipAddress`
- `userAgent`
- `createdAt` — Immutable

### LedgerEntry (Cryptographic Audit Ledger)
- `id` — UUID
- `tenantId` — FK
- `sequenceNumber` — Auto-increment per tenant
- `eventType` — String
- `entityType` — String
- `entityId` — UUID
- `payload` — JSONB (event data)
- `previousHash` — SHA-256 hash of previous entry
- `currentHash` — SHA-256 hash of this entry
- `createdAt` — Immutable

### Notification
- `id` — UUID
- `tenantId` — FK
- `userId` — FK (recipient)
- `type` — Enum: SMS, EMAIL, WHATSAPP, PUSH
- `channel` — Delivery channel
- `title`
- `body`
- `status` — Enum: PENDING, SENT, DELIVERED, FAILED
- `sentAt` — Timestamp (nullable)
- Timestamps

### ActuarialMetrics
- `id` — UUID
- `tenantId` — FK
- `periodStart`, `periodEnd`
- `claimType` — Enum
- `totalClaims` — Integer
- `totalAmount` — Decimal
- `averageSeverity` — Decimal
- `claimFrequency` — Decimal
- `lossRatio` — Decimal
- `reserveEstimate` — Decimal
- `fraudRate` — Decimal
- Timestamps

### IntegrationWebhook
- `id` — UUID
- `tenantId` — FK
- `provider` — Enum: MPESA, WHATSAPP, AFRICAS_TALKING
- `eventType` — String
- `payload` — JSONB (raw webhook body)
- `status` — Enum: RECEIVED, PROCESSED, FAILED
- `processedAt` — Timestamp (nullable)
- `errorMessage` — Text (nullable)
- `idempotencyKey` — Unique
- Timestamps

## Key Relationships

```
Tenant ──1:N── User
Tenant ──1:N── Policy
Tenant ──1:N── Claim
User   ──1:N── Policy (as policyholder)
User   ──1:N── Claim (as claimant)
Policy ──1:N── Claim
Claim  ──1:N── ClaimDocument
Claim  ──1:1── FraudScore
Claim  ──1:N── Payment
Claim  ──1:N── ClaimStatusHistory
User   ──1:N── AuditLog (as actor)
Tenant ──1:N── LedgerEntry
Tenant ──1:N── Notification
```

## Aggregate Boundaries

1. **Claim Aggregate:** Claim + ClaimDocument + ClaimStatusHistory + FraudScore
2. **User Aggregate:** User + Role
3. **Payment Aggregate:** Payment (references Claim by ID, not nested)
4. **Audit Aggregate:** AuditLog + LedgerEntry (append-only, never modified)
