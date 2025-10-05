import { z } from 'zod';

/**
 * Agent types supported by the orchestrator
 */
export enum AgentType {
  RBA = 'RBA', // Replica Balance Agent
  PRA = 'PRA', // Predictive Renewal Agent
  PAA = 'PAA', // Pricing Arbitrage Agent
}

/**
 * Agent status lifecycle
 */
export enum AgentStatus {
  CREATED = 'created',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Base agent configuration schema
 */
export const BaseAgentConfigSchema = z.object({
  checkIntervalMs: z.number().min(1000).default(60000),
  autoExecute: z.boolean().default(false),
  maxActionsPerRun: z.number().min(1).default(10),
});

/**
 * RBA-specific configuration
 */
export const RBAConfigSchema = BaseAgentConfigSchema.extend({
  type: z.literal(AgentType.RBA),
});

/**
 * PRA-specific configuration
 */
export const PRAConfigSchema = BaseAgentConfigSchema.extend({
  type: z.literal(AgentType.PRA),
  leadTimeDays: z.number().min(1).default(14),
});

/**
 * PAA-specific configuration
 */
export const PAAConfigSchema = BaseAgentConfigSchema.extend({
  type: z.literal(AgentType.PAA),
  minSavingsPct: z.number().min(0).default(10),
});

/**
 * Union of all agent config schemas
 */
export const AgentConfigSchema = z.discriminatedUnion('type', [
  RBAConfigSchema,
  PRAConfigSchema,
  PAAConfigSchema,
]);

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type RBAConfig = z.infer<typeof RBAConfigSchema>;
export type PRAConfig = z.infer<typeof PRAConfigSchema>;
export type PAAConfig = z.infer<typeof PAAConfigSchema>;

/**
 * Agent registration parameters
 */
export interface RegisterAgentParams {
  type: AgentType;
  projectId: string;
  policyId: string;
  config: Partial<AgentConfig>;
}

/**
 * Agent instance
 */
export interface AgentInstance {
  id: string;
  type: AgentType;
  projectId: string;
  policyId: string;
  status: AgentStatus;
  config: AgentConfig;
  lastHeartbeat: Date | null;
  errorCount: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent heartbeat
 */
export interface AgentHeartbeat {
  agentId: string;
  timestamp: Date;
  status: AgentStatus;
  metrics?: {
    actionsProposed?: number;
    actionsExecuted?: number;
    errorCount?: number;
  };
}

/**
 * Agent error
 */
export interface AgentError {
  agentId: string;
  timestamp: Date;
  error: Error;
  context?: Record<string, unknown>;
}
