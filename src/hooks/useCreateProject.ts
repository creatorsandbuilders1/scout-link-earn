import { useState, useEffect } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { supabase } from '@/lib/supabase';
import { principalCV, uintCV } from '@stacks/transactions';
import { TransactionStatus, TransactionState, CreateProjectResult } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

interface CreateProjectParams {
  talentAddress: string;
  amountSTX: number;
  scoutFeePercent: number;
  platformFeePercent: number;
}

interface AttributionData {
  scoutId: string;
  finderFeePercent: number;
  isLocked: boolean;
}

export const useCreateProject = () => {
  const { projectEscrow, transactionManager } = useContract();
  const { stacksAddress } = useWallet();
  const { scoutAddress } = useScoutTracking();
  const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });
  const [attributionData, setAttributionData] = useState<AttributionData | null>(null);

  /**
   * Fetch attribution data for current client and talent
   * ✅ CRITICAL: Uses locked commission from client_attributions table
   */
  const fetchAttributionData = async (talentAddress: string): Promise<AttributionData | null> => {
    if (!stacksAddress) return null;

    try {
      console.log('[CREATE_PROJECT] Checking for attribution:', {
        client: stacksAddress,
        talent: talentAddress,
      });

      // Query client_attributions table
      const { data: attribution, error } = await supabase
        .from('client_attributions')
        .select('scout_id, attributed_finder_fee')
        .eq('client_id', stacksAddress)
        .eq('talent_id', talentAddress)
        .eq('status', 'active')
        .maybeSingle() as { data: { scout_id: string; attributed_finder_fee: number } | null; error: any };

      if (error) {
        console.error('[CREATE_PROJECT] Error fetching attribution:', error);
        return null;
      }

      if (attribution) {
        console.log('[CREATE_PROJECT] Attribution found - using locked commission:', {
          scout: attribution.scout_id,
          fee: attribution.attributed_finder_fee + '%',
        });

        return {
          scoutId: attribution.scout_id,
          finderFeePercent: attribution.attributed_finder_fee,
          isLocked: true,
        };
      }

      console.log('[CREATE_PROJECT] No attribution found - self-hire');
      return null;
    } catch (error) {
      console.error('[CREATE_PROJECT] Error checking attribution:', error);
      return null;
    }
  };

  const createProject = async (params: CreateProjectParams): Promise<CreateProjectResult | null> => {
    const clientAddress = stacksAddress;
    
    if (!clientAddress) {
      throw new Error('Wallet not connected');
    }

    // =====================================================
    // CRITICAL: Check for Attribution Record
    // =====================================================
    // This is the new source of truth for Scout attribution
    const attribution = await fetchAttributionData(params.talentAddress);

    let finalScoutAddress: string;
    let finalScoutFeePercent: number;

    if (attribution) {
      // ✅ Use locked attribution data
      finalScoutAddress = attribution.scoutId;
      finalScoutFeePercent = attribution.finderFeePercent;
      console.log('[CREATE_PROJECT] Using locked attribution:', {
        scout: finalScoutAddress,
        fee: finalScoutFeePercent + '%',
      });
    } else {
      // No attribution - self-hire or use current Scout session
      finalScoutAddress = scoutAddress || clientAddress;
      finalScoutFeePercent = params.scoutFeePercent;

      // =====================================================
      // CRITICAL SECURITY: Prevent Self-Referral Loop
      // =====================================================
      if (scoutAddress && scoutAddress === clientAddress) {
        console.warn('[CREATE_PROJECT] Self-referral detected, using client as Scout');
        finalScoutAddress = clientAddress;
      }

      console.log('[CREATE_PROJECT] No attribution - using current session:', {
        scout: finalScoutAddress,
        fee: finalScoutFeePercent + '%',
        isSelfHire: finalScoutAddress === clientAddress,
      });
    }
    
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
            uintCV(finalScoutFeePercent), // ✅ Use locked fee if attribution exists
            uintCV(params.platformFeePercent)
          ],
        },
        setStatus
      );

      // ✅ Mark attribution as used if it exists
      if (attribution) {
        try {
          const { error: rpcError } = await supabase.rpc('mark_attribution_used', {
            p_client_id: clientAddress,
            p_talent_id: params.talentAddress,
          } as any);
          
          if (rpcError) {
            console.error('[CREATE_PROJECT] Error marking attribution as used:', rpcError);
          } else {
            console.log('[CREATE_PROJECT] Attribution marked as used');
          }
        } catch (error) {
          console.error('[CREATE_PROJECT] Error marking attribution as used:', error);
          // Don't fail the transaction if this fails
        }
      }

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
    scoutAddress, // Expose the Scout address being used
    attributionData, // Expose attribution data for UI
    fetchAttributionData, // Expose function to check attribution
  };
};
