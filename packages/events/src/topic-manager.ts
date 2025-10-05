import { getKafkaClient } from './kafka-client';
import { TOPIC_CONFIGS, TopicConfig } from './topics';
import { createLogger } from '@filops/common';

const logger = createLogger({
  service: 'topic-manager',
  level: process.env.LOG_LEVEL || 'info',
});

export class TopicManager {
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor(kafkaClient?: ReturnType<typeof getKafkaClient>) {
    this.kafkaClient = kafkaClient || getKafkaClient();
  }

  /**
   * Create all FilOps topics
   */
  async createTopics(configs: TopicConfig[] = TOPIC_CONFIGS): Promise<void> {
    const admin = await this.kafkaClient.getAdmin();

    try {
      const existingTopics = await admin.listTopics();
      const topicsToCreate = configs.filter((config) => !existingTopics.includes(config.topic));

      if (topicsToCreate.length === 0) {
        logger.info('All topics already exist');
        return;
      }

      await admin.createTopics({
        topics: topicsToCreate.map((config) => ({
          topic: config.topic,
          numPartitions: config.numPartitions || 1,
          replicationFactor: config.replicationFactor || 1,
          configEntries: config.configEntries,
        })),
      });

      logger.info('Topics created', {
        count: topicsToCreate.length,
        topics: topicsToCreate.map((c) => c.topic),
      });
    } catch (error) {
      logger.error('Failed to create topics', { error });
      throw error;
    }
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<string[]> {
    const admin = await this.kafkaClient.getAdmin();
    return admin.listTopics();
  }

  /**
   * Delete topics (use with caution!)
   */
  async deleteTopics(topics: string[]): Promise<void> {
    const admin = await this.kafkaClient.getAdmin();

    try {
      await admin.deleteTopics({
        topics,
      });

      logger.info('Topics deleted', { topics });
    } catch (error) {
      logger.error('Failed to delete topics', { topics, error });
      throw error;
    }
  }

  /**
   * Get topic metadata
   */
  async getTopicMetadata(topics: string[]): Promise<any> {
    const admin = await this.kafkaClient.getAdmin();
    return admin.fetchTopicMetadata({ topics });
  }
}
