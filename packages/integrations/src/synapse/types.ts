/**
 * Types for Synapse SDK integration
 */

export interface SynapseConfig {
  apiUrl: string;
  apiKey?: string;
  network: 'mainnet' | 'testnet' | 'devnet';
  walletPrivateKey?: string;
}

export interface CreateDealParams {
  dataCid: string;
  providerId: string;
  duration: number; // in days
  price: string; // in FIL
  collateral: string; // in FIL
  verified?: boolean;
}

export interface CreateDealResult {
  dealId: string;
  txHash: string;
  proposalCid: string;
}

export interface RenewDealParams {
  dealId: string;
  duration: number; // in days
  additionalCollateral?: string;
}

export interface RenewDealResult {
  txHash: string;
  newExpiryEpoch: number;
}

export interface TopUpCollateralParams {
  dealId: string;
  amount: string; // in FIL
}

export interface TopUpCollateralResult {
  txHash: string;
  newCollateral: string;
}

export interface DealStatus {
  dealId: string;
  status: 'pending' | 'active' | 'expired' | 'failed' | 'slashed';
  providerId: string;
  dataCid: string;
  startEpoch: number;
  endEpoch: number;
  price: string;
  collateral: string;
  verified: boolean;
}

export interface ProviderInfo {
  providerId: string;
  peerId: string;
  multiaddrs: string[];
  sectorSize: number;
  availableBalance: string;
  lockedBalance: string;
}
