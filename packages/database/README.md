# @filops/database

Database package for FilOps using Prisma ORM with PostgreSQL.

## Features

- **Prisma ORM** for type-safe database access
- **PostgreSQL** database with full schema
- **Migrations** for version control
- **Seed data** for development and testing
- **Type-safe** models and queries

## Database Schema

### Core Models

- **User** - User accounts with roles (Admin, Operator, Developer, Viewer)
- **Project** - Projects owned by users
- **Policy** - Storage policies with replication, renewal, and arbitrage rules
- **Dataset** - Data stored on Filecoin (identified by CID)
- **Deal** - Storage deals with providers
- **AgentInstance** - Running agents (RBA, PRA, PAA)
- **AgentAction** - Agent actions and their execution status
- **Alert** - System alerts and notifications
- **AuditLog** - Immutable audit trail

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Database

Create `.env` file:

```bash
cp .env.example .env
```

Update `DATABASE_URL` if needed:
```
DATABASE_URL=postgresql://filops:filops@localhost:5434/filops
```

### 3. Generate Prisma Client

```bash
pnpm db:generate
```

### 4. Run Migrations

```bash
# Development (creates migration files)
pnpm db:migrate

# Production (applies migrations)
pnpm db:migrate:deploy
```

### 5. Seed Database (Optional)

```bash
pnpm db:seed
```

## Usage

### In Your Code

```typescript
import { prisma, User, Project } from '@filops/database';

// Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    role: 'DEVELOPER',
  },
});

// Query with relations
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    owner: true,
    policies: true,
    datasets: true,
  },
});

// Update
await prisma.policy.update({
  where: { id: policyId },
  data: { active: true },
});

// Delete
await prisma.dataset.delete({
  where: { id: datasetId },
});
```

## Available Scripts

```bash
# Generate Prisma Client
pnpm db:generate

# Create and apply migration
pnpm db:migrate

# Apply migrations (production)
pnpm db:migrate:deploy

# Push schema without migration (dev only)
pnpm db:push

# Open Prisma Studio (GUI)
pnpm db:studio

# Seed database
pnpm db:seed

# Reset database (WARNING: deletes all data)
pnpm db:reset

# Run tests
pnpm test

# Build
pnpm build
```

## Prisma Studio

View and edit your database with a GUI:

```bash
pnpm db:studio
```

Opens at http://localhost:5555

## Migrations

### Create a New Migration

```bash
pnpm db:migrate
```

This will:
1. Prompt for a migration name
2. Generate SQL migration files
3. Apply the migration
4. Regenerate Prisma Client

### Migration Files

Located in `prisma/migrations/`

Each migration has:
- `migration.sql` - SQL commands
- Timestamp prefix for ordering

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:cov
```

**Note**: Tests run against the configured database. Use a separate test database in CI/CD.

## Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm db:migrate` to create migration
3. Commit both schema and migration files

## Troubleshooting

### Connection Issues

```bash
# Test connection
pnpm prisma db execute --stdin <<< "SELECT 1"

# Check database exists
psql postgresql://filops:filops@localhost:5434/postgres -c "\l"
```

### Reset Everything

```bash
# WARNING: Deletes all data
pnpm db:reset
```

### Generate Client After Schema Changes

```bash
pnpm db:generate
```

## Production Considerations

1. **Use connection pooling** (PgBouncer)
2. **Set appropriate pool size** in DATABASE_URL
3. **Run migrations** before deploying new code
4. **Backup database** before major migrations
5. **Monitor query performance** with Prisma logging
6. **Use read replicas** for heavy read workloads

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database?schema=public&connection_limit=10&pool_timeout=20
```

Parameters:
- `connection_limit` - Max connections (default: unlimited)
- `pool_timeout` - Connection timeout in seconds (default: 10)
- `schema` - PostgreSQL schema (default: public)
