import axios, { AxiosInstance } from 'axios';
import { createLogger } from '@filops/common';
import { GeoMgrConfig, ProviderLocation, RegionStats } from './types';

const logger = createLogger({
  service: 'geomgr-client',
  level: process.env.LOG_LEVEL || 'info',
});

export class GeoMgrClient {
  private config: GeoMgrConfig;
  private client: AxiosInstance;

  constructor(config: GeoMgrConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('GeoMgr client initialized', { apiUrl: config.apiUrl });
  }

  /**
   * Get geographic location for a provider
   */
  async getProviderLocation(providerId: string): Promise<ProviderLocation> {
    logger.debug('Getting provider location', { providerId });

    try {
      // TODO: Replace with actual Titan GeoMgr API call
      // const response = await this.client.get(`/providers/${providerId}/location`);
      // return response.data;

      // Mock implementation
      const mockLocation: ProviderLocation = {
        providerId,
        region: 'NA',
        country: 'US',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        lastUpdated: new Date().toISOString(),
      };

      logger.debug('Provider location retrieved', { providerId, region: mockLocation.region });
      return mockLocation;
    } catch (error: any) {
      logger.error('Failed to get provider location', { error: error.message, providerId });
      throw new Error(`Failed to get provider location: ${error.message}`);
    }
  }

  /**
   * Get all providers in a specific region
   */
  async getProvidersInRegion(region: string): Promise<ProviderLocation[]> {
    logger.info('Getting providers in region', { region });

    try {
      // TODO: Replace with actual Titan GeoMgr API call
      // const response = await this.client.get(`/regions/${region}/providers`);
      // return response.data;

      // Mock implementation
      const mockProviders: ProviderLocation[] = [
        {
          providerId: 'f01234',
          region: region as any,
          country: 'US',
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
        },
        {
          providerId: 'f05678',
          region: region as any,
          country: 'US',
          city: 'New York',
          latitude: 40.7128,
          longitude: -74.0060,
        },
      ];

      logger.info('Providers retrieved', { region, count: mockProviders.length });
      return mockProviders;
    } catch (error: any) {
      logger.error('Failed to get providers in region', { error: error.message, region });
      throw new Error(`Failed to get providers in region: ${error.message}`);
    }
  }

  /**
   * Get region statistics
   */
  async getRegionStats(region: string): Promise<RegionStats> {
    logger.debug('Getting region stats', { region });

    try {
      // TODO: Replace with actual Titan GeoMgr API call
      // Mock implementation
      const mockStats: RegionStats = {
        region,
        providerCount: Math.floor(Math.random() * 100) + 10,
        totalCapacity: `${Math.floor(Math.random() * 1000)}PiB`,
        averageLatency: Math.floor(Math.random() * 200) + 50,
      };

      return mockStats;
    } catch (error: any) {
      logger.error('Failed to get region stats', { error: error.message, region });
      throw new Error(`Failed to get region stats: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two providers
   */
  calculateDistance(loc1: ProviderLocation, loc2: ProviderLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.latitude - loc1.latitude);
    const dLon = this.toRad(loc2.longitude - loc1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.latitude)) *
        Math.cos(this.toRad(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
