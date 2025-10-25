import { useState, useEffect } from 'react';
import { useContract } from '@/contexts/ContractContext';
import { useWallet } from '@/contexts/WalletContext';
import { ProjectData, ProjectStatus } from '@/types/contracts';

interface ScoutEarning {
  projectId: number;
  project: ProjectData;
  commission: bigint;
  status: ProjectStatus;
}

export const useScoutEarnings = () => {
  const { projectEscrow } = useContract();
  const { stacksAddress } = useWallet();
  const [earnings, setEarnings] = useState<ScoutEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScoutEarnings = async () => {
      const scoutAddress = stacksAddress;
      
      if (!scoutAddress) {
        setError('Wallet not connected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Note: This is a simplified version. In production, you'd need to:
        // 1. Query a backend API that indexes blockchain events
        // 2. Or use Stacks API to find transactions involving the Scout
        
        // For now, we'll fetch a range of project IDs
        // This should be replaced with proper indexing
        const maxProjectId = 100; // Adjust based on your needs
        const scoutProjects: ScoutEarning[] = [];

        for (let id = 1; id <= maxProjectId; id++) {
          try {
            const projectData = await projectEscrow.getProjectData(id, scoutAddress);
            
            if (projectData && projectData.scout === scoutAddress) {
              const payouts = projectEscrow.calculatePayouts(
                projectData.amount,
                projectData.scoutFeePercent,
                projectData.platformFeePercent
              );

              scoutProjects.push({
                projectId: id,
                project: projectData,
                commission: payouts.scout,
                status: projectData.status
              });
            }
          } catch {
            // Project doesn't exist or error fetching, continue
            continue;
          }
        }

        setEarnings(scoutProjects);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch earnings');
      } finally {
        setLoading(false);
      }
    };

    fetchScoutEarnings();
  }, [projectEscrow, stacksAddress]);

  // Calculate totals
  const totalEarned = earnings
    .filter(e => e.status === ProjectStatus.Completed)
    .reduce((sum, e) => sum + e.commission, 0n);

  const pendingEarnings = earnings
    .filter(e => e.status === ProjectStatus.Funded)
    .reduce((sum, e) => sum + e.commission, 0n);

  return {
    earnings,
    totalEarned,
    pendingEarnings,
    loading,
    error
  };
};
