# Smart Contract Integration - Design Document

## Overview

This document outlines the technical architecture for integrating the deployed REFERYDO! smart contracts on Stacks Testnet with the React frontend application. The design focuses on creating a robust, type-safe integration layer that connects the UI with on-chain contract functions while maintaining excellent user experience through optimistic updates, caching, and clear transaction status feedback.

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Contexts   │          │
│  │              │  │              │  │              │          │
│  │ • Profile    │  │ • Project    │  │ • Wallet     │          │
│  │ • Dashboard  │  │   Creation   │  │ • Contract   │          │
│  │ • Workspace  │  │ • Scout      │  │ • Scout      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │           Custom Hooks Layer                       │         │
│  │                                                     │         │
│  │  • useCreateProject()                              │         │
│  │  • useFundEscrow()                                 │         │
│  │  • useApproveAndDistribute()                       │         │
│  │  • useProjectData()                                │         │
│  │  • useRegisterProfile()                            │         │
│  │  • useScoutTracking()                              │         │
│  └─────────────────────────┬──────────────────────────┘         │
│                            │                                     │
│  ┌─────────────────────────▼──────────────────────────┐         │
│  │        Contract Service Layer                      │         │
│  │                                                     │         │
│  │  • contractService.ts                              │         │
│  │  • profileRegistryService.ts                       │         │
│  │  • projectEscrowService.ts                         │         │
│  │  • transactionManager.ts                           │         │
│  └─────────────────────────┬──────────────────────────┘         │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ @stacks/transactions
                             │ @stacks/connect
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    Stacks Blockchain                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐      ┌──────────────────────┐         │
│  │  Profile Registry    │      │   Project Escrow     │         │
│  │  Contract            │      │   Contract           │         │
│  │                      │      │                      │         │
│  │  ST2ZG3R1EMK0...    │      │  ST2ZG3R1EMK0...    │         │
│  └──────────────────────┘      └──────────────────────┘         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### 1. Contract Configuration

**File:** `src/config/contracts.ts`

```typescript
import { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';

export interface ContractConfig {
  profileRegistry: string;
  projectEscrow: string;
  network: StacksNetwork;
}

export const CONTRACTS: Record<'testnet' | 'mainnet', ContractConfig> = {
  testnet: {
    profileRegistry: 'ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry',
    projectEscrow: 'ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow',
    network: new StacksTestnet()
  },
  mainnet: {
    profileRegistry: '', // To be deployed
    projectEscrow: '',
    network: new StacksMainnet()
  }
};

export const getContractConfig = (networkType: 'testnet' | 'mainnet'): ContractConfig => {
  return CONTRACTS[networkType];
};

// Parse contract address into deployer and contract name
export const parseContractAddress = (fullAddress: string) => {
  const [deployer, contractName] = fullAddress.split('.');
  return { deployer, contractName };
};
```

### 2. Type Definitions

**File:** `src/types/contracts.ts`

```typescript
// Project status enum matching contract
export enum ProjectStatus {
  Created = 0,
  Funded = 1,
  Completed = 2,
  Disputed = 3
}

// Project data structure from contract
export interface ProjectData {
  client: string;
  talent: string;
  scout: string;
  amount: bigint;
  scoutFeePercent: number;
  platformFeePercent: number;
  status: ProjectStatus;
}

// Transaction state
export enum TransactionState {
  Idle = 'idle',
  Signing = 'signing',
  Broadcasting = 'broadcasting',
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed'
}

export interface TransactionStatus {
  state: TransactionState;
  txId?: string;
  error?: string;
  blockHeight?: number;
}

// Contract function result types
export interface CreateProjectResult {
  projectId: number;
  txId: string;
}

export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  txId?: string;
  error?: string;
}
```


### 3. Contract Service Layer

**File:** `src/services/contractService.ts`

Base service for common contract operations:

```typescript
import { 
  callReadOnlyFunction, 
  cvToJSON, 
  ClarityValue,
  ResponseCV
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { getContractConfig, parseContractAddress } from '@/config/contracts';

export class ContractService {
  protected network: StacksNetwork;
  protected contractAddress: string;
  protected deployer: string;
  protected contractName: string;

  constructor(contractAddress: string, networkType: 'testnet' | 'mainnet' = 'testnet') {
    const config = getContractConfig(networkType);
    this.network = config.network;
    this.contractAddress = contractAddress;
    
    const parsed = parseContractAddress(contractAddress);
    this.deployer = parsed.deployer;
    this.contractName = parsed.contractName;
  }

  // Read-only function call (no gas fees)
  protected async callReadOnly<T>(
    functionName: string,
    functionArgs: ClarityValue[],
    senderAddress: string
  ): Promise<T> {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.deployer,
        contractName: this.contractName,
        functionName,
        functionArgs,
        senderAddress,
        network: this.network,
      });

      return this.parseReadOnlyResult<T>(result);
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  // Parse Clarity response to JSON
  protected parseReadOnlyResult<T>(result: ClarityValue): T {
    const json = cvToJSON(result);
    return json as T;
  }

  // Map contract error codes to messages
  protected mapErrorCode(code: number): string {
    const errorMap: Record<number, string> = {
      101: 'You are not authorized to perform this action',
      102: 'Project not found',
      103: 'Project is in the wrong status for this action',
      104: 'Failed to transfer funds to escrow'
    };
    return errorMap[code] || `Unknown error (code: ${code})`;
  }
}
```


**File:** `src/services/profileRegistryService.ts`

