import { AgentOrchestrator } from '../orchestrator';
import { AgentType, AgentStatus } from '../types';
import { prisma } from '@filops/database';

// Mock Prisma
jest.mock('@filops/database', () => ({
  prisma: {
    policy: {
      findUnique: jest.fn(),
    },
    agent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    alert: {
      create: jest.fn(),
    },
  },
}));

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    jest.clearAllMocks();
  });

  afterEach(() => {
    orchestrator.cleanup();
  });

  describe('registerAgent', () => {
    it('should register a new RBA agent', async () => {
      const mockPolicy = {
        id: 'policy-123',
        active: true,
      };

      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        project_id: 'project-123',
        policy_id: 'policy-123',
        status: AgentStatus.CREATED,
        config: {
          type: AgentType.RBA,
          checkIntervalMs: 60000,
          autoExecute: false,
          maxActionsPerRun: 10,
        },
        error_count: 0,
        last_heartbeat: null,
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (prisma.policy.findUnique as jest.Mock).mockResolvedValue(mockPolicy);
      (prisma.agent.create as jest.Mock).mockResolvedValue(mockAgent);

      const result = await orchestrator.registerAgent({
        type: AgentType.RBA,
        projectId: 'project-123',
        policyId: 'policy-123',
        config: {
          checkIntervalMs: 60000,
          autoExecute: false,
        },
      });

      expect(result.id).toBe('agent-123');
      expect(result.type).toBe(AgentType.RBA);
      expect(result.status).toBe(AgentStatus.CREATED);
      expect(prisma.agent.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error if policy not found', async () => {
      (prisma.policy.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        orchestrator.registerAgent({
          type: AgentType.RBA,
          projectId: 'project-123',
          policyId: 'policy-123',
          config: {},
        })
      ).rejects.toThrow('Policy not found');
    });

    it('should throw error if policy is not active', async () => {
      const mockPolicy = {
        id: 'policy-123',
        active: false,
      };

      (prisma.policy.findUnique as jest.Mock).mockResolvedValue(mockPolicy);

      await expect(
        orchestrator.registerAgent({
          type: AgentType.RBA,
          projectId: 'project-123',
          policyId: 'policy-123',
          config: {},
        })
      ).rejects.toThrow('Policy is not active');
    });
  });

  describe('startAgent', () => {
    it('should start an agent', async () => {
      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        status: AgentStatus.CREATED,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.RUNNING,
      });

      await orchestrator.startAgent('agent-123');

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: expect.objectContaining({
          status: AgentStatus.RUNNING,
        }),
      });
    });

    it('should throw error if agent not found', async () => {
      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(orchestrator.startAgent('agent-123')).rejects.toThrow(
        'Agent not found'
      );
    });
  });

  describe('pauseAgent', () => {
    it('should pause a running agent', async () => {
      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        status: AgentStatus.RUNNING,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.PAUSED,
      });

      await orchestrator.pauseAgent('agent-123');

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: {
          status: AgentStatus.PAUSED,
        },
      });
    });
  });

  describe('resumeAgent', () => {
    it('should resume a paused agent', async () => {
      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        status: AgentStatus.PAUSED,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.RUNNING,
      });

      await orchestrator.resumeAgent('agent-123');

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: expect.objectContaining({
          status: AgentStatus.RUNNING,
        }),
      });
    });

    it('should throw error if agent is not paused', async () => {
      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        status: AgentStatus.RUNNING,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);

      await expect(orchestrator.resumeAgent('agent-123')).rejects.toThrow(
        'Agent is not paused'
      );
    });
  });

  describe('stopAgent', () => {
    it('should stop an agent', async () => {
      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        status: AgentStatus.RUNNING,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.agent.update as jest.Mock).mockResolvedValue({
        ...mockAgent,
        status: AgentStatus.STOPPED,
      });

      await orchestrator.stopAgent('agent-123');

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: {
          status: AgentStatus.STOPPED,
        },
      });
    });
  });

  describe('getAgentStatus', () => {
    it('should return agent status', async () => {
      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        project_id: 'project-123',
        policy_id: 'policy-123',
        status: AgentStatus.RUNNING,
        config: {},
        error_count: 0,
        last_heartbeat: new Date(),
        error_message: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);

      const result = await orchestrator.getAgentStatus('agent-123');

      expect(result.id).toBe('agent-123');
      expect(result.status).toBe(AgentStatus.RUNNING);
    });
  });

  describe('listAgents', () => {
    it('should list all agents', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          type: AgentType.RBA,
          project_id: 'project-123',
          policy_id: 'policy-123',
          status: AgentStatus.RUNNING,
          config: {},
          error_count: 0,
          last_heartbeat: new Date(),
          error_message: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'agent-2',
          type: AgentType.PRA,
          project_id: 'project-123',
          policy_id: 'policy-456',
          status: AgentStatus.PAUSED,
          config: {},
          error_count: 0,
          last_heartbeat: new Date(),
          error_message: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (prisma.agent.findMany as jest.Mock).mockResolvedValue(mockAgents);

      const result = await orchestrator.listAgents();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('agent-1');
      expect(result[1].id).toBe('agent-2');
    });

    it('should filter agents by project', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          type: AgentType.RBA,
          project_id: 'project-123',
          policy_id: 'policy-123',
          status: AgentStatus.RUNNING,
          config: {},
          error_count: 0,
          last_heartbeat: new Date(),
          error_message: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (prisma.agent.findMany as jest.Mock).mockResolvedValue(mockAgents);

      const result = await orchestrator.listAgents({
        projectId: 'project-123',
      });

      expect(result).toHaveLength(1);
      expect(prisma.agent.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          project_id: 'project-123',
        }),
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('recordHeartbeat', () => {
    it('should record agent heartbeat', async () => {
      (prisma.agent.update as jest.Mock).mockResolvedValue({});

      await orchestrator.recordHeartbeat({
        agentId: 'agent-123',
        timestamp: new Date(),
        status: AgentStatus.RUNNING,
        metrics: {
          actionsProposed: 5,
          actionsExecuted: 3,
        },
      });

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: expect.objectContaining({
          status: AgentStatus.RUNNING,
        }),
      });
    });
  });

  describe('recordError', () => {
    it('should record agent error', async () => {
      const mockAgent = {
        id: 'agent-123',
        project_id: 'project-123',
        error_count: 0,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.agent.update as jest.Mock).mockResolvedValue({});

      await orchestrator.recordError({
        agentId: 'agent-123',
        timestamp: new Date(),
        error: new Error('Test error'),
      });

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: expect.objectContaining({
          status: AgentStatus.ERROR,
          error_count: 1,
          error_message: 'Test error',
        }),
      });
    });

    it('should create alert after 3 errors', async () => {
      const mockAgent = {
        id: 'agent-123',
        type: AgentType.RBA,
        project_id: 'project-123',
        error_count: 2,
      };

      (prisma.agent.findUnique as jest.Mock).mockResolvedValue(mockAgent);
      (prisma.agent.update as jest.Mock).mockResolvedValue({});
      (prisma.alert.create as jest.Mock).mockResolvedValue({});

      await orchestrator.recordError({
        agentId: 'agent-123',
        timestamp: new Date(),
        error: new Error('Test error'),
      });

      expect(prisma.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          severity: 'critical',
          status: 'open',
        }),
      });
    });
  });
});
