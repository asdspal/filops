import { PricingService } from '../pricing/service';
import { ProviderPricing } from '../pricing/types';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  describe('updatePricing', () => {
    it('should update provider pricing', async () => {
      const pricing: ProviderPricing = {
        providerId: 'f01234',
        region: 'NA',
        priceUsdPerTiBMonth: 50,
        availability: 0.99,
        latencyMs: 100,
        verified: true,
        updatedAt: new Date(),
      };

      await service.updatePricing(pricing);

      const retrieved = await service.getPricing('f01234');
      expect(retrieved).toEqual(pricing);
    });
  });

  describe('queryPricing', () => {
    beforeEach(async () => {
      await service.updatePricing({
        providerId: 'f01234',
        region: 'NA',
        priceUsdPerTiBMonth: 50,
        availability: 0.99,
        latencyMs: 100,
        verified: true,
        updatedAt: new Date(),
      });

      await service.updatePricing({
        providerId: 'f05678',
        region: 'EU',
        priceUsdPerTiBMonth: 60,
        availability: 0.95,
        latencyMs: 150,
        verified: true,
        updatedAt: new Date(),
      });
    });

    it('should query by region', async () => {
      const result = await service.queryPricing({ region: 'NA' });

      expect(result).toHaveLength(1);
      expect(result[0].providerId).toBe('f01234');
    });

    it('should query by max price', async () => {
      const result = await service.queryPricing({ maxPrice: 55 });

      expect(result).toHaveLength(1);
      expect(result[0].priceUsdPerTiBMonth).toBeLessThanOrEqual(55);
    });

    it('should query by min availability', async () => {
      const result = await service.queryPricing({ minAvailability: 0.98 });

      expect(result).toHaveLength(1);
      expect(result[0].availability).toBeGreaterThanOrEqual(0.98);
    });

    it('should apply limit', async () => {
      const result = await service.queryPricing({ limit: 1 });

      expect(result).toHaveLength(1);
    });
  });

  describe('findCheapestProviders', () => {
    it('should find cheapest providers in region', async () => {
      await service.updatePricing({
        providerId: 'f01234',
        region: 'NA',
        priceUsdPerTiBMonth: 50,
        availability: 0.99,
        latencyMs: 100,
        verified: true,
        updatedAt: new Date(),
      });

      const result = await service.findCheapestProviders('NA', 5);

      expect(result).toBeInstanceOf(Array);
      expect(result[0].priceUsdPerTiBMonth).toBe(50);
    });
  });

  describe('getAveragePricing', () => {
    it('should calculate average pricing', async () => {
      await service.updatePricing({
        providerId: 'f01234',
        region: 'NA',
        priceUsdPerTiBMonth: 50,
        availability: 0.99,
        latencyMs: 100,
        verified: true,
        updatedAt: new Date(),
      });

      await service.updatePricing({
        providerId: 'f05678',
        region: 'NA',
        priceUsdPerTiBMonth: 60,
        availability: 0.95,
        latencyMs: 150,
        verified: true,
        updatedAt: new Date(),
      });

      const result = await service.getAveragePricing('NA');

      expect(result.averagePrice).toBe(55);
      expect(result.medianPrice).toBeGreaterThan(0);
      expect(result.providerCount).toBe(2);
    });
  });
});
