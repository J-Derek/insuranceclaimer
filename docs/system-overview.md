# System Overview — KlaimSwift Insurance Claims System

## Purpose

KlaimSwift is a production-grade insurance claims management platform built for Kenya's insurance market. It digitizes the entire claims lifecycle — from multi-channel submission through AI-powered fraud detection to automated M-Pesa settlement — reducing processing times from 15–30 days to 2–3 days.

## Target Market

- **Geography:** Kenya (IRA-regulated)
- **Scale:** 100k+ active users, 30M+ claims/year capacity
- **Deployment:** SaaS multi-tenant model

## User Roles

| Role | Responsibilities |
|---|---|
| **Policyholder** | Submit claims (web, mobile, WhatsApp, USSD), upload documents, track status, receive payments via M-Pesa |
| **Claims Adjuster** | Review claims, request documents, approve/reject, trigger inspections |
| **Fraud Analyst** | Review flagged claims, override risk scores, investigate patterns |
| **Admin** | Manage users/roles, configure system, manage tenants |
| **Actuary** | Access predictive analytics, loss ratios, reserve forecasting, trend analysis |
| **Regulator (IRA)** | View audit trails, compliance reports, industry-wide metrics |

## Core System Workflows

### 1. Claim Submission Flow
```
Policyholder → [Web/Mobile/WhatsApp/USSD] → API Gateway → Claims Service
  → Validate policy → Create claim record → Upload documents to S3
  → Trigger OCR processing (async) → Trigger fraud scoring (async)
  → Notify adjuster → Audit log entry
```

### 2. Fraud Detection Flow
```
Claim Created → BullMQ Job → Fraud Worker
  → Risk scoring (GLM, velocity, pattern) → Store FraudScore
  → If Critical (≥85): Auto-flag for investigation
  → If High (70-84): Priority review queue
  → If Medium (50-69): Standard review
  → If Low (<50): Fast-track eligible
```

### 3. Payment Settlement Flow
```
Claim Approved → Payment Service → M-Pesa STK Push
  → Callback webhook → Verify signature → Record payment
  → Update claim status → Notify policyholder
  → Cryptographic ledger entry → Audit log
```

### 4. OCR Document Processing
```
Document Uploaded → BullMQ Job → OCR Worker
  → Extract text/metadata → Store structured data
  → Link to claim record → Auto-fill claim fields
```

## Required Integrations

| Integration | Purpose | Protocol |
|---|---|---|
| **M-Pesa (Safaricom)** | Premium payments, claim settlements | REST API (Daraja) |
| **WhatsApp Business API** | Claim submission, status updates | Webhook |
| **Africa's Talking** | USSD channel, SMS notifications | REST API |
| **S3-compatible storage** | Document/image storage | S3 API |
| **OCR Service** | Document text extraction | Internal queue |

## AI & Actuarial Components

- **Fraud Detection:** GLM-based scoring, random forest patterns, velocity checks
- **Actuarial Models:** Poisson/Negative Binomial (claim frequency), Gamma/Lognormal (severity), Chain Ladder (reserves)
- **Predictive Analytics:** ARIMA/Holt-Winters for trend analysis
- **Image Recognition:** Damage assessment from submitted photos (future)

## Regulatory Constraints

- IRA (Insurance Regulatory Authority) compliance reporting
- Kenya Data Protection Act compliance
- Automated audit trails for all claim transactions
- Standardized data formats for industry reporting
- 7-year data retention for claims records

## Key Performance Targets

| Metric | Target |
|---|---|
| Claims processing time | 2–3 days (from 15–30) |
| Manual data entry reduction | 85% |
| Fraud reduction | 40% |
| Support call reduction | 50% |
| System uptime | 99.9% |
| API response time (p95) | < 200ms |
