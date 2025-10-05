import { prisma } from '@filops/database';
import { EventProducer, TOPICS } from '@filops/events';
import { createLogger, AppError } from '@filops/common';
import {
  AgentType,
  AgentStatus,
  AgentInstance,
  RegisterAgentParams,
  AgentHeartbeat,
  AgentError,
  AgentConfigSchema,
} from './types';

const logger = createLogger({
  service: 'agent-orchestrator',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Agent Orchestrator
 * Manages agent lifecycle, health monitoring, and coordination
 */
export class AgentOrchestrator {
  private eventProducer?: EventProducer;
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(eventProducer?: EventProducer) {
    this.eventProducer = eventProducer;
  }

  /**
   * Register a new agent
   */
  async registerAgent(params: RegisterAgentParams): Promise<AgentInstance> {
    logger.info('Registering agent', {
      type: params.type,
      projectId: params.projectId,
      policyId: params.policyId,
    });

    // Validate config
    const config = AgentConfigSchema.parse({
      type: params.type,
      ...params.config,
    });

    // Check if policy exists and is active
    const policy = await prisma.policy.findUnique({
      where: { id: params.policyId },
    });

    if (!policy) {
      throw new AppError('Policy not found', 404, 'POLICY_NOT_FOUND');
    }

    if (!policy.active) {
      throw new AppError('Policy is not active', 400, 'POLICY_NOT_ACTIVE');
    }

    // Create agent in database
    const agent = await prisma.agent.create({
      data: {
        type: params.type,
        project_id: params.projectId,
        policy_id: params.policyId,
        status: AgentStatus.CREATED,
        config: config as any,
        error_count: 0,
      },
    });

    // Publish event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'agent.registered',
        source: 'agent-orchestrator',
        payload: {
          agent_id: agent.id,
          agent_type: agent.type,
          project_id: agent.project_id,
          policy_id: agent.policy_id,
          status: agent.status,
        },
      });
    }

    logger.info('Agent registered', { agentId: agent.id });

    return this.mapAgentToInstance(agent);
  }

  /**
   * Start an agent
   */
  async startAgent(agentId: string): Promise<void> {
    logger.info('Starting agent', { agentId });

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    if (agent.status === AgentStatus.RUNNING) {
      logger.warn('Agent already running', { agentId });
      return;
    }

    // Update status to running
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.RUNNING,
        last_heartbeat: new Date(),
        error_count: 0,
        error_message: null,
      },
    });

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring(agentId);

    // Publish event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'agent.started',
        source: 'agent-orchestrator',
        payload: {
          agent_id: agentId,
          status: AgentStatus.RUNNING,
        },
      });
    }

    logger.info('Agent started', { agentId });
  }

  /**
   * Pause an agent
   */
  async pauseAgent(agentId: string): Promise<void> {
    logger.info('Pausing agent', { agentId });

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    // Update status to paused
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.PAUSED,
      },
    });

    // Stop heartbeat monitoring
    this.stopHeartbeatMonitoring(agentId);

    // Publish event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'agent.paused',
        source: 'agent-orchestrator',
        payload: {
          agent_id: agentId,
          status: AgentStatus.PAUSED,
        },
      });
    }

    logger.info('Agent paused', { agentId });
  }

  /**
   * Resume a paused agent
   */
  async resumeAgent(agentId: string): Promise<void> {
    logger.info('Resuming agent', { agentId });

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    if (agent.status !== AgentStatus.PAUSED) {
      throw new AppError('Agent is not paused', 400, 'AGENT_NOT_PAUSED');
    }

    // Update status to running
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.RUNNING,
        last_heartbeat: new Date(),
      },
    });

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring(agentId);

    // Publish event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'agent.resumed',
        source: 'agent-orchestrator',
        payload: {
          agent_id: agentId,
          status: AgentStatus.RUNNING,
        },
      });
    }

    logger.info('Agent resumed', { agentId });
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId: string): Promise<void> {
    logger.info('Stopping agent', { agentId });

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    // Update status to stopped
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.STOPPED,
      },
    });

    // Stop heartbeat monitoring
    this.stopHeartbeatMonitoring(agentId);

    // Publish event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'agent.stopped',
        source: 'agent-orchestrator',
        payload: {
          agent_id: agentId,
          status: AgentStatus.STOPPED,
        },
      });
    }

    logger.info('Agent stopped', { agentId });
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentInstance> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new AppError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    return this.mapAgentToInstance(agent);
  }

  /**
   * List all agents
   */
  async listAgents(filters?: {
    projectId?: string;
    policyId?: string;
    type?: AgentType;
    status?: AgentStatus;
  }): Promise<AgentInstance[]> {
    const agents = await prisma.agent.findMany({
      where: {
        project_id: filters?.projectId,
        policy_id: filters?.policyId,
        type: filters?.type,
        status: filters?.status,
      },
      orderBy: { created_at: 'desc' },
    });

    return agents.map((agent) => this.mapAgentToInstance(agent));
  }

  /**
   * Record agent heartbeat
   */
  async recordHeartbeat(heartbeat: AgentHeartbeat): Promise<void> {
    await prisma.agent.update({
      where: { id: heartbeat.agentId },
      data: {
        last_heartbeat: heartbeat.timestamp,
        status: heartbeat.status,
      },
    });

    // Publish heartbeat event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'agent.heartbeat',
        source: 'agent-orchestrator',
        payload: {
          agent_id: heartbeat.agentId,
          timestamp: heartbeat.timestamp.toISOString(),
          status: heartbeat.status,
          metrics: heartbeat.metrics,
        },
      });
    }
  }

  /**
   * Record agent error
   */
  async recordError(error: AgentError): Promise<void> {
    const agent = await prisma.agent.findUnique({
      where: { id: error.agentId },
    });

    if (!agent) {
      return;
    }

    const errorCount = agent.error_count + 1;

    // Update agent with error
    await prisma.agent.update({
      where: { id: error.agentId },
      data: {
        status: AgentStatus.ERROR,
        error_count: errorCount,
        error_message: error.error.message,
      },
    });

    // Publish error event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'agent.error',
        source: 'agent-orchestrator',
        payload: {
          agent_id: error.agentId,
          timestamp: error.timestamp.toISOString(),
          error: error.error.message,
          error_count: errorCount,
          context: error.context,
        },
      });
    }

    // Create alert if error count exceeds threshold
    if (errorCount >= 3) {
      await prisma.alert.create({
        data: {
          project_id: agent.project_id,
          severity: 'critical',
          summary: `Agent ${agent.type} has failed ${errorCount} times`,
          details: {
            agent_id: agent.id,
            error_message: error.error.message,
            error_count: errorCount,
          },
          status: 'open',
        },
      });
    }

    logger.error('Agent error recorded', {
      agentId: error.agentId,
      errorCount,
      error: error.error.message,
    });
  }

  /**
   * Start heartbeat monitoring for an agent
   */
  private startHeartbeatMonitoring(agentId: string): void {
    // Check heartbeat every 60 seconds
    const interval = setInterval(async () => {
      try {
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
        });

        if (!agent || agent.status !== AgentStatus.RUNNING) {
          this.stopHeartbeatMonitoring(agentId);
          return;
        }

        // Check if heartbeat is stale (no heartbeat in last 5 minutes)
        const lastHeartbeat = agent.last_heartbeat;
        if (lastHeartbeat) {
          const staleDuration = Date.now() - lastHeartbeat.getTime();
          if (staleDuration > 5 * 60 * 1000) {
            logger.warn('Agent heartbeat stale', {
              agentId,
              staleDuration,
            });

            // Create alert
            await prisma.alert.create({
              data: {
                project_id: agent.project_id,
                severity: 'warning',
                summary: `Agent ${agent.type} heartbeat is stale`,
                details: {
                  agent_id: agentId,
                  last_heartbeat: lastHeartbeat.toISOString(),
                  stale_duration_ms: staleDuration,
                },
                status: 'open',
              },
            });
          }
        }
      } catch (error) {
        logger.error('Error checking agent heartbeat', {
          agentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, 60000);

    this.heartbeatIntervals.set(agentId, interval);
  }

  /**
   * Stop heartbeat monitoring for an agent
   */
  private stopHeartbeatMonitoring(agentId: string): void {
    const interval = this.heartbeatIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(agentId);
    }
  }

  /**
   * Map database agent to AgentInstance
   */
  private mapAgentToInstance(agent: any): AgentInstance {
    return {
      id: agent.id,
      type: agent.type as AgentType,
      projectId: agent.project_id,
      policyId: agent.policy_id,
      status: agent.status as AgentStatus,
      config: agent.config as any,
      lastHeartbeat: agent.last_heartbeat,
      errorCount: agent.error_count,
      errorMessage: agent.error_message,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
    };
  }

  /**
   * Cleanup - stop all heartbeat monitoring
   */
  cleanup(): void {
    for (const [agentId, interval] of this.heartbeatIntervals.entries()) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();
  }
}