```typescript
import { ContractService } from './contractService';
import { stringUtf8CV, principalCV } from '@stacks/transactions';
import { CONTRACTS } from '@/config/contracts';

export class ProfileRegistryService extends ContractService {
  constructor(networkType: 'testnet' | 'mainnet' = 'testnet') {
    const config = CONTRACTS[networkType];
    super(config.profileRegistry, networkType);
  }

  // Read-only: Get profile data for a user
  async getProfile(userAddress: string): Promise<string | null> {
    try {
      const result = await this.callReadOnly<any>(
        'get-profile',
        [principalCV(userAddress)],
        userAddress
      );

      // Result is (optional (string-utf8 256))
      if (result.value) {
        return result.value.value;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
}
```

**File:** `src/services/projectEscrowService.ts`

```typescript
import { ContractService } from './contractService';
import { 
  uintCV, 
  principalCV,
  cvToJSON,
  ClarityValue
} from '@stacks/transactions';
import { CONTRACTS } from '@/config/contracts';
import { ProjectData, ProjectStatus } from '@/types/contracts';

export class ProjectEscrowService extends ContractService {
  constructor(networkType: 'testnet' | 'mainnet' = 'testnet') {
    const config = CONTRACTS[networkType];
    super(config.projectEscrow, networkType);
  }

  // Read-only: Get project data
  async getProjectData(projectId: number, senderAddress: string): Promise<ProjectData | null> {
    try {
      const result = await this.callReadOnly<any>(
        'get-project-data',
        [uintCV(projectId)],
        senderAddress
      );

      // Result is (optional { ... })
      if (result.value) {
        const data = result.value;
        return {
          client: data.client.value,
          talent: data.talent.value,
          scout: data.scout.value,
          amount: BigInt(data.amount.value),
          scoutFeePercent: Number(data['scout-fee-percent'].value),
          platformFeePercent: Number(data['platform-fee-percent'].value),
          status: Number(data.status.value) as ProjectStatus
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching project data:', error);
      return null;
    }
  }

  // Calculate payout breakdown
  calculatePayouts(amount: bigint, scoutFeePercent: number, platformFeePercent: number) {
    const scoutPayout = (amount * BigInt(scoutFeePercent)) / 100n;
    const platformPayout = (amount * BigInt(platformFeePercent)) / 100n;
    const talentPayout = amount - scoutPayout - platformPayout;

    return {
      talent: talentPayout,
      scout: scoutPayout,
      platform: platformPayout,
      total: amount
    };
  }
}
```


### 4. Transaction Manager

**File:** `src/services/transactionManager.ts`

Handles transaction signing, broadcasting, and status tracking:

```typescript
import { openContractCall, ContractCallOptions } from '@stacks/connect';
import { StacksNetwork } from '@stacks/network';
import { 
  PostConditionMode,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  createAssetInfo
} from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';

export class TransactionManager {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  // Execute a contract call with transaction tracking
  async executeContractCall(
    options: Omit<ContractCallOptions, 'network'>,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      onStatusChange?.({ state: TransactionState.Signing });

      openContractCall({
        ...options,
        network: this.network,
        onFinish: (data) => {
          onStatusChange?.({ 
            state: TransactionState.Broadcasting,
            txId: data.txId 
          });
          
          // Start polling for confirmation
          this.pollTransactionStatus(data.txId, onStatusChange)
            .then(() => resolve(data.txId))
            .catch(reject);
        },
        onCancel: () => {
          onStatusChange?.({ 
            state: TransactionState.Failed,
            error: 'Transaction cancelled by user'
          });
          reject(new Error('Transaction cancelled'));
        }
      });
    });
  }

  // Poll transaction status until confirmed
  private async pollTransactionStatus(
    txId: string,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<void> {
    onStatusChange?.({ 
      state: TransactionState.Pending,
      txId 
    });

    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `${this.network.coreApiUrl}/extended/v1/tx/${txId}`
        );
        const data = await response.json();

        if (data.tx_status === 'success') {
          onStatusChange?.({ 
            state: TransactionState.Success,
            txId,
            blockHeight: data.block_height
          });
          return;
        } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
          throw new Error(`Transaction failed: ${data.tx_status}`);
        }

        // Still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        onStatusChange?.({ 
          state: TransactionState.Failed,
          txId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }

    throw new Error('Transaction confirmation timeout');
  }

  // Create post-condition for STX transfer
  createSTXPostCondition(
    address: string,
    amount: bigint,
    conditionCode: FungibleConditionCode = FungibleConditionCode.Equal
  ) {
    return makeStandardSTXPostCondition(
      address,
      conditionCode,
      amount
    );
  }
}
```


### 5. Contract Context

**File:** `src/contexts/ContractContext.tsx`

Provides contract services and transaction management to the app:

```typescript
import React, { createContext, useContext, useMemo } from 'react';
import { ProfileRegistryService } from '@/services/profileRegistryService';
import { ProjectEscrowService } from '@/services/projectEscrowService';
import { TransactionManager } from '@/services/transactionManager';
import { getContractConfig } from '@/config/contracts';
import { useWallet } from './WalletContext';

interface ContractContextValue {
  profileRegistry: ProfileRegistryService;
  projectEscrow: ProjectEscrowService;
  transactionManager: TransactionManager;
  networkType: 'testnet' | 'mainnet';
}

const ContractContext = createContext<ContractContextValue | null>(null);

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { network } = useWallet();
  
  // Determine network type from wallet
  const networkType: 'testnet' | 'mainnet' = useMemo(() => {
    return network === 'testnet' ? 'testnet' : 'mainnet';
  }, [network]);

  const value = useMemo(() => {
    const config = getContractConfig(networkType);
    
    return {
      profileRegistry: new ProfileRegistryService(networkType),
      projectEscrow: new ProjectEscrowService(networkType),
      transactionManager: new TransactionManager(config.network),
      networkType
    };
  }, [networkType]);

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within ContractProvider');
  }
  return context;
};
```


### 6. Scout Tracking Context

