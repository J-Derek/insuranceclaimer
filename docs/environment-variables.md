# Environment Variables — KlaimSwift Backend

## Application

| Variable | Description | Example | Required |
|---|---|---|---|
| `NODE_ENV` | Runtime environment | `development` / `production` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `API_PREFIX` | API path prefix | `api/v1` | Yes |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3001,https://app.klaimswift.co.ke` | Yes |

## Database

| Variable | Description | Example | Required |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/klaimswift?schema=public` | Yes |
| `DATABASE_POOL_MIN` | Min pool connections | `2` | No (default: 2) |
| `DATABASE_POOL_MAX` | Max pool connections | `10` | No (default: 10) |

## Redis

| Variable | Description | Example | Required |
|---|---|---|---|
| `REDIS_HOST` | Redis host | `localhost` | Yes |
| `REDIS_PORT` | Redis port | `6379` | Yes |
| `REDIS_PASSWORD` | Redis password | `secret` | No |
| `REDIS_DB` | Redis database number | `0` | No (default: 0) |

## JWT / Auth

| Variable | Description | Example | Required |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | Access token signing secret (min 32 chars) | `super-secret-access-key-min-32-chars` | Yes |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` | Yes |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `super-secret-refresh-key-min-32-chars` | Yes |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` | Yes |
| `BCRYPT_ROUNDS` | Bcrypt hashing rounds | `12` | No (default: 12) |

## S3 Storage

| Variable | Description | Example | Required |
|---|---|---|---|
| `S3_ENDPOINT` | S3 endpoint URL | `http://localhost:9000` (MinIO) | Yes |
| `S3_ACCESS_KEY` | S3 access key | `minioadmin` | Yes |
| `S3_SECRET_KEY` | S3 secret key | `minioadmin` | Yes |
| `S3_BUCKET` | S3 bucket name | `klaimswift-documents` | Yes |
| `S3_REGION` | S3 region | `us-east-1` | No (default: us-east-1) |

## M-Pesa (Daraja API)

| Variable | Description | Example | Required |
|---|---|---|---|
| `MPESA_CONSUMER_KEY` | Daraja consumer key | `abc123...` | Yes |
| `MPESA_CONSUMER_SECRET` | Daraja consumer secret | `xyz789...` | Yes |
| `MPESA_SHORTCODE` | Business shortcode | `174379` | Yes |
| `MPESA_PASSKEY` | Lipa Na M-Pesa passkey | `bfb279...` | Yes |
| `MPESA_CALLBACK_URL` | Payment callback URL | `https://api.klaimswift.co.ke/api/v1/payments/mpesa/callback` | Yes |
| `MPESA_ENVIRONMENT` | Sandbox or production | `sandbox` / `production` | Yes |

## WhatsApp (Meta Business API)

| Variable | Description | Example | Required |
|---|---|---|---|
| `WHATSAPP_API_TOKEN` | Meta API bearer token | `EAAG...` | No* |
| `WHATSAPP_PHONE_ID` | WhatsApp phone number ID | `123456789` | No* |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | `my-verify-token` | No* |

*Required only if WhatsApp channel is enabled.

## Rate Limiting

| Variable | Description | Example | Required |
|---|---|---|---|
| `THROTTLE_TTL` | Default rate limit window (seconds) | `60` | No (default: 60) |
| `THROTTLE_LIMIT` | Default requests per window | `60` | No (default: 60) |

## Observability

| Variable | Description | Example | Required |
|---|---|---|---|
| `LOG_LEVEL` | Logging level | `info` / `debug` / `error` | No (default: info) |
| `OTEL_ENDPOINT` | OpenTelemetry collector URL | `http://otel-collector:4318` | No |

---

## Notes

- **Secrets management:** In production, use Kubernetes Secrets or HashiCorp Vault. Never commit `.env` files.
- **Validation:** All env vars are validated at startup using Joi schema. Missing required vars cause immediate exit.
- **Defaults:** Optional vars have sensible defaults for local development.
