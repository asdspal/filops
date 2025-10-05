#!/bin/bash

# Health check script for FilOps infrastructure services
# Usage: ./infrastructure/scripts/check-services.sh

set -e

echo "🔍 Checking FilOps infrastructure services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Function to check service health
check_service() {
    local service_name=$1
    local container_name=$2
    
    if docker ps --filter "name=${container_name}" --filter "status=running" | grep -q "${container_name}"; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "${container_name}" 2>/dev/null || echo "none")
        
        if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
            echo -e "${GREEN}✅ ${service_name} is running${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  ${service_name} is running but not healthy (status: ${health})${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ ${service_name} is not running${NC}"
        return 1
    fi
}

# Check each service
all_healthy=true

check_service "PostgreSQL" "filops-postgres" || all_healthy=false
check_service "TimescaleDB" "filops-timescaledb" || all_healthy=false
check_service "Zookeeper" "filops-zookeeper" || all_healthy=false
check_service "Kafka" "filops-kafka" || all_healthy=false
check_service "Kafka UI" "filops-kafka-ui" || all_healthy=false

echo ""

# Test PostgreSQL connection
if docker exec filops-postgres pg_isready -U filops > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL connection test passed${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection test failed${NC}"
    all_healthy=false
fi

# Test TimescaleDB connection
if docker exec filops-timescaledb pg_isready -U filops > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TimescaleDB connection test passed${NC}"
else
    echo -e "${RED}❌ TimescaleDB connection test failed${NC}"
    all_healthy=false
fi

# Test Kafka
if docker exec filops-kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Kafka connection test passed${NC}"
else
    echo -e "${RED}❌ Kafka connection test failed${NC}"
    all_healthy=false
fi

echo ""

if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    echo ""
    echo "Service URLs:"
    echo "  - PostgreSQL:    localhost:5434"
    echo "  - TimescaleDB:   localhost:5433"
    echo "  - Kafka:         localhost:9092"
    echo "  - Kafka UI:      http://localhost:8080"
    exit 0
else
    echo -e "${RED}⚠️  Some services are not healthy${NC}"
    echo ""
    echo "Try running: docker-compose logs [service-name]"
    exit 1
fi
