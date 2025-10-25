import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/contexts/WalletContext';
import { ProjectStatus } from '@/types/contracts';

export interface WorkspaceContract {
  id: number;
  project_id: number;
  project_title: string | null;
  project_brief: string | null;
  client_id: string;
  talent_id: string;
  scout_id: string;
  amount_micro_stx: number;
  scout_fee_percent: number;
  platform_fee_percent: number;
  status: number;
  created_at: string;
  funded_at: string | null;
  completed_at: string | null;
  create_tx_id: string;
  fund_tx_id: string | null;
  complete_tx_id: string | null;
  // Related data
  client?: {
    username: string;
    avatar_url: string | null;
  };
  talent?: {
    username: string;
    avatar_url: string | null;
  };
  scout?: {
    username: string;
    avatar_url: string | null;
  };
}

export type ContractFilter = 'all' | 'active' | 'pending' | 'completed';

export const useWorkspaceContracts = () => {
  const { stacksAddress } = useWallet();
  const [contracts, setContracts] = useState<WorkspaceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContractFilter>('all');

  const fetchContracts = async () => {
    if (!stacksAddress) {
      setContracts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[WORKSPACE] Fetching contracts for:', stacksAddress);

      // Fetch all contracts where user is either client or talent
      const { data, error: fetchError } = await supabase
        .from('on_chain_contracts')
        .select(`
          *,
          client:client_id (username, avatar_url),
          talent:talent_id (username, avatar_url),
          scout:scout_id (username, avatar_url)
        `)
        .or(`client_id.eq.${stacksAddress},talent_id.eq.${stacksAddress}`)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[WORKSPACE] Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('[WORKSPACE] Contracts loaded:', data?.length || 0);
      setContracts(data || []);
    } catch (err) {
      console.error('[WORKSPACE] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [stacksAddress]);

  // Filter contracts based on selected filter
  const filteredContracts = contracts.filter((contract) => {
    switch (filter) {
      case 'active':
        return contract.status === ProjectStatus.Funded; // Status 1
      case 'pending':
        return contract.status === ProjectStatus.PendingAcceptance; // Status 4
      case 'completed':
        return contract.status === ProjectStatus.Completed; // Status 2
      case 'all':
      default:
        return true;
    }
  });

  // Helper to determine user's role in contract
  const getUserRole = (contract: WorkspaceContract): 'client' | 'talent' | 'scout' | null => {
    if (!stacksAddress) return null;
    if (contract.client_id === stacksAddress) return 'client';
    if (contract.talent_id === stacksAddress) return 'talent';
    if (contract.scout_id === stacksAddress) return 'scout';
    return null;
  };

  // Helper to get the "other party" in the contract
  const getOtherParty = (contract: WorkspaceContract) => {
    const role = getUserRole(contract);
    if (role === 'client') {
      return {
        role: 'talent' as const,
        address: contract.talent_id,
        username: contract.talent?.username || 'Unknown',
        avatar: contract.talent?.avatar_url,
      };
    } else if (role === 'talent') {
      return {
        role: 'client' as const,
        address: contract.client_id,
        username: contract.client?.username || 'Unknown',
        avatar: contract.client?.avatar_url,
      };
    }
    return null;
  };

  return {
    contracts: filteredContracts,
    allContracts: contracts,
    loading,
    error,
    filter,
    setFilter,
    refetch: fetchContracts,
    getUserRole,
    getOtherParty,
  };
};
