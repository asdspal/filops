import { IPNIClient } from '../ipni/client';

describe('IPNIClient', () => {
  let client: IPNIClient;

  beforeEach(() => {
    client = new IPNIClient({
      apiUrl: 'https://cid.contact',
    });
  });

  describe('findProviders', () => {
    it('should find providers for a CID', async () => {
      const result = await client.findProviders('bafytest123');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('providerId');
      expect(result[0]).toHaveProperty('metadata');
    });
  });

  describe('hasProvider', () => {
    it('should check if provider has CID', async () => {
      const result = await client.hasProvider('bafytest123', 'f01234');

      expect(typeof result).toBe('boolean');
    });
  });

  describe('findProvidersForMultipleCids', () => {
    it('should find providers for multiple CIDs', async () => {
      const cids = ['bafytest1', 'bafytest2'];
      const result = await client.findProvidersForMultipleCids(cids);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
    });
  });

  describe('getProviderStats', () => {
    it('should get provider statistics', async () => {
      const result = await client.getProviderStats('f01234');

      expect(result).toHaveProperty('totalCids');
      expect(result).toHaveProperty('lastSeen');
      expect(result.totalCids).toBeGreaterThanOrEqual(0);
    });
  });
});
