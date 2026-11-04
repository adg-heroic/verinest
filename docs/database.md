# Database Architecture

## Stage 4 choice

VeriNest uses PostgreSQL through Prisma.

The repository contains the schema only. No database credentials or hosted database have been created by this implementation.

## Core models

### User
Stores the minimum account identity required for authentication. Passwords are stored only as bcrypt hashes.

### Account
One account per user. The balance is represented as a fixed decimal value and should only be changed through controlled transaction logic.

### Transaction
Provides an immutable-style record direction for credits, debits, refunds, and adjustments. Payment integration is not implemented yet.

### VerificationRequest
Stores request lifecycle metadata. It deliberately does not store message content or OTP values.

### AuditEvent
Provides a foundation for security and compliance event logging. Sensitive values should never be placed into audit metadata.

## Before production

- Run database migrations in a controlled environment.
- Restrict database network access.
- Use managed backups and encryption where appropriate.
- Add transaction-level balance controls before handling real money.
- Define data-retention periods and deletion workflows.
- Do not store provider credentials in database records.