**File:** `src/contexts/ScoutTrackingContext.tsx`

Manages Scout referral tracking across the application:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ScoutSession {
  scoutAddress: string;
  timestamp: number;
  expiresAt: number;
}

interface ScoutTrackingContextValue {
  scoutAddress: string | null;
  hasActiveScoutSession: boolean;
  clearScoutSession: () => void;
}

const SCOUT_STORAGE_KEY = 'referydo_scout_address';
const SCOUT_TIMESTAMP_KEY = 'referydo_scout_timestamp';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

const ScoutTrackingContext = createContext<ScoutTrackingContextValue | null>(null);

export const ScoutTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [scoutAddress, setScoutAddress] = useState<string | null>(null);

  // Initialize and capture Scout from URL
  useEffect(() => {
    // Check URL for scout parameter
    const scoutParam = searchParams.get('scout');
    
    if (scoutParam && isValidStacksAddress(scoutParam)) {
      // New Scout session from URL
      const now = Date.now();
      localStorage.setItem(SCOUT_STORAGE_KEY, scoutParam);
      localStorage.setItem(SCOUT_TIMESTAMP_KEY, now.toString());
      setScoutAddress(scoutParam);
      return;
    }

    // Check for existing Scout session
    const storedScout = localStorage.getItem(SCOUT_STORAGE_KEY);
    const storedTimestamp = localStorage.getItem(SCOUT_TIMESTAMP_KEY);

    if (storedScout && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp);
      const now = Date.now();
      
      // Check if session is still valid
      if (now - timestamp < SESSION_DURATION) {
        setScoutAddress(storedScout);
      } else {
        // Session expired, clear it
        clearScoutSession();
      }
    }
  }, [searchParams]);

  const clearScoutSession = () => {
    localStorage.removeItem(SCOUT_STORAGE_KEY);
    localStorage.removeItem(SCOUT_TIMESTAMP_KEY);
    setScoutAddress(null);
  };

  const value = {
    scoutAddress,
    hasActiveScoutSession: scoutAddress !== null,
    clearScoutSession
  };

  return (
    <ScoutTrackingContext.Provider value={value}>
      {children}
    </ScoutTrackingContext.Provider>
  );
};

export const useScoutTracking = () => {
  const context = useContext(ScoutTrackingContext);
  if (!context) {
    throw new Error('useScoutTracking must be used within ScoutTrackingProvider');
  }
  return context;
};

// Validate Stacks address format
function isValidStacksAddress(address: string): boolean {
  // Testnet addresses start with ST, mainnet with SP
  return /^(ST|SP)[0-9A-Z]{38,41}$/.test(address);
}
```


## Custom Hooks

### 1. useRegisterProfile Hook

**File:** `src/hooks/useRegisterProfile.ts`

```typescript
import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { stringUtf8CV } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

