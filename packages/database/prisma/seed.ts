import { PrismaClient } from '@prisma/client';
import {
  seedUsers,
  createSeedProject,
  createSeedPolicy,
  createSeedDataset,
  createSeedDeal,
  createSeedAgent,
  createSeedAlert,
} from '../src/seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.agentAction.deleteMany();
  await prisma.agentInstance.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👤 Creating users...');
  const users = await Promise.all(
    seedUsers.map((userData) => prisma.user.create({ data: userData })),
  );
  console.log(`✅ Created ${users.length} users`);

  // Create project for first user (admin)
  console.log('📁 Creating project...');
  const project = await prisma.project.create({
    data: createSeedProject(users[0].id),
  });
  console.log(`✅ Created project: ${project.name}`);

  // Create policy
  console.log('📋 Creating policy...');
  const policy = await prisma.policy.create({
    data: createSeedPolicy(project.id),
  });
  console.log(`✅ Created policy: ${policy.name}`);

  // Create dataset
  console.log('💾 Creating dataset...');
  const dataset = await prisma.dataset.create({
    data: createSeedDataset(project.id),
  });
  console.log(`✅ Created dataset: ${dataset.cid}`);

  // Create deal
  console.log('🤝 Creating deal...');
  const deal = await prisma.deal.create({
    data: createSeedDeal(dataset.id),
  });
  console.log(`✅ Created deal: ${deal.id}`);

  // Create agent
  console.log('🤖 Creating agent...');
  const agent = await prisma.agentInstance.create({
    data: createSeedAgent(project.id, policy.id),
  });
  console.log(`✅ Created agent: ${agent.type}`);

  // Create alert
  console.log('🚨 Creating alert...');
  const alert = await prisma.alert.create({
    data: createSeedAlert(project.id),
  });
  console.log(`✅ Created alert: ${alert.summary}`);

  // Create audit log
  console.log('📝 Creating audit log...');
  await prisma.auditLog.create({
    data: {
      actorId: users[0].id,
      action: 'SEED_DATABASE',
      resource: 'DATABASE',
      metadata: {
        timestamp: new Date().toISOString(),
        items_created: {
          users: users.length,
          projects: 1,
          policies: 1,
          datasets: 1,
          deals: 1,
          agents: 1,
          alerts: 1,
        },
      },
    },
  });

  console.log('');
  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Projects: 1`);
  console.log(`  - Policies: 1`);
  console.log(`  - Datasets: 1`);
  console.log(`  - Deals: 1`);
  console.log(`  - Agents: 1`);
  console.log(`  - Alerts: 1`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
