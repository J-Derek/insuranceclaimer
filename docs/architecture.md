# Architecture — KlaimSwift Backend

## High-Level Architecture

```
                           ┌────────────────────────┐
                           │     Load Balancer       │
                           │    (Nginx / K8s Ingress)│
                           └──────────┬─────────────┘
                                      │
                           ┌──────────▼─────────────┐
                           │    NestJS API Server    │
                           │                        │
                           │  ┌─────┐ ┌──────────┐  │
                           │  │Auth │ │  Claims   │  │
                           │  └─────┘ └──────────┘  │
                           │  ┌─────┐ ┌──────────┐  │
                           │  │Admin│ │ Payments  │  │
                           │  └─────┘ └──────────┘  │
                           │  ┌──────────────────┐  │
                           │  │     Common       │  │
                           │  │ (Guards,Filters) │  │
                           │  └──────────────────┘  │
                           └──┬──────┬──────┬───────┘
                              │      │      │
              ┌───────────────┘      │      └───────────────┐
              │                      │                      │
     ┌────────▼───────┐    ┌────────▼───────┐    ┌────────▼───────┐
     │  PostgreSQL    │    │     Redis       │    │  S3 (MinIO)    │
     │  (Primary DB)  │    │  Cache + Queue  │    │  Doc Storage   │
     └────────────────┘    └────────┬────────┘    └────────────────┘
                                    │
                           ┌────────▼───────────────┐
                           │   BullMQ Workers        │
                           │                        │
                           │  ┌─────────────────┐   │
                           │  │  Fraud Scorer    │   │
                           │  └─────────────────┘   │
                           │  ┌─────────────────┐   │
                           │  │  OCR Processor   │   │
                           │  └─────────────────┘   │
                           │  ┌─────────────────┐   │
                           │  │  Notification    │   │
                           │  └─────────────────┘   │
                           └────────────────────────┘
```

## Service Boundaries

| Service | Responsibility | Communication |
|---|---|---|
| **API Server** | HTTP request handling, validation, business logic | Synchronous (REST) |
| **Fraud Worker** | Async fraud scoring, risk analysis | BullMQ queue (Redis) |
| **OCR Worker** | Async document text extraction | BullMQ queue (Redis) |
| **Notification Worker** | Async SMS/email/WhatsApp delivery | BullMQ queue (Redis) |

## Claims Processing Pipeline

```
1. Policyholder submits claim via REST API
2. Claims Service validates input + policy status
3. Claim record created (status: SUBMITTED)
4. Documents uploaded to S3
5. OCR job enqueued → OCR Worker extracts metadata
6. Fraud scoring job enqueued → Fraud Worker scores claim
7. Adjuster notified (notification job enqueued)
8. Adjuster reviews → approves/rejects
9. If approved: Payment job triggers M-Pesa STK Push
10. M-Pesa callback confirms payment → claim SETTLED
11. All steps logged: AuditLog + LedgerEntry (hash-chained)
```

## Fraud Scoring Async Flow

```
BullMQ Queue: "fraud-scoring"
  │
  ├─ Job data: { claimId, claimantId, amount, type, history }
  │
  └─ Fraud Worker Process:
       1. Fetch claimant history from DB
       2. Velocity check (claims in last 30/90/365 days)
       3. Amount anomaly check (vs historical average)
       4. Pattern matching (known fraud indicators)
       5. GLM-simulated risk score calculation
       6. Aggregate: overallScore = weighted(velocity + amount + pattern)
       7. Persist FraudScore record
       8. If score ≥ 70: auto-transition claim to INVESTIGATION
       9. Emit event for notification
```

## OCR Ingestion Pipeline

```
BullMQ Queue: "ocr-processing"
  │
  ├─ Job data: { documentId, storageKey, claimId }
  │
  └─ OCR Worker Process:
       1. Download file from S3
       2. Run OCR extraction (Tesseract simulation)
       3. Parse structured data (dates, amounts, IDs)
       4. Store metadata in ClaimDocument.ocrResult (JSONB)
       5. Update document status: COMPLETED
       6. If auto-fill enabled: update Claim fields
```

## Payment Integration Flow (M-Pesa)

```
1. Claim APPROVED → Payment Service triggered
2. Generate idempotency key (claimId + amount + timestamp hash)
3. Call Daraja API: STK Push to policyholder's phone
4. Record Payment (status: PROCESSING)
5. M-Pesa sends callback to POST /api/v1/payments/mpesa/callback
6. Verify callback signature
7. Check idempotency key (prevent replay)
8. Update Payment status → COMPLETED
9. Update Claim status → SETTLED
10. Create LedgerEntry (hash-chained)
11. Notify policyholder
```

## Event Logging Architecture

Every significant action creates two records:

1. **AuditLog** — Human-readable, queryable, indexed by entity
2. **LedgerEntry** — Cryptographically chained, tamper-evident

### Hash Chain Structure
```
Entry N:
  currentHash = SHA-256(sequenceNumber + eventType + entityId + payload + previousHash + timestamp)
  previousHash = Entry(N-1).currentHash

Entry 1 (Genesis):
  previousHash = SHA-256("GENESIS:" + tenantId)
```

### Verification Algorithm
```
For each entry (1..N):
  expectedHash = SHA-256(entry.sequenceNumber + ... + entry.previousHash)
  assert entry.currentHash === expectedHash
  assert entry.previousHash === previousEntry.currentHash
```

## Rate Limiting Strategy

| Endpoint Category | Limit | Window |
|---|---|---|
| Auth (login/register) | 5 requests | 60 seconds |
| Auth (password reset) | 3 requests | 300 seconds |
| Claims (create) | 10 requests | 60 seconds |
| Claims (list/get) | 100 requests | 60 seconds |
| Payments (webhook) | 200 requests | 60 seconds |
| Admin endpoints | 50 requests | 60 seconds |
| General API | 60 requests | 60 seconds |

Implemented via `@nestjs/throttler` with Redis backing for distributed rate limiting.

## Error Standardization

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [
    {
      "field": "claimAmount",
      "message": "must be a positive number"
    }
  ],
  "requestId": "req_abc123",
  "timestamp": "2026-02-24T09:00:00Z"
}
```

All errors follow this format via a global `HttpExceptionFilter`.

## Observability Plan

| Layer | Tool | Purpose |
|---|---|---|
| **Logging** | Winston + structured JSON | Application logs |
| **Metrics** | Prometheus + Grafana | Request latency, queue depth, error rates |
| **Tracing** | OpenTelemetry | Distributed request tracing |
| **Alerting** | Grafana Alerting | SLA violations, error spikes |
| **Queue Monitoring** | Bull Board | Job status, failed jobs, retries |
| **Health Checks** | `/health` endpoint | DB, Redis, S3 connectivity |
