import { UserRole, AgentType, AgentStatus, AlertSeverity, AlertStatus, DealStatus } from '@prisma/client';

// Seed data for testing and development
export const seedUsers = [
  {
    email: 'admin@filops.io',
    walletAddress: '0x1234567890123456789012345678901234567890',
    role: UserRole.ADMIN,
  },
  {
    email: 'operator@filops.io',
    walletAddress: '0x2345678901234567890123456789012345678901',
    role: UserRole.OPERATOR,
  },
  {
    email: 'developer@filops.io',
    walletAddress: '0x3456789012345678901234567890123456789012',
    role: UserRole.DEVELOPER,
  },
];

export const createSeedProject = (ownerId: string) => ({
  ownerId,
  name: 'Demo Project',
  description: 'A demo project for testing FilOps functionality',
});

export const createSeedPolicy = (projectId: string) => ({
  projectId,
  name: 'Default Policy',
  version: 1,
  active: true,
  docJson: {
    replication: {
      regions: [
        { code: 'NA', min_replicas: 2 },
        { code: 'EU', min_replicas: 1 },
        { code: 'APAC', min_replicas: 1 },
      ],
      allowlist_providers: [],
      denylist_providers: [],
    },
    availability_target: 0.999,
    latency_targets_ms: {
      NA: 100,
      EU: 150,
      APAC: 200,
    },
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
  },
});

export const createSeedDataset = (projectId: string) => ({
  projectId,
  cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
  sizeBytes: BigInt(1024 * 1024 * 100), // 100 MB
  name: 'Sample Dataset',
  metadata: {
    description: 'A sample dataset for testing',
    tags: ['test', 'demo'],
  },
});

export const createSeedDeal = (datasetId: string) => ({
  datasetId,
  providerId: 'f01234',
  region: 'NA',
  startAt: new Date(),
  expiryAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
  status: DealStatus.ACTIVE,
  dealId: '12345',
  price: 50.0,
  collateral: 100.0,
  metadata: {
    miner: 'f01234',
    verified: true,
  },
});

export const createSeedAgent = (projectId: string, policyId: string) => ({
  type: AgentType.RBA,
  projectId,
  policyId,
  status: AgentStatus.RUNNING,
  config: {
    check_interval_seconds: 300,
    auto_execute: false,
  },
  lastHeartbeat: new Date(),
});

export const createSeedAlert = (projectId: string) => ({
  projectId,
  severity: AlertSeverity.WARNING,
  summary: 'Replica count below policy threshold',
  detailsJson: {
    policy_id: 'test-policy',
    current_replicas: 2,
    required_replicas: 4,
    region: 'APAC',
  },
  status: AlertStatus.OPEN,
  source: 'RBA',
});
