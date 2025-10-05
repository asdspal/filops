import { PolicySchema, AgentType, AgentStatus, HealthStatus } from '../types';

describe('Types', () => {
  describe('PolicySchema', () => {
    it('should validate a valid policy', () => {
      const validPolicy = {
        name: 'Test Policy',
        owner: 'user@example.com',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
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
          enable: true,
          min_expected_savings_pct: 10,
          verification_strategy: {
            hash_check: true,
            sample_retrieval: 0.01,
          },
        },
      };

      const result = PolicySchema.safeParse(validPolicy);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(1);
        expect(result.data.conflict_strategy).toBe('warn');
        expect(result.data.active).toBe(false);
      }
    });

    it('should reject invalid policy with missing required fields', () => {
      const invalidPolicy = {
        name: 'Test Policy',
      };

      const result = PolicySchema.safeParse(invalidPolicy);
      expect(result.success).toBe(false);
    });

    it('should reject policy with invalid availability target', () => {
      const invalidPolicy = {
        name: 'Test Policy',
        owner: 'user@example.com',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        replication: {
          regions: [{ code: 'NA', min_replicas: 2 }],
        },
        availability_target: 1.5, // Invalid: > 1
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
      };

      const result = PolicySchema.safeParse(invalidPolicy);
      expect(result.success).toBe(false);
    });
  });

  describe('Enums', () => {
    it('should have correct AgentType values', () => {
      expect(AgentType.RBA).toBe('RBA');
      expect(AgentType.PRA).toBe('PRA');
      expect(AgentType.PAA).toBe('PAA');
    });

    it('should have correct AgentStatus values', () => {
      expect(AgentStatus.CREATED).toBe('created');
      expect(AgentStatus.RUNNING).toBe('running');
      expect(AgentStatus.PAUSED).toBe('paused');
      expect(AgentStatus.ERROR).toBe('error');
      expect(AgentStatus.STOPPED).toBe('stopped');
    });

    it('should have correct HealthStatus values', () => {
      expect(HealthStatus.HEALTHY).toBe('healthy');
      expect(HealthStatus.DEGRADED).toBe('degraded');
      expect(HealthStatus.UNHEALTHY).toBe('unhealthy');
    });
  });
});
