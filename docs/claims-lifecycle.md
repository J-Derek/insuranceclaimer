# Claims Lifecycle — KlaimSwift Insurance Claims System

## State Machine

```
                    ┌──────────┐
                    │  DRAFT   │ (saved but not submitted)
                    └────┬─────┘
                         │ submit()
                    ┌────▼─────┐
                    │SUBMITTED │
                    └────┬─────┘
                         │ assign_adjuster()
                    ┌────▼──────────┐
                    │ UNDER_REVIEW  │
                    └────┬──────────┘
                         │ trigger_fraud_check()
                    ┌────▼──────────┐
                    │ FRAUD_CHECK   │ (async — waiting for score)
                    └────┬──────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
      ┌───────▼──┐ ┌─────▼────┐ ┌──▼──────────┐
      │ APPROVED │ │ REJECTED │ │ INVESTIGATION│
      └────┬─────┘ └──────────┘ └──────┬───────┘
           │                           │
           │                    ┌──────▼──────┐
           │                    │  APPROVED/   │
           │                    │  REJECTED    │
           │                    └──────────────┘
      ┌────▼───────────┐
      │PAYMENT_PENDING │
      └────┬───────────┘
           │
    ┌──────┼──────────┐
    │                 │
┌───▼────┐    ┌───────▼──┐
│SETTLED │    │DISPUTED  │
└───┬────┘    └────┬─────┘
    │              │ resolve()
    │         ┌────▼─────┐
    │         │ SETTLED/ │
    │         │ REJECTED │
    │         └──────────┘
┌───▼────┐
│ CLOSED │
└───┬────┘
    │ archive() (after retention period)
┌───▼─────┐
│ARCHIVED │
└─────────┘
```

## Status Definitions

| Status | Description | Triggered By |
|---|---|---|
| `DRAFT` | Claim saved but not submitted. Policyholder can still edit. | Policyholder |
| `SUBMITTED` | Claim submitted for processing. Documents attached. | Policyholder |
| `UNDER_REVIEW` | Assigned to a claims adjuster for review. | System (auto-assign) or Admin |
| `FRAUD_CHECK` | Async fraud scoring in progress. | System (auto after review) |
| `APPROVED` | Claim approved by adjuster. Amount confirmed. | Claims Adjuster |
| `REJECTED` | Claim rejected with documented reason. | Claims Adjuster / Fraud Analyst |
| `INVESTIGATION` | Flagged for fraud investigation (score ≥ 70). | Fraud Engine / Fraud Analyst |
| `PAYMENT_PENDING` | Approved, awaiting payment processing. | System (auto after approval) |
| `SETTLED` | Payment successfully disbursed via M-Pesa. | Payment Service |
| `DISPUTED` | Policyholder disputes the decision or amount. | Policyholder |
| `CLOSED` | Claim lifecycle complete. No further action. | System / Admin |
| `ARCHIVED` | Moved to cold storage after retention period. | System (scheduled) |

## Valid State Transitions

| From | To | Actor | Rules |
|---|---|---|---|
| `DRAFT` | `SUBMITTED` | Policyholder | At least 1 document required |
| `SUBMITTED` | `UNDER_REVIEW` | System/Admin | Auto-assigns adjuster based on claim type |
| `UNDER_REVIEW` | `FRAUD_CHECK` | System | Auto-triggered, adjuster confirms details first |
| `FRAUD_CHECK` | `APPROVED` | Adjuster | Fraud score < 70 required, or override logged |
| `FRAUD_CHECK` | `REJECTED` | Adjuster | Must provide rejection reason |
| `FRAUD_CHECK` | `INVESTIGATION` | System/Analyst | Auto if score ≥ 70, or manual by analyst |
| `INVESTIGATION` | `APPROVED` | Fraud Analyst | Override logged with full justification |
| `INVESTIGATION` | `REJECTED` | Fraud Analyst | Investigation findings documented |
| `APPROVED` | `PAYMENT_PENDING` | System | Auto-triggered on approval |
| `PAYMENT_PENDING` | `SETTLED` | Payment Service | M-Pesa callback confirms success |
| `PAYMENT_PENDING` | `DISPUTED` | Policyholder | Must provide dispute reason |
| `SETTLED` | `CLOSED` | System/Admin | After settlement confirmation period |
| `REJECTED` | `DISPUTED` | Policyholder | Within 30-day dispute window |
| `DISPUTED` | `UNDER_REVIEW` | Admin | Re-opens claim for re-evaluation |
| `CLOSED` | `ARCHIVED` | System | After data retention period (7 years) |

## Invalid Transitions (Enforced by State Machine)

- `SUBMITTED` → `APPROVED` (cannot skip review)
- `DRAFT` → `APPROVED` (cannot approve unsubmitted)
- `SETTLED` → `SUBMITTED` (cannot un-settle)
- `ARCHIVED` → any (archived is terminal)
- `CLOSED` → `SUBMITTED` (cannot reopen closed)
- Any → `DRAFT` (draft is initial only)

## Enforcement Rules

1. **Every transition** creates a `ClaimStatusHistory` record
2. **Every transition** creates an `AuditLog` entry
3. **Every transition** creates a `LedgerEntry` (hash-chained)
4. **Rejection** requires a `reason` field (non-empty string)
5. **Override** of fraud score requires `overrideReason` and `overriddenById`
6. **Dispute** window: 30 days from rejection/settlement date
7. **Archival** only after 7-year retention period from closure date

## Processing Time SLAs

| Transition | Target SLA |
|---|---|
| Submitted → Under Review | < 1 hour (business hours) |
| Under Review → Fraud Check | < 4 hours |
| Fraud Check → Decision | < 24 hours |
| Approved → Settled | < 48 hours |
| Dispute → Re-review | < 72 hours |
