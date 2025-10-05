# Testing Guide - Milestones 0.1 & 0.2

This guide explains how to run tests for the FilOps monorepo after completing Milestones 0.1 (Bootstrap) and 0.2 (Infrastructure).

## Prerequisites

Before running tests, ensure you have:

1. **Node.js 18+** installed
2. **pnpm** installed globally: `npm install -g pnpm`
3. All dependencies installed: `pnpm install`

## Installation Steps

```bash
# 1. Navigate to the project root
cd /home/pauli/wspace/filecoin/filops

# 2. Install all dependencies
pnpm install

# This will install dependencies for:
# - Root workspace
# - packages/common
# - packages/api-gateway
```

## Running Tests

### Run All Tests

```bash
# From project root - runs tests for all packages
pnpm test
```

### Run Tests for Specific Package

```bash
# Test common package only
pnpm --filter @filops/common test

# Test API gateway only
pnpm --filter @filops/api-gateway test
```

### Run Tests with Coverage

```bash
# Common package with coverage
pnpm --filter @filops/common test:cov

# API Gateway with coverage
pnpm --filter @filops/api-gateway test:cov
```

### Run E2E Tests

```bash
# API Gateway E2E tests
cd packages/api-gateway
pnpm test test/app.e2e-spec.ts
```

### Watch Mode (for development)

```bash
# Watch mode for common package
pnpm --filter @filops/common test:watch

# Watch mode for API gateway
pnpm --filter @filops/api-gateway test:watch
```

## Expected Test Results

### @filops/common

**Test Suites:**
- `logger.test.ts` - Logger creation and functionality
- `errors.test.ts` - Custom error classes
- `types.test.ts` - Policy schema validation and enums

**Expected Output:**
```
PASS  src/__tests__/logger.test.ts
PASS  src/__tests__/errors.test.ts
PASS  src/__tests__/types.test.ts

Test Suites: 3 passed, 3 total
Tests:       15+ passed, 15+ total
```

### @filops/api-gateway

**Test Suites:**
- `health.controller.spec.ts` - Health controller unit tests
- `app.e2e-spec.ts` - End-to-end API tests

**Expected Output:**
```
PASS  src/health/health.controller.spec.ts
PASS  test/app.e2e-spec.ts

Test Suites: 2 passed, 2 total
Tests:       4+ passed, 4+ total
```

## Troubleshooting

### Issue: `pnpm: command not found`

**Solution:**
```bash
npm install -g pnpm
```

### Issue: Dependencies not installed

**Solution:**
```bash
# Clean install
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Build common package first (API Gateway depends on it)
pnpm --filter @filops/common build
pnpm --filter @filops/api-gateway build
```

### Issue: Port already in use (for E2E tests)

**Solution:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

## Test Coverage Thresholds

All packages are configured with minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Tests will fail if coverage drops below these thresholds.

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```bash
# CI command (no watch, with coverage)
pnpm test:cov
```

## Infrastructure Tests (Milestone 0.2)

### Prerequisites

Before running infrastructure tests, ensure:
- Docker is installed and running
- Docker Compose is available
- Ports 5432, 5433, 8080, 9092 are free

### Start Infrastructure

```bash
# Using Make (recommended)
make infra-start

# Or using scripts directly
./infrastructure/scripts/start-infra.sh

# Or using Docker Compose
docker-compose up -d
```

### Run Infrastructure Tests

```bash
# Make scripts executable (first time only)
chmod +x infrastructure/scripts/*.sh
chmod +x infrastructure/tests/*.sh

# Run health checks
make infra-check

# Or run comprehensive integration tests
./infrastructure/tests/infra.test.sh
```

### Expected Infrastructure Test Results

The infrastructure test suite includes:

**Test Categories:**
1. Docker Tests (2 tests)
2. Service Health Tests (5 tests)
3. Database Connection Tests (6 tests)
4. Kafka Tests (4 tests)
5. Port Availability Tests (4 tests)
6. Volume Tests (4 tests)
7. Network Tests (2 tests)

