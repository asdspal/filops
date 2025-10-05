import { z } from 'zod';

/**
 * Event schemas for FilOps
 * All events follow a common structure with type-specific payloads
 */

// Base event schema
export const BaseEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  type: z.string(),
  source: z.string(),
  version: z.string().default('1.0'),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// Deal Status Event
export const DealStatusEventSchema = BaseEventSchema.extend({
  type: z.literal('deal.status.changed'),
  payload: z.object({
    deal_id: z.string(),
    dataset_id: z.string(),
    provider_id: z.string(),
    old_status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'FAILED', 'RENEWED']),
    new_status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'FAILED', 'RENEWED']),
    expiry_at: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export type DealStatusEvent = z.infer<typeof DealStatusEventSchema>;

// Provider Pricing Event
export const ProviderPricingEventSchema = BaseEventSchema.extend({
  type: z.literal('provider.pricing.updated'),
  payload: z.object({
    provider_id: z.string(),
    region: z.string(),
    price_usd_per_TiB_month: z.number().positive(),
    availability: z.number().min(0).max(1),
    latency_ms: z.number().positive(),
    verified: z.boolean(),
    updated_at: z.string().datetime(),
  }),
});

export type ProviderPricingEvent = z.infer<typeof ProviderPricingEventSchema>;

// PDP Event
export const PDPEventSchema = BaseEventSchema.extend({
  type: z.enum(['pdp.proof.success', 'pdp.proof.failure']),
  payload: z.object({
    deal_id: z.string(),
    provider_id: z.string(),
    dataset_id: z.string(),
    proof_type: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
  }),
});

export type PDPEvent = z.infer<typeof PDPEventSchema>;

// Policy Update Event
export const PolicyUpdateEventSchema = BaseEventSchema.extend({
  type: z.enum(['policy.created', 'policy.updated', 'policy.activated', 'policy.deactivated']),
  payload: z.object({
    policy_id: z.string().uuid(),
    project_id: z.string().uuid(),
    name: z.string(),
    version: z.number().int().positive(),
    active: z.boolean(),
    changes: z.array(z.string()).optional(),
    actor_id: z.string().uuid(),
  }),
});

export type PolicyUpdateEvent = z.infer<typeof PolicyUpdateEventSchema>;

// Agent Action Event
export const AgentActionEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.action'),
  payload: z.object({
    agent_id: z.string().uuid(),
    agent_type: z.enum(['RBA', 'PRA', 'PAA']),
    action_id: z.string().uuid(),
    action_type: z.string(),
    status: z.enum(['PROPOSED', 'APPROVED', 'EXECUTING', 'EXECUTED', 'FAILED', 'ROLLED_BACK']),
    details: z.record(z.unknown()),
    tx_hash: z.string().optional(),
    error: z.string().optional(),
  }),
});

export type AgentActionEvent = z.infer<typeof AgentActionEventSchema>;

// Agent Heartbeat Event
export const AgentHeartbeatEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.heartbeat'),
  payload: z.object({
    agent_id: z.string().uuid(),
    agent_type: z.enum(['RBA', 'PRA', 'PAA']),
    status: z.enum(['CREATED', 'RUNNING', 'PAUSED', 'ERROR', 'STOPPED']),
    health: z.enum(['healthy', 'degraded', 'unhealthy']),
    metrics: z.object({
      actions_processed: z.number().int().nonnegative(),
      actions_succeeded: z.number().int().nonnegative(),
      actions_failed: z.number().int().nonnegative(),
      uptime_seconds: z.number().int().nonnegative(),
    }),
  }),
});

export type AgentHeartbeatEvent = z.infer<typeof AgentHeartbeatEventSchema>;

// Alert Event
export const AlertEventSchema = BaseEventSchema.extend({
  type: z.literal('alert.created'),
  payload: z.object({
    alert_id: z.string().uuid(),
    project_id: z.string().uuid(),
    severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
    summary: z.string(),
    details: z.record(z.unknown()),
    source: z.string(),
  }),
});

export type AlertEvent = z.infer<typeof AlertEventSchema>;

// Union type of all events
export type FilOpsEvent =
  | DealStatusEvent
  | ProviderPricingEvent
  | PDPEvent
  | PolicyUpdateEvent
  | AgentActionEvent
  | AgentHeartbeatEvent
  | AlertEvent;

// Schema map for validation
export const EVENT_SCHEMAS = {
  'deal.status.changed': DealStatusEventSchema,
  'provider.pricing.updated': ProviderPricingEventSchema,
  'pdp.proof.success': PDPEventSchema,
  'pdp.proof.failure': PDPEventSchema,
  'policy.created': PolicyUpdateEventSchema,
  'policy.updated': PolicyUpdateEventSchema,
  'policy.activated': PolicyUpdateEventSchema,
  'policy.deactivated': PolicyUpdateEventSchema,
  'agent.action': AgentActionEventSchema,
  'agent.heartbeat': AgentHeartbeatEventSchema,
  'alert.created': AlertEventSchema,
} as const;

// Helper function to validate events
export function validateEvent(event: unknown): FilOpsEvent {
  const baseEvent = BaseEventSchema.parse(event);
  const schema = EVENT_SCHEMAS[baseEvent.type as keyof typeof EVENT_SCHEMAS];

  if (!schema) {
    throw new Error(`Unknown event type: ${baseEvent.type}`);
  }

  return schema.parse(event) as FilOpsEvent;
}
