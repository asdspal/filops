.PHONY: help install dev build test lint format clean infra-start infra-stop infra-check infra-reset

# Default target
help:
	@echo "FilOps - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install       - Install all dependencies"
	@echo "  make dev          - Start all services in development mode"
	@echo "  make build        - Build all packages"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linter"
	@echo "  make format       - Format code with Prettier"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make infra-start  - Start infrastructure services (Docker)"
	@echo "  make infra-stop   - Stop infrastructure services"
	@echo "  make infra-check  - Check infrastructure health"
	@echo "  make infra-reset  - Reset infrastructure (clean restart)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Clean build artifacts and node_modules"

# Development commands
install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

format:
	pnpm format

# Infrastructure commands
infra-start:
	@chmod +x infrastructure/scripts/*.sh
	./infrastructure/scripts/start-infra.sh

infra-stop:
	@chmod +x infrastructure/scripts/*.sh
	./infrastructure/scripts/stop-infra.sh

infra-check:
	@chmod +x infrastructure/scripts/*.sh
	./infrastructure/scripts/check-services.sh

infra-reset:
	@chmod +x infrastructure/scripts/*.sh
	./infrastructure/scripts/reset-infra.sh

# Cleanup
clean:
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf packages/*/dist
	rm -rf packages/*/build
	find . -name "*.tsbuildinfo" -delete
