import { randomUUID } from 'crypto';
import { getKafkaClient } from './kafka-client';
import { TopicName } from './topics';
import { FilOpsEvent, validateEvent } from './schemas';
import { createLogger } from '@filops/common';

const logger = createLogger({
  service: 'event-producer',
  level: process.env.LOG_LEVEL || 'info',
});

export interface ProduceOptions {
  key?: string;
  partition?: number;
  headers?: Record<string, string>;
}

export class EventProducer {
  private kafkaClient: ReturnType<typeof getKafkaClient>;

  constructor(kafkaClient?: ReturnType<typeof getKafkaClient>) {
    this.kafkaClient = kafkaClient || getKafkaClient();
  }

  /**
   * Publish an event to a Kafka topic
   */
  async publish(
    topic: TopicName,
    event: Omit<FilOpsEvent, 'id' | 'timestamp' | 'version'> & {
      id?: string;
      timestamp?: string;
      version?: string;
    },
    options?: ProduceOptions,
  ): Promise<void> {
    // Add default fields
    const fullEvent: FilOpsEvent = {
      id: event.id || randomUUID(),
      timestamp: event.timestamp || new Date().toISOString(),
      version: event.version || '1.0',
      ...event,
    } as FilOpsEvent;

    // Validate event
    try {
      validateEvent(fullEvent);
    } catch (error) {
      logger.error('Event validation failed', { event: fullEvent, error });
      throw error;
    }

    // Publish to Kafka
    const producer = await this.kafkaClient.getProducer();

    try {
      await producer.send({
        topic,
        messages: [
          {
            key: options?.key || fullEvent.id,
            value: JSON.stringify(fullEvent),
            partition: options?.partition,
            headers: options?.headers,
          },
        ],
      });

      logger.debug('Event published', {
        topic,
        eventId: fullEvent.id,
        eventType: fullEvent.type,
      });
    } catch (error) {
      logger.error('Failed to publish event', {
        topic,
        event: fullEvent,
        error,
      });
      throw error;
    }
  }

  /**
   * Publish multiple events in a batch
   */
  async publishBatch(
    topic: TopicName,
    events: Array<Omit<FilOpsEvent, 'id' | 'timestamp' | 'version'>>,
    options?: ProduceOptions,
  ): Promise<void> {
    const producer = await this.kafkaClient.getProducer();

    const messages = events.map((event) => {
      const fullEvent: FilOpsEvent = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        ...event,
      } as FilOpsEvent;

      // Validate
      validateEvent(fullEvent);

      return {
        key: options?.key || fullEvent.id,
        value: JSON.stringify(fullEvent),
        partition: options?.partition,
        headers: options?.headers,
      };
    });

    try {
      await producer.send({
        topic,
        messages,
      });

      logger.debug('Batch events published', {
        topic,
        count: messages.length,
      });
    } catch (error) {
      logger.error('Failed to publish batch events', {
        topic,
        count: events.length,
        error,
      });
      throw error;
    }
  }

  /**
   * Disconnect producer
   */
  async disconnect(): Promise<void> {
    await this.kafkaClient.disconnect();
  }
}
