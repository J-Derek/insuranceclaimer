# 🧠 Brainstorm: Insurance Claims System Backend Architecture

## Context

Building a production-grade backend for **KlaimSwift** — an innovative insurance claims system for Kenya that combines AI, blockchain, mobile-first platforms, and actuarial analytics. The system must handle 30M+ claims/year at scale, integrate M-Pesa payments, support WhatsApp/USSD channels, enforce fraud detection, and comply with IRA (Insurance Regulatory Authority) regulations.

**Source:** National Product Development Competition 2025/2026, Daystar University proposal by Araka Rebbecah.

---

## Key Decision Areas

### Option A: Pure NestJS Monolith (Modular)

A single NestJS application with strongly separated modules (Auth, Claims, Fraud, OCR, Payments, Admin), using PostgreSQL + Prisma, BullMQ for async jobs, and Redis for caching. Deployed as a single Docker container.

✅ **Pros:**
- Simplest deployment and debugging
- Shared database — atomic transactions across modules
- NestJS module system provides clean boundaries
- Lower operational cost initially
- Easiest to test end-to-end

❌ **Cons:**
- Single failure domain
- Scaling limited to vertical + horizontal replicas of entire app
- OCR/Fraud CPU-heavy work could starve API requests

📊 **Effort:** Medium

---

### Option B: NestJS Modular Monolith with Worker Processes

Same as Option A, but CPU-intensive work (fraud scoring, OCR processing) runs in separate BullMQ worker processes. The main API process handles HTTP requests only. Workers consume from Redis queues.

✅ **Pros:**
- CPU-intensive work isolated from API latency
- Independent scaling of workers vs API
- Still a single codebase — shared types, schemas
- Production-proven pattern (Stripe, Shopify use this)
- Can evolve to microservices later if needed

❌ **Cons:**
- Slightly more complex deployment (API + workers)
- Need queue monitoring (Bull Board)

📊 **Effort:** Medium

---

### Option C: Full Microservices (NestJS + gRPC)

Separate services for each domain (Auth, Claims, Fraud, OCR, Payments), communicating via gRPC or message broker (RabbitMQ/Kafka).

✅ **Pros:**
- Independent scaling per service
- Independent deployment
- Technology flexibility per service
- Fault isolation

❌ **Cons:**
- Massive operational complexity for a competition project
- Distributed transactions are hard (saga pattern needed)
- Network latency between services
- Over-engineering for current scale
- 10x more infrastructure (service mesh, API gateway, etc.)

📊 **Effort:** Very High

---

## 💡 Recommendation

**Option B: NestJS Modular Monolith with Worker Processes** — This is the sweet spot for a production-grade competition project. It provides:

1. **Clean architecture** via NestJS modules
2. **Performance isolation** — OCR and fraud scoring won't block API responses
3. **Simple deployment** — one codebase, two process types (API + worker)
4. **Future-proof** — can split into microservices later without rewriting
5. **Matches the scale requirement** — BullMQ handles millions of jobs/day

---

## Technology Stack Decisions

| Component | Choice | Justification |
|---|---|---|
| **Framework** | NestJS (TypeScript) | Type-safe, modular, enterprise patterns, OpenAPI support |
| **Database** | PostgreSQL | Complex relationships, partitioning, JSONB for flexible data, proven at scale |
| **ORM** | Prisma | Best DX, schema-first, type-safe queries, migration tooling |
| **Cache** | Redis | Session storage, rate limiting, BullMQ backing store |
| **Queue** | BullMQ | Reliable job processing, delayed jobs, rate limiting, retries |
| **Storage** | S3-compatible (MinIO local / AWS S3 prod) | Document and image storage for OCR pipeline |
| **Auth** | JWT + Refresh tokens | Stateless, scalable, industry standard |
| **RBAC** | Custom guards + Prisma role model | Flexible, supports tenant isolation |
| **API Style** | REST + OpenAPI/Swagger | Broad compatibility, auto-generated docs |
| **Containerization** | Docker + docker-compose | Consistent environments |
| **Orchestration** | Kubernetes | Production scaling target |

---

## Blockchain Decision: Cryptographic Audit Ledger

> **Decision:** Use a **Cryptographic Event Ledger** instead of a full blockchain.

**Justification:**
- Full blockchain (Ethereum/Hyperledger) adds massive complexity, gas costs, and latency
- The proposal's core need is **immutability + traceability** — not decentralization
- A hash-chained audit log (each entry includes SHA-256 hash of previous entry) provides:
  - Tamper-evident records
  - Verifiable audit trail
  - No external dependencies
  - Sub-millisecond latency
  - Simulated "smart contract" behavior via state machines
- If true blockchain is later required, the ledger entries can be batch-anchored to a public chain

---

## Fraud Detection Architecture

- **Async pipeline:** Claim submission → BullMQ job → Fraud scoring worker
- **Risk scores:** 0-100 scale with thresholds (Critical ≥85, High 70-84, Medium 50-69)
- **Models (simulated):** GLM-based scoring, pattern matching, velocity checks
- **Manual override:** Admin can override with audit logging
- **Real-time:** Redis-cached risk profiles for repeat claimants

---

## Multi-Channel Strategy (Backend Perspective)

| Channel | Backend Support |
|---|---|
| **Web Portal** | Direct REST API |
| **Mobile App** | Same REST API |
| **WhatsApp** | Webhook endpoint for Meta Business API |
| **USSD** | Webhook endpoint for Africa's Talking / Safaricom API |
| **SMS** | Notification service via Africa's Talking |

All channels converge to the same Claims service — the channel is just metadata.

---

## What direction would you like to explore?
