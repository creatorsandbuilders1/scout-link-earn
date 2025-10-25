# Accept/Decline Transaction Fix - COMPLETE ✅

## Date: October 24, 2025

## Critical Issue Resolved

**Problem:** "Improperly formatted private-key. Private-key byte length should be 32 or 33. Length provided: 0"

**Root Cause:** useAcceptProject and useDeclineProject hooks were using low-level `makeContractCall` with an empty `senderKey` instead of using the TransactionManager service that properly delegates signing to the user's wallet.

## The Issue

When a Talent clicked "Accept Project" or "Decline Project":
1. Hook called `makeContractCall` with `senderKey: ''` ❌
2. `makeContractCall` tried to sign transaction with empty key ❌
3. Error: "Private-key byte length should be 32 or 33. Length provided: 0" ❌

## The Pattern That Works

All other hooks (useCreateProject, useFundEscrow) use the **TransactionManager** pattern:

```typescript
// ✅ CORRECT PATTERN
const { projectEscrow, transactionManager } = useContract();

const txId = await transactionManager.executeContractCall(
  {
    contractAddress: deployer,
    contractName,
    functionName: 'accept-project',
    functionArgs: [uintCV(projectId)],
  },
  setStatus
);
```

This pattern:
- Uses `@stacks/connect` request method
- Delegates signing to wallet extension (Leather/Xverse)
- Never exposes private keys
- Handles transaction status tracking
- Works with both Leather and Xverse wallets

## Changes Made

### 1. useAcceptProject.ts ✅

**BEFORE (Broken):**
```typescript
import { makeContractCall, broadcastTransaction } from '@stacks/transactions';

const txOptions = {
  contractAddress,
  contractName,
  functionName: 'accept-project',
  functionArgs: [uintCV(projectId)],
  senderKey: '', // ❌ Empty key causes error
  network: contractConfig.network,
  anchorMode: AnchorMode.Any,
  postConditionMode: PostConditionMode.Allow,
};

const transaction = await makeContractCall(txOptions);
const broadcastResult = await broadcastTransaction(transaction, contractConfig.network);
```

**AFTER (Fixed):**
```typescript
import { useContract } from '@/contexts/ContractContext';
import { TransactionStatus, TransactionState } from '@/types/contracts';
import { parseContractAddress } from '@/config/contracts';

const { projectEscrow, transactionManager } = useContract();
const [status, setStatus] = useState<TransactionStatus>({ state: TransactionState.Idle });

const { deployer, contractName } = parseContractAddress(
  projectEscrow.contractAddress
);

const txId = await transactionManager.executeContractCall(
  {
    contractAddress: deployer,
    contractName,
    functionName: 'accept-project',
    functionArgs: [uintCV(projectId)],
  },
  setStatus
);
```

**Key Changes:**
- ✅ Removed `makeContractCall` and `broadcastTransaction`
- ✅ Removed `senderKey`, `AnchorMode`, manual network config
- ✅ Added `useContract` hook
- ✅ Added `TransactionStatus` state management
- ✅ Uses `transactionManager.executeContractCall()`
- ✅ Uses `parseContractAddress` helper
- ✅ Proper transaction status tracking

### 2. useDeclineProject.ts ✅

**Same refactor applied:**
- Removed manual transaction creation
- Uses TransactionManager
- Proper status tracking
- Wallet-delegated signing

## Transaction Flow (After Fix)

### Accept Project Flow

1. **Talent clicks "Accept Project"**
2. **Backend verification:**
   ```typescript
   POST /functions/v1/accept-project
   Body: { projectId: 5, talentId: "ST1P97..." }
   Response: { success: true, project: {...} }
   ```
3. **TransactionManager.executeContractCall:**
   - Calls `@stacks/connect` request method
   - Opens wallet popup (Leather/Xverse)
   - User signs transaction in wallet ✅
   - Transaction broadcast to blockchain
   - Status tracking: Signing → Broadcasting → Pending → Success
4. **Database sync:**
   ```typescript
   POST /functions/v1/sync-on-chain-contract
   Body: { projectId: 5, txId: "...", newStatus: 1 }
   ```
5. **Success toast:** "Project accepted successfully!"

### Decline Project Flow

Same flow as accept, but:
- Calls `decline-project` function
- Updates status to 5 (Declined)
- Toast: "Project declined successfully!"

## Files Modified

1. ✅ **src/hooks/useAcceptProject.ts**
   - Removed: `makeContractCall`, `broadcastTransaction`, `senderKey`
   - Added: `useContract`, `transactionManager`, `TransactionStatus`
   - Pattern: Matches useCreateProject and useFundEscrow

2. ✅ **src/hooks/useDeclineProject.ts**
   - Same refactor as useAcceptProject
   - Consistent pattern across all transaction hooks

## Standardization Complete

All transaction hooks now follow the same pattern:

| Hook | Uses TransactionManager | Status Tracking | Wallet Signing |
|------|------------------------|-----------------|----------------|
| useCreateProject | ✅ | ✅ | ✅ |
| useFundEscrow | ✅ | ✅ | ✅ |
| useAcceptProject | ✅ | ✅ | ✅ |
| useDeclineProject | ✅ | ✅ | ✅ |

## Testing Checklist

- [x] No TypeScript errors
- [x] Hooks compile successfully
- [ ] Talent can accept project (test in browser)
- [ ] Wallet popup opens correctly
- [ ] Transaction signs successfully
- [ ] Status updates in real-time
- [ ] Database syncs correctly
- [ ] Talent can decline project
- [ ] Both flows show proper toasts

## Expected Behavior

When Talent clicks "Accept Project":

1. ✅ Backend verifies project (200 OK)
2. ✅ Wallet popup opens (Leather/Xverse)
3. ✅ User signs transaction
4. ✅ Transaction broadcasts
5. ✅ Status updates: Signing → Broadcasting → Pending → Success
6. ✅ Database syncs
7. ✅ Success toast appears
8. ✅ Workspace refreshes with updated status

## Security & Best Practices

✅ **No private keys in frontend code**  
✅ **Wallet-delegated signing**  
✅ **Consistent transaction pattern**  
✅ **Proper error handling**  
✅ **Transaction status tracking**  
✅ **Backend verification before blockchain call**  

## Related Fixes

This completes the transaction standardization effort:

1. ✅ **Database Schema** - Fixed column names (client_id, talent_id, scout_id)
2. ✅ **Edge Functions** - Fixed queries to use correct column names
3. ✅ **Frontend Hooks** - Fixed to use TransactionManager pattern
4. ✅ **Workspace** - Displays contracts correctly
5. ✅ **Accept/Decline** - Now uses proper wallet signing

---

**Status:** COMPLETE ✅  
**Ready for:** Browser testing  
**Next Step:** Test accept/decline flow with real wallet
