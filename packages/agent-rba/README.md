# @filops/agent-rba

Replica Balance Agent (RBA) for FilOps - Ensures data replicas meet geo-distribution policies.

## Features

- Monitors replica counts per region
- Detects policy violations and replica deficits
- Proposes actions to achieve compliance
- Executes deals automatically or with approval
- Integrates with Synapse SDK for deal creation
- Publishes events and alerts

## How It Works

1. **Monitor**: Periodically checks dataset replicas against policy requirements
2. **Detect**: Identifies regions with insufficient replicas
3. **Propose**: Generates action proposals (create_deal, upgrade_sector)
4. **Execute**: Creates deals via Synapse SDK (with approval if configured)
5. **Verify**: Confirms deal creation and updates compliance status

## Usage

```typescript
import { ReplicaBalanceAgent } from '@filops/agent-rba';
import { AgentOrchestrator } from '@filops/agent-orchestrator';
import { IntegrationsService } from '@filops/integrations';

// Initialize services
const orchestrator = new AgentOrchestrator();
const integrations = new IntegrationsService({
  synapse: { apiUrl: '...', network: 'mainnet' },
  ipni: { apiUrl: '...' },
  geomgr: { apiUrl: '...' },
});

// Create RBA instance
const rba = new ReplicaBalanceAgent({
  agentId: 'agent-123',
  policyId: 'policy-456',
  orchestrator,
  integrations,
  config: {
    checkIntervalMs: 60000,
    autoExecute: false,
    maxActionsPerRun: 10,
  },
});

// Start the agent
await rba.start();

// Agent will now run continuously, checking compliance
// and proposing/executing actions as needed
```

## Configuration

```typescript
{
  checkIntervalMs: 60000,      // Check every 60 seconds
  autoExecute: false,           // Require approval for actions
  maxActionsPerRun: 10,         // Max 10 actions per check cycle
}
```

## Actions

### create_deal
Creates a new storage deal with a provider in a deficit region.

### upgrade_sector
Upgrades a CC sector to store actual data (future enhancement).

## Events

The RBA publishes events to Kafka:

- `rba.check.started` - Compliance check started
- `rba.check.completed` - Compliance check completed
- `rba.deficit.detected` - Replica deficit detected
- `rba.action.proposed` - Action proposed
- `rba.action.approved` - Action approved
- `rba.action.executed` - Action executed
- `rba.action.failed` - Action failed

## Alerts

The RBA creates alerts for:

- Policy violations (replica count below minimum)
- Action execution failures
- Provider availability issues
- Budget ceiling breaches

## Testing

```bash
pnpm test
```
