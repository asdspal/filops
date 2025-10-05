/**
 * FilOps Integrations Package
 * 
 * Provides clients for interacting with Filecoin ecosystem services:
 * - Synapse SDK: On-chain deal operations
 * - IPNI: Provider discovery
 * - Titan GeoMgr: Geographic data
 * - Pricing: Provider pricing aggregation
 */

export * from './synapse/types';
export * from './synapse/client';

export * from './ipni/types';
export * from './ipni/client';

export * from './geomgr/types';
export * from './geomgr/client';

export * from './pricing/types';
export * from './pricing/service';

// Re-export for convenience
export { SynapseClient } from './synapse/client';
export { IPNIClient } from './ipni/client';
export { GeoMgrClient } from './geomgr/client';
export { PricingService } from './pricing/service';

import { SynapseClient } from './synapse/client';
import { SynapseConfig } from './synapse/types';
import { IPNIClient } from './ipni/client';
import { IPNIConfig } from './ipni/types';
import { GeoMgrClient } from './geomgr/client';
import { GeoMgrConfig } from './geomgr/types';
import { PricingService } from './pricing/service';
import { EventProducer } from '@filops/events';

export interface IntegrationsConfig {
  synapse: SynapseConfig;
  ipni: IPNIConfig;
  geomgr: GeoMgrConfig;
}

/**
 * Unified integrations service
 */
export class IntegrationsService {
  public synapse: SynapseClient;
  public ipni: IPNIClient;
  public geomgr: GeoMgrClient;
  public pricing: PricingService;

  constructor(config: IntegrationsConfig, eventProducer?: EventProducer) {
    this.synapse = new SynapseClient(config.synapse);
    this.ipni = new IPNIClient(config.ipni);
    this.geomgr = new GeoMgrClient(config.geomgr);
    this.pricing = new PricingService(eventProducer);
  }

  /**
   * Find best providers for a deal based on multiple criteria
   */
  async findBestProviders(params: {
    region: string;
    minAvailability: number;
    maxPrice: number;
    limit: number;
  }): Promise<any[]> {
    // Get providers in region
    const locations = await this.geomgr.getProvidersInRegion(params.region);
    
    // Get pricing data
    const pricing = await this.pricing.queryPricing({
      region: params.region,
      maxPrice: params.maxPrice,
      minAvailability: params.minAvailability,
      limit: params.limit,
    });

    // Combine data
    return pricing.map((p) => {
      const location = locations.find((l) => l.providerId === p.providerId);
      return {
        ...p,
        location,
      };
    });
  }
}
