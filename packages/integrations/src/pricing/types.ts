/**
 * Types for provider pricing service
 */

export interface ProviderPricing {
  providerId: string;
  region: string;
  priceUsdPerTiBMonth: number;
  availability: number; // 0-1
  latencyMs: number;
  verified: boolean;
  updatedAt: Date;
}

export interface PricingQuery {
  region?: string;
  maxPrice?: number;
  minAvailability?: number;
  verified?: boolean;
  limit?: number;
}