export const useRegisterProfile = () => {
  const { profileRegistry, transactionManager, networkType } = useContract();
  const { addresses } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const registerProfile = async (profileData: string) => {
    if (!addresses || addresses.length === 0) {
      throw new Error('Wallet not connected');
    }

    const userAddress = addresses[0].address;
    const { deployer, contractName } = parseContractAddress(
      profileRegistry.contractAddress
    );

    try {
      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'register-profile',
          functionArgs: [stringUtf8CV(profileData)],
          postConditionMode: 0x01, // Allow
        },
        setStatus
      );

      return { success: true, txId };
    } catch (error) {
      setStatus({
        state: TransactionState.Failed,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    registerProfile,
    status,
    isLoading: status.state === TransactionState.Signing || 
               status.state === TransactionState.Broadcasting ||
               status.state === TransactionState.Pending
  };
};
```

### 2. useCreateProject Hook

**File:** `src/hooks/useCreateProject.ts`

```typescript
import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { principalCV, uintCV } from '@stacks/transactions';
import { TransactionStatus, TransactionState, CreateProjectResult } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

interface CreateProjectParams {
  talentAddress: string;
  amountSTX: number;
  scoutFeePercent: number;
  platformFeePercent: number;
}

export const useCreateProject = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { addresses } = useWallet();
  const { scoutAddress } = useScoutTracking();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const createProject = async (params: CreateProjectParams): Promise<CreateProjectResult | null> => {
    if (!addresses || addresses.length === 0) {
      throw new Error('Wallet not connected');
    }

    const clientAddress = addresses[0].address;
    
    // Use tracked Scout address or default to client address if no Scout
    const finalScoutAddress = scoutAddress || clientAddress;
    
    // Convert STX to microSTX (1 STX = 1,000,000 microSTX)
    const amountMicroSTX = params.amountSTX * 1_000_000;

    const { deployer, contractName } = parseContractAddress(
      projectEscrow.contractAddress
    );

    try {
      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'create-project',
          functionArgs: [
            principalCV(params.talentAddress),
            principalCV(finalScoutAddress),
            uintCV(amountMicroSTX),
            uintCV(params.scoutFeePercent),
            uintCV(params.platformFeePercent)
          ],
          postConditionMode: 0x01, // Allow
        },
        setStatus
      );

      // Note: We'll need to fetch the project ID from the transaction result
      // For now, return the txId and let the caller handle project ID retrieval
      return { projectId: 0, txId }; // Project ID will be fetched separately
    } catch (error) {
      setStatus({
        state: TransactionState.Failed,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  };

  return {
    createProject,
    status,
    isLoading: status.state === TransactionState.Signing || 
               status.state === TransactionState.Broadcasting ||
               status.state === TransactionState.Pending,
    scoutAddress // Expose the Scout address being used
  };
};
```


### 3. useFundEscrow Hook

**File:** `src/hooks/useFundEscrow.ts`

```typescript
import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { uintCV, FungibleConditionCode } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

export const useFundEscrow = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { addresses } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const fundEscrow = async (projectId: number, amountSTX: number) => {
    if (!addresses || addresses.length === 0) {
      throw new Error('Wallet not connected');
    }

    const clientAddress = addresses[0].address;
    const amountMicroSTX = BigInt(amountSTX * 1_000_000);

    const { deployer, contractName } = parseContractAddress(
      projectEscrow.contractAddress
    );

    try {
      // Create post-condition to ensure exact STX amount is transferred
      const postCondition = transactionManager.createSTXPostCondition(
        clientAddress,
        amountMicroSTX,
        FungibleConditionCode.Equal
      );

      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'fund-escrow',
          functionArgs: [uintCV(projectId)],
          postConditions: [postCondition],
          postConditionMode: 0x02, // Deny mode - enforce post-conditions
        },
        setStatus
      );

      return { success: true, txId };
    } catch (error) {
      setStatus({
        state: TransactionState.Failed,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    fundEscrow,
    status,
    isLoading: status.state === TransactionState.Signing || 
               status.state === TransactionState.Broadcasting ||
               status.state === TransactionState.Pending
  };
};
```

### 4. useApproveAndDistribute Hook

**File:** `src/hooks/useApproveAndDistribute.ts`

```typescript
import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { uintCV } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

export const useApproveAndDistribute = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { addresses } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const approveAndDistribute = async (projectId: number) => {
    if (!addresses || addresses.length === 0) {
      throw new Error('Wallet not connected');
    }

    const { deployer, contractName } = parseContractAddress(
      projectEscrow.contractAddress
    );

    try {
      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'approve-and-distribute',
          functionArgs: [uintCV(projectId)],
          postConditionMode: 0x01, // Allow - contract handles transfers
        },
        setStatus
      );

      return { success: true, txId };
    } catch (error) {
      setStatus({
        state: TransactionState.Failed,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    approveAndDistribute,
    status,
    isLoading: status.state === TransactionState.Signing || 
               status.state === TransactionState.Broadcasting ||
               status.state === TransactionState.Pending
  };
};
```


### 5. useProjectData Hook

**File:** `src/hooks/useProjectData.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { ProjectData } from '@/types/contracts';

interface UseProjectDataOptions {
  projectId: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export const useProjectData = ({ 
  projectId, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: UseProjectDataOptions) => {
  const { projectEscrow } = useContract();
  const { addresses } = useWallet();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    if (!addresses || addresses.length === 0) {
      setError('Wallet not connected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const projectData = await projectEscrow.getProjectData(
        projectId,
        addresses[0].address
      );
      
      if (projectData) {
        setData(projectData);
        setError(null);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project data');
    } finally {
      setLoading(false);
    }
  }, [projectId, projectEscrow, addresses]);

  // Initial fetch
  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchProjectData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchProjectData]);

  // Calculate payouts if data is available
  const payouts = data ? projectEscrow.calculatePayouts(
    data.amount,
    data.scoutFeePercent,
    data.platformFeePercent
  ) : null;

  return {
    data,
    payouts,
    loading,
    error,
    refetch: fetchProjectData
  };
};
```

### 6. useScoutEarnings Hook

**File:** `src/hooks/useScoutEarnings.ts`

```typescript
import { useState, useEffect } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { ProjectData, ProjectStatus } from '@/types/contracts';

interface ScoutEarning {
  projectId: number;
  project: ProjectData;
  commission: bigint;
  status: ProjectStatus;
}

