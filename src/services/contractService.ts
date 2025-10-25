import { 
  fetchCallReadOnlyFunction, 
  cvToJSON, 
  ClarityValue,
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';
import { getContractConfig, parseContractAddress } from '@/config/contracts';

export class ContractService {
  protected network: StacksNetwork;
  public contractAddress: string;
  protected deployer: string;
  protected contractName: string;

  constructor(contractAddress: string, networkType: 'testnet' | 'mainnet' = 'testnet') {
    const config = getContractConfig(networkType);
    this.network = config.network;
    this.contractAddress = contractAddress;
    
    const parsed = parseContractAddress(contractAddress);
    this.deployer = parsed.deployer;
    this.contractName = parsed.contractName;
  }

  // Read-only function call (no gas fees)
  protected async callReadOnly<T>(
    functionName: string,
    functionArgs: ClarityValue[],
    senderAddress: string
  ): Promise<T> {
    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: this.deployer,
        contractName: this.contractName,
        functionName,
        functionArgs,
        senderAddress,
        network: this.network,
      });

      return this.parseReadOnlyResult<T>(result);
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  // Parse Clarity response to JSON
  protected parseReadOnlyResult<T>(result: ClarityValue): T {
    const json = cvToJSON(result);
    return json as T;
  }

  // Map contract error codes to messages
  protected mapErrorCode(code: number): string {
    const errorMap: Record<number, string> = {
      101: 'You are not authorized to perform this action',
      102: 'Project not found',
      103: 'Project is in the wrong status for this action',
      104: 'Failed to transfer funds to escrow',
      105: 'Fee Calculation Error: The calculated fees exceed the total project amount. Please contact support.' // ✅ v5: Production-ready error handling
    };
    return errorMap[code] || `Unknown error (code: ${code})`;
  }
}
