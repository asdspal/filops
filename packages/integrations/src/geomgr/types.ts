/**
 * Types for Titan GeoMgr integration
 */

export interface GeoMgrConfig {
  apiUrl: string;
  timeout?: number;
}

export interface ProviderLocation {
  providerId: string;
  region: 'NA' | 'EU' | 'APAC' | 'SA' | 'AF' | 'ME';
  country: string;
  city?: string;
  latitude: number;
  longitude: number;
  lastUpdated?: string;
}

export interface RegionStats {
  region: string;
  providerCount: number;
  totalCapacity: string;
  averageLatency: number;
}