export const useScoutEarnings = () => {
  const { projectEscrow } = useContract();
  const { addresses } = useWallet();
  const [earnings, setEarnings] = useState<ScoutEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScoutEarnings = async () => {
      if (!addresses || addresses.length === 0) {
        setError('Wallet not connected');
        setLoading(false);
        return;
      }

      const scoutAddress = addresses[0].address;

      try {
        setLoading(true);
        
        // Note: This is a simplified version. In production, you'd need to:
        // 1. Query a backend API that indexes blockchain events
        // 2. Or iterate through project IDs (inefficient)
        // 3. Or use Stacks API to find transactions involving the Scout
        
        // For now, we'll fetch a range of project IDs
        // This should be replaced with proper indexing
        const maxProjectId = 100; // Adjust based on your needs
        const scoutProjects: ScoutEarning[] = [];

        for (let id = 1; id <= maxProjectId; id++) {
          try {
            const projectData = await projectEscrow.getProjectData(id, scoutAddress);
            
            if (projectData && projectData.scout === scoutAddress) {
              const payouts = projectEscrow.calculatePayouts(
                projectData.amount,
                projectData.scoutFeePercent,
                projectData.platformFeePercent
              );

              scoutProjects.push({
                projectId: id,
                project: projectData,
                commission: payouts.scout,
                status: projectData.status
              });
            }
          } catch {
            // Project doesn't exist or error fetching, continue
            continue;
          }
        }

        setEarnings(scoutProjects);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch earnings');
      } finally {
        setLoading(false);
      }
    };

    fetchScoutEarnings();
  }, [projectEscrow, addresses]);

  // Calculate totals
  const totalEarned = earnings
    .filter(e => e.status === ProjectStatus.Completed)
    .reduce((sum, e) => sum + e.commission, 0n);

  const pendingEarnings = earnings
    .filter(e => e.status === ProjectStatus.Funded)
    .reduce((sum, e) => sum + e.commission, 0n);

  return {
    earnings,
    totalEarned,
    pendingEarnings,
    loading,
    error
  };
};
```


## Data Models

### Project Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Flow Diagram                         │
└─────────────────────────────────────────────────────────────┘

1. PROJECT CREATION
   ┌──────────┐
   │  Client  │
   └────┬─────┘
        │ Clicks "Hire Talent"
        ▼
   ┌──────────────────┐
   │ Project Creation │
   │     Modal        │
   └────┬─────────────┘
        │ Fills form: amount, fees
        │ Scout auto-filled from localStorage
        ▼
   ┌──────────────────┐
   │ useCreateProject │
   │      Hook        │
   └────┬─────────────┘
        │ Calls create-project()
        ▼
   ┌──────────────────┐
   │ Smart Contract   │
   │ project-escrow   │
   └────┬─────────────┘
        │ Returns project-id
        │ Status: 0 (Created)
        ▼
   ┌──────────────────┐
   │  Project Page    │
   │ (Awaiting Fund)  │
   └──────────────────┘

2. ESCROW FUNDING
   ┌──────────┐
   │  Client  │
   └────┬─────┘
        │ Clicks "Fund Escrow"
        ▼
   ┌──────────────────┐
   │  useFundEscrow   │
   │      Hook        │
   └────┬─────────────┘
        │ Transfers STX to contract
        │ Calls fund-escrow(project-id)
        ▼
   ┌──────────────────┐
   │ Smart Contract   │
   │ project-escrow   │
   └────┬─────────────┘
        │ Holds STX in escrow
        │ Status: 1 (Funded)
        ▼
   ┌──────────────────┐
   │ Project Workspace│
   │ (Work in Progress│
   └──────────────────┘

3. WORK COMPLETION & PAYOUT
   ┌──────────┐
   │  Talent  │
   └────┬─────┘
        │ Submits work
        ▼
   ┌──────────┐
   │  Client  │
   └────┬─────┘
        │ Reviews & approves
        │ Clicks "Approve & Distribute"
        ▼
   ┌──────────────────────┐
   │ useApproveAndDistribute│
   │         Hook          │
   └────┬──────────────────┘
        │ Calls approve-and-distribute(project-id)
        ▼
   ┌──────────────────┐
   │ Smart Contract   │
   │ project-escrow   │
   └────┬─────────────┘
        │ ATOMIC PAYOUT:
        │ ├─> Talent (70%)
        │ ├─> Scout (15%)
        │ └─> Platform (15%)
        │ Status: 2 (Completed)
        ▼
   ┌──────────────────┐
   │ All parties paid │
   │ Project Complete │
   └──────────────────┘
```

### State Management

```typescript
// Project state in UI
interface ProjectUIState {
  // On-chain data (source of truth)
  onChainData: ProjectData | null;
  
  // Off-chain data (Supabase/local)
  offChainData: {
    title: string;
    description: string;
    milestones: Milestone[];
    messages: Message[];
  };
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Transaction state
  currentTransaction: TransactionStatus | null;
}

// Milestone tracking (off-chain)
interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'approved';
  submissionUrl?: string;
  submittedAt?: Date;
  approvedAt?: Date;
}
```


## Error Handling

### Contract Error Mapping

```typescript
// src/utils/contractErrors.ts

export enum ContractErrorCode {
  NOT_AUTHORIZED = 101,
  PROJECT_NOT_FOUND = 102,
  WRONG_STATUS = 103,
  FUNDING_FAILED = 104
}

export const getErrorMessage = (code: number): string => {
  switch (code) {
    case ContractErrorCode.NOT_AUTHORIZED:
      return 'You are not authorized to perform this action. Only the project creator can execute this function.';
    case ContractErrorCode.PROJECT_NOT_FOUND:
      return 'Project not found. Please verify the project ID and try again.';
    case ContractErrorCode.WRONG_STATUS:
      return 'Project is in the wrong status for this action. Please check the project status and try again.';
    case ContractErrorCode.FUNDING_FAILED:
      return 'Failed to transfer funds to escrow. Please ensure you have sufficient STX balance and try again.';
    default:
      return `An unknown error occurred (code: ${code}). Please try again or contact support.`;
  }
};

// Parse error from transaction result
export const parseContractError = (error: any): string => {
  if (error?.message) {
    // Try to extract error code from message
    const match = error.message.match(/\(err u(\d+)\)/);
    if (match) {
      const code = parseInt(match[1]);
      return getErrorMessage(code);
    }
    return error.message;
  }
  return 'An unknown error occurred';
};
```

### Error Boundary Component

```typescript
// src/components/ContractErrorBoundary.tsx

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ContractErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Contract error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract Interaction Error</AlertTitle>
          <AlertDescription>
            {this.state.error?.message || 'An error occurred while interacting with the smart contract.'}
          </AlertDescription>
          <Button 
            variant="outline" 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4"
          >
            Try Again
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```


## Testing Strategy

### Unit Tests

```typescript
// src/services/__tests__/projectEscrowService.test.ts

import { ProjectEscrowService } from '../projectEscrowService';
import { ProjectStatus } from '@/types/contracts';

describe('ProjectEscrowService', () => {
  let service: ProjectEscrowService;

  beforeEach(() => {
    service = new ProjectEscrowService('testnet');
  });

  describe('calculatePayouts', () => {
    it('should correctly calculate three-way split', () => {
      const amount = 1000000n; // 1 STX in microSTX
      const scoutFee = 15; // 15%
      const platformFee = 5; // 5%

      const payouts = service.calculatePayouts(amount, scoutFee, platformFee);

      expect(payouts.scout).toBe(150000n); // 15%
      expect(payouts.platform).toBe(50000n); // 5%
      expect(payouts.talent).toBe(800000n); // 80%
      expect(payouts.total).toBe(amount);
    });

    it('should handle zero fees', () => {
      const amount = 1000000n;
      const payouts = service.calculatePayouts(amount, 0, 0);

      expect(payouts.scout).toBe(0n);
      expect(payouts.platform).toBe(0n);
      expect(payouts.talent).toBe(amount);
    });
  });
});
```

