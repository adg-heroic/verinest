# VeriNest Architecture

## Current prototype boundary

The current application is intentionally split into a static frontend and a small server foundation.

```text
Browser
  │
  ├── Static prototype (index.html + assets)
  │
  └── Future authenticated application
          │
          ▼
     VeriNest API
          │
          ├── Authentication (future)
          ├── Account management (future)
          ├── Verification request orchestration (future)
          ├── Payments (future)
          └── Authorized provider adapters (future)
```

## Security principles

- Provider and payment credentials stay on the server.
- Secrets are loaded from environment variables and are not committed.
- API input should be validated before business logic is added.
- Rate limiting and abuse controls should be introduced before public production access.
- Verification and message data should be retained only as long as necessary.
- Live providers must explicitly authorize the intended use case.

## Data model direction

Future persistence should separate:

- users and authentication identities
- account balances and immutable transaction records
- service requests and their lifecycle
- provider configuration and provider-side references
- security and compliance audit events

No production database is connected during this stage.

## API status

`GET /api/v1/health` is a non-sensitive health endpoint for local and future deployment checks.

The API deliberately contains no live SMS, number purchasing, OTP retrieval, payment, or provider functionality.
