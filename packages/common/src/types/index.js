"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicySchema = exports.PolicyArbitrageSchema = exports.PolicyRenewalSchema = exports.PolicyReplicationSchema = exports.RegionReplicationSchema = exports.AgentStatus = exports.AgentType = exports.HealthStatus = void 0;
const zod_1 = require("zod");
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["UNHEALTHY"] = "unhealthy";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
var AgentType;
(function (AgentType) {
    AgentType["RBA"] = "RBA";
    AgentType["PRA"] = "PRA";
    AgentType["PAA"] = "PAA";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["CREATED"] = "created";
    AgentStatus["RUNNING"] = "running";
    AgentStatus["PAUSED"] = "paused";
    AgentStatus["ERROR"] = "error";
    AgentStatus["STOPPED"] = "stopped";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
exports.RegionReplicationSchema = zod_1.z.object({
    code: zod_1.z.string(),
    min_replicas: zod_1.z.number().int().positive(),
});
exports.PolicyReplicationSchema = zod_1.z.object({
    regions: zod_1.z.array(exports.RegionReplicationSchema),
    allowlist_providers: zod_1.z.array(zod_1.z.string()).optional(),
    denylist_providers: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.PolicyRenewalSchema = zod_1.z.object({
    lead_time_days: zod_1.z.number().int().positive(),
    min_collateral_buffer_pct: zod_1.z.number().min(0).max(100),
});
exports.PolicyArbitrageSchema = zod_1.z.object({
    enable: zod_1.z.boolean(),
    min_expected_savings_pct: zod_1.z.number().min(0).max(100),
    verification_strategy: zod_1.z.object({
        hash_check: zod_1.z.boolean(),
        sample_retrieval: zod_1.z.number().min(0).max(1),
    }),
});
exports.PolicySchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(255),
    version: zod_1.z.number().int().positive().default(1),
    owner: zod_1.z.string(),
    project_id: zod_1.z.string().uuid(),
    replication: exports.PolicyReplicationSchema,
    availability_target: zod_1.z.number().min(0).max(1),
    latency_targets_ms: zod_1.z.record(zod_1.z.string(), zod_1.z.number().positive()).optional(),
    cost_ceiling_usd_per_TiB_month: zod_1.z.number().positive(),
    renewal: exports.PolicyRenewalSchema,
    arbitrage: exports.PolicyArbitrageSchema,
    conflict_strategy: zod_1.z.enum(['warn', 'auto_adjust', 'block']).default('warn'),
    active: zod_1.z.boolean().default(false),
    created_at: zod_1.z.string().datetime().optional(),
    updated_at: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=index.js.map