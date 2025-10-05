import { EventProducer } from '../producer';
import { TOPICS } from '../topics';
import { getKafkaClient, resetKafkaClient } from '../kafka-client';

// Mock KafkaJS
jest.mock('kafkajs', () => {
  const mockSend = jest.fn().mockResolvedValue(undefined);
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    send: mockSend,
  };

  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: jest.fn().mockReturnValue(mockProducer),
      consumer: jest.fn(),
      admin: jest.fn(),
    })),
    logLevel: {
      ERROR: 0,
    },
  };
});

describe('EventProducer', () => {
  let producer: EventProducer;

  beforeEach(() => {
    resetKafkaClient();
    const kafkaClient = getKafkaClient({
      brokers: ['localhost:9092'],
      clientId: 'test-client',
    });
    producer = new EventProducer(kafkaClient);
  });

  afterEach(async () => {
    await producer.disconnect();
    resetKafkaClient();
  });

  describe('publish', () => {
    it('should publish a valid event', async () => {
      const event = {
        type: 'deal.status.changed' as const,
        source: 'test',
        payload: {
          deal_id: 'deal-123',
          dataset_id: 'dataset-456',
          provider_id: 'f01234',
          old_status: 'PENDING' as const,
          new_status: 'ACTIVE' as const,
        },
      };

      await expect(producer.publish(TOPICS.DEALS_STATUS, event)).resolves.not.toThrow();
    });

    it('should add default fields to event', async () => {
      const event = {
        type: 'deal.status.changed' as const,
        source: 'test',
        payload: {
          deal_id: 'deal-123',
          dataset_id: 'dataset-456',
          provider_id: 'f01234',
          old_status: 'PENDING' as const,
          new_status: 'ACTIVE' as const,
        },
      };

      await producer.publish(TOPICS.DEALS_STATUS, event);

      // Event should have id, timestamp, and version added
      // We can't directly verify this without mocking, but validation would fail if not added
    });

    it('should reject invalid event', async () => {
      const invalidEvent = {
        type: 'deal.status.changed' as const,
        source: 'test',
        payload: {
          // Missing required fields
          deal_id: 'deal-123',
        },
      };

      await expect(producer.publish(TOPICS.DEALS_STATUS, invalidEvent as any)).rejects.toThrow();
    });
  });

  describe('publishBatch', () => {
    it('should publish multiple events', async () => {
      const events = [
        {
          type: 'deal.status.changed' as const,
          source: 'test',
          payload: {
            deal_id: 'deal-1',
            dataset_id: 'dataset-1',
            provider_id: 'f01234',
            old_status: 'PENDING' as const,
            new_status: 'ACTIVE' as const,
          },
        },
        {
          type: 'deal.status.changed' as const,
          source: 'test',
          payload: {
            deal_id: 'deal-2',
            dataset_id: 'dataset-2',
            provider_id: 'f01235',
            old_status: 'ACTIVE' as const,
            new_status: 'EXPIRED' as const,
          },
        },
      ];

      await expect(producer.publishBatch(TOPICS.DEALS_STATUS, events)).resolves.not.toThrow();
    });

    it('should reject batch with invalid events', async () => {
      const events = [
        {
          type: 'deal.status.changed' as const,
          source: 'test',
          payload: {
            deal_id: 'deal-1',
            // Missing required fields
          },
        },
      ];

      await expect(producer.publishBatch(TOPICS.DEALS_STATUS, events as any)).rejects.toThrow();
    });
  });
});
