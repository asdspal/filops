import { EventProducer, TOPICS } from '@filops/events';
import { createLogger } from '@filops/common';
import { ProviderPricing, PricingQuery } from './types';

const logger = createLogger({
  service: 'pricing-service',
  level: process.env.LOG_LEVEL || 'info',
});

export class PricingService {
  private eventProducer?: EventProducer;
  private pricingCache: Map<string, ProviderPricing> = new Map();

  constructor(eventProducer?: EventProducer) {
    this.eventProducer = eventProducer;
  }

  /**
   * Update pricing for a provider
   */
  async updatePricing(pricing: ProviderPricing): Promise<void> {
    logger.info('Updating provider pricing', {
      providerId: pricing.providerId,
      price: pricing.priceUsdPerTiBMonth,
      region: pricing.region,
    });

    // Store in cache (in production, this would go to database)
    this.pricingCache.set(pricing.providerId, pricing);

    // Publish event
    if (this.eventProducer) {
      await this.eventProducer.publish(TOPICS.PROVIDERS_PRICING, {
        type: 'provider.pricing.updated',
        source: 'pricing-service',
        payload: {
          provider_id: pricing.providerId,
          region: pricing.region,
          price_usd_per_TiB_month: pricing.priceUsdPerTiBMonth,
          availability: pricing.availability,
          latency_ms: pricing.latencyMs,
          verified: pricing.verified,
          updated_at: pricing.updatedAt.toISOString(),
        },
      });
    }
  }

  /**
   * Get pricing for a specific provider
   */
  async getPricing(providerId: string): Promise<ProviderPricing | null> {
    return this.pricingCache.get(providerId) || null;
  }

  /**
   * Query providers by pricing criteria
   */
  async queryPricing(query: PricingQuery): Promise<ProviderPricing[]> {
    logger.debug('Querying provider pricing', query);

    let results = Array.from(this.pricingCache.values());

    // Apply filters
    if (query.region) {
      results = results.filter((p) => p.region === query.region);
    }

    if (query.maxPrice !== undefined) {
      results = results.filter((p) => p.priceUsdPerTiBMonth <= query.maxPrice!);
    }

    if (query.minAvailability !== undefined) {
      results = results.filter((p) => p.availability >= query.minAvailability!);
    }

    if (query.verified !== undefined) {
      results = results.filter((p) => p.verified === query.verified);
    }

    // Sort by price (cheapest first)
    results.sort((a, b) => a.priceUsdPerTiBMonth - b.priceUsdPerTiBMonth);

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    logger.debug('Pricing query results', { count: results.length });
    return results;
  }

  /**
   * Find cheapest providers in a region
   */
  async findCheapestProviders(
    region: string,
    limit: number = 10,
  ): Promise<ProviderPricing[]> {
    return this.queryPricing({ region, limit });
  }

  /**
   * Get average pricing for a region
   */
  async getAveragePricing(region: string): Promise<{
    averagePrice: number;
    medianPrice: number;
    providerCount: number;
  }> {
    const providers = await this.queryPricing({ region });

    if (providers.length === 0) {
      return { averagePrice: 0, medianPrice: 0, providerCount: 0 };
    }

    const prices = providers.map((p) => p.priceUsdPerTiBMonth).sort((a, b) => a - b);
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const medianPrice = prices[Math.floor(prices.length / 2)];

    return {
      averagePrice,
      medianPrice,
      providerCount: providers.length,
    };
  }
}
