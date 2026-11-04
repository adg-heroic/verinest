# VeriNest

VeriNest is an independent prototype for a future verification-services marketplace focused on legitimate, authorized verification and testing workflows.

## Current stage

**Stage 4 — Persistent database foundation**

The project contains a responsive front-end prototype, a Node.js/Express API, password-hashed registration and token-based login foundations, a Prisma PostgreSQL schema, and an initial database migration.

## Authentication status

Authentication is still an early prototype. It requires the Supabase database migration to complete successfully on Render before registration and login can be tested. Production-grade authentication controls, account recovery, rate limiting, and security review remain outstanding.

## Important

This repository does **not** currently provide live SMS verification services.

- No live SMS provider is connected.
- No phone numbers are purchased by the prototype.
- No incoming SMS or OTP messages are fabricated or represented as real.
- No provider, payment, database, or JWT secrets are committed to this repository.
- Any future provider integration must explicitly authorize the intended use and resale model.

## API endpoints

- GET /api/v1/health
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/account/me

Authentication endpoints require server-side `JWT_SECRET` and `DATABASE_URL` settings. For this early prototype, the Render start command runs `prisma db push` before starting the API, synchronizing the Prisma schema with the Supabase database. A formal migration/baselining workflow should be introduced before production.

## Database migration

The initial migration remains in `server/prisma/migrations/20261104130000_init/migration.sql` as the schema history blueprint. For the current prototype, Render uses `prisma db push` to synchronize the schema because the managed Supabase database is already non-empty. Before production, the database will be baselined and switched to a formal migration workflow.

## Running the API locally

You need Node.js 20 or newer.

1. Open a terminal in the server folder.
2. Run npm install.
3. Copy the root .env.example to .env.
4. Set a long, random JWT_SECRET locally.
5. Run npm run dev.

Do not commit your .env file.

## Next stages

1. Verify persistent registration/login and database migration
2. Production-grade authentication controls
3. Authorized provider due diligence and adapter design
4. Payment integration planning
5. Abuse prevention, compliance controls, testing, and deployment
