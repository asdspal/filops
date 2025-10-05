# @filops/agent-orchestrator

Agent lifecycle management and orchestration for FilOps.

## Features

- Agent registration and lifecycle management
- Health monitoring and heartbeat tracking
- Status transitions (created → running → paused → error)
- Auto-restart with exponential backoff
- Agent configuration management
- Event publishing for agent actions

## Agent Lifecycle

```
created → running → paused → stopped
            ↓
          error → running (auto-restart)
```

## Usage

```typescript
import { AgentOrchestrator } from '@filops/agent-orchestrator';

const orchestrator = new AgentOrchestrator();

// Register an agent
const agent = await orchestrator.registerAgent({
  type: 'RBA',
  projectId: 'project-123',
  policyId: 'policy-456',
  config: {
    checkIntervalMs: 60000,
    autoExecute: false,
  },
});

// Start the agent
await orchestrator.startAgent(agent.id);

// Pause the agent
await orchestrator.pauseAgent(agent.id);

// Resume the agent
await orchestrator.resumeAgent(agent.id);

// Stop the agent
await orchestrator.stopAgent(agent.id);

// Get agent status
const status = await orchestrator.getAgentStatus(agent.id);
```

## Agent Types

- **RBA** - Replica Balance Agent
- **PRA** - Predictive Renewal Agent
- **PAA** - Pricing Arbitrage Agent

## Configuration

Each agent type has its own configuration schema:

### RBA Configuration
```typescript
{
  checkIntervalMs: number;      // How often to check compliance
  autoExecute: boolean;          // Auto-execute or require approval
  maxActionsPerRun: number;      // Max actions per check cycle
}
```

## Events

The orchestrator publishes events to Kafka:

- `agent.registered` - Agent registered
- `agent.started` - Agent started
- `agent.paused` - Agent paused
- `agent.resumed` - Agent resumed
- `agent.stopped` - Agent stopped
- `agent.error` - Agent encountered error
- `agent.heartbeat` - Agent heartbeat

## Testing

```bash
pnpm test
```
