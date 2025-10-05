import {
  validateEvent,
  DealStatusEventSchema,
  PolicyUpdateEventSchema,
  AgentActionEventSchema,
} from '../schemas';

describe('Event Schemas', () => {
  describe('validateEvent', () => {
    it('should validate a valid deal status event', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        type: 'deal.status.changed',
        source: 'deal-monitor',
        version: '1.0',
        payload: {
          deal_id: 'deal-123',
          dataset_id: 'dataset-456',
          provider_id: 'f01234',
          old_status: 'PENDING',
          new_status: 'ACTIVE',
        },
      };

      expect(() => validateEvent(event)).not.toThrow();
      const validated = validateEvent(event);
      expect(validated.type).toBe('deal.status.changed');
    });

    it('should validate a valid policy update event', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        type: 'policy.created',
        source: 'policy-service',
        version: '1.0',
        payload: {
          policy_id: '123e4567-e89b-12d3-a456-426614174000',
          project_id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Test Policy',
          version: 1,
          active: true,
          actor_id: '123e4567-e89b-12d3-a456-426614174002',
        },
      };

      expect(() => validateEvent(event)).not.toThrow();
    });

    it('should validate a valid agent action event', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        type: 'agent.action',
        source: 'rba-agent',
        version: '1.0',
        payload: {
          agent_id: '123e4567-e89b-12d3-a456-426614174000',
          agent_type: 'RBA',
          action_id: '123e4567-e89b-12d3-a456-426614174001',
          action_type: 'create_deal',
          status: 'PROPOSED',
          details: {
            provider: 'f01234',
            region: 'NA',
          },
        },
      };

      expect(() => validateEvent(event)).not.toThrow();
    });

    it('should reject event with invalid type', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        type: 'invalid.type',
        source: 'test',
        version: '1.0',
        payload: {},
      };

      expect(() => validateEvent(event)).toThrow('Unknown event type');
    });

    it('should reject event with missing required fields', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'deal.status.changed',
        source: 'test',
        payload: {
          deal_id: 'deal-123',
          // Missing required fields
        },
      };

      expect(() => validateEvent(event)).toThrow();
    });

    it('should reject event with invalid UUID', () => {
      const event = {
        id: 'not-a-uuid',
        timestamp: new Date().toISOString(),
        type: 'deal.status.changed',
        source: 'test',
        version: '1.0',
        payload: {
          deal_id: 'deal-123',
          dataset_id: 'dataset-456',
          provider_id: 'f01234',
          old_status: 'PENDING',
          new_status: 'ACTIVE',
        },
      };

      expect(() => validateEvent(event)).toThrow();
    });
  });

  describe('DealStatusEventSchema', () => {
    it('should validate valid deal status', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        type: 'deal.status.changed' as const,
        source: 'test',
        version: '1.0',
        payload: {
          deal_id: 'deal-123',
          dataset_id: 'dataset-456',
          provider_id: 'f01234',
          old_status: 'PENDING' as const,
          new_status: 'ACTIVE' as const,
        },
      };

      const result = DealStatusEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        type: 'deal.status.changed',
        source: 'test',
        version: '1.0',
        payload: {
          deal_id: 'deal-123',
          dataset_id: 'dataset-456',
          provider_id: 'f01234',
          old_status: 'INVALID_STATUS',
          new_status: 'ACTIVE',
        },
      };

      const result = DealStatusEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });
});
