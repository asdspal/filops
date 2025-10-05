import { Kafka, Producer, Consumer, Admin, KafkaConfig, logLevel } from 'kafkajs';
import { createLogger } from '@filops/common';

const logger = createLogger({
  service: 'kafka-client',
  level: process.env.LOG_LEVEL || 'info',
});

export interface KafkaClientConfig {
  brokers: string[];
  clientId: string;
  groupId?: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

export class KafkaClient {
  private kafka: Kafka;
  private producer?: Producer;
  private consumer?: Consumer;
  private admin?: Admin;
  private config: KafkaClientConfig;

  constructor(config: KafkaClientConfig) {
    this.config = config;

    const kafkaConfig: KafkaConfig = {
      clientId: config.clientId,
      brokers: config.brokers,
      logLevel: logLevel.ERROR,
    };

    if (config.ssl) {
      kafkaConfig.ssl = true;
    }

    if (config.sasl) {
      kafkaConfig.sasl = config.sasl as any;
    }

    this.kafka = new Kafka(kafkaConfig);
    logger.info('Kafka client initialized', {
      clientId: config.clientId,
      brokers: config.brokers,
    });
  }

  // Get or create producer
  async getProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000,
      });

      await this.producer.connect();
      logger.info('Kafka producer connected');
    }

    return this.producer;
  }

  // Get or create consumer
  async getConsumer(): Promise<Consumer> {
    if (!this.consumer) {
      if (!this.config.groupId) {
        throw new Error('groupId is required for consumer');
      }

      this.consumer = this.kafka.consumer({
        groupId: this.config.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await this.consumer.connect();
      logger.info('Kafka consumer connected', { groupId: this.config.groupId });
    }

    return this.consumer;
  }

  // Get or create admin client
  async getAdmin(): Promise<Admin> {
    if (!this.admin) {
      this.admin = this.kafka.admin();
      await this.admin.connect();
      logger.info('Kafka admin connected');
    }

    return this.admin;
  }

  // Disconnect all clients
  async disconnect(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.producer) {
      promises.push(this.producer.disconnect());
    }

    if (this.consumer) {
      promises.push(this.consumer.disconnect());
    }

    if (this.admin) {
      promises.push(this.admin.disconnect());
    }

    await Promise.all(promises);
    logger.info('Kafka client disconnected');
  }

  // Check if connected
  isConnected(): boolean {
    return !!(this.producer || this.consumer || this.admin);
  }
}

// Singleton instance
let kafkaClient: KafkaClient | null = null;

export function getKafkaClient(config?: KafkaClientConfig): KafkaClient {
  if (!kafkaClient && config) {
    kafkaClient = new KafkaClient(config);
  }

  if (!kafkaClient) {
    throw new Error('Kafka client not initialized. Provide config on first call.');
  }

  return kafkaClient;
}

export function resetKafkaClient(): void {
  kafkaClient = null;
}
