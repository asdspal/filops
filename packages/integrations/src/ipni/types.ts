/**
 * Types for IPNI (InterPlanetary Network Indexer) integration
 */

export interface IPNIConfig {
  apiUrl: string;
  timeout?: number;
}

export interface ProviderRecord {
  providerId: string;
  metadata: {
    protocols: string[];
    addresses: string[];
  };
  lastAdvertisement?: string;
  contextId?: string;
}

export interface MultihashResult {
  multihash: string;
  providerResults: ProviderRecord[];
}
