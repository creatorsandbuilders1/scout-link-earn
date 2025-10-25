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
  const { stacksAddress } = useWallet();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    const senderAddress = stacksAddress;
    
    if (!senderAddress) {
      setError('Wallet not connected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const projectData = await projectEscrow.getProjectData(
        projectId,
        senderAddress
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
  }, [projectId, projectEscrow, stacksAddress]);

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
