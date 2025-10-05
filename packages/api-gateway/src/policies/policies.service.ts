import { Injectable, OnModuleInit } from '@nestjs/common';
import { PolicyService } from '@filops/policy-engine';
import { EventProducer, getKafkaClient } from '@filops/events';

@Injectable()
export class PoliciesService implements OnModuleInit {
  private policyService: PolicyService;

  constructor() {
    // Initialize with a mock producer for now (will be replaced in onModuleInit)
    this.policyService = new PolicyService();
  }

  onModuleInit() {
    // Initialize Kafka client if environment variables are set
    if (process.env.KAFKA_BROKERS) {
      try {
        const kafkaClient = getKafkaClient({
          brokers: process.env.KAFKA_BROKERS.split(','),
          clientId: process.env.KAFKA_CLIENT_ID || 'filops-api-gateway',
          groupId: process.env.KAFKA_GROUP_ID || 'filops-api-gateway-group',
        });
        const eventProducer = new EventProducer(kafkaClient);
        this.policyService = new PolicyService(eventProducer);
      } catch (error) {
        console.warn('Kafka not available, using mock event producer');
      }
    }
  }

  getPolicyService(): PolicyService {
    return this.policyService;
  }
}
