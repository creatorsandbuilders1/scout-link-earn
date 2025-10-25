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
  console.log('[CONTRACT] Initializing ContractProvider...');
  
  const { network } = useWallet();
  
  // Use network type directly from wallet context
  const networkType: 'testnet' | 'mainnet' = useMemo(() => {
    console.log('[CONTRACT] Network type determined:', { network });
    return network;
  }, [network]);

  const value = useMemo(() => {
    console.log('[CONTRACT] Creating contract services for network:', networkType);
    
    try {
      const config = getContractConfig(networkType);
      console.log('[CONTRACT] Config loaded:', config);
      
      const services = {
        profileRegistry: new ProfileRegistryService(networkType),
        projectEscrow: new ProjectEscrowService(networkType),
        transactionManager: new TransactionManager(config.network),
        networkType
      };
      
      console.log('[CONTRACT] Services created successfully');
      return services;
    } catch (error) {
      console.error('[CONTRACT] Error creating services:', error);
      throw error;
    }
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