### Integration Tests

```typescript
// src/hooks/__tests__/useCreateProject.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { useCreateProject } from '../useCreateProject';
import { ContractProvider } from '@/contexts/ContractContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ScoutTrackingProvider } from '@/contexts/ScoutTrackingContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WalletProvider>
    <ContractProvider>
      <ScoutTrackingProvider>
        {children}
      </ScoutTrackingProvider>
    </ContractProvider>
  </WalletProvider>
);

describe('useCreateProject', () => {
  it('should create project with Scout address from tracking', async () => {
    const { result } = renderHook(() => useCreateProject(), { wrapper });

    await waitFor(() => {
      expect(result.current.scoutAddress).toBeDefined();
    });

    // Test project creation
    const projectResult = await result.current.createProject({
      talentAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      amountSTX: 10,
      scoutFeePercent: 15,
      platformFeePercent: 5
    });

    expect(projectResult).toBeDefined();
    expect(projectResult?.txId).toBeTruthy();
  });
});
```

### E2E Tests

```typescript
// e2e/project-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Complete Project Flow', () => {
  test('should create, fund, and complete a project', async ({ page }) => {
    // 1. Connect wallet
    await page.goto('/');
    await page.click('[data-testid="connect-wallet"]');
    // ... wallet connection steps

    // 2. Navigate to talent profile
    await page.goto('/profile/talent-username');
    
    // 3. Create project
    await page.click('[data-testid="hire-talent"]');
    await page.fill('[data-testid="project-amount"]', '10');
    await page.click('[data-testid="create-project"]');
    
    // Wait for transaction
    await expect(page.locator('[data-testid="tx-success"]')).toBeVisible();
    
    // 4. Fund escrow
    await page.click('[data-testid="fund-escrow"]');
    await expect(page.locator('[data-testid="project-funded"]')).toBeVisible();
    
    // 5. Complete work (simulated)
    // ... milestone submission steps
    
    // 6. Approve and distribute
    await page.click('[data-testid="approve-distribute"]');
    await expect(page.locator('[data-testid="payout-complete"]')).toBeVisible();
  });
});
```


## UI Components

### 1. Transaction Status Component

```typescript
// src/components/TransactionStatus.tsx

import { TransactionState, TransactionStatus as TxStatus } from '@/types/contracts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  status: TxStatus;
  networkType: 'testnet' | 'mainnet';
}

export const TransactionStatus: React.FC<Props> = ({ status, networkType }) => {
  const explorerUrl = networkType === 'testnet' 
    ? 'https://explorer.hiro.so/txid'
    : 'https://explorer.stacks.co/txid';

  const getStatusDisplay = () => {
    switch (status.state) {
      case TransactionState.Signing:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Waiting for signature',
          description: 'Please sign the transaction in your wallet',
          variant: 'default' as const
        };
      
      case TransactionState.Broadcasting:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Broadcasting transaction',
          description: 'Sending transaction to the network...',
          variant: 'default' as const
        };
      
      case TransactionState.Pending:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Transaction pending',
          description: 'Waiting for confirmation on the blockchain...',
          variant: 'default' as const
        };
      
      case TransactionState.Success:
        return {
          icon: <CheckCircle className="h-4 w-4 text-success" />,
          title: 'Transaction successful',
          description: 'Your transaction has been confirmed',
          variant: 'default' as const
        };
      
      case TransactionState.Failed:
        return {
          icon: <XCircle className="h-4 w-4 text-destructive" />,
          title: 'Transaction failed',
          description: status.error || 'An error occurred',
          variant: 'destructive' as const
        };
      
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  return (
    <Alert variant={display.variant}>
      <div className="flex items-start gap-3">
        {display.icon}
        <div className="flex-1">
          <AlertDescription className="font-semibold">
            {display.title}
          </AlertDescription>
          <AlertDescription className="text-sm mt-1">
            {display.description}
          </AlertDescription>
          {status.txId && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto"
              asChild
            >
              <a
                href={`${explorerUrl}/${status.txId}?chain=${networkType}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
```

### 2. Scout Banner Component

```typescript
// src/components/ScoutBanner.tsx

import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const ScoutBanner: React.FC = () => {
  const { scoutAddress, hasActiveScoutSession, clearScoutSession } = useScoutTracking();
  const [dismissed, setDismissed] = useState(false);

  if (!hasActiveScoutSession || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <Alert className="mb-4 bg-primary/10 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link2 className="h-4 w-4 text-primary" />
          <div>
            <AlertDescription className="font-semibold text-primary">
              You were referred by a Scout
            </AlertDescription>
            <AlertDescription className="text-sm text-muted-foreground mt-1">
              Address: {scoutAddress?.slice(0, 8)}...{scoutAddress?.slice(-6)}
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};
```


### 3. Project Creation Modal

```typescript
// src/components/ProjectCreationModal.tsx

import { useState } from 'react';
import { useCreateProject } from '@/hooks/useCreateProject';
import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TransactionStatus } from './TransactionStatus';
import { Users, DollarSign } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  talentAddress: string;
  talentUsername: string;
  talentAvatar: string;
  scoutFeePercent: number;
}

