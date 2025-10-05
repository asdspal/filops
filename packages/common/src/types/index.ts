import { z } from 'zod';

// Health status
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface HealthCheckResponse {
  status: HealthStatus;
  version: string;
  timestamp: string;
  uptime: number;
  dependencies?: Record<string, HealthStatus>;
}

// Agent types
export enum AgentType {
  RBA = 'RBA',
  PRA = 'PRA',
  PAA = 'PAA',
}

export enum AgentStatus {
  CREATED = 'created',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error',
  STOPPED = 'stopped',
}

// Policy schemas
export const RegionReplicationSchema = z.object({
  code: z.string(),
  min_replicas: z.number().int().positive(),
});

export const PolicyReplicationSchema = z.object({
  regions: z.array(RegionReplicationSchema),
  allowlist_providers: z.array(z.string()).optional(),
  denylist_providers: z.array(z.string()).optional(),
});

export const PolicyRenewalSchema = z.object({
  lead_time_days: z.number().int().positive(),
  min_collateral_buffer_pct: z.number().min(0).max(100),
});

export const PolicyArbitrageSchema = z.object({
  enable: z.boolean(),
  min_expected_savings_pct: z.number().min(0).max(100),
  verification_strategy: z.object({
    hash_check: z.boolean(),
    sample_retrieval: z.number().min(0).max(1),
  }),
});

export const PolicySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  version: z.number().int().positive().default(1),
  owner: z.string(),
  project_id: z.string().uuid(),
  replication: PolicyReplicationSchema,
  availability_target: z.number().min(0).max(1),
  latency_targets_ms: z.record(z.string(), z.number().positive()).optional(),
  cost_ceiling_usd_per_TiB_month: z.number().positive(),
  renewal: PolicyRenewalSchema,
  arbitrage: PolicyArbitrageSchema,
  conflict_strategy: z.enum(['warn', 'auto_adjust', 'block']).default('warn'),
  active: z.boolean().default(false),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Policy = z.infer<typeof PolicySchema>;
export type RegionReplication = z.infer<typeof RegionReplicationSchema>;
export type PolicyReplication = z.infer<typeof PolicyReplicationSchema>;
export type PolicyRenewal = z.infer<typeof PolicyRenewalSchema>;
export type PolicyArbitrage = z.infer<typeof PolicyArbitrageSchema>;

// Event types
export interface BaseEvent {
  id: string;
  timestamp: string;
  type: string;
  source: string;
}

export interface PolicyUpdatedEvent extends BaseEvent {
  type: 'policy.updated';
  payload: {
    policy_id: string;
    version: number;
    changes: string[];
  };
}

export interface AgentActionEvent extends BaseEvent {
  type: 'agent.action';
  payload: {
    agent_id: string;
    agent_type: AgentType;
    action_type: string;
    status: 'proposed' | 'approved' | 'executed' | 'failed';
    details: Record<string, unknown>;
  };
}

export type FilOpsEvent = PolicyUpdatedEvent | AgentActionEvent;
