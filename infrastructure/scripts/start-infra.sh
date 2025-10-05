#!/bin/bash

# Start FilOps infrastructure services
# Usage: ./infrastructure/scripts/start-infra.sh

set -e

echo "🚀 Starting FilOps infrastructure services..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Detect docker-compose command (v1 or v2)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Start services
$DOCKER_COMPOSE up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
echo ""

# Wait for services to be healthy (max 60 seconds)
timeout=60
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if ./infrastructure/scripts/check-services.sh > /dev/null 2>&1; then
        echo ""
        echo "✅ All services are up and running!"
        echo ""
        echo "Service URLs:"
        echo "  - PostgreSQL:    localhost:5434 (user: filops, password: filops, db: filops)"
        echo "  - TimescaleDB:   localhost:5433 (user: filops, password: filops, db: filops_metrics)"
        echo "  - Kafka:         localhost:9092"
        echo "  - Kafka UI:      http://localhost:8080"
        echo ""
        echo "To check service health: ./infrastructure/scripts/check-services.sh"
        echo "To view logs: docker-compose logs -f [service-name]"
        echo "To stop services: ./infrastructure/scripts/stop-infra.sh"
        exit 0
    fi
    
    sleep 5
    elapsed=$((elapsed + 5))
    echo "  Still waiting... (${elapsed}s / ${timeout}s)"
done

echo ""
echo "⚠️  Services did not become healthy within ${timeout} seconds"
echo "Check logs with: docker-compose logs"
exit 1
