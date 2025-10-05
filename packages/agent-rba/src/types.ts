import { z } from 'zod';

/**
 * Action types that RBA can propose/execute
 */
export enum ActionType {
  CREATE_DEAL = 'create_deal',
  UPGRADE_SECTOR = 'upgrade_sector',
}

/**
 * Action status
 */
export enum ActionStatus {
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REJECTED = 'rejected',
}

/**
 * Replica deficit for a region
 */
export interface ReplicaDeficit {
  region: string;
  required: number;
  current: number;
  deficit: number;
}

/**
 * Action proposal
 */
export interface ActionProposal {
  id: string;
  agentId: string;
  datasetId: string;
  type: ActionType;
  status: ActionStatus;
  region: string;
  providerId?: string;
  estimatedCost?: number;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  executedAt?: Date;
  result?: Record<string, unknown>;
  error?: string;
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  datasetId: string;
  policyId: string;
  compliant: boolean;
  deficits: ReplicaDeficit[];
  totalReplicas: number;
  requiredReplicas: number;
  checkedAt: Date;
}

/**
 * RBA metrics
 */
export interface RBAMetrics {
  checksPerformed: number;
  deficitsDetected: number;
  actionsProposed: number;
  actionsExecuted: number;
  actionsSucceeded: number;
  actionsFailed: number;
  lastCheckAt?: Date;
}

/**
 * Deal creation parameters
 */
export interface DealCreationParams {
  datasetId: string;
  dataCid: string;
  providerId: string;
  region: string;
  duration: number;
  price: string;
  collateral: string;
  verified: boolean;
}
