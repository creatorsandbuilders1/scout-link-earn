import { ContractService } from './contractService';
import { uintCV } from '@stacks/transactions';
import { CONTRACTS } from '@/config/contracts';
import { ProjectData, ProjectStatus } from '@/types/contracts';

export class ProjectEscrowService extends ContractService {
  constructor(networkType: 'testnet' | 'mainnet' = 'testnet') {
    const config = CONTRACTS[networkType];
    super(config.projectEscrow, networkType);
  }

  // Read-only: Get project data
  async getProjectData(projectId: number, senderAddress: string): Promise<ProjectData | null> {
    try {
      const result = await this.callReadOnly<any>(
        'get-project-data',
        [uintCV(projectId)],
        senderAddress
      );

      // Result is (optional { ... })
      if (result.value) {
        const data = result.value;
        return {
          client: data.client.value,
          talent: data.talent.value,
          scout: data.scout.value,
          amount: BigInt(data.amount.value),
          scoutFeePercent: Number(data['scout-fee-percent'].value),
          platformFeePercent: Number(data['platform-fee-percent'].value),
          status: Number(data.status.value) as ProjectStatus
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching project data:', error);
      return null;
    }
  }

  // Calculate payout breakdown
  calculatePayouts(amount: bigint, scoutFeePercent: number, platformFeePercent: number) {
    const scoutPayout = (amount * BigInt(scoutFeePercent)) / 100n;
    const platformPayout = (amount * BigInt(platformFeePercent)) / 100n;
    const talentPayout = amount - scoutPayout - platformPayout;

    return {
      talent: talentPayout,
      scout: scoutPayout,
      platform: platformPayout,
      total: amount
    };
  }
}
