# @filops/api-gateway

API Gateway service for FilOps - provides unified REST API for all FilOps operations.

## Features

- Health check endpoints
- Version information
- Swagger/OpenAPI documentation
- Global validation and error handling
- OAuth2/JWT authentication (coming soon)

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Run with coverage
pnpm test:cov
```

## Endpoints

- `GET /health` - Health check
- `GET /version` - Service version
- `GET /api/docs` - Swagger documentation

## Environment Variables

See `.env.example` for required environment variables.
