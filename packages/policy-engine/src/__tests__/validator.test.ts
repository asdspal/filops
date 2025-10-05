import { PolicyValidator } from '../validator';
import { PolicyDocument } from '../types';

describe('PolicyValidator', () => {
  let validator: PolicyValidator;

  beforeEach(() => {
    validator = new PolicyValidator();
  });

  const createValidPolicy = (): PolicyDocument => ({
    replication: {
      regions: [
        { code: 'NA', min_replicas: 2 },
        { code: 'EU', min_replicas: 1 },
      ],
    },
    availability_target: 0.999,
    cost_ceiling_usd_per_TiB_month: 100,
    renewal: {
      lead_time_days: 14,
      min_collateral_buffer_pct: 20,
    },
    arbitrage: {
      enable: false,
      min_expected_savings_pct: 10,
      verification_strategy: {
        hash_check: true,
        sample_retrieval: 0.01,
      },
    },
    conflict_strategy: 'warn',
  });

  describe('validate', () => {
    it('should validate a correct policy', () => {
      const policy = createValidPolicy();
      const result = validator.validate(policy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject policy with less than 2 total replicas', () => {
      const policy = createValidPolicy();
      policy.replication.regions = [{ code: 'NA', min_replicas: 1 }];

      const result = validator.validate(policy);

      expect(result.valid).toBe(false);
      expect(result.conflicts).toContainEqual(
        expect.objectContaining({
          type: 'region',
          severity: 'error',
        }),
      );
    });

    it('should warn about high replica count', () => {
      const policy = createValidPolicy();
      policy.replication.regions = [{ code: 'NA', min_replicas: 51 }];

      const result = validator.validate(policy);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject duplicate regions', () => {
      const policy = createValidPolicy();
      policy.replication.regions = [
        { code: 'NA', min_replicas: 2 },
        { code: 'NA', min_replicas: 1 },
      ];

      const result = validator.validate(policy);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('Duplicate regions'));
    });

    it('should reject conflicting provider lists', () => {
      const policy = createValidPolicy();
      policy.replication.allowlist_providers = ['f01234', 'f05678'];
      policy.replication.denylist_providers = ['f01234', 'f09999'];

      const result = validator.validate(policy);

      expect(result.valid).toBe(false);
      expect(result.conflicts).toContainEqual(
        expect.objectContaining({
          type: 'provider',
          severity: 'error',
        }),
      );
    });

    it('should warn about low cost ceiling', () => {
      const policy = createValidPolicy();
      policy.cost_ceiling_usd_per_TiB_month = 5;
      policy.replication.regions = [
        { code: 'NA', min_replicas: 5 },
        { code: 'EU', min_replicas: 5 },
      ];

      const result = validator.validate(policy);

      expect(result.conflicts).toContainEqual(
        expect.objectContaining({
          type: 'budget',
          severity: 'warning',
        }),
      );
    });

    it('should warn about short renewal lead time', () => {
      const policy = createValidPolicy();
      policy.renewal.lead_time_days = 3;

      const result = validator.validate(policy);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject arbitrage without hash verification', () => {
      const policy = createValidPolicy();
      policy.arbitrage.enable = true;
      policy.arbitrage.verification_strategy.hash_check = false;

      const result = validator.validate(policy);

      expect(result.valid).toBe(false);
      expect(result.conflicts).toContainEqual(
        expect.objectContaining({
          type: 'sla',
          severity: 'error',
        }),
      );
    });
  });

  describe('checkConflicts', () => {
    it('should warn about existing active policies', async () => {
      const policy = createValidPolicy();
      const existingPolicies = [
        {
          id: 'policy-1',
          doc_json: createValidPolicy(),
          active: true,
        },
      ];

      const conflicts = await validator.checkConflicts(policy, 'project-1', existingPolicies);

      expect(conflicts).toContainEqual(
        expect.objectContaining({
          type: 'region',
          severity: 'warning',
        }),
      );
    });

    it('should not warn if no active policies exist', async () => {
      const policy = createValidPolicy();
      const existingPolicies = [
        {
          id: 'policy-1',
          doc_json: createValidPolicy(),
          active: false,
        },
      ];

      const conflicts = await validator.checkConflicts(policy, 'project-1', existingPolicies);

      expect(conflicts).toHaveLength(0);
    });
  });
});
