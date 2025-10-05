import { EachMessagePayload } from 'kafkajs';
import { getKafkaClient } from './kafka-client';
import { TopicName } from './topics';
import { FilOpsEvent, validateEvent } from './schemas';
import { createLogger } from '@filops/common';

const logger = createLogger({
  service: 'event-consumer',
  level: process.env.LOG_LEVEL || 'info',
});

export type EventHandler = (event: FilOpsEvent, context: EachMessagePayload) => Promise<void>;

export interface ConsumerOptions {
  topics: TopicName[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
}

export class EventConsumer {
  private kafkaClient: ReturnType<typeof getKafkaClient>;
  private handlers: Map<string, EventHandler[]> = new Map();
  private running = false;

  constructor(kafkaClient?: ReturnType<typeof getKafkaClient>) {
    this.kafkaClient = kafkaClient || getKafkaClient();
  }

  /**
   * Register a handler for a specific event type
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    logger.debug('Handler registered', { eventType });
  }

  /**
   * Register a handler for all events
   */
  onAny(handler: EventHandler): void {
    this.on('*', handler);
  }

  /**
   * Start consuming events
   */
  async start(options: ConsumerOptions): Promise<void> {
    if (this.running) {
      logger.warn('Consumer already running');
      return;
    }

    const consumer = await this.kafkaClient.getConsumer();

    // Subscribe to topics
    await consumer.subscribe({
      topics: options.topics,
      fromBeginning: options.fromBeginning ?? false,
    });

    logger.info('Consumer subscribed to topics', { topics: options.topics });

    this.running = true;

    // Start consuming
    await consumer.run({
      autoCommit: options.autoCommit ?? true,
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    logger.info('Consumer started');
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      // Parse message
      const eventData = JSON.parse(message.value?.toString() || '{}');

      // Validate event
      const event = validateEvent(eventData);

      logger.debug('Event received', {
        topic,
        partition,
        offset: message.offset,
        eventId: event.id,
        eventType: event.type,
      });

      // Get handlers for this event type
      const specificHandlers = this.handlers.get(event.type) || [];
      const wildcardHandlers = this.handlers.get('*') || [];
      const allHandlers = [...specificHandlers, ...wildcardHandlers];

      if (allHandlers.length === 0) {
        logger.warn('No handlers registered for event type', { eventType: event.type });
        return;
      }

      // Execute handlers
      await Promise.all(
        allHandlers.map(async (handler) => {
          try {
            await handler(event, payload);
          } catch (error) {
            logger.error('Handler failed', {
              eventType: event.type,
              eventId: event.id,
              error,
            });
            throw error; // Re-throw to trigger retry/DLQ
          }
        }),
      );

      logger.debug('Event processed successfully', {
        eventId: event.id,
        eventType: event.type,
        handlerCount: allHandlers.length,
      });
    } catch (error) {
      logger.error('Failed to process message', {
        topic,
        partition,
        offset: message.offset,
        error,
      });
      throw error; // Let Kafka handle retry
    }
  }

  /**
   * Stop consuming
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    await this.kafkaClient.disconnect();
    logger.info('Consumer stopped');
  }

  /**
   * Check if consumer is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