export const ProjectCreationModal: React.FC<Props> = ({
  open,
  onClose,
  talentAddress,
  talentUsername,
  talentAvatar,
  scoutFeePercent
}) => {
  const { createProject, status, isLoading, scoutAddress } = useCreateProject();
  const { hasActiveScoutSession } = useScoutTracking();
  const [amount, setAmount] = useState('');
  
  const platformFeePercent = 5; // Fixed platform fee
  
  const calculateBreakdown = () => {
    const amountNum = parseFloat(amount) || 0;
    const scoutFee = (amountNum * scoutFeePercent) / 100;
    const platformFee = (amountNum * platformFeePercent) / 100;
    const talentPayout = amountNum - scoutFee - platformFee;
    
    return { scoutFee, platformFee, talentPayout };
  };

  const breakdown = calculateBreakdown();

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const result = await createProject({
      talentAddress,
      amountSTX: parseFloat(amount),
      scoutFeePercent,
      platformFeePercent
    });

    if (result) {
      // Success - redirect to project page
      // onClose();
      // navigate(`/projects/${result.projectId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trinity Visualization */}
          <div className="flex items-center justify-center gap-8 p-6 bg-muted/50 rounded-lg">
            {/* Client (You) */}
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold">Client</p>
              <p className="text-xs text-muted-foreground">You</p>
            </div>

            <div className="text-2xl text-muted-foreground">→</div>

            {/* Talent */}
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={talentAvatar} />
                <AvatarFallback>{talentUsername[0]}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold">Talent</p>
              <p className="text-xs text-muted-foreground">@{talentUsername}</p>
            </div>

            {hasActiveScoutSession && (
              <>
                <div className="text-2xl text-muted-foreground">←</div>
                
                {/* Scout */}
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2 ring-2 ring-primary">
                    <AvatarFallback>
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold text-primary">Scout</p>
                  <p className="text-xs text-muted-foreground">
                    {scoutAddress?.slice(0, 6)}...{scoutAddress?.slice(-4)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Project Amount (STX)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="10.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>

          {/* Fee Breakdown */}
          {amount && parseFloat(amount) > 0 && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Breakdown
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Talent Payout:</span>
                  <span className="font-semibold">{breakdown.talentPayout.toFixed(2)} STX</span>
                </div>
                
                {hasActiveScoutSession && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scout Commission ({scoutFeePercent}%):</span>
                    <span className="font-semibold text-primary">{breakdown.scoutFee.toFixed(2)} STX</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee ({platformFeePercent}%):</span>
                  <span className="font-semibold">{breakdown.platformFee.toFixed(2)} STX</span>
                </div>
                
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold">{amount} STX</span>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {status.state !== 'idle' && (
            <TransactionStatus status={status} networkType="testnet" />
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!amount || parseFloat(amount) <= 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```


## Performance Optimizations

### 1. Caching Strategy

```typescript
// src/utils/contractCache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ContractCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const contractCache = new ContractCache();

// Cache keys
export const getCacheKey = {
  projectData: (projectId: number) => `project:${projectId}`,
  profile: (address: string) => `profile:${address}`,
  scoutEarnings: (address: string) => `scout-earnings:${address}`
};
```

### 2. Optimistic Updates

```typescript
// src/hooks/useOptimisticProjectUpdate.ts

import { useState } from 'react';
import { ProjectData, ProjectStatus } from '@/types/contracts';
import { contractCache, getCacheKey } from '@/utils/contractCache';

export const useOptimisticProjectUpdate = (projectId: number) => {
  const [optimisticData, setOptimisticData] = useState<ProjectData | null>(null);

  const updateOptimistically = (updates: Partial<ProjectData>) => {
    const cacheKey = getCacheKey.projectData(projectId);
    const currentData = contractCache.get<ProjectData>(cacheKey);
    
    if (currentData) {
      const newData = { ...currentData, ...updates };
      setOptimisticData(newData);
      contractCache.set(cacheKey, newData, 5000); // Short TTL for optimistic data
    }
  };

  const revertOptimistic = () => {
    setOptimisticData(null);
    contractCache.invalidate(getCacheKey.projectData(projectId));
  };

  return {
    optimisticData,
    updateOptimistically,
    revertOptimistic
  };
};
```

### 3. Batch Read Operations

```typescript
// src/services/batchReader.ts

import { ProjectEscrowService } from './projectEscrowService';
import { ProjectData } from '@/types/contracts';

export class BatchReader {
  private escrowService: ProjectEscrowService;

  constructor(escrowService: ProjectEscrowService) {
    this.escrowService = escrowService;
  }

  async fetchMultipleProjects(
    projectIds: number[],
    senderAddress: string
  ): Promise<Map<number, ProjectData>> {
    const results = new Map<number, ProjectData>();

    // Fetch in parallel
    const promises = projectIds.map(async (id) => {
      try {
        const data = await this.escrowService.getProjectData(id, senderAddress);
        if (data) {
          results.set(id, data);
        }
      } catch (error) {
        console.error(`Failed to fetch project ${id}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }
}
```


## Security Considerations

### 1. Post-Conditions

Post-conditions are critical for ensuring transaction safety. They act as assertions that must be true for a transaction to succeed.

```typescript
// Example: Funding escrow with exact amount
const postCondition = makeStandardSTXPostCondition(
  clientAddress,
  FungibleConditionCode.Equal,
  amountMicroSTX
);

// This ensures:
// - Exactly the specified amount is transferred
// - No more, no less
// - Transaction fails if condition not met
```

### 2. Address Validation

```typescript
// src/utils/validation.ts

export const validateStacksAddress = (address: string, networkType: 'testnet' | 'mainnet'): boolean => {
  const prefix = networkType === 'testnet' ? 'ST' : 'SP';
  const regex = new RegExp(`^${prefix}[0-9A-Z]{38,41}$`);
  return regex.test(address);
};

export const validateProjectAmount = (amount: number): { valid: boolean; error?: string } => {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }
  
  return { valid: true };
};

export const validateFeePercent = (percent: number): { valid: boolean; error?: string } => {
  if (percent < 0 || percent > 100) {
    return { valid: false, error: 'Fee percent must be between 0 and 100' };
  }
  
  return { valid: true };
};
```

### 3. Transaction Replay Protection

The Stacks blockchain provides built-in replay protection through nonces. Each transaction includes a nonce that must be sequential for the sender's account.

### 4. Scout Address Verification

```typescript
// Verify Scout address before project creation
const verifyScoutAddress = async (scoutAddress: string): Promise<boolean> => {
  try {
    // Check if address has registered profile
    const profile = await profileRegistry.getProfile(scoutAddress);
    
    // Optionally verify Scout role in profile data
    if (profile) {
      const profileData = JSON.parse(profile);
      return profileData.roles?.includes('scout') || false;
    }
    
    return false;
  } catch {
    return false;
  }
};
```


## Migration from Mock Data

### Phase 1: Parallel Operation

During migration, run both mock and real data systems in parallel:

```typescript
// src/hooks/useProjectDataWithFallback.ts

import { useProjectData } from './useProjectData';
import { mockContracts } from '@/lib/mockData';

export const useProjectDataWithFallback = (projectId: number) => {
  const { data: onChainData, loading, error } = useProjectData({ projectId });
  
  // During migration, fall back to mock data if on-chain data unavailable
  const data = onChainData || mockContracts.find(c => c.id === projectId.toString());
  
  return {
    data,
    loading,
    error,
    isOnChain: !!onChainData
  };
};
```

### Phase 2: Data Migration Script

```typescript
// scripts/migrateToOnChain.ts

import { mockContracts } from '../src/lib/mockData';
import { ProjectEscrowService } from '../src/services/projectEscrowService';

async function migrateProjects() {
  const escrowService = new ProjectEscrowService('testnet');
  
  for (const mockProject of mockContracts) {
    console.log(`Migrating project: ${mockProject.project_title}`);
    
    // Create on-chain project
    // Note: This would need to be done through the UI with proper wallet signatures
    // This script is for reference only
    
    const projectData = {
      talent: mockProject.talent_id,
      scout: mockProject.scout_id || mockProject.client_id,
      amount: mockProject.total_value,
      scoutFee: 15,
      platformFee: 5
    };
    
    console.log('Project data:', projectData);
  }
}
```

### Phase 3: Remove Mock Data

Once all projects are on-chain:

1. Remove mock data imports
2. Update components to use only on-chain hooks
3. Remove fallback logic
4. Update tests to use testnet data


## Deployment Checklist

### Pre-Deployment

- [ ] Install required dependencies
  ```bash
  npm install @stacks/transactions @stacks/network @stacks/connect
  ```

- [ ] Create contract configuration files
- [ ] Set up environment variables
  ```env
  VITE_NETWORK=testnet
  VITE_PROFILE_REGISTRY_CONTRACT=ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry
  VITE_PROJECT_ESCROW_CONTRACT=ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow
  ```

- [ ] Implement all service layers
- [ ] Create custom hooks
- [ ] Build UI components
- [ ] Write unit tests
- [ ] Write integration tests

### Testing Phase

- [ ] Test on Stacks Testnet
- [ ] Verify all contract calls work correctly
- [ ] Test Scout tracking flow end-to-end
- [ ] Test project creation with real STX
- [ ] Test escrow funding
- [ ] Test payout distribution
- [ ] Verify transaction status tracking
- [ ] Test error handling
- [ ] Test with multiple wallets (Xverse, Leather)

### Production Deployment

- [ ] Deploy contracts to Mainnet
- [ ] Update contract addresses in config
- [ ] Switch network to mainnet
- [ ] Perform final testing on mainnet
- [ ] Monitor first transactions closely
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics
- [ ] Create user documentation
- [ ] Prepare support resources

### Post-Deployment

- [ ] Monitor transaction success rates
- [ ] Track gas fees
- [ ] Gather user feedback
- [ ] Optimize based on usage patterns
- [ ] Plan for contract upgrades if needed


## Summary

This design document provides a comprehensive architecture for integrating the deployed REFERYDO! smart contracts with the React frontend. The key components include:

### Core Architecture
- **Service Layer**: Abstracted contract interactions with `ProfileRegistryService` and `ProjectEscrowService`
- **Transaction Management**: Centralized transaction signing, broadcasting, and status tracking
- **Context Providers**: `ContractContext` and `ScoutTrackingContext` for app-wide state management

### Custom Hooks
- `useRegisterProfile` - Profile registration on-chain
- `useCreateProject` - Project creation with automatic Scout attribution
- `useFundEscrow` - Escrow funding with post-conditions
- `useApproveAndDistribute` - Atomic payout distribution
- `useProjectData` - Real-time project data fetching with caching
- `useScoutEarnings` - Scout earnings tracking and analytics

### UI Components
- `TransactionStatus` - Real-time transaction feedback
- `ScoutBanner` - Visual Scout session indicator
- `ProjectCreationModal` - Complete project creation flow with Trinity visualization

### Key Features
- **Type-Safe**: Full TypeScript integration with Clarity types
- **Optimistic Updates**: Immediate UI feedback with cache invalidation
- **Error Handling**: Comprehensive error mapping and user-friendly messages
- **Performance**: Caching, batch operations, and optimized read calls
- **Security**: Post-conditions, address validation, and replay protection
- **Testing**: Unit, integration, and E2E test strategies

### Scout Guarantee Implementation
The design ensures the Scout commission guarantee through:
1. **Immutable Storage**: Scout address stored permanently on-chain during project creation
2. **Atomic Payouts**: Three-way distribution in a single transaction (all or nothing)
3. **Contract Enforcement**: Smart contract logic prevents bypassing Scout payment
4. **Transparent Tracking**: All participants can verify Scout attribution on-chain

This architecture transforms REFERYDO! from a UI prototype into a fully functional Web3 platform with mathematically guaranteed Scout commissions backed by blockchain immutability.

