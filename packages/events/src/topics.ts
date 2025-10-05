/**
 * Kafka topic definitions for FilOps
 * Based on SRD event specifications
 */

export const TOPICS = {
  // Deal lifecycle events
  DEALS_STATUS: 'filops.deals.status',
  DEALS_CREATED: 'filops.deals.created',
  DEALS_EXPIRED: 'filops.deals.expired',
  DEALS_RENEWED: 'filops.deals.renewed',

  // Provider events
  PROVIDERS_PRICING: 'filops.providers.pricing',
  PROVIDERS_SLA: 'filops.providers.sla',
  PROVIDERS_AVAILABILITY: 'filops.providers.availability',

  // PDP (Proof of Data Possession) events
  PDP_EVENTS: 'filops.pdp.events',
  PDP_SUCCESS: 'filops.pdp.success',
  PDP_FAILURE: 'filops.pdp.failure',

  // Policy events
  POLICIES_UPDATES: 'filops.policies.updates',
  POLICIES_CREATED: 'filops.policies.created',
  POLICIES_ACTIVATED: 'filops.policies.activated',
  POLICIES_DEACTIVATED: 'filops.policies.deactivated',

  // Agent events
  AGENTS_ACTIONS: 'filops.agents.actions',
  AGENTS_HEARTBEAT: 'filops.agents.heartbeat',
  AGENTS_STATUS: 'filops.agents.status',

  // Alert events
  ALERTS: 'filops.alerts',
  ALERTS_CRITICAL: 'filops.alerts.critical',
  ALERTS_WARNING: 'filops.alerts.warning',

  // System events
  SYSTEM_HEALTH: 'filops.system.health',
  SYSTEM_METRICS: 'filops.system.metrics',

  // Dead Letter Queue topics
  DLQ_DEALS: 'filops.dlq.deals',
  DLQ_AGENTS: 'filops.dlq.agents',
  DLQ_ALERTS: 'filops.dlq.alerts',
  DLQ_GENERAL: 'filops.dlq.general',
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];

// Topic configuration
export interface TopicConfig {
  topic: TopicName;
  numPartitions?: number;
  replicationFactor?: number;
  configEntries?: Array<{ name: string; value: string }>;
}

export const TOPIC_CONFIGS: TopicConfig[] = [
  // High-throughput topics
  {
    topic: TOPICS.DEALS_STATUS,
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '2592000000' }, // 30 days
      { name: 'compression.type', value: 'snappy' },
    ],
  },
  {
    topic: TOPICS.PDP_EVENTS,
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '2592000000' }, // 30 days
    ],
  },
  {
    topic: TOPICS.PROVIDERS_PRICING,
    numPartitions: 2,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '604800000' }, // 7 days
    ],
  },

  // Standard topics
  {
    topic: TOPICS.POLICIES_UPDATES,
    numPartitions: 1,
    replicationFactor: 1,
  },
  {
    topic: TOPICS.AGENTS_ACTIONS,
    numPartitions: 2,
    replicationFactor: 1,
  },
  {
    topic: TOPICS.ALERTS,
    numPartitions: 1,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '2592000000' }, // 30 days
    ],
  },

  // DLQ topics
  {
    topic: TOPICS.DLQ_GENERAL,
    numPartitions: 1,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '7776000000' }, // 90 days
    ],
  },
];
