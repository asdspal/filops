# @filops/events

Event-driven architecture package for FilOps using Apache Kafka.

## Features

- **Kafka Integration** - Producer and consumer clients
- **Event Schemas** - Type-safe event definitions with Zod validation
- **Topic Management** - Automated topic creation and configuration
- **Event Validation** - Runtime validation of all events
- **DLQ Support** - Dead Letter Queue topics for failed messages

## Event Types

FilOps uses the following event types:

### Deal Events
- `deal.status.changed` - Deal status transitions
- Published to: `filops.deals.status`

### Provider Events
- `provider.pricing.updated` - Provider pricing changes
- Published to: `filops.providers.pricing`

### PDP Events
- `pdp.proof.success` / `pdp.proof.failure` - Proof verification results
- Published to: `filops.pdp.events`

### Policy Events
- `policy.created` / `policy.updated` / `policy.activated` / `policy.deactivated`
- Published to: `filops.policies.updates`

### Agent Events
- `agent.action` - Agent actions and execution
- `agent.heartbeat` - Agent health status
- Published to: `filops.agents.actions` / `filops.agents.heartbeat`

### Alert Events
- `alert.created` - System alerts
- Published to: `filops.alerts`

## Usage

### Initialize Kafka Client

```typescript
import { getKafkaClient } from '@filops/events';

const kafkaClient = getKafkaClient({
  brokers: ['localhost:9092'],
  clientId: 'filops-service',
  groupId: 'filops-consumers',
});
```

### Publish Events

```typescript
import { EventProducer, TOPICS } from '@filops/events';

const producer = new EventProducer();

await producer.publish(TOPICS.DEALS_STATUS, {
  type: 'deal.status.changed',
  source: 'deal-monitor',
  payload: {
    deal_id: 'deal-123',
    dataset_id: 'dataset-456',
    provider_id: 'f01234',
    old_status: 'PENDING',
    new_status: 'ACTIVE',
  },
});
```

### Consume Events

```typescript
import { EventConsumer, TOPICS } from '@filops/events';

const consumer = new EventConsumer();

// Register handler for specific event type
consumer.on('deal.status.changed', async (event, context) => {
  console.log('Deal status changed:', event.payload);
});

// Register handler for all events
consumer.onAny(async (event, context) => {
  console.log('Event received:', event.type);
});

// Start consuming
await consumer.start({
  topics: [TOPICS.DEALS_STATUS, TOPICS.AGENTS_ACTIONS],
  fromBeginning: false,
});
```

### Create Topics

```typescript
import { TopicManager } from '@filops/events';

const topicManager = new TopicManager();

// Create all FilOps topics
await topicManager.createTopics();

// List topics
const topics = await topicManager.listTopics();
console.log('Topics:', topics);
```

## Event Schema

All events follow this structure:

```typescript
{
  id: string;           // UUID
  timestamp: string;    // ISO 8601 datetime
  type: string;         // Event type
  source: string;       // Event source (service name)
  version: string;      // Schema version (default: "1.0")
  payload: object;      // Event-specific data
}
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

## Environment Variables

```bash
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=filops
KAFKA_GROUP_ID=filops-group
LOG_LEVEL=info
```

## Topic Configuration

Topics are configured with:
- **Partitions**: For parallel processing
- **Replication Factor**: For fault tolerance (set to 1 for dev)
- **Retention**: How long messages are kept
- **Compression**: Snappy compression for high-throughput topics

See `src/topics.ts` for full configuration.

## Error Handling

- Events are validated before publishing
- Invalid events throw validation errors
- Consumer errors are logged and can trigger retries
- Failed messages can be sent to DLQ topics

## Best Practices

1. **Always validate events** before publishing
2. **Use specific event types** instead of generic ones
3. **Include correlation IDs** in event payloads for tracing
4. **Handle consumer errors** gracefully
5. **Monitor DLQ topics** for failed messages
6. **Use batch publishing** for high-throughput scenarios
