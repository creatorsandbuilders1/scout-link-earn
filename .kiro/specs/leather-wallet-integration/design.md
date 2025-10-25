# Design Document: Leather Wallet Integration

## Overview

This design document outlines the implementation approach for integrating Leather wallet support using the `@stacks/connect` v8+ unified wallet interface. The solution replaces the current `sats-connect` implementation with the modern `@stacks/connect` package that provides native support for both Xverse and Leather wallets through a standardized SIP-030 interface.

### Key Design Decisions

1. **Unified Interface**: Use `@stacks/connect` for all wallet operations instead of separate implementations
2. **Provider Agnostic**: Let `@stacks/connect` handle wallet-specific logic internally
3. **Simplified State**: Remove wallet-type tracking since the SDK handles provider selection
4. **Standard Methods**: Use `connect()`, `request()`, and wallet-specific methods from the SDK

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────┐     │
│  │ WalletContext    │◄────────┤ Components           │     │
│  │ (State Manager)  │         │ - Navigation         │     │
│  └────────┬─────────┘         │ - WalletModal        │     │
│           │                   │ - ProjectCreation    │     │
│           │                   └──────────────────────┘     │
│           │                                                 │
│           ▼                                                 │
│  ┌──────────────────┐         ┌──────────────────────┐     │
│  │ @stacks/connect  │◄────────┤ TransactionManager   │     │
│  │ (Wallet SDK)     │         │ (Transaction Logic)  │     │
│  └────────┬─────────┘         └──────────────────────┘     │
│           │                                                 │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────┐
│              Browser Wallet Extensions                     │
│  ┌──────────────────┐         ┌──────────────────────┐   │
│  │ Xverse Wallet    │         │ Leather Wallet       │   │
│  │ (StacksProvider) │         │ (LeatherProvider)    │   │
│  └──────────────────┘         └──────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. WalletContext

**Purpose**: Manages wallet connection state and provides wallet operations to the application.

**Interface**:
```typescript
interface WalletContextType {
  isConnected: boolean;
  stacksAddress: string | null;
  bitcoinAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  network: 'mainnet' | 'testnet';
}
```

**Key Methods**:

- `connectWallet()`: Initiates wallet connection using `@stacks/connect`'s `connect()` function
- `disconnectWallet()`: Clears connection state using `disconnect()`
- `isConnected()`: Checks connection status using `isConnected()`
- Address getters: Retrieve addresses from local storage populated by `connect()`

**Implementation Details**:

```typescript
// Connection flow
const connectWallet = async () => {
  try {
    const response = await connect({
      forceWalletSelect: true, // Always show wallet selection
      approvedProviderIds: ['LeatherProvider', 'xverse'], // Support both wallets
    });
    
    // Addresses are automatically stored in localStorage by @stacks/connect
    // Retrieve them using getLocalStorage()
    const data = getLocalStorage();
    
    // Update React state
    setStacksAddress(data.addresses.stx[0]?.address);
    setBitcoinAddress(data.addresses.btc[0]?.address);
    setIsConnected(true);
  } catch (error) {
    console.error('Connection failed:', error);
    throw error;
  }
};
```

### 2. WalletSelectionModal

**Purpose**: Displays available wallets and handles user selection.

**Interface**:
```typescript
interface WalletSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => Promise<void>;
}
```

**Design Notes**:

- Modal is simplified since `@stacks/connect` handles wallet selection internally
- The `forceWalletSelect: true` option shows the SDK's built-in wallet picker
- We can still show our custom modal for branding/UX, then call `connect()`
- Wallet detection is handled by the SDK automatically

**Wallet Information Display**:

```typescript
const wallets = [
  {
    id: 'xverse',
    name: 'Xverse Wallet',
    description: 'Bitcoin & Stacks wallet with Ordinals support',
    downloadUrl: 'https://www.xverse.app/',
    features: ['Bitcoin', 'Stacks', 'Ordinals', 'BRC-20'],
  },
  {
    id: 'leather',
    name: 'Leather Wallet',
    description: 'Stacks-native wallet (formerly Hiro Wallet)',
    downloadUrl: 'https://leather.io/install-extension',
    features: ['Stacks', 'Bitcoin', 'STX Tokens'],
  },
];
```

### 3. TransactionManager

**Purpose**: Handles blockchain transaction execution using the connected wallet.

**Interface**:
```typescript
interface TransactionManagerInterface {
  executeContractCall(
    params: ContractCallParams,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string>;
  
  transferSTX(
    params: STXTransferParams,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string>;
}
```

**Key Changes**:

Replace `openContractCall` with `request('stx_callContract', params)`:

```typescript
async executeContractCall(params: ContractCallParams): Promise<string> {
  try {
    const response = await request('stx_callContract', {
      contract: `${params.contractAddress}.${params.contractName}`,
      functionName: params.functionName,
      functionArgs: params.functionArgs,
      network: this.network,
    });
    
    return response.txid;
  } catch (error) {
    console.error('Contract call failed:', error);
    throw error;
  }
}
```

**Transaction Status Polling**:

- Remains unchanged - still polls Hiro API for transaction status
- Uses network-specific API URLs (mainnet vs testnet)
- Implements exponential backoff for retries

## Data Models

