import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { uintCV, PostConditionMode } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

export const useFundEscrow = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { stacksAddress } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const fundEscrow = async (projectId: number, amountSTX: number) => {
    const clientAddress = stacksAddress;
    
    if (!clientAddress) {
      throw new Error('Wallet not connected');
    }

    const amountMicroSTX = BigInt(amountSTX * 1_000_000);

    const { deployer, contractName } = parseContractAddress(
      projectEscrow.contractAddress
    );

    try {
      // Note: Post-conditions would be added here for production
      // For now, using Allow mode to enable the STX transfer
      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'fund-escrow',
          functionArgs: [uintCV(projectId)],
          postConditionMode: PostConditionMode.Allow,
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