**Expected Output:**
```
🧪 Running infrastructure integration tests...

=== Docker Tests ===
Test 1: Docker is running... PASS
Test 2: Docker Compose is available... PASS

=== Service Health Tests ===
Test 3: PostgreSQL container is running... PASS
Test 4: TimescaleDB container is running... PASS
Test 5: Kafka container is running... PASS
Test 6: Zookeeper container is running... PASS
Test 7: Kafka UI container is running... PASS

=== Database Connection Tests ===
Test 8: PostgreSQL accepts connections... PASS
Test 9: TimescaleDB accepts connections... PASS
Test 10: PostgreSQL database exists... PASS
Test 11: TimescaleDB database exists... PASS
Test 12: PostgreSQL uuid-ossp extension loaded... PASS
Test 13: TimescaleDB extension loaded... PASS

=== Kafka Tests ===
Test 14: Kafka broker is reachable... PASS
Test 15: Can create Kafka topic... PASS
Test 16: Can list Kafka topics... PASS
Test 17: Can delete Kafka topic... PASS

=== Port Availability Tests ===
Test 18: PostgreSQL port 5432 is accessible... PASS
Test 19: TimescaleDB port 5433 is accessible... PASS
Test 20: Kafka port 9092 is accessible... PASS
Test 21: Kafka UI port 8080 is accessible... PASS

=== Volume Tests ===
Test 22: PostgreSQL volume exists... PASS
Test 23: TimescaleDB volume exists... PASS
Test 24: Kafka volume exists... PASS
Test 25: Zookeeper volume exists... PASS

=== Network Tests ===
Test 26: FilOps network exists... PASS
Test 27: All services on same network... PASS

================================
Test Summary:
  Total:  27
  Passed: 27
================================

✅ All infrastructure tests passed!
```

### Manual Service Verification

You can also manually verify each service:

**PostgreSQL:**
```bash
# Connect to database
docker exec -it filops-postgres psql -U filops -d filops

# Run a test query
docker exec filops-postgres psql -U filops -d filops -c "SELECT version();"
```

**TimescaleDB:**
```bash
# Connect to database
docker exec -it filops-timescaledb psql -U filops -d filops_metrics

# Verify TimescaleDB extension
docker exec filops-timescaledb psql -U filops -d filops_metrics -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb';"
```

**Kafka:**
```bash
# List topics
docker exec filops-kafka kafka-topics --bootstrap-server localhost:9092 --list

# Create test topic
docker exec filops-kafka kafka-topics --bootstrap-server localhost:9092 --create --topic test --partitions 1 --replication-factor 1

# Produce a message
echo "test message" | docker exec -i filops-kafka kafka-console-producer --bootstrap-server localhost:9092 --topic test

# Consume messages
docker exec filops-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic test --from-beginning --max-messages 1
```

**Kafka UI:**
```bash
# Open in browser
open http://localhost:8080
```

### Stop Infrastructure

```bash
# Stop services (preserve data)
make infra-stop

# Stop and remove all data
./infrastructure/scripts/stop-infra.sh --clean

# Reset everything (clean restart)
make infra-reset
```

## Next Steps

After verifying all tests pass:

1. ✅ Milestone 0.1 is complete
2. ✅ Milestone 0.2 is complete
3. 🚧 Ready to proceed to Milestone 0.3 (Database schemas with Prisma)

## Manual Verification

You can also manually verify the API Gateway:

```bash
# 1. Start the API Gateway
cd packages/api-gateway
pnpm dev

# 2. In another terminal, test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/version

# 3. Open Swagger docs in browser
open http://localhost:3000/api/docs
```

Expected responses:

**GET /health:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2025-10-05T11:44:00.000Z",
  "uptime": 5,
  "dependencies": {
    "database": "healthy",
    "kafka": "healthy"
  }
}
```

**GET /version:**
```json
{
  "version": "0.1.0",
  "service": "api-gateway"
}
```
