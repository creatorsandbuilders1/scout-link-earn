import { request } from '@stacks/connect';
import type { StacksNetwork } from '@stacks/network';
import { 
  PostConditionMode,
  ClarityValue,
  PostCondition
} from '@stacks/transactions';
import { TransactionStatus, TransactionState } from '@/types/contracts';

interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditions?: PostCondition[];
  postConditionMode?: PostConditionMode;
}

export class TransactionManager {
  private network: StacksNetwork;

  constructor(network: StacksNetwork) {
    this.network = network;
  }

  /**
   * Execute a contract call with transaction tracking
   * Uses @stacks/connect unified interface for both Xverse and Leather wallets
   */
  async executeContractCall(
    options: ContractCallParams,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    try {
      console.log('[TRANSACTION] Executing contract call:', options);
      onStatusChange?.({ state: TransactionState.Signing });

      // Use @stacks/connect request method for contract calls
      const response = await request('stx_callContract', {
        contract: `${options.contractAddress}.${options.contractName}`,
        functionName: options.functionName,
        functionArgs: options.functionArgs,
        postConditions: options.postConditions,
        postConditionMode: options.postConditionMode === PostConditionMode.Allow ? 'allow' : 'deny',
        network: this.network.chainId === 1 ? 'mainnet' : 'testnet',
      });

      console.log('[TRANSACTION] Transaction response:', response);
      
      if (response.txid) {
        onStatusChange?.({ 
          state: TransactionState.Broadcasting,
          txId: response.txid 
        });
        
        // Start polling for confirmation
        await this.pollTransactionStatus(response.txid, onStatusChange);
        return response.txid;
      } else {
        throw new Error('No transaction ID returned from wallet');
      }
    } catch (error) {
      console.error('[TRANSACTION] Contract call failed:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
          onStatusChange?.({ 
            state: TransactionState.Failed,
            error: 'Transaction cancelled by user'
          });
        } else {
          onStatusChange?.({ 
            state: TransactionState.Failed,
            error: error.message
          });
        }
      }
      
      throw error;
    }
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
        // Determine API URL based on network
        const apiUrl = this.network.chainId === 1
          ? 'https://api.mainnet.hiro.so'
          : 'https://api.testnet.hiro.so';
        const response = await fetch(
          `${apiUrl}/extended/v1/tx/${txId}`
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
  // Note: Post-conditions will be created inline when needed
  // using the appropriate functions from @stacks/transactions
}
