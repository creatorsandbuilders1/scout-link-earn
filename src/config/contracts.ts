import type { StacksNetwork } from '@stacks/network';

console.log('[CONTRACTS] Loading contract configuration...');

export interface ContractConfig {
  profileRegistry: string;
  projectEscrow: string;
  network: StacksNetwork;
}

// Create network instances using the correct API
const testnetNetwork: StacksNetwork = {
  version: 128,
  chainId: 2147483648,
  bnsLookupUrl: 'https://api.testnet.hiro.so',
  broadcastEndpoint: '/v2/transactions',
  transferFeeEstimateEndpoint: '/v2/fees/transfer',
  accountEndpoint: '/v2/accounts',
  contractAbiEndpoint: '/v2/contracts/interface',
  readOnlyFunctionCallEndpoint: '/v2/contracts/call-read',
  isMainnet: () => false,
  getCoreApiUrl: () => 'https://api.testnet.hiro.so'
};

const mainnetNetwork: StacksNetwork = {
  version: 1,
  chainId: 1,
  bnsLookupUrl: 'https://api.mainnet.hiro.so',
  broadcastEndpoint: '/v2/transactions',
  transferFeeEstimateEndpoint: '/v2/fees/transfer',
  accountEndpoint: '/v2/accounts',
  contractAbiEndpoint: '/v2/contracts/interface',
  readOnlyFunctionCallEndpoint: '/v2/contracts/call-read',
  isMainnet: () => true,
  getCoreApiUrl: () => 'https://api.mainnet.hiro.so'
};

console.log('[CONTRACTS] Networks created:', { testnetNetwork, mainnetNetwork });

export const CONTRACTS: Record<'testnet' | 'mainnet', ContractConfig> = {
  testnet: {
    profileRegistry: 'ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry',
    projectEscrow: 'ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow-v6', // ✅ V6 - Official Map/Fold Pattern + Contract Reserve
    network: testnetNetwork
  },
  mainnet: {
    profileRegistry: '', // To be deployed
    projectEscrow: '', // Will use project-escrow-v6 when deployed to mainnet
    network: mainnetNetwork
  }
};

console.log('[CONTRACTS] Configuration loaded successfully');

export const getContractConfig = (networkType: 'testnet' | 'mainnet'): ContractConfig => {
  return CONTRACTS[networkType];
};

// Parse contract address into deployer and contract name
export const parseContractAddress = (fullAddress: string) => {
  const [deployer, contractName] = fullAddress.split('.');
  return { deployer, contractName };
};
