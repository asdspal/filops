# FilOps

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Overview

**FilOps** is an autonomous agent suite designed to automate and optimize every aspect of Filecoin storage operations. Leveraging a modular architecture, FilOps provides intelligent agents for replica balancing, predictive deal renewal, and pricing arbitrage—enabling fully self-healing, policy-driven data pipeline automation on Filecoin.

---

## Features

- **Replica Balance Agent:** Maintains geo-distributed replicas by automatically creating deals and upgrading sectors to meet resilience policies.
- **Predictive Renewal Agent:** Uses AI/ML forecasting to proactively top-up collateral and renew deals before expiration, ensuring uninterrupted storage.
- **Pricing Arbitrage Agent:** Continuously scans provider pricing and SLA metrics to migrate cold data cost-effectively while maintaining SLA guarantees.
- **Policy-Driven Automation:** Define custom policies for geo-replication, renewal thresholds, and cost limits through an intuitive dashboard.
- **Unified API & CLI:** Manage agents, policies, and storage workflows seamlessly via REST APIs and command-line tools.
- **Real-Time Monitoring & Alerts:** Track agent health, SLA statuses, and cost optimizations with customizable alerting.

---

## Architecture

FilOps is a microservices-based system including:
- Agent services (node.js/TypeScript) deployed serverlessly or in Kubernetes
- Event-driven Kafka bus for real-time PDP proof and pricing data
- AI/ML microservice for forecasting and decision-making
- PostgreSQL and time-series databases for metadata and metrics
- Frontend dashboard built with React and Next.js
- Deep integration with Filecoin Onchain Cloud using Synapse SDK

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **Docker** and **Docker Compose** (for local infrastructure)
- **Make** (optional, for convenience commands)
- Access to a Filecoin testnet or mainnet node (for later milestones)
- Wallet with FIL tokens for testing payments and deals (for later milestones)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/filops.git
cd filops

# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies
pnpm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `FILECOIN_RPC_URL` - Filecoin node RPC endpoint
- `FILECOIN_WALLET_PRIVATE_KEY` - Wallet private key or KMS credentials
- `KAFKA_BROKERS` - Kafka broker connection details
- `DATABASE_URL` - PostgreSQL connection string

### Running Infrastructure

```bash
# Start infrastructure services (PostgreSQL, Kafka, TimescaleDB)
make infra-start

# Check service health
make infra-check

# Stop infrastructure
make infra-stop
```

### Running Application Services

```bash
# Start all services in development mode
pnpm dev

# Or start individual services
cd packages/api-gateway && pnpm dev
```

**Service URLs:**
- API Gateway: [http://localhost:3000](http://localhost:3000)
- API Documentation: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- Kafka UI: [http://localhost:8080](http://localhost:8080)
- PostgreSQL: `localhost:5434`
- TimescaleDB: `localhost:5433`
- Kafka: `localhost:9092`

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @filops/common test

# Run tests with coverage
pnpm --filter @filops/api-gateway test:cov
```

---

## Usage

- Use the onboarding wizard to link Git repos and wallets.
- Create and customize policies for geo-replication and renewal thresholds.
- Monitor agent activity and storage SLA adherence in real time.
- Use CLI commands to manually control agents or trigger workflows.

---



## License

This project is licensed under the MIT License.

---

## Project Structure

```
filops/
├── packages/
│   ├── common/              ✅ Shared types, utilities, logger
│   ├── database/            ✅ Prisma ORM, schemas, migrations
│   ├── events/              ✅ Kafka integration
│   ├── api-gateway/         ✅ NestJS API Gateway
│   ├── policy-engine/       ✅ Policy validation & CRUD
│   ├── integrations/        ✅ Synapse, IPNI, GeoMgr, Pricing
│   ├── agent-orchestrator/  ✅ Agent lifecycle management
│   ├── agent-rba/           ✅ Replica Balance Agent
│   ├── agent-pra/           ⏳ Predictive Renewal Agent (TODO)
│   ├── agent-paa/           ⏳ Pricing Arbitrage Agent (TODO)
│   └── web-ui/              🚧 Next.js dashboard (stub)
├── infrastructure/          ✅ Docker, scripts, tests
├── memory-bank/             ✅ Project documentation
└── pnpm-workspace.yaml      ✅ Monorepo configuration
```

## Development Status

### ✅ Milestone 0 - Foundation (100% Complete)
- [x] Monorepo setup with pnpm workspaces
- [x] Common package with types, logger, errors
- [x] API Gateway with health endpoints
- [x] Docker Compose infrastructure
- [x] PostgreSQL + TimescaleDB + Kafka
- [x] Database schemas with Prisma (9 tables)
- [x] Kafka topics and event contracts (7 topics)
- [x] 66+ tests passing

### ✅ Milestone 1 - Policy Engine (100% Complete)
- [x] Policy types and schemas
- [x] Policy validator with business logic
- [x] Policy service with CRUD operations
- [x] REST API endpoints (9 endpoints)
- [x] Swagger documentation
- [x] Event publishing
- [x] 10+ policy tests passing

### ✅ Milestone 2 - Integrations (100% Complete)
- [x] Synapse SDK client
- [x] IPNI client
- [x] GeoMgr client
- [x] Pricing service
- [x] Unified integrations service
- [x] 17+ integration tests passing

### ✅ Milestone 3 - RBA Agent MVP (100% Complete)
- [x] Agent orchestrator with lifecycle management
- [x] Replica Balance Agent implementation
- [x] Compliance checking and deficit detection
- [x] Action proposal and execution
- [x] Agent REST API endpoints (9 endpoints)
- [x] Event publishing and alerting
- [x] 15+ orchestrator tests passing

### ⏳ Milestone 4 - Advanced Features (0% Complete)
- [ ] Predictive Renewal Agent (PRA)
- [ ] Pricing Arbitrage Agent (PAA)
- [ ] SLA marketplace
- [ ] Hot/warm tiering
- [ ] Advanced compliance packs

**Overall Progress: ~80% Complete**

## Contact

Project Maintainers:
- Lead Developer: Ashwini kumar pal (ashwinids@gmail.com)

