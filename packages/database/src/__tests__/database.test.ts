import { getPrismaClient } from '../index';

describe('Database', () => {
  let prisma: ReturnType<typeof getPrismaClient>;

  beforeAll(() => {
    prisma = getPrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
  });

  it('should return singleton instance', () => {
    const prisma1 = getPrismaClient();
    const prisma2 = getPrismaClient();
    expect(prisma1).toBe(prisma2);
  });

  describe('User model', () => {
    it('should create a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          role: 'DEVELOPER',
        },
      });

      expect(user.id).toBeDefined();
      expect(user.email).toContain('test-');
      expect(user.role).toBe('DEVELOPER');

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should enforce unique email constraint', async () => {
      const email = `unique-${Date.now()}@example.com`;
      
      await prisma.user.create({
        data: { email, role: 'DEVELOPER' },
      });

      await expect(
        prisma.user.create({
          data: { email, role: 'DEVELOPER' },
        }),
      ).rejects.toThrow();

      // Cleanup
      await prisma.user.deleteMany({ where: { email } });
    });
  });

  describe('Project model', () => {
    it('should create a project with user relation', async () => {
      const user = await prisma.user.create({
        data: {
          email: `owner-${Date.now()}@example.com`,
          role: 'ADMIN',
        },
      });

      const project = await prisma.project.create({
        data: {
          ownerId: user.id,
          name: 'Test Project',
          description: 'A test project',
        },
      });

      expect(project.id).toBeDefined();
      expect(project.ownerId).toBe(user.id);

      // Cleanup
      await prisma.project.delete({ where: { id: project.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should cascade delete when user is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: `cascade-${Date.now()}@example.com`,
          role: 'ADMIN',
        },
      });

      const project = await prisma.project.create({
        data: {
          ownerId: user.id,
          name: 'Cascade Test',
        },
      });

      await prisma.user.delete({ where: { id: user.id } });

      const deletedProject = await prisma.project.findUnique({
        where: { id: project.id },
      });

      expect(deletedProject).toBeNull();
    });
  });

  describe('Policy model', () => {
    it('should create a policy with JSON document', async () => {
      const user = await prisma.user.create({
        data: {
          email: `policy-test-${Date.now()}@example.com`,
          role: 'ADMIN',
        },
      });

      const project = await prisma.project.create({
        data: {
          ownerId: user.id,
          name: 'Policy Test Project',
        },
      });

      const policyDoc = {
        replication: {
          regions: [{ code: 'NA', min_replicas: 2 }],
        },
        availability_target: 0.99,
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

      const policy = await prisma.policy.create({
        data: {
          projectId: project.id,
          name: 'Test Policy',
          version: 1,
          docJson: policyDoc,
          active: true,
        },
      });

      expect(policy.id).toBeDefined();
      expect(policy.docJson).toEqual(policyDoc);
      expect(policy.active).toBe(true);

      // Cleanup
      await prisma.policy.delete({ where: { id: policy.id } });
      await prisma.project.delete({ where: { id: project.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