### Connection State (LocalStorage)

```typescript
interface StoredConnectionData {
  addresses: {
    stx: Array<{
      address: string;
      publicKey?: string;
    }>;
    btc: Array<{
      address: string;
      publicKey?: string;
    }>;
  };
}
```

**Storage Keys**:
- `stacks-connect-addresses`: Managed by `@stacks/connect` SDK
- `referydo_network`: Application-specific network setting

### Transaction State

```typescript
enum TransactionState {
  Idle = 'idle',
  Signing = 'signing',
  Broadcasting = 'broadcasting',
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

interface TransactionStatus {
  state: TransactionState;
  txId?: string;
  blockHeight?: number;
  error?: string;
}
```

## Error Handling

### Error Categories

1. **Wallet Not Found**
   - Error: User doesn't have wallet extension installed
   - Handling: Show install instructions with download link
   - Recovery: User installs wallet and retries

2. **Connection Cancelled**
   - Error: User cancels wallet connection prompt
   - Handling: Silent failure, return to previous state
   - Recovery: User can retry connection

3. **Transaction Rejected**
   - Error: User rejects transaction in wallet
   - Handling: Show "Transaction cancelled" message
   - Recovery: User can retry transaction

4. **Network Error**
   - Error: API request fails or times out
   - Handling: Retry with exponential backoff (3 attempts)
   - Recovery: Show error message, allow manual retry

5. **Invalid State**
   - Error: Corrupted localStorage data
   - Handling: Clear storage and reset to disconnected state
   - Recovery: User reconnects wallet

### Error Handling Flow

```typescript
try {
  await connect();
} catch (error) {
  if (error.code === 'WALLET_NOT_FOUND') {
    showInstallInstructions();
  } else if (error.code === 'USER_CANCELLED') {
    // Silent - user intentionally cancelled
    return;
  } else {
    showErrorMessage(error.message);
    logError(error);
  }
}
```

## Testing Strategy

### Unit Tests

1. **WalletContext Tests**
   - Test connection state management
   - Test address retrieval
   - Test disconnect functionality
   - Test localStorage persistence

2. **TransactionManager Tests**
   - Test contract call execution
   - Test transaction status polling
   - Test error handling
   - Test retry logic

### Integration Tests

1. **Wallet Connection Flow**
   - Test Xverse connection (if available)
   - Test Leather connection (if available)
   - Test connection persistence across page reloads
   - Test disconnect and reconnect

2. **Transaction Flow**
   - Test contract call with mock wallet
   - Test transaction status updates
   - Test transaction failure scenarios

### Manual Testing Checklist

- [ ] Connect with Xverse wallet on testnet
- [ ] Connect with Leather wallet on testnet
- [ ] Verify addresses are correctly retrieved
- [ ] Create a project (contract call)
- [ ] Fund escrow (contract call)
- [ ] Verify transaction status updates
- [ ] Disconnect and verify state cleared
- [ ] Reload page and verify connection restored
- [ ] Test with wallet not installed
- [ ] Test cancelling connection
- [ ] Test rejecting transaction

## Migration Plan

### Phase 1: Update Dependencies

1. Install `@stacks/connect` v8+
2. Remove `@leather.io/rpc` (no longer needed)
3. Keep `@stacks/transactions` and `@stacks/network`

### Phase 2: Update WalletContext

1. Replace `sats-connect` imports with `@stacks/connect`
2. Update `connectWallet()` to use `connect()`
3. Update `disconnectWallet()` to use `disconnect()`
4. Update address retrieval to use `getLocalStorage()`
5. Remove wallet-type tracking (no longer needed)

### Phase 3: Update TransactionManager

1. Replace `openContractCall` with `request('stx_callContract')`
2. Update function argument formatting for new API
3. Keep transaction polling logic unchanged
4. Update error handling for new error types

### Phase 4: Update WalletSelectionModal

1. Simplify modal to work with SDK's wallet picker
2. Update wallet information display
3. Remove manual wallet detection (SDK handles it)
4. Update connection flow to call new `connectWallet()`

### Phase 5: Testing & Validation

1. Test with both wallets on testnet
2. Verify all transaction flows work
3. Test error scenarios
4. Verify connection persistence
5. Update documentation

## Security Considerations

1. **Private Key Safety**: Private keys never leave the wallet extension
2. **Transaction Verification**: Users always approve transactions in their wallet
3. **Post-Conditions**: Continue using post-conditions to protect users
4. **Network Validation**: Always verify network matches expected environment
5. **Input Sanitization**: Validate all user inputs before creating transactions

## Performance Considerations

1. **Connection Speed**: `@stacks/connect` handles provider detection efficiently
2. **Transaction Polling**: Use 5-second intervals to balance responsiveness and API load
3. **State Management**: Minimize re-renders by using proper React state management
4. **LocalStorage**: Efficient storage access with minimal overhead

## Future Enhancements

1. **Additional Wallets**: Easy to add more wallets supported by `@stacks/connect`
2. **Wallet Switching**: Allow users to switch wallets without disconnecting
3. **Multi-Account**: Support multiple accounts from same wallet
4. **Transaction History**: Track and display user's transaction history
5. **Gas Estimation**: Show estimated transaction fees before signing
