import { useState } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { uintCV } from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';
import { toast } from 'sonner';

export const useDeclineProject = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { stacksAddress } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

  const declineProject = async (projectId: number): Promise<boolean> => {
    if (!stacksAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('[DECLINE_PROJECT] Starting decline for project:', projectId);

      // Step 1: Verify project with backend
      const verifyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/decline-project`,
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

      console.log('[DECLINE_PROJECT] Project verified:', verifyResult.project);

      // Step 2: Call smart contract decline-project function using TransactionManager
      const { deployer, contractName } = parseContractAddress(
        projectEscrow.contractAddress
      );

      console.log('[DECLINE_PROJECT] Calling smart contract...');
      const txId = await transactionManager.executeContractCall(
        {
          contractAddress: deployer,
          contractName,
          functionName: 'decline-project',
          functionArgs: [uintCV(projectId)],
        },
        setStatus
      );

      console.log('[DECLINE_PROJECT] Transaction successful:', txId);

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
              newStatus: 5, // Declined status
            }),
          }
        );
      } catch (syncError) {
        console.warn('[DECLINE_PROJECT] Sync warning:', syncError);
        // Don't fail the whole operation for sync issues
      }

      toast.success('Project declined successfully!', {
        description: 'The client has been automatically refunded.',
      });

      return true;
    } catch (error) {
      console.error('[DECLINE_PROJECT] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to decline project';
      setStatus({
        state: TransactionState.Failed,
        error: errorMessage
      });
      toast.error('Failed to decline project', {
        description: errorMessage,
      });
      return false;
    }
  };

  return {
    declineProject,
    status,
    isLoading: status.state === TransactionState.Signing || 
               status.state === TransactionState.Broadcasting ||
               status.state === TransactionState.Pending,
  };
};
