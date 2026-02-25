# Scaling Strategy — KlaimSwift Backend

## Target Scale

- 100k+ active users
- 30M+ claims/year (~82k claims/day, ~57/min average, ~200/min peak)
- Sub-200ms API response (p95)
- 99.9% uptime

## Horizontal Scaling Architecture

```
                    ┌─────────────┐
                    │  K8s Ingress│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
         │ API Pod │  │ API Pod │  │ API Pod │
         │  (HPA)  │  │  (HPA)  │  │  (HPA)  │
         └─────────┘  └─────────┘  └─────────┘
              │            │            │
         ┌────▼────────────▼────────────▼───┐
         │         PostgreSQL Primary       │
         │         (Read-Write)             │
         └───────────┬─────────────────────┘
                     │ Streaming Replication
              ┌──────┼──────┐
         ┌────▼────┐   ┌────▼────┐
         │Read Rep │   │Read Rep │
         │  (Hot)  │   │  (Hot)  │
         └─────────┘   └─────────┘
```

## Database Scaling

### Table Partitioning (Claims — High Volume)

Partition `claims` table by date range (monthly):
```sql
CREATE TABLE claims (
  id UUID,
  created_at TIMESTAMPTZ,
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE claims_2026_01 PARTITION OF claims
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE claims_2026_02 PARTITION OF claims
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- Auto-managed by pg_partman extension
```

### Read Replicas
- **Read-heavy queries** (analytics, reporting, list endpoints) → Read replica
- **Write operations** (create, update, transition) → Primary
- Prisma supports `$queryRaw` with read replica connection

### Connection Pooling
- PgBouncer for connection pooling (max 100 connections → 10,000 concurrent)
- Prisma connection pool: min 2, max 10 per pod

### Index Strategy
- B-tree indexes on frequently filtered columns (status, tenant_id, created_at)
- Composite indexes for common query patterns (tenant_id + status + created_at)
- GIN index on JSONB columns (fraud_score.factors, audit_log.old_value)
- Partial indexes for active records (WHERE deleted_at IS NULL)

## Redis Scaling

- **Redis Cluster** for production (3 masters + 3 replicas minimum)
- Separate databases: 0=cache, 1=sessions, 2=BullMQ queues
- Key expiry policies for cache items
- Memory limit with LRU eviction for cache

## Worker Auto-Scaling

| Worker | Scaling Trigger | Min Pods | Max Pods |
|---|---|---|---|
| Fraud Scorer | Queue depth > 100 | 2 | 10 |
| OCR Processor | Queue depth > 50 | 1 | 5 |
| Notification | Queue depth > 200 | 1 | 3 |

Workers are Kubernetes Deployments with HPA based on custom BullMQ queue depth metrics exported to Prometheus.

## API Auto-Scaling

| Metric | Scale Up | Scale Down |
|---|---|---|
| CPU utilization | > 70% | < 30% |
| Memory utilization | > 80% | < 40% |
| Request latency (p95) | > 500ms | < 100ms |
| Min/Max pods | 3 | 20 |

## Caching Strategy

| Data | TTL | Invalidation |
|---|---|---|
| User profile (JWT claims) | 15 min | On role change |
| Claim list (by tenant) | 30 sec | On claim create/update |
| Fraud score | 5 min | On score update/override |
| Actuarial metrics | 1 hour | On scheduled recalc |
| Policy lookup | 5 min | On policy update |

Cache keys are tenant-scoped: `tenant:{id}:claims:list:{hash}`.

## Data Archival Strategy

1. **Active data:** Claims < 1 year old → primary database (fast SSD)
2. **Warm data:** Claims 1–3 years old → read replica, still queryable
3. **Cold data:** Claims 3–7 years old → archived partitions (cheaper storage)
4. **Purged:** Claims > 7 years old → deleted (regulatory retention met)

Archival runs as a scheduled BullMQ job (weekly).

## Load Testing Strategy

| Tool | Scenario | Target |
|---|---|---|
| k6 | Sustained load: 1000 VUs, 10 min | < 200ms p95 |
| k6 | Spike: 0→5000 VUs in 30 sec | No errors, < 1s p95 |
| k6 | Soak: 500 VUs, 1 hour | No memory leaks |
| Custom | Concurrent claim creation | No duplicate claim numbers |
| Custom | M-Pesa callback replay | Idempotent (no double payment) |
