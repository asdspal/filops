import { prisma } from '@filops/database';
import { EventProducer, TOPICS } from '@filops/events';
import { createLogger, NotFoundError, ValidationError, ConflictError } from '@filops/common';
import { PolicyValidator } from './validator';
import {
  CreatePolicyInput,
  UpdatePolicyInput,
  PolicyDocument,
  PolicyValidationResult,
  PolicyComplianceStatus,
  CreatePolicyInputSchema,
  UpdatePolicyInputSchema,
} from './types';

const logger = createLogger({
  service: 'policy-service',
  level: process.env.LOG_LEVEL || 'info',
});

export class PolicyService {
  private validator: PolicyValidator;
  private eventProducer?: EventProducer;

  constructor(eventProducer?: EventProducer) {
    this.validator = new PolicyValidator();
    this.eventProducer = eventProducer;
  }

  /**
   * Create a new policy
   */
  async create(input: CreatePolicyInput, actorId: string): Promise<any> {
    // Validate input
    const validated = CreatePolicyInputSchema.parse(input);

    // Validate policy document
    const validationResult = this.validator.validate(validated.doc);
    if (!validationResult.valid) {
      throw new ValidationError('Policy validation failed', {
        errors: validationResult.errors,
        conflicts: validationResult.conflicts,
      });
    }

    // Check for conflicts with existing policies
    const existingPolicies = await prisma.policy.findMany({
      where: { projectId: validated.project_id },
    });

    const conflicts = await this.validator.checkConflicts(
      validated.doc,
      validated.project_id,
      existingPolicies.map((p: any) => ({
        id: p.id,
        doc_json: p.docJson,
        active: p.active,
      })),
    );

    // Block if there are error-level conflicts
    const errorConflicts = conflicts.filter((c) => c.severity === 'error');
    if (errorConflicts.length > 0) {
      throw new ConflictError('Policy has conflicts', { conflicts: errorConflicts });
    }

    // Create policy
    const policy = await prisma.policy.create({
      data: {
        projectId: validated.project_id,
        name: validated.name,
        version: 1,
        docJson: validated.doc as any,
        active: validated.active,
      },
      include: {
        project: true,
      },
    });

    logger.info('Policy created', {
      policyId: policy.id,
      projectId: policy.projectId,
      name: policy.name,
    });

    // Publish event (if event producer is available)
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.POLICIES_UPDATES, {
        type: 'policy.created',
        source: 'policy-service',
        payload: {
          policy_id: policy.id,
          project_id: policy.projectId,
          name: policy.name,
          version: policy.version,
          active: policy.active,
          actor_id: actorId,
        },
      });
    }

    return policy;
  }

  /**
   * Get policy by ID
   */
  async getById(policyId: string): Promise<any> {
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        project: true,
        agents: true,
      },
    });

    if (!policy) {
      throw new NotFoundError('Policy', policyId);
    }

    return policy;
  }

  /**
   * List policies for a project
   */
  async listByProject(projectId: string, activeOnly = false): Promise<any[]> {
    return prisma.policy.findMany({
      where: {
        projectId,
        ...(activeOnly && { active: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        project: true,
      },
    });
  }

  /**
   * Update policy
   */
  async update(policyId: string, input: UpdatePolicyInput, actorId: string): Promise<any> {
    // Validate input
    const validated = UpdatePolicyInputSchema.parse(input);

    // Get existing policy
    const existing = await this.getById(policyId);

    // If updating document, validate it
    if (validated.doc) {
      const validationResult = this.validator.validate(validated.doc);
      if (!validationResult.valid) {
        throw new ValidationError('Policy validation failed', {
          errors: validationResult.errors,
          conflicts: validationResult.conflicts,
        });
      }
    }

    // Determine what changed
    const changes: string[] = [];
    if (validated.name && validated.name !== existing.name) {
      changes.push('name');
    }
    if (validated.doc) {
      changes.push('document');
    }
    if (validated.active !== undefined && validated.active !== existing.active) {
      changes.push('active');
    }

    // Update policy
    const updated = await prisma.policy.update({
      where: { id: policyId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.doc && { docJson: validated.doc as any }),
        ...(validated.active !== undefined && { active: validated.active }),
      },
      include: {
        project: true,
      },
    });

    logger.info('Policy updated', {
      policyId: updated.id,
      changes,
    });

    // Publish event (if event producer is available)
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.POLICIES_UPDATES, {
        type: 'policy.updated',
        source: 'policy-service',
        payload: {
          policy_id: updated.id,
          project_id: updated.projectId,
          name: updated.name,
          version: updated.version,
          active: updated.active,
          changes,
          actor_id: actorId,
        },
      });
    }

    return updated;
  }

  /**
   * Activate policy
   */
  async activate(policyId: string, actorId: string) {
    const policy = await this.getById(policyId);

    if (policy.active) {
      return policy; // Already active
    }

    const updated = await prisma.policy.update({
      where: { id: policyId },
      data: { active: true },
      include: { project: true },
    });

    logger.info('Policy activated', { policyId });

    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.POLICIES_UPDATES, {
        type: 'policy.activated',
        source: 'policy-service',
        payload: {
          policy_id: updated.id,
          project_id: updated.projectId,
          name: updated.name,
          version: updated.version,
          active: true,
          actor_id: actorId,
        },
      });
    }

    return updated;
  }

  /**
   * Deactivate policy
   */
  async deactivate(policyId: string, actorId: string): Promise<any> {
    const policy = await this.getById(policyId);

    if (!policy.active) {
      return policy; // Already inactive
    }

    const updated = await prisma.policy.update({
      where: { id: policyId },
      data: { active: false },
      include: { project: true },
    });

    logger.info('Policy deactivated', { policyId });

    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.POLICIES_UPDATES, {
        type: 'policy.deactivated',
        source: 'policy-service',
        payload: {
          policy_id: updated.id,
          project_id: updated.projectId,
          name: updated.name,
          version: updated.version,
          active: false,
          actor_id: actorId,
        },
      });
    }

    return updated;
  }

  /**
   * Delete policy
   */
  async delete(policyId: string) {
    const policy = await this.getById(policyId);

    // Check if policy has active agents
    const activeAgents = await prisma.agentInstance.count({
      where: {
        policyId,
        status: { in: ['RUNNING', 'CREATED'] },
      },
    });

    if (activeAgents > 0) {
      throw new ConflictError('Cannot delete policy with active agents', {
        active_agents: activeAgents,
      });
    }

    await prisma.policy.delete({
      where: { id: policyId },
    });

    logger.info('Policy deleted', { policyId });
  }

  /**
   * Validate policy document
   */
  validateDocument(doc: PolicyDocument): PolicyValidationResult {
    return this.validator.validate(doc);
  }

  /**
   * Get policy compliance status
   */
  async getComplianceStatus(policyId: string): Promise<PolicyComplianceStatus> {
    const policy = await this.getById(policyId);
    const doc = policy.docJson as PolicyDocument;

    // Get all deals for this project
    const deals = await prisma.deal.findMany({
      where: {
        dataset: {
          projectId: policy.projectId,
        },
        status: 'ACTIVE',
      },
      include: {
        dataset: true,
      },
    });

    // Calculate replica counts by region
    const regionCounts = new Map<string, number>();
    deals.forEach((deal: any) => {
      if (deal.region) {
        regionCounts.set(deal.region, (regionCounts.get(deal.region) || 0) + 1);
      }
    });

    // Check compliance for each region
    const regionStatus = doc.replication.regions.map((regionReq) => {
      const current = regionCounts.get(regionReq.code) || 0;
      return {
        region: regionReq.code,
        current,
        required: regionReq.min_replicas,
        compliant: current >= regionReq.min_replicas,
      };
    });

    const totalReplicas = deals.length;
    const requiredReplicas = doc.replication.regions.reduce(
      (sum, r) => sum + r.min_replicas,
      0,
    );

    // Calculate cost (simplified - would need actual pricing data)
    const currentCost = deals.reduce((sum: number, deal: any) => {
      return sum + (deal.price ? Number(deal.price) : 0);
    }, 0);

    return {
      policy_id: policyId,
      compliant: regionStatus.every((r) => r.compliant),
      total_replicas: totalReplicas,
      required_replicas: requiredReplicas,
      region_status: regionStatus,
      cost_status: {
        current_cost_usd: currentCost,
        ceiling_usd: doc.cost_ceiling_usd_per_TiB_month,
        within_budget: currentCost <= doc.cost_ceiling_usd_per_TiB_month,
      },
      last_checked: new Date().toISOString(),
    };
  }
}
