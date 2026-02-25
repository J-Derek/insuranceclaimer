# API Design — KlaimSwift Backend

Base URL: `/api/v1`

All responses follow the standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150 },
  "requestId": "req_abc123"
}
```

Error responses:
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "must be a valid email" }],
  "requestId": "req_abc123",
  "timestamp": "2026-02-24T09:00:00Z"
}
```

---

## Auth Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/register` | No | — | Register new user |
| POST | `/auth/login` | No | — | Login, get tokens |
| POST | `/auth/refresh` | No* | — | Refresh access token (*uses refresh token) |
| POST | `/auth/logout` | Yes | Any | Invalidate refresh token |
| POST | `/auth/forgot-password` | No | — | Request password reset email |
| POST | `/auth/reset-password` | No | — | Reset password with token |
| GET | `/auth/me` | Yes | Any | Get current user profile |
| PATCH | `/auth/me` | Yes | Any | Update own profile |

### Request/Response Examples

**POST /auth/register**
```json
// Request
{
  "email": "juma@example.com",
  "password": "SecurePass123!",
  "firstName": "Juma",
  "lastName": "Odhiambo",
  "phone": "+254712345678",
  "nationalId": "12345678",
  "dateOfBirth": "1990-05-15"
}
// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "juma@example.com",
    "firstName": "Juma",
    "role": "POLICYHOLDER"
  }
}
```

**POST /auth/login**
```json
// Request
{ "email": "juma@example.com", "password": "SecurePass123!" }
// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "user": { "id": "uuid", "email": "...", "role": "POLICYHOLDER" }
  }
}
```

---

## Claims Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/claims` | Yes | POLICYHOLDER | Create new claim |
| GET | `/claims` | Yes | Any | List claims (filtered by role) |
| GET | `/claims/:id` | Yes | Any | Get claim details |
| PATCH | `/claims/:id` | Yes | POLICYHOLDER | Update draft claim |
| POST | `/claims/:id/submit` | Yes | POLICYHOLDER | Submit draft claim |
| POST | `/claims/:id/transition` | Yes | ADJUSTER, ANALYST, ADMIN | Transition claim status |
| POST | `/claims/:id/documents` | Yes | POLICYHOLDER, ADJUSTER | Upload document |
| GET | `/claims/:id/documents` | Yes | Any | List claim documents |
| GET | `/claims/:id/history` | Yes | Any | Get status history |
| POST | `/claims/:id/dispute` | Yes | POLICYHOLDER | Dispute decision |

### Request/Response Examples

**POST /claims**
```json
// Request
{
  "policyId": "uuid",
  "type": "MEDICAL",
  "description": "Hospital visit for emergency treatment",
  "incidentDate": "2026-02-20",
  "claimAmount": 50000,
  "channel": "WEB"
}
// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "claimNumber": "KS-2026-000042",
    "status": "DRAFT",
    "type": "MEDICAL",
    "claimAmount": 50000
  }
}
```

**POST /claims/:id/transition**
```json
// Request
{
  "toStatus": "APPROVED",
  "approvedAmount": 45000,
  "reason": "All documentation verified, amount adjusted per policy limits"
}
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedAmount": 45000,
    "previousStatus": "FRAUD_CHECK"
  }
}
```

---

## Fraud Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/fraud/scores` | Yes | ANALYST, ADMIN | List fraud scores |
| GET | `/fraud/scores/:claimId` | Yes | ADJUSTER, ANALYST, ADMIN | Get score for claim |
| POST | `/fraud/scores/:claimId/override` | Yes | ANALYST | Override fraud score |
| GET | `/fraud/dashboard` | Yes | ANALYST, ADMIN | Fraud analytics dashboard |

### Request/Response Examples

**GET /fraud/scores/:claimId**
```json
{
  "success": true,
  "data": {
    "claimId": "uuid",
    "overallScore": 78,
    "riskLevel": "HIGH",
    "factors": {
      "velocityScore": 85,
      "patternScore": 70,
      "amountScore": 80
    },
    "isOverridden": false
  }
}
```

**POST /fraud/scores/:claimId/override**
```json
// Request
{
  "overrideReason": "Verified claimant identity in person. Hospital records confirmed.",
  "newRiskLevel": "LOW"
}
```

---

## Payment Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/payments/initiate` | Yes | ADMIN, SYSTEM | Initiate M-Pesa STK Push |
| POST | `/payments/mpesa/callback` | No* | — | M-Pesa webhook (*verified by signature) |
| GET | `/payments` | Yes | ADMIN, ADJUSTER | List payments |
| GET | `/payments/:id` | Yes | Any | Get payment details |

### Request/Response Examples

**POST /payments/mpesa/callback** (from Safaricom)
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "...",
      "CheckoutRequestID": "...",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 50000 },
          { "Name": "MpesaReceiptNumber", "Value": "QKJ4....." },
          { "Name": "TransactionDate", "Value": 20260224 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

---

## Admin Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/users` | Yes | ADMIN | List users |
| PATCH | `/admin/users/:id/role` | Yes | ADMIN | Assign role |
| GET | `/admin/analytics/claims` | Yes | ADMIN, ACTUARY | Claims analytics |
| GET | `/admin/analytics/actuarial` | Yes | ACTUARY | Actuarial metrics |
| GET | `/admin/analytics/fraud` | Yes | ADMIN, ANALYST | Fraud analytics |
| GET | `/admin/audit-logs` | Yes | ADMIN, REGULATOR | Audit trail |
| GET | `/admin/ledger/verify` | Yes | ADMIN, REGULATOR | Verify ledger integrity |

---

## OCR Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/ocr/process/:documentId` | Yes | ADJUSTER, ADMIN | Trigger OCR processing |
| GET | `/ocr/results/:documentId` | Yes | Any | Get OCR results |

---

## Health & Utility

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check (DB, Redis, S3) |
| GET | `/health/ready` | No | Readiness probe (K8s) |
| GET | `/health/live` | No | Liveness probe (K8s) |

---

## Pagination

All list endpoints accept:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sortBy` (field name)
- `sortOrder` (`asc` | `desc`)

## Filtering

Claims list supports:
- `status` — ClaimStatus enum
- `type` — ClaimType enum
- `dateFrom`, `dateTo` — date range
- `assignedTo` — adjuster UUID
- `channel` — submission channel
