# Folder Structure — KlaimSwift Backend

```
insurance-easy-get/
├── docs/                          # Documentation
│   ├── brainstorm.md
│   ├── system-overview.md
│   ├── domain-model.md
│   ├── claims-lifecycle.md
│   ├── architecture.md
│   ├── folder-structure.md
│   ├── api-design.md
│   ├── auth-flow.md
│   ├── environment-variables.md
│   ├── scaling-strategy.md
│   ├── security-baseline.md
│   └── database-design.md
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Generated migration files
│
├── src/
│   ├── main.ts                    # App bootstrap (Swagger, CORS, Helmet)
│   ├── app.module.ts              # Root module
│   │
│   ├── config/                    # Configuration
│   │   ├── configuration.ts       # Typed env config
│   │   └── validation.ts          # Env validation schema (Joi)
│   │
│   ├── common/                    # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── services/
│   │   │   ├── audit-log.service.ts
│   │   │   ├── ledger.service.ts
│   │   │   └── storage.service.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   └── constants/
│   │       └── index.ts
│   │
│   ├── prisma/                    # Prisma module
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── auth/                      # Auth module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── refresh-token.dto.ts
│   │       └── reset-password.dto.ts
│   │
│   ├── claims/                    # Claims module
│   │   ├── claims.module.ts
│   │   ├── claims.controller.ts
│   │   ├── claims.service.ts
│   │   ├── claims-state.machine.ts
│   │   └── dto/
│   │       ├── create-claim.dto.ts
│   │       ├── update-claim.dto.ts
│   │       ├── transition-claim.dto.ts
│   │       └── query-claims.dto.ts
│   │
│   ├── fraud/                     # Fraud engine module
│   │   ├── fraud.module.ts
│   │   ├── fraud.controller.ts
│   │   ├── fraud.service.ts
│   │   ├── fraud.processor.ts     # BullMQ worker
│   │   └── dto/
│   │       ├── fraud-score.dto.ts
│   │       └── override-score.dto.ts
│   │
│   ├── ocr/                       # OCR processing module
│   │   ├── ocr.module.ts
│   │   ├── ocr.controller.ts
│   │   ├── ocr.service.ts
│   │   └── ocr.processor.ts      # BullMQ worker
│   │
│   ├── payments/                  # Payment module
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   └── dto/
│   │       ├── initiate-payment.dto.ts
│   │       └── mpesa-callback.dto.ts
│   │
│   └── admin/                     # Admin module
│       ├── admin.module.ts
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       └── dto/
│           ├── assign-role.dto.ts
│           └── query-analytics.dto.ts
│
├── test/
│   ├── integration/
│   │   ├── claims-fraud.spec.ts
│   │   ├── claims-payment.spec.ts
│   │   └── auth-rbac.spec.ts
│   └── e2e/
│       ├── claim-lifecycle.e2e-spec.ts
│       ├── payment-replay.e2e-spec.ts
│       └── concurrent-claims.e2e-spec.ts
│
├── k8s/                           # Kubernetes manifests
│   ├── namespace.yaml
│   ├── deployment-api.yaml
│   ├── deployment-worker.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── hpa.yaml
│   └── ingress.yaml
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```
