# VeriNest

VeriNest is an independent prototype for a future verification-services marketplace focused on legitimate, authorized verification and testing workflows.

## Current stage

**Stage 3 — Authentication foundation**

The project now contains a responsive front-end prototype, a lightweight Node.js/Express API, password hashing and token-based authentication foundations, and architecture/security documentation.

## Authentication status

Authentication is currently a **development prototype**. User records are stored only in server memory and disappear on restart. It must not be treated as production-ready authentication.

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

Authentication endpoints require a server-side JWT_SECRET.

## Running the API locally

You need Node.js 20 or newer.

1. Open a terminal in the server folder.
2. Run npm install.
3. Copy the root .env.example to .env.
4. Set a long, random JWT_SECRET locally.
5. Run npm run dev.

Do not commit your .env file.

## Next stages

1. Persistent database and user schema
2. Production-grade authentication controls
3. Authorized provider due diligence and adapter design
4. Payment integration planning
5. Abuse prevention, compliance controls, testing, and deployment
