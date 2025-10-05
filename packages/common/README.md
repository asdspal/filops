# @filops/common

Shared TypeScript types, utilities, and configurations for FilOps packages.

## Features

- **Types**: Shared TypeScript types and Zod schemas for policies, agents, events
- **Logger**: Winston-based structured logging
- **Errors**: Custom error classes with HTTP status codes
- **Config**: Environment configuration validation with Zod

## Usage

```typescript
import { 
  createLogger, 
  PolicySchema, 
  ValidationError,
  HealthStatus 
} from '@filops/common';

// Create a logger
const logger = createLogger({
  service: 'my-service',
  level: 'info',
});

// Validate a policy
const result = PolicySchema.safeParse(policyData);

// Throw custom errors
throw new ValidationError('Invalid input', { field: 'name' });
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test
```
