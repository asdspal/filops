import { SynapseClient } from '../synapse/client';

describe('SynapseClient', () => {
  let client: SynapseClient;

  beforeEach(() => {
    client = new SynapseClient({
      apiUrl: 'http://localhost:1234',
      network: 'devnet',
    });
  });

  describe('createDeal', () => {
    it('should create a storage deal', async () => {
      const result = await client.createDeal({
        dataCid: 'bafytest123',
        providerId: 'f01234',
        duration: 180,
        price: '50',
        collateral: '100',
      });

      expect(result.dealId).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.proposalCid).toBeDefined();
      expect(result.dealId).toContain('deal-');
    });
  });

  describe('renewDeal', () => {
    it('should renew an existing deal', async () => {
      const result = await client.renewDeal({
        dealId: 'deal-123',
        duration: 180,
      });

      expect(result.txHash).toBeDefined();
      expect(result.newExpiryEpoch).toBeGreaterThan(0);
    });
  });

  describe('topUpCollateral', () => {
    it('should top up collateral', async () => {
      const result = await client.topUpCollateral({
        dealId: 'deal-123',
        amount: '50',
      });

      expect(result.txHash).toBeDefined();
      expect(result.newCollateral).toBeDefined();
      expect(parseFloat(result.newCollateral)).toBeGreaterThan(50);
    });
  });

  describe('getDealStatus', () => {
    it('should get deal status', async () => {
      const result = await client.getDealStatus('deal-123');

      expect(result.dealId).toBe('deal-123');
      expect(result.status).toBeDefined();
      expect(['pending', 'active', 'expired', 'failed', 'slashed']).toContain(result.status);
    });
  });

  describe('getProviderInfo', () => {
    it('should get provider information', async () => {
      const result = await client.getProviderInfo('f01234');

      expect(result.providerId).toBe('f01234');
      expect(result.peerId).toBeDefined();
      expect(result.multiaddrs).toBeInstanceOf(Array);
      expect(result.sectorSize).toBeGreaterThan(0);
    });
  });

  describe('isProviderActive', () => {
    it('should check if provider is active', async () => {
      const result = await client.isProviderActive('f01234');

      expect(typeof result).toBe('boolean');
    });
  });
});
