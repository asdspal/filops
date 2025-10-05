# FilOps Quick Start Guide

Get FilOps up and running in under 10 minutes!

---

## Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **Docker** and **Docker Compose**
- **Make** (optional)

---

## Step 1: Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/filops.git
cd filops

# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

---

## Step 2: Start Infrastructure

```bash
# Start PostgreSQL, TimescaleDB, and Kafka
make infra-start

# Wait ~30 seconds for services to be ready

# Check service health
make infra-check
```

You should see:
```
✓ PostgreSQL is healthy
✓ TimescaleDB is healthy
✓ Kafka is healthy
✓ Zookeeper is healthy
✓ Kafka UI is healthy
```

---

## Step 3: Setup Database

```bash
# Run database migrations
cd packages/database
pnpm db:migrate

# Seed test data
pnpm db:seed

# (Optional) Open Prisma Studio to view data
pnpm db:studio
```

---

## Step 4: Build Packages

```bash
# Build all packages
cd ../..
pnpm build
```

---

## Step 5: Start API Gateway

```bash
cd packages/api-gateway
pnpm dev
```

The API will be available at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

---

## Step 6: Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### List Policies
```bash
curl http://localhost:3000/policies
```

### Create a Policy
```bash
curl -X POST http://localhost:3000/policies \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Production Policy",
    "doc": {
      "replication": {
        "regions": [
          { "code": "NA", "min_replicas": 2 },
          { "code": "EU", "min_replicas": 1 }
        ]
      },
      "availability_target": 0.999,
      "cost_ceiling_usd_per_TiB_month": 100,
      "renewal": {
        "lead_time_days": 14,
        "min_collateral_buffer_pct": 20
      },
      "arbitrage": {
        "enable": false
      }
    },
    "active": false
  }'
```

---

## Step 7: Register and Start an Agent

### Register an RBA Agent
```bash
curl -X POST http://localhost:3000/agents \
  -H "Content-Type: application/json" \
  -d '{
    "type": "RBA",
    "projectId": "123e4567-e89b-12d3-a456-426614174000",
    "policyId": "<policy-id-from-step-6>",
    "config": {
      "checkIntervalMs": 60000,
      "autoExecute": false,
      "maxActionsPerRun": 10
    }
  }'
```

Save the `agent_id` from the response.

### Start the Agent
```bash
curl -X POST http://localhost:3000/agents/<agent-id>/start
```

### Check Agent Status
```bash
curl http://localhost:3000/agents/<agent-id>
```

---

## Step 8: Monitor Events

Open Kafka UI in your browser:
```
http://localhost:8080
```

You can see:
- Topics: `filops.policies.updates`, `filops.agents.actions`, etc.
- Messages: Real-time events from agents and services

---

## Step 9: View Database

Open Prisma Studio:
```bash
cd packages/database
pnpm db:studio
```

Browse:
- **policies** - Your policies
- **agents** - Running agents
- **actions** - Proposed/executed actions
- **alerts** - System alerts
- **deals** - Storage deals

---

## Step 10: Run Tests

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @filops/policy-engine test
pnpm --filter @filops/agent-orchestrator test
```

---

## Common Commands

### Infrastructure
```bash
make infra-start    # Start all services
make infra-stop     # Stop all services
make infra-check    # Check service health
make infra-reset    # Reset all data
```

### Development
```bash
pnpm install        # Install dependencies
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm dev            # Start development mode
```

### Database
```bash
cd packages/database
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed test data
pnpm db:studio      # Open Prisma Studio
pnpm db:reset       # Reset database
```

---

## Troubleshooting

### Port Already in Use
If ports 3000, 5433, 5434, 8080, or 9092 are in use:
1. Stop conflicting services
2. Or modify ports in `docker-compose.yml` and `.env`

### Kafka Connection Issues
```bash
# Restart Kafka
docker-compose restart kafka zookeeper

# Check logs
docker-compose logs kafka
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify connection
psql postgresql://filops:filops@localhost:5434/filops
```

### Build Errors
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

---

## Next Steps

1. **Explore the API** - Visit http://localhost:3000/api/docs
2. **Read the Docs** - Check `memory-bank/` for detailed guides
3. **Create Policies** - Define your storage policies
4. **Start Agents** - Let agents manage your storage
5. **Monitor** - Watch agents work in real-time

---

## Getting Help

- **Documentation**: See `memory-bank/` directory
- **API Docs**: http://localhost:3000/api/docs
- **Issues**: Create an issue on GitHub
- **Email**: ashwinids@gmail.com

---

**Happy FilOps-ing! 🚀**
