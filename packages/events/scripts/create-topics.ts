#!/usr/bin/env tsx

import { getKafkaClient, TopicManager, TOPIC_CONFIGS } from '../src';

async function main() {
  console.log('🚀 Creating Kafka topics for FilOps...\n');

  const kafkaClient = getKafkaClient({
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'filops-topic-manager',
  });

  const topicManager = new TopicManager(kafkaClient);

  try {
    // List existing topics
    console.log('📋 Listing existing topics...');
    const existingTopics = await topicManager.listTopics();
    console.log(`Found ${existingTopics.length} existing topics\n`);

    // Create topics
    console.log('✨ Creating FilOps topics...');
    await topicManager.createTopics(TOPIC_CONFIGS);

    // List topics again
    const allTopics = await topicManager.listTopics();
    const filopsTopics = allTopics.filter((t) => t.startsWith('filops.'));

    console.log(`\n✅ Success! ${filopsTopics.length} FilOps topics ready:`);
    filopsTopics.forEach((topic) => console.log(`  - ${topic}`));
  } catch (error) {
    console.error('❌ Failed to create topics:', error);
    process.exit(1);
  } finally {
    await kafkaClient.disconnect();
  }
}

main();
