import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { uintCV } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';
import { toast } from 'sonner';

export const useAcceptProject = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { stacksAddress } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const acceptProject = async (projectId: number): Promise<boolean> => {
    if (!stacksAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('[ACCEPT_PROJECT] Starting acceptance for project:', projectId);

      // Step 1: Verify project with backend
      const verifyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-project`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            projectId,
            talentId: stacksAddress,
          }),
        }
      );

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Project verification failed');
      }

      console.log('[ACCEPT_PROJECT] Project verified:', verifyResult.project);

      // Step 2: Call smart contract accept-project function using TransactionManager
      const { deployer, contractName } = parseContractAddress(
        projectEscrow.contractAddress
      );

      console.log('[ACCEPT_PROJECT] Calling smart contract...');
      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'accept-project',
          functionArgs: [uintCV(projectId)],
        },
        setStatus
      );

      console.log('[ACCEPT_PROJECT] Transaction successful:', txId);

      // Step 3: Update local database (via sync function)
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-on-chain-contract`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              projectId,
              txId,
              newStatus: 1, // Funded status
            }),
          }
        );
      } catch (syncError) {
        console.warn('[ACCEPT_PROJECT] Sync warning:', syncError);
        // Don't fail the whole operation for sync issues
      }

      toast.success('Project accepted successfully!', {
        description: 'You can now begin work on this project.',
      });

      return true;
    } catch (error) {
      console.error('[ACCEPT_PROJECT] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept project';
      setStatus({
        state: TransactionState.Failed,
        error: errorMessage
      });
      toast.error('Failed to accept project', {
        description: errorMessage,
      });
      return false;
    }
  };

  return {
    acceptProject,
    status,
    isLoading: status.state === TransactionState.Signing || 
               status.state === TransactionState.Broadcasting ||
               status.state === TransactionState.Pending,
  };
};
