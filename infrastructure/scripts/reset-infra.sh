#!/bin/bash

# Reset FilOps infrastructure (stop, clean, and restart)
# Usage: ./infrastructure/scripts/reset-infra.sh

set -e

echo "🔄 Resetting FilOps infrastructure..."
echo ""

# Stop and clean
./infrastructure/scripts/stop-infra.sh --clean

echo ""
echo "⏳ Waiting 5 seconds before restart..."
sleep 5

# Start fresh
./infrastructure/scripts/start-infra.sh
