#!/bin/bash

# Integration tests for FilOps infrastructure
# Usage: ./infrastructure/tests/infra.test.sh

set -e

echo "🧪 Running infrastructure integration tests..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_count=0
passed_count=0
failed_count=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    test_count=$((test_count + 1))
    echo -n "Test $test_count: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        passed_count=$((passed_count + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        failed_count=$((failed_count + 1))
        return 1
    fi
}

echo "=== Docker Tests ==="
run_test "Docker is running" "docker info"
run_test "Docker Compose is available" "docker compose version || docker-compose --version"
echo ""

echo "=== Service Health Tests ==="
run_test "PostgreSQL container is running" "docker ps | grep filops-postgres"
run_test "TimescaleDB container is running" "docker ps | grep filops-timescaledb"
run_test "Kafka container is running" "docker ps | grep filops-kafka"
run_test "Zookeeper container is running" "docker ps | grep filops-zookeeper"
run_test "Kafka UI container is running" "docker ps | grep filops-kafka-ui"
echo ""

echo "=== Database Connection Tests ==="
run_test "PostgreSQL accepts connections" "docker exec filops-postgres pg_isready -U filops"
run_test "TimescaleDB accepts connections" "docker exec filops-timescaledb pg_isready -U filops"
run_test "PostgreSQL database exists" "docker exec filops-postgres psql -U filops -d filops -c 'SELECT 1'"
run_test "TimescaleDB database exists" "docker exec filops-timescaledb psql -U filops -d filops_metrics -c 'SELECT 1'"
run_test "PostgreSQL uuid-ossp extension loaded" "docker exec filops-postgres psql -U filops -d filops -c 'SELECT uuid_generate_v4()'"
run_test "TimescaleDB extension loaded" "docker exec filops-timescaledb psql -U filops -d filops_metrics -c 'SELECT extname FROM pg_extension WHERE extname = '\''timescaledb'\'''"
echo ""

echo "=== Kafka Tests ==="
run_test "Kafka broker is reachable" "docker exec filops-kafka kafka-broker-api-versions --bootstrap-server localhost:9092"
run_test "Can create Kafka topic" "docker exec filops-kafka kafka-topics --bootstrap-server localhost:9092 --create --topic test-topic --if-not-exists --partitions 1 --replication-factor 1"
run_test "Can list Kafka topics" "docker exec filops-kafka kafka-topics --bootstrap-server localhost:9092 --list"
run_test "Can delete Kafka topic" "docker exec filops-kafka kafka-topics --bootstrap-server localhost:9092 --delete --topic test-topic"
echo ""

echo "=== Port Availability Tests ==="
run_test "PostgreSQL port 5434 is accessible" "nc -z localhost 5434"
run_test "TimescaleDB port 5433 is accessible" "nc -z localhost 5433"
run_test "Kafka port 9092 is accessible" "nc -z localhost 9092"
run_test "Kafka UI port 8080 is accessible" "nc -z localhost 8080"
echo ""

echo "=== Volume Tests ==="
run_test "PostgreSQL volume exists" "docker volume ls | grep postgres_data"
run_test "TimescaleDB volume exists" "docker volume ls | grep timescale_data"
run_test "Kafka volume exists" "docker volume ls | grep kafka_data"
run_test "Zookeeper volume exists" "docker volume ls | grep zookeeper_data"
echo ""

echo "=== Network Tests ==="
run_test "FilOps network exists" "docker network ls | grep filops"
run_test "All services on same network" "[ \$(docker network inspect filops_filops-network -f '{{range .Containers}}1{{end}}' | wc -c) -ge 5 ]"
echo ""

# Summary
echo "================================"
echo "Test Summary:"
echo "  Total:  $test_count"
echo -e "  ${GREEN}Passed: $passed_count${NC}"
if [ $failed_count -gt 0 ]; then
    echo -e "  ${RED}Failed: $failed_count${NC}"
fi
echo "================================"
echo ""

if [ $failed_count -eq 0 ]; then
    echo -e "${GREEN}✅ All infrastructure tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
