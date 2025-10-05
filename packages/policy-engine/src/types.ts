import { z } from 'zod';

/**
 * Policy types and schemas for FilOps
 * Extended from common package with additional validation
 */

// Region codes
export const REGION_CODES = ['NA', 'EU', 'APAC', 'SA', 'AF', 'ME'] as const;
export type RegionCode = (typeof REGION_CODES)[number];

// Region replication schema
export const RegionReplicationSchema = z.object({
  code: z.enum(REGION_CODES),
  min_replicas: z.number().int().positive().max(100),
});

export type RegionReplication = z.infer<typeof RegionReplicationSchema>;

// Policy replication schema
export const PolicyReplicationSchema = z.object({
  regions: z.array(RegionReplicationSchema).min(1).max(10),
  allowlist_providers: z.array(z.string()).optional(),
  denylist_providers: z.array(z.string()).optional(),
});

export type PolicyReplication = z.infer<typeof PolicyReplicationSchema>;

// Policy renewal schema
export const PolicyRenewalSchema = z.object({
  lead_time_days: z.number().int().min(1).max(365),
  min_collateral_buffer_pct: z.number().min(0).max(100),
});

export type PolicyRenewal = z.infer<typeof PolicyRenewalSchema>;

// Policy arbitrage schema
export const PolicyArbitrageSchema = z.object({
  enable: z.boolean(),
  min_expected_savings_pct: z.number().min(0).max(100),
  verification_strategy: z.object({
    hash_check: z.boolean(),
    sample_retrieval: z.number().min(0).max(1),
  }),
});

export type PolicyArbitrage = z.infer<typeof PolicyArbitrageSchema>;

// Full policy document schema
export const PolicyDocumentSchema = z.object({
  replication: PolicyReplicationSchema,
  availability_target: z.number().min(0).max(1),
  latency_targets_ms: z.record(z.enum(REGION_CODES), z.number().positive()).optional(),
  cost_ceiling_usd_per_TiB_month: z.number().positive().max(10000),
  renewal: PolicyRenewalSchema,
  arbitrage: PolicyArbitrageSchema,
  conflict_strategy: z.enum(['warn', 'auto_adjust', 'block']).default('warn'),
});

export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

// Policy create input
export const CreatePolicyInputSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  doc: PolicyDocumentSchema,
  active: z.boolean().default(false),
});

export type CreatePolicyInput = z.infer<typeof CreatePolicyInputSchema>;

// Policy update input
export const UpdatePolicyInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  doc: PolicyDocumentSchema.optional(),
  active: z.boolean().optional(),
});

export type UpdatePolicyInput = z.infer<typeof UpdatePolicyInputSchema>;

// Policy validation result
export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: PolicyConflict[];
}

// Policy conflict
export interface PolicyConflict {
  type: 'budget' | 'region' | 'provider' | 'sla';
  severity: 'error' | 'warning';
  message: string;
  details: Record<string, unknown>;
}

// Policy compliance status
export interface PolicyComplianceStatus {
  policy_id: string;
  compliant: boolean;
  total_replicas: number;
  required_replicas: number;
  region_status: Array<{
    region: RegionCode;
    current: number;
    required: number;
    compliant: boolean;
  }>;
  cost_status: {
    current_cost_usd: number;
    ceiling_usd: number;
    within_budget: boolean;
  };
  last_checked: string;
}
