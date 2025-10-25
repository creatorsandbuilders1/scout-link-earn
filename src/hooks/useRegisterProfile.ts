import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { stringUtf8CV } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

export const useRegisterProfile = () => {
  const { profileRegistry, transactionManager, networkType } = useContract();
  const { stacksAddress } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const registerProfile = async (profileData: string) => {
    const userAddress = stacksAddress;
    
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

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
