#!/bin/bash

# Stop FilOps infrastructure services
# Usage: ./infrastructure/scripts/stop-infra.sh [--clean]

set -e

echo "🛑 Stopping FilOps infrastructure services..."
echo ""

# Detect docker-compose command (v1 or v2)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

if [ "$1" = "--clean" ]; then
    echo "⚠️  Cleaning up volumes (all data will be lost)..."
    $DOCKER_COMPOSE down -v
    echo "✅ Services stopped and volumes removed"
else
    $DOCKER_COMPOSE down
    echo "✅ Services stopped (volumes preserved)"
    echo ""
    echo "To remove all data, run: ./infrastructure/scripts/stop-infra.sh --clean"
fi
