# Database Design — KlaimSwift Backend

## Schema Overview

14 entities across 6 bounded contexts supporting multi-tenant, high-volume claims processing.

| Entity | Purpose | Estimated Volume (Year 1) |
|---|---|---|
| Tenant | Insurance company isolation | ~10 |
| User | All system users across roles | ~100k |
| Policy | Insurance policies | ~500k |
| Claim | Claims records | ~30M |
| ClaimDocument | Uploaded files/images | ~90M (3 per claim avg) |
| ClaimStatusHistory | State transition audit trail | ~150M (5 transitions avg) |
| FraudScore | ML-based risk assessments | ~30M (1 per claim) |
| Payment | M-Pesa payment records | ~20M |
| AuditLog | Human-readable audit trail | ~200M |
| LedgerEntry | Hash-chained immutable ledger | ~200M |
| Notification | SMS/Email/WhatsApp notifications | ~100M |
| ActuarialMetrics | Aggregated analytics snapshots | ~1k |
| IntegrationWebhook | Raw webhook payloads | ~50M |

## Index Strategy

### Primary Query Patterns & Indexes

1. **List claims by tenant + status** → `@@index([tenantId, status])`
2. **List claims by tenant + date range** → `@@index([tenantId, createdAt])`
3. **List claims by tenant + type + status** → `@@index([tenantId, type, status])`
4. **Lookup claim by number** → `@@index([claimNumber])` (unique)
5. **User's claims** → `@@index([tenantId, claimantId])`
6. **Adjuster workload** → `@@index([tenantId, assignedAdjusterId])`
7. **Audit log by entity** → `@@index([tenantId, entityType, entityId])`
8. **Ledger verification** → `@@unique([tenantId, sequenceNumber])`
9. **Payment idempotency** → `@@unique([idempotencyKey])`

### Index Guidelines
- All list queries start with `tenantId` (tenant isolation)
- No redundant single-column indexes already covered by composites
- GIN indexes for JSONB columns added at the SQL level (not via Prisma)
- Partial indexes (e.g., `WHERE deleted_at IS NULL`) added via raw migration

## Soft Delete Policy

Entities with `deletedAt` column:
- **User** — Regulatory requirement: can't hard-delete user accounts
- **Policy** — Historical reference for claims
- **Claim** — Legal/regulatory retention requirements

Entities WITHOUT soft delete (append-only):
- **AuditLog** — Never modified or deleted
- **LedgerEntry** — Never modified or deleted (immutability)
- **ClaimStatusHistory** — Immutable audit trail
- **IntegrationWebhook** — Raw webhook preservation

## Migration Strategy

1. **Initial migration:** Full schema creation via `prisma migrate dev`
2. **Schema changes:** Always additive first (add nullable columns → backfill → make required)
3. **Zero-downtime:** No column drops or renames without deprecation period
4. **Rollback plan:** Every migration has a corresponding `down` migration
5. **CI integration:** `prisma migrate deploy` in CI/CD pipeline (non-interactive)

## Data Partitioning Plan

### Claims Table (High Volume)

At 30M claims/year, partitioning by `created_at` using PostgreSQL range partitioning:

```
claims_2026_q1 — Jan-Mar 2026
claims_2026_q2 — Apr-Jun 2026
claims_2026_q3 — Jul-Sep 2026
claims_2026_q4 — Oct-Dec 2026
```

Implemented via raw SQL migration (pg_partman extension), transparent to Prisma queries.

### AuditLog & LedgerEntry (Very High Volume)

Partitioned monthly via `created_at`. Old partitions detached after archival period.

## Archival Strategy

| Tier | Age | Storage | Access |
|---|---|---|---|
| Hot | < 1 year | Primary SSD | Full query |
| Warm | 1–3 years | Read replica | Read-only queries |
| Cold | 3–7 years | Detached partitions (cheap storage) | On-demand reattach |
| Purge | > 7 years | Deleted | N/A |

Archival is a scheduled job that detaches old partitions and moves data files.

## Data Retention Compliance

- **Kenya Data Protection Act 2019:** Personal data retained only as long as necessary
- **IRA Regulations:** Claims records retained minimum 7 years
- **Audit trails:** Retained minimum 10 years (regulatory)
- **Payment records:** Retained minimum 7 years (tax compliance)
- **User PII deletion:** On user request, anonymize PII but retain financial records
