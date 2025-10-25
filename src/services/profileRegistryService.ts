import { ContractService } from './contractService';
import { principalCV } from '@stacks/transactions';
import { CONTRACTS } from '@/config/contracts';

export class ProfileRegistryService extends ContractService {
  constructor(networkType: 'testnet' | 'mainnet' = 'testnet') {
    const config = CONTRACTS[networkType];
    super(config.profileRegistry, networkType);
  }

  // Read-only: Get profile data for a user
  async getProfile(userAddress: string): Promise<string | null> {
    try {
      const result = await this.callReadOnly<any>(
        'get-profile',
        [principalCV(userAddress)],
        userAddress
      );

      // Result is (optional (string-utf8 256))
      if (result.value) {
        return result.value.value;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
}
