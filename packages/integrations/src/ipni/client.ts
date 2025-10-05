import axios, { AxiosInstance } from 'axios';
import { createLogger } from '@filops/common';
import { IPNIConfig, ProviderRecord, MultihashResult } from './types';

const logger = createLogger({
  service: 'ipni-client',
  level: process.env.LOG_LEVEL || 'info',
});

export class IPNIClient {
  private config: IPNIConfig;
  private client: AxiosInstance;

  constructor(config: IPNIConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('IPNI client initialized', { apiUrl: config.apiUrl });
  }

  /**
   * Find providers that have a specific CID
   */
  async findProviders(cid: string): Promise<ProviderRecord[]> {
    logger.info('Finding providers for CID', { cid });

    try {
      // TODO: Replace with actual IPNI API call
      // const response = await this.client.get(`/cid/${cid}`);
      // return response.data.providers;

      // Mock implementation
      const mockProviders: ProviderRecord[] = [
        {
          providerId: 'f01234',
          metadata: {
            protocols: ['filecoin', 'bitswap'],
            addresses: [
              '/ip4/1.2.3.4/tcp/1234',
              '/ip6/::1/tcp/1234',
            ],
          },
          lastAdvertisement: new Date().toISOString(),
          contextId: 'context-123',
        },
        {
          providerId: 'f05678',
          metadata: {
            protocols: ['filecoin'],
            addresses: ['/ip4/5.6.7.8/tcp/5678'],
          },
          lastAdvertisement: new Date().toISOString(),
          contextId: 'context-456',
        },
      ];

      logger.info('Found providers', { cid, count: mockProviders.length });
      return mockProviders;
    } catch (error: any) {
      logger.error('Failed to find providers', { error: error.message, cid });
      throw new Error(`Failed to find providers: ${error.message}`);
    }
  }

  /**
   * Check if a specific provider has a CID
   */
  async hasProvider(cid: string, providerId: string): Promise<boolean> {
    logger.debug('Checking if provider has CID', { cid, providerId });

    try {
      const providers = await this.findProviders(cid);
      const hasProvider = providers.some((p) => p.providerId === providerId);
      
      logger.debug('Provider check result', { cid, providerId, hasProvider });
      return hasProvider;
    } catch (error: any) {
      logger.error('Failed to check provider', { error: error.message, cid, providerId });
      return false;
    }
  }

  /**
   * Get all providers for multiple CIDs
   */
  async findProvidersForMultipleCids(cids: string[]): Promise<Map<string, ProviderRecord[]>> {
    logger.info('Finding providers for multiple CIDs', { count: cids.length });

    const results = new Map<string, ProviderRecord[]>();

    await Promise.all(
      cids.map(async (cid) => {
        try {
          const providers = await this.findProviders(cid);
          results.set(cid, providers);
        } catch (error) {
          logger.warn('Failed to find providers for CID', { cid });
          results.set(cid, []);
        }
      }),
    );

    return results;
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(providerId: string): Promise<{
    totalCids: number;
    lastSeen: string;
  }> {
    logger.debug('Getting provider stats', { providerId });

    try {
      // TODO: Replace with actual IPNI API call
      // Mock implementation
      return {
        totalCids: Math.floor(Math.random() * 10000),
        lastSeen: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to get provider stats', { error: error.message, providerId });
      throw new Error(`Failed to get provider stats: ${error.message}`);
    }
  }
}
