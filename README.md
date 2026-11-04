# VeriNest

VeriNest is an independent prototype for a future verification-services marketplace focused on legitimate, authorized verification and testing workflows.

## Current stage

**Stage 2 — Application foundation**

The project now contains:

- A responsive Stage 1 front-end prototype
- A lightweight Node.js/Express API foundation
- A health-check endpoint
- Environment configuration templates
- Basic HTTP security headers and request-size limits
- Architecture and security planning documentation

## Important

This repository does **not** currently provide live SMS verification services.

- No live SMS provider is connected.
- No phone numbers are purchased by the prototype.
- No incoming SMS or OTP messages are fabricated or represented as real.
- No provider, payment, or database credentials are committed to this repository.
- Any future provider integration must explicitly authorize the intended use and resale model.

## Project structure

```text
verinest/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/app.js
├── server/
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/env.js
│       └── routes/health.js
├── .env.example
├── .gitignore
└── docs/architecture.md
```

## Running the API locally

You need Node.js 20 or newer.

1. Open a terminal in the `server` folder.
2. Run `npm install`.
3. Copy the root `.env.example` to `.env` and adjust values for local development.
4. Run `npm run dev`.
5. Visit `http://localhost:3000/api/v1/health`.

The health endpoint does not expose credentials or verification data.

## Next stages

1. Authentication and account security design
2. Database selection and schema implementation
3. Authorized provider due diligence and adapter design
4. Payment integration planning
5. Abuse prevention, compliance controls, and testing
6. Deployment

See [docs/architecture.md](docs/architecture.md) for the current architecture direction.
