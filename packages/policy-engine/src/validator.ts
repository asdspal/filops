import {
  PolicyDocument,
  PolicyValidationResult,
  PolicyConflict,
  PolicyDocumentSchema,
} from './types';
import { createLogger } from '@filops/common';

const logger = createLogger({
  service: 'policy-validator',
  level: process.env.LOG_LEVEL || 'info',
});

export class PolicyValidator {
  /**
   * Validate a policy document
   */
  validate(doc: PolicyDocument): PolicyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: PolicyConflict[] = [];

    try {
      // Schema validation
      PolicyDocumentSchema.parse(doc);
    } catch (error: any) {
      errors.push(`Schema validation failed: ${error.message}`);
      return { valid: false, errors, warnings, conflicts };
    }

    // Business logic validation
    this.validateReplication(doc, errors, warnings, conflicts);
    this.validateBudget(doc, errors, warnings, conflicts);
    this.validateRenewal(doc, errors, warnings, conflicts);
    this.validateArbitrage(doc, errors, warnings, conflicts);

    const valid = errors.length === 0 && conflicts.filter((c) => c.severity === 'error').length === 0;

    if (!valid) {
      logger.warn('Policy validation failed', { errors, warnings, conflicts });
    }

    return { valid, errors, warnings, conflicts };
  }

  /**
   * Validate replication configuration
   */
  private validateReplication(
    doc: PolicyDocument,
    errors: string[],
    warnings: string[],
    conflicts: PolicyConflict[],
  ): void {
    const { replication } = doc;

    // Check for duplicate regions
    const regionCodes = replication.regions.map((r) => r.code);
    const duplicates = regionCodes.filter((code, index) => regionCodes.indexOf(code) !== index);

    if (duplicates.length > 0) {
      errors.push(`Duplicate regions found: ${duplicates.join(', ')}`);
    }

    // Check total replica count
    const totalReplicas = replication.regions.reduce((sum, r) => sum + r.min_replicas, 0);

    if (totalReplicas < 2) {
      conflicts.push({
        type: 'region',
        severity: 'error',
        message: 'Total replicas must be at least 2 for data safety',
        details: { total_replicas: totalReplicas },
      });
    }

    if (totalReplicas > 50) {
      warnings.push(`High replica count (${totalReplicas}) may be expensive`);
    }

    // Check for conflicting provider lists
    if (replication.allowlist_providers && replication.denylist_providers) {
      const intersection = replication.allowlist_providers.filter((p) =>
        replication.denylist_providers!.includes(p),
      );

      if (intersection.length > 0) {
        conflicts.push({
          type: 'provider',
          severity: 'error',
          message: 'Providers cannot be in both allowlist and denylist',
          details: { conflicting_providers: intersection },
        });
      }
    }
  }

  /**
   * Validate budget configuration
   */
  private validateBudget(
    doc: PolicyDocument,
    errors: string[],
    warnings: string[],
    conflicts: PolicyConflict[],
  ): void {
    const { cost_ceiling_usd_per_TiB_month, replication } = doc;

    // Estimate minimum cost based on replicas
    const totalReplicas = replication.regions.reduce((sum, r) => sum + r.min_replicas, 0);
    const estimatedMinCost = totalReplicas * 5; // Assume $5/TiB/month minimum

    if (cost_ceiling_usd_per_TiB_month < estimatedMinCost) {
      conflicts.push({
        type: 'budget',
        severity: 'warning',
        message: `Cost ceiling ($${cost_ceiling_usd_per_TiB_month}) may be too low for ${totalReplicas} replicas`,
        details: {
          ceiling: cost_ceiling_usd_per_TiB_month,
          estimated_min: estimatedMinCost,
          replicas: totalReplicas,
        },
      });
    }

    if (cost_ceiling_usd_per_TiB_month > 1000) {
      warnings.push(`Very high cost ceiling: $${cost_ceiling_usd_per_TiB_month}/TiB/month`);
    }
  }

  /**
   * Validate renewal configuration
   */
  private validateRenewal(
    doc: PolicyDocument,
    errors: string[],
    warnings: string[],
    conflicts: PolicyConflict[],
  ): void {
    const { renewal } = doc;

    if (renewal.lead_time_days < 7) {
      warnings.push('Renewal lead time less than 7 days may be risky');
    }

    if (renewal.lead_time_days > 90) {
      warnings.push('Very long renewal lead time may lock funds unnecessarily');
    }

    if (renewal.min_collateral_buffer_pct < 10) {
      warnings.push('Low collateral buffer may cause renewal failures');
    }
  }

  /**
   * Validate arbitrage configuration
   */
  private validateArbitrage(
    doc: PolicyDocument,
    errors: string[],
    warnings: string[],
    conflicts: PolicyConflict[],
  ): void {
    const { arbitrage } = doc;

    if (arbitrage.enable) {
      if (arbitrage.min_expected_savings_pct < 5) {
        warnings.push('Low savings threshold may cause frequent migrations');
      }

      if (!arbitrage.verification_strategy.hash_check) {
        conflicts.push({
          type: 'sla',
          severity: 'error',
          message: 'Hash verification must be enabled for arbitrage',
          details: {},
        });
      }

      if (arbitrage.verification_strategy.sample_retrieval < 0.01) {
        warnings.push('Very low sample retrieval rate may miss data corruption');
      }
    }
  }

  /**
   * Check for conflicts with existing policies
   */
  async checkConflicts(
    doc: PolicyDocument,
    projectId: string,
    existingPolicies: Array<{ id: string; doc_json: any; active: boolean }>,
  ): Promise<PolicyConflict[]> {
    const conflicts: PolicyConflict[] = [];

    // Check for conflicting active policies
    const activePolicies = existingPolicies.filter((p) => p.active);

    if (activePolicies.length > 0) {
      conflicts.push({
        type: 'region',
        severity: 'warning',
        message: `Project already has ${activePolicies.length} active policy/policies`,
        details: {
          active_policy_ids: activePolicies.map((p) => p.id),
        },
      });
    }

    return conflicts;
  }
}
