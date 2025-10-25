import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { uintCV, PostConditionMode } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';
import { supabase } from '@/lib/supabase';

export const useApproveAndDistribute = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { stacksAddress } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const approveAndDistribute = async (projectId: number) => {
    const clientAddress = stacksAddress;
    
    if (!clientAddress) {
      throw new Error('Wallet not connected');
    }

    const { deployer, contractName } = parseContractAddress(
      projectEscrow.contractAddress
    );

    try {
      // Execute the blockchain transaction and wait for confirmation
      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'approve-and-distribute',
          functionArgs: [uintCV(projectId)],
          postConditionMode: PostConditionMode.Allow, // Contract handles transfers
        },
        setStatus
      );

      // CRITICAL: Only sync database AFTER blockchain confirmation
      // The transactionManager.executeContractCall waits for tx_status === 'success'
      console.log('[APPROVE] Transaction confirmed, syncing database...');
      
      try {
        // Call sync-on-chain-contract Edge Function to update database
        const { data: syncData, error: syncError } = await supabase.functions.invoke(
          'sync-on-chain-contract',
          {
            body: {
              projectId,
              txId,
              contractAddress: projectEscrow.contractAddress
            }
          }
        );

        if (syncError) {
          console.error('[APPROVE] Database sync failed:', syncError);
          // Transaction succeeded on-chain but DB sync failed
          // This is not critical - the blockchain is the source of truth
        } else {
          console.log('[APPROVE] Database synced successfully:', syncData);
        }
      } catch (syncErr) {
        console.error('[APPROVE] Database sync error:', syncErr);
        // Non-critical error - blockchain transaction succeeded
      }

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
