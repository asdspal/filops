import { z } from 'zod';
export declare enum HealthStatus {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNHEALTHY = "unhealthy"
}
export interface HealthCheckResponse {
    status: HealthStatus;
    version: string;
    timestamp: string;
    uptime: number;
    dependencies?: Record<string, HealthStatus>;
}
export declare enum AgentType {
    RBA = "RBA",
    PRA = "PRA",
    PAA = "PAA"
}
export declare enum AgentStatus {
    CREATED = "created",
    RUNNING = "running",
    PAUSED = "paused",
    ERROR = "error",
    STOPPED = "stopped"
}
export declare const RegionReplicationSchema: z.ZodObject<{
    code: z.ZodString;
    min_replicas: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    code: string;
    min_replicas: number;
}, {
    code: string;
    min_replicas: number;
}>;
export declare const PolicyReplicationSchema: z.ZodObject<{
    regions: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        min_replicas: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        code: string;
        min_replicas: number;
    }, {
        code: string;
        min_replicas: number;
    }>, "many">;
    allowlist_providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    denylist_providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    regions: {
        code: string;
        min_replicas: number;
    }[];
    allowlist_providers?: string[] | undefined;
    denylist_providers?: string[] | undefined;
}, {
    regions: {
        code: string;
        min_replicas: number;
    }[];
    allowlist_providers?: string[] | undefined;
    denylist_providers?: string[] | undefined;
}>;
export declare const PolicyRenewalSchema: z.ZodObject<{
    lead_time_days: z.ZodNumber;
    min_collateral_buffer_pct: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lead_time_days: number;
    min_collateral_buffer_pct: number;
}, {
    lead_time_days: number;
    min_collateral_buffer_pct: number;
}>;
export declare const PolicyArbitrageSchema: z.ZodObject<{
    enable: z.ZodBoolean;
    min_expected_savings_pct: z.ZodNumber;
    verification_strategy: z.ZodObject<{
        hash_check: z.ZodBoolean;
        sample_retrieval: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        hash_check: boolean;
        sample_retrieval: number;
    }, {
        hash_check: boolean;
        sample_retrieval: number;
    }>;
}, "strip", z.ZodTypeAny, {
    enable: boolean;
    min_expected_savings_pct: number;
    verification_strategy: {
        hash_check: boolean;
        sample_retrieval: number;
    };
}, {
    enable: boolean;
    min_expected_savings_pct: number;
    verification_strategy: {
        hash_check: boolean;
        sample_retrieval: number;
    };
}>;
export declare const PolicySchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    owner: z.ZodString;
    project_id: z.ZodString;
    replication: z.ZodObject<{
        regions: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            min_replicas: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            code: string;
            min_replicas: number;
        }, {
            code: string;
            min_replicas: number;
        }>, "many">;
        allowlist_providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        denylist_providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        regions: {
            code: string;
            min_replicas: number;
        }[];
        allowlist_providers?: string[] | undefined;
        denylist_providers?: string[] | undefined;
    }, {
        regions: {
            code: string;
            min_replicas: number;
        }[];
        allowlist_providers?: string[] | undefined;
        denylist_providers?: string[] | undefined;
    }>;
    availability_target: z.ZodNumber;
    latency_targets_ms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    cost_ceiling_usd_per_TiB_month: z.ZodNumber;
    renewal: z.ZodObject<{
        lead_time_days: z.ZodNumber;
        min_collateral_buffer_pct: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lead_time_days: number;
        min_collateral_buffer_pct: number;
    }, {
        lead_time_days: number;
        min_collateral_buffer_pct: number;
    }>;
    arbitrage: z.ZodObject<{
        enable: z.ZodBoolean;
        min_expected_savings_pct: z.ZodNumber;
        verification_strategy: z.ZodObject<{
            hash_check: z.ZodBoolean;
            sample_retrieval: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            hash_check: boolean;
            sample_retrieval: number;
        }, {
            hash_check: boolean;
            sample_retrieval: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        enable: boolean;
        min_expected_savings_pct: number;
        verification_strategy: {
            hash_check: boolean;
            sample_retrieval: number;
        };
    }, {
        enable: boolean;
        min_expected_savings_pct: number;
        verification_strategy: {
            hash_check: boolean;
            sample_retrieval: number;
        };
    }>;
    conflict_strategy: z.ZodDefault<z.ZodEnum<["warn", "auto_adjust", "block"]>>;
    active: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: number;
    owner: string;
    project_id: string;
    replication: {
        regions: {
            code: string;
            min_replicas: number;
        }[];
        allowlist_providers?: string[] | undefined;
        denylist_providers?: string[] | undefined;
    };
    availability_target: number;
    cost_ceiling_usd_per_TiB_month: number;
    renewal: {
        lead_time_days: number;
        min_collateral_buffer_pct: number;
    };
    arbitrage: {
        enable: boolean;
        min_expected_savings_pct: number;
        verification_strategy: {
            hash_check: boolean;
            sample_retrieval: number;
        };
    };
    conflict_strategy: "warn" | "auto_adjust" | "block";
    active: boolean;
    id?: string | undefined;
    latency_targets_ms?: Record<string, number> | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    name: string;
    owner: string;
    project_id: string;
    replication: {
        regions: {
            code: string;
            min_replicas: number;
        }[];
        allowlist_providers?: string[] | undefined;
        denylist_providers?: string[] | undefined;
    };
    availability_target: number;
    cost_ceiling_usd_per_TiB_month: number;
    renewal: {
        lead_time_days: number;
        min_collateral_buffer_pct: number;
    };
    arbitrage: {
        enable: boolean;
        min_expected_savings_pct: number;
        verification_strategy: {
            hash_check: boolean;
            sample_retrieval: number;
        };
    };
    id?: string | undefined;
    version?: number | undefined;
    latency_targets_ms?: Record<string, number> | undefined;
    conflict_strategy?: "warn" | "auto_adjust" | "block" | undefined;
    active?: boolean | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
export type Policy = z.infer<typeof PolicySchema>;
export type RegionReplication = z.infer<typeof RegionReplicationSchema>;
export type PolicyReplication = z.infer<typeof PolicyReplicationSchema>;
export type PolicyRenewal = z.infer<typeof PolicyRenewalSchema>;
export type PolicyArbitrage = z.infer<typeof PolicyArbitrageSchema>;
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
//# sourceMappingURL=index.d.ts.map