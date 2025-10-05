import { prisma } from '@filops/database';
import { EventProducer, TOPICS } from '@filops/events';
import { createLogger, AppError } from '@filops/common';
import { PolicyService } from '@filops/policy-engine';
import { IntegrationsService } from '@filops/integrations';
import {
  AgentOrchestrator,
  AgentStatus,
  AgentHeartbeat,
  RBAConfig,
} from '@filops/agent-orchestrator';
import {
  ActionType,
  ActionStatus,
  ActionProposal,
  ReplicaDeficit,
  ComplianceCheckResult,
  RBAMetrics,
  DealCreationParams,
} from './types';

const logger = createLogger({
  service: 'agent-rba',
  level: process.env.LOG_LEVEL || 'info',
});

/**
 * Replica Balance Agent
 * Monitors and maintains replica counts per region according to policies
 */
export class ReplicaBalanceAgent {
  private agentId: string;
  private policyId: string;
  private config: RBAConfig;
  private orchestrator: AgentOrchestrator;
  private integrations: IntegrationsService;
  private policyService: PolicyService;
  private eventProducer?: EventProducer;
  private running: boolean = false;
  private checkInterval?: NodeJS.Timeout;
  private metrics: RBAMetrics = {
    checksPerformed: 0,
    deficitsDetected: 0,
    actionsProposed: 0,
    actionsExecuted: 0,
    actionsSucceeded: 0,
    actionsFailed: 0,
  };

  constructor(params: {
    agentId: string;
    policyId: string;
    config: RBAConfig;
    orchestrator: AgentOrchestrator;
    integrations: IntegrationsService;
    eventProducer?: EventProducer;
  }) {
    this.agentId = params.agentId;
    this.policyId = params.policyId;
    this.config = params.config;
    this.orchestrator = params.orchestrator;
    this.integrations = params.integrations;
    this.eventProducer = params.eventProducer;
    this.policyService = new PolicyService(params.eventProducer);
  }

  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Agent already running', { agentId: this.agentId });
      return;
    }

    logger.info('Starting RBA agent', {
      agentId: this.agentId,
      policyId: this.policyId,
      config: this.config,
    });

    this.running = true;

    // Send initial heartbeat
    await this.sendHeartbeat();

    // Start periodic compliance checks
    this.checkInterval = setInterval(async () => {
      try {
        await this.runComplianceCheck();
      } catch (error) {
        logger.error('Error in compliance check', {
          agentId: this.agentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        await this.orchestrator.recordError({
          agentId: this.agentId,
          timestamp: new Date(),
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    }, this.config.checkIntervalMs);

    // Run initial check immediately
    await this.runComplianceCheck();
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    logger.info('Stopping RBA agent', { agentId: this.agentId });

    this.running = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Run compliance check for all datasets
   */
  private async runComplianceCheck(): Promise<void> {
    logger.info('Running compliance check', { agentId: this.agentId });

    // Publish check started event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'rba.check.started',
        source: 'agent-rba',
        payload: {
          agent_id: this.agentId,
          policy_id: this.policyId,
        },
      });
    }

    try {
      // Get policy
      const policy = await this.policyService.getPolicy(this.policyId);

      if (!policy.active) {
        logger.warn('Policy is not active, skipping check', {
          policyId: this.policyId,
        });
        return;
      }

      // Get all datasets for this policy's project
      const datasets = await prisma.dataset.findMany({
        where: {
          project_id: policy.project_id,
        },
        include: {
          deals: {
            where: {
              status: 'active',
            },
          },
        },
      });

      logger.info('Checking datasets', {
        count: datasets.length,
        policyId: this.policyId,
      });

      // Check each dataset
      for (const dataset of datasets) {
        await this.checkDatasetCompliance(dataset, policy);
      }

      this.metrics.checksPerformed++;
      this.metrics.lastCheckAt = new Date();

      // Send heartbeat with metrics
      await this.sendHeartbeat();

      // Publish check completed event
      if (this.eventProducer) {
        await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
          type: 'rba.check.completed',
          source: 'agent-rba',
          payload: {
            agent_id: this.agentId,
            policy_id: this.policyId,
            datasets_checked: datasets.length,
            metrics: this.metrics,
          },
        });
      }
    } catch (error) {
      logger.error('Error in compliance check', {
        agentId: this.agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check compliance for a single dataset
   */
  private async checkDatasetCompliance(dataset: any, policy: any): Promise<void> {
    logger.debug('Checking dataset compliance', {
      datasetId: dataset.id,
      policyId: policy.id,
    });

    // Count replicas per region
    const replicasByRegion = new Map<string, number>();

    for (const deal of dataset.deals) {
      const region = deal.region || 'UNKNOWN';
      replicasByRegion.set(region, (replicasByRegion.get(region) || 0) + 1);
    }

    // Check against policy requirements
    const deficits: ReplicaDeficit[] = [];
    const policyDoc = policy.doc as any;

    if (policyDoc.replication?.regions) {
      for (const regionReq of policyDoc.replication.regions) {
        const current = replicasByRegion.get(regionReq.code) || 0;
        const required = regionReq.min_replicas;

        if (current < required) {
          const deficit: ReplicaDeficit = {
            region: regionReq.code,
            required,
            current,
            deficit: required - current,
          };
          deficits.push(deficit);
        }
      }
    }

    // If deficits found, propose actions
    if (deficits.length > 0) {
      logger.info('Replica deficits detected', {
        datasetId: dataset.id,
        deficits,
      });

      this.metrics.deficitsDetected++;

      // Publish deficit detected event
      if (this.eventProducer) {
        await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
          type: 'rba.deficit.detected',
          source: 'agent-rba',
          payload: {
            agent_id: this.agentId,
            dataset_id: dataset.id,
            policy_id: policy.id,
            deficits,
          },
        });
      }

      // Create alert
      await prisma.alert.create({
        data: {
          project_id: policy.project_id,
          severity: 'warning',
          summary: `Dataset ${dataset.cid} has replica deficits`,
          details: {
            dataset_id: dataset.id,
            dataset_cid: dataset.cid,
            policy_id: policy.id,
            deficits,
          },
          status: 'open',
        },
      });

      // Propose actions to fix deficits
      await this.proposeActionsForDeficits(dataset, policy, deficits);
    } else {
      logger.debug('Dataset is compliant', {
        datasetId: dataset.id,
      });
    }
  }

  /**
   * Propose actions to fix replica deficits
   */
  private async proposeActionsForDeficits(
    dataset: any,
    policy: any,
    deficits: ReplicaDeficit[]
  ): Promise<void> {
    const policyDoc = policy.doc as any;
    let actionsProposed = 0;

    for (const deficit of deficits) {
      // Limit actions per run
      if (actionsProposed >= this.config.maxActionsPerRun) {
        logger.warn('Max actions per run reached', {
          maxActions: this.config.maxActionsPerRun,
        });
        break;
      }

      // Find best providers in the deficit region
      try {
        const providers = await this.integrations.findBestProviders({
          region: deficit.region,
          minAvailability: policyDoc.availability_target || 0.99,
          maxPrice: policyDoc.cost_ceiling_usd_per_TiB_month || 1000,
          limit: deficit.deficit,
        });

        if (providers.length === 0) {
          logger.warn('No suitable providers found', {
            region: deficit.region,
          });
          continue;
        }

        // Create action proposals
        for (let i = 0; i < Math.min(deficit.deficit, providers.length); i++) {
          const provider = providers[i];

          const action = await prisma.action.create({
            data: {
              agent_id: this.agentId,
              dataset_id: dataset.id,
              type: ActionType.CREATE_DEAL,
              status: ActionStatus.PROPOSED,
              metadata: {
                region: deficit.region,
                provider_id: provider.providerId,
                estimated_cost: provider.priceUsdPerTiBMonth,
                reason: `Replica deficit in ${deficit.region}: ${deficit.current}/${deficit.required}`,
                dataset_cid: dataset.cid,
                dataset_size: dataset.size_bytes,
              },
            },
          });

          actionsProposed++;
          this.metrics.actionsProposed++;

          logger.info('Action proposed', {
            actionId: action.id,
            type: action.type,
            region: deficit.region,
            providerId: provider.providerId,
          });

          // Publish action proposed event
          if (this.eventProducer) {
            await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
              type: 'rba.action.proposed',
              source: 'agent-rba',
              payload: {
                agent_id: this.agentId,
                action_id: action.id,
                dataset_id: dataset.id,
                action_type: action.type,
                region: deficit.region,
                provider_id: provider.providerId,
              },
            });
          }

          // If auto-execute is enabled, execute immediately
          if (this.config.autoExecute) {
            await this.executeAction(action.id);
          }
        }
      } catch (error) {
        logger.error('Error proposing actions', {
          region: deficit.region,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Execute an action
   */
  async executeAction(actionId: string): Promise<void> {
    logger.info('Executing action', { actionId });

    const action = await prisma.action.findUnique({
      where: { id: actionId },
      include: { dataset: true },
    });

    if (!action) {
      throw new AppError('Action not found', 404, 'ACTION_NOT_FOUND');
    }

    if (action.status !== ActionStatus.PROPOSED && action.status !== ActionStatus.APPROVED) {
      throw new AppError('Action is not in executable state', 400, 'ACTION_NOT_EXECUTABLE');
    }

    // Update status to executing
    await prisma.action.update({
      where: { id: actionId },
      data: {
        status: ActionStatus.EXECUTING,
      },
    });

    try {
      const metadata = action.metadata as any;

      if (action.type === ActionType.CREATE_DEAL) {
        // Create deal via Synapse SDK
        const dealResult = await this.integrations.synapse.createDeal({
          dataCid: metadata.dataset_cid,
          providerId: metadata.provider_id,
          duration: 180, // 180 days default
          price: '50', // Mock price
          collateral: '100', // Mock collateral
          verified: true,
        });

        // Create deal record in database
        await prisma.deal.create({
          data: {
            dataset_id: action.dataset_id,
            provider_id: metadata.provider_id,
            region: metadata.region,
            deal_id: dealResult.dealId,
            start_at: new Date(),
            expiry_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            status: 'active',
            price_fil: '50',
            collateral_fil: '100',
          },
        });

        // Update action status to completed
        await prisma.action.update({
          where: { id: actionId },
          data: {
            status: ActionStatus.COMPLETED,
            executed_at: new Date(),
            result: {
              deal_id: dealResult.dealId,
              tx_hash: dealResult.txHash,
            },
          },
        });

        this.metrics.actionsExecuted++;
        this.metrics.actionsSucceeded++;

        logger.info('Action executed successfully', {
          actionId,
          dealId: dealResult.dealId,
        });

        // Publish action executed event
        if (this.eventProducer) {
          await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
            type: 'rba.action.executed',
            source: 'agent-rba',
            payload: {
              agent_id: this.agentId,
              action_id: actionId,
              deal_id: dealResult.dealId,
              tx_hash: dealResult.txHash,
            },
          });
        }
      }
    } catch (error) {
      logger.error('Error executing action', {
        actionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update action status to failed
      await prisma.action.update({
        where: { id: actionId },
        data: {
          status: ActionStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      this.metrics.actionsExecuted++;
      this.metrics.actionsFailed++;

      // Publish action failed event
      if (this.eventProducer) {
        await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
          type: 'rba.action.failed',
          source: 'agent-rba',
          payload: {
            agent_id: this.agentId,
            action_id: actionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      throw error;
    }
  }

  /**
   * Approve an action
   */
  async approveAction(actionId: string): Promise<void> {
    logger.info('Approving action', { actionId });

    const action = await prisma.action.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new AppError('Action not found', 404, 'ACTION_NOT_FOUND');
    }

    if (action.status !== ActionStatus.PROPOSED) {
      throw new AppError('Action is not in proposed state', 400, 'ACTION_NOT_PROPOSED');
    }

    // Update status to approved
    await prisma.action.update({
      where: { id: actionId },
      data: {
        status: ActionStatus.APPROVED,
      },
    });

    // Publish action approved event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.AGENTS_ACTIONS, {
        type: 'rba.action.approved',
        source: 'agent-rba',
        payload: {
          agent_id: this.agentId,
          action_id: actionId,
        },
      });
    }

    // Execute the action
    await this.executeAction(actionId);
  }

  /**
   * Reject an action
   */
  async rejectAction(actionId: string, reason?: string): Promise<void> {
    logger.info('Rejecting action', { actionId, reason });

    const action = await prisma.action.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new AppError('Action not found', 404, 'ACTION_NOT_FOUND');
    }

    if (action.status !== ActionStatus.PROPOSED) {
      throw new AppError('Action is not in proposed state', 400, 'ACTION_NOT_PROPOSED');
    }

    // Update status to rejected
    await prisma.action.update({
      where: { id: actionId },
      data: {
        status: ActionStatus.REJECTED,
        error: reason,
      },
    });
  }

  /**
   * Get agent metrics
   */
  getMetrics(): RBAMetrics {
    return { ...this.metrics };
  }

  /**
   * Send heartbeat to orchestrator
   */
  private async sendHeartbeat(): Promise<void> {
    const heartbeat: AgentHeartbeat = {
      agentId: this.agentId,
      timestamp: new Date(),
      status: this.running ? AgentStatus.RUNNING : AgentStatus.STOPPED,
      metrics: {
        actionsProposed: this.metrics.actionsProposed,
        actionsExecuted: this.metrics.actionsExecuted,
        errorCount: this.metrics.actionsFailed,
      },
    };

    await this.orchestrator.recordHeartbeat(heartbeat);
  }
}
