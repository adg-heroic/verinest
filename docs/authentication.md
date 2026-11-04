# Authentication Architecture

## Current prototype implementation

Stage 3 adds these API foundations:

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/account/me (Bearer token required)

Passwords are hashed with bcrypt before storage. Tokens are signed with a server-side JWT secret.

## Prototype limitation

User records are stored only in process memory. They disappear when the server restarts and are not suitable for production.

Before public launch, add persistent storage, email verification, password reset, rate limiting, audit logging, token revocation, and appropriate monitoring.

Never expose password hashes, JWT secrets, provider credentials, or payment secrets to the browser.
