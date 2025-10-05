import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AgentOrchestrator, AgentType, AgentStatus } from '@filops/agent-orchestrator';
import { ReplicaBalanceAgent } from '@filops/agent-rba';
import { IntegrationsService } from '@filops/integrations';
import { EventProducer } from '@filops/events';

@Injectable()
export class AgentsService implements OnModuleInit, OnModuleDestroy {
  private orchestrator: AgentOrchestrator;
  private integrations: IntegrationsService;
  private eventProducer: EventProducer;
  private rbaInstances: Map<string, ReplicaBalanceAgent> = new Map();

  async onModuleInit() {
    // Initialize event producer
    this.eventProducer = new EventProducer({
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: 'api-gateway',
    });
    await this.eventProducer.connect();

    // Initialize orchestrator
    this.orchestrator = new AgentOrchestrator(this.eventProducer);

    // Initialize integrations
    this.integrations = new IntegrationsService({
      synapse: {
        apiUrl: process.env.SYNAPSE_API_URL || 'http://localhost:1234',
        network: (process.env.SYNAPSE_NETWORK as any) || 'devnet',
      },
      ipni: {
        apiUrl: process.env.IPNI_API_URL || 'https://cid.contact',
      },
      geomgr: {
        apiUrl: process.env.GEOMGR_API_URL || 'https://geomgr.titan.io',
      },
    });
  }

  async onModuleDestroy() {
    // Stop all RBA instances
    for (const [agentId, rba] of this.rbaInstances.entries()) {
      await rba.stop();
    }
    this.rbaInstances.clear();

    // Cleanup orchestrator
    this.orchestrator.cleanup();

    // Disconnect event producer
    await this.eventProducer.disconnect();
  }

  /**
   * Register a new agent
   */
  async registerAgent(params: {
    type: AgentType;
    projectId: string;
    policyId: string;
    config: any;
  }) {
    return await this.orchestrator.registerAgent(params);
  }

  /**
   * Start an agent
   */
  async startAgent(agentId: string) {
    // Start in orchestrator
    await this.orchestrator.startAgent(agentId);

    // Get agent details
    const agent = await this.orchestrator.getAgentStatus(agentId);

    // If RBA, create and start instance
    if (agent.type === AgentType.RBA) {
      const rba = new ReplicaBalanceAgent({
        agentId: agent.id,
        policyId: agent.policyId,
        config: agent.config as any,
        orchestrator: this.orchestrator,
        integrations: this.integrations,
        eventProducer: this.eventProducer,
      });

      await rba.start();
      this.rbaInstances.set(agentId, rba);
    }

    return agent;
  }

  /**
   * Pause an agent
   */
  async pauseAgent(agentId: string) {
    // Pause in orchestrator
    await this.orchestrator.pauseAgent(agentId);

    // Stop RBA instance if exists
    const rba = this.rbaInstances.get(agentId);
    if (rba) {
      await rba.stop();
    }

    return await this.orchestrator.getAgentStatus(agentId);
  }

  /**
   * Resume an agent
   */
  async resumeAgent(agentId: string) {
    // Resume in orchestrator
    await this.orchestrator.resumeAgent(agentId);

    // Get agent details
    const agent = await this.orchestrator.getAgentStatus(agentId);

    // If RBA, restart instance
    if (agent.type === AgentType.RBA) {
      let rba = this.rbaInstances.get(agentId);
      if (!rba) {
        rba = new ReplicaBalanceAgent({
          agentId: agent.id,
          policyId: agent.policyId,
          config: agent.config as any,
          orchestrator: this.orchestrator,
          integrations: this.integrations,
          eventProducer: this.eventProducer,
        });
        this.rbaInstances.set(agentId, rba);
      }
      await rba.start();
    }

    return agent;
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId: string) {
    // Stop in orchestrator
    await this.orchestrator.stopAgent(agentId);

    // Stop and remove RBA instance if exists
    const rba = this.rbaInstances.get(agentId);
    if (rba) {
      await rba.stop();
      this.rbaInstances.delete(agentId);
    }

    return await this.orchestrator.getAgentStatus(agentId);
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string) {
    const agent = await this.orchestrator.getAgentStatus(agentId);

    // Add RBA metrics if available
    if (agent.type === AgentType.RBA) {
      const rba = this.rbaInstances.get(agentId);
      if (rba) {
        return {
          ...agent,
          metrics: rba.getMetrics(),
        };
      }
    }

    return agent;
  }

  /**
   * List all agents
   */
  async listAgents(filters?: {
    projectId?: string;
    policyId?: string;
    type?: AgentType;
    status?: AgentStatus;
  }) {
    return await this.orchestrator.listAgents(filters);
  }

  /**
   * Approve an action
   */
  async approveAction(agentId: string, actionId: string) {
    const rba = this.rbaInstances.get(agentId);
    if (!rba) {
      throw new Error('RBA agent not found or not running');
    }

    await rba.approveAction(actionId);
  }

  /**
   * Reject an action
   */
  async rejectAction(agentId: string, actionId: string, reason?: string) {
    const rba = this.rbaInstances.get(agentId);
    if (!rba) {
      throw new Error('RBA agent not found or not running');
    }

    await rba.rejectAction(actionId, reason);
  }
}
