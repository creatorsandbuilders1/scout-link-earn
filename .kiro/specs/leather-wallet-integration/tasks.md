# Implementation Plan

- [x] 1. Update project dependencies


  - Install `@stacks/connect` v8+ package
  - Remove `@leather.io/rpc` dependency (no longer needed)
  - Verify `@stacks/transactions` and `@stacks/network` are up to date
  - _Requirements: 1.1, 1.2, 1.3_





- [ ] 2. Refactor WalletContext to use @stacks/connect
  - [ ] 2.1 Update imports and type definitions
    - Replace `sats-connect` imports with `@stacks/connect`
    - Import `connect`, `disconnect`, `isConnected`, `getLocalStorage` from SDK


    - Remove wallet-type related types (no longer needed)
    - Update WalletContextType interface to remove walletType field
    - _Requirements: 1.1, 1.2, 4.1_

  - [ ] 2.2 Implement unified connectWallet function
    - Replace current connection logic with `connect()` from SDK
    - Pass `forceWalletSelect: true` to show wallet picker


    - Pass `approvedProviderIds: ['LeatherProvider', 'xverse']` to support both wallets
    - Use `getLocalStorage()` to retrieve addresses after connection
    - Update React state with Stacks and Bitcoin addresses
    - Remove separate Xverse/Leather connection functions


    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_

  - [ ] 2.3 Update disconnectWallet function
    - Call `disconnect()` from SDK to clear connection
    - Clear local React state (addresses, isConnected)


    - Remove manual localStorage clearing (SDK handles it)
    - _Requirements: 6.4_





  - [ ] 2.4 Update connection restoration logic
    - Use `isConnected()` from SDK to check connection status
    - Use `getLocalStorage()` to retrieve stored addresses
    - Update React state if valid connection exists
    - Handle corrupted data by clearing and prompting reconnection
    - _Requirements: 6.1, 6.2, 6.3, 6.5_


  - [ ] 2.5 Update address getter functions
    - Modify `getStacksAddress()` to retrieve from SDK's localStorage format
    - Modify `getBitcoinAddress()` to retrieve from SDK's localStorage format
    - Handle cases where addresses might not exist

    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 3. Update TransactionManager to use request() method
  - [ ] 3.1 Replace openContractCall with request method
    - Import `request` from `@stacks/connect`
    - Update `executeContractCall()` to use `request('stx_callContract', params)`
    - Format contract parameter as `${contractAddress}.${contractName}`

    - Pass functionName and functionArgs in correct format
    - Include network configuration in request
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Update transaction status tracking




    - Keep existing transaction state enum (Signing, Broadcasting, Pending, Success, Failed)
    - Update status callbacks to work with new request flow
    - Ensure txId is correctly extracted from response
    - _Requirements: 3.3, 3.4, 3.5_


  - [ ] 3.3 Enhance error handling
    - Handle wallet-not-found errors
    - Handle user-cancelled errors
    - Handle transaction-rejected errors
    - Implement retry logic with exponential backoff (max 3 attempts)

    - Log errors for debugging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 3.4 Keep transaction polling logic
    - Maintain existing `pollTransactionStatus()` function
    - Use correct API URL based on network (mainnet vs testnet)

    - Poll every 5 seconds with max 60 attempts
    - Handle success, failure, and timeout scenarios
    - _Requirements: 5.3, 5.4_





- [ ] 4. Simplify WalletSelectionModal component
  - [ ] 4.1 Update modal interface and props
    - Simplify props to remove wallet-type selection
    - Update to call single `onConnect` callback

    - Remove wallet-type state management
    - _Requirements: 1.1, 2.1_

  - [ ] 4.2 Update wallet information display
    - Keep wallet cards for Xverse and Leather

    - Update descriptions and features
    - Ensure download links are correct
    - Add network information (testnet/mainnet)
    - _Requirements: 2.2, 2.3_




  - [ ] 4.3 Update connection flow
    - Single "Connect" button that calls `connectWallet()`
    - SDK handles wallet selection internally
    - Show loading state during connection

    - Handle connection errors with user-friendly messages
    - _Requirements: 1.1, 1.2, 1.4, 7.1, 7.2_

  - [ ] 4.4 Add wallet detection hints
    - Show "Install" button for wallets not detected
    - Display helpful messages for first-time users
    - Link to wallet installation pages
    - _Requirements: 2.1, 2.2_

- [ ] 5. Update components using wallet context
  - [ ] 5.1 Update Navigation component
    - Remove wallet-type display (no longer tracked)
    - Keep address display and disconnect button
    - Update to use new WalletContext interface
    - _Requirements: 1.1, 4.2, 4.3_

  - [ ] 5.2 Update ProjectCreationModal
    - Verify it works with new transaction flow
    - Ensure proper error handling
    - Test transaction status updates
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 5.3 Update FundEscrowButton
    - Verify it works with new transaction flow
    - Ensure proper error handling
    - Test transaction status updates
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. Update network configuration
  - [ ] 6.1 Verify network constants
    - Ensure using correct network from `@stacks/network`
    - Verify mainnet vs testnet configuration
    - Update environment-based network selection
    - _Requirements: 5.1, 5.2_

  - [ ] 6.2 Update API endpoints
    - Verify Hiro API URLs for mainnet and testnet
    - Update transaction polling to use correct endpoints
    - Ensure contract service uses correct network
    - _Requirements: 5.3, 5.4_

- [x] 7. Testing and validation




  - [ ] 7.1 Test Xverse wallet connection
    - Connect Xverse on testnet
    - Verify addresses retrieved correctly
    - Test disconnect and reconnect
    - Verify connection persists across page reload

    - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2, 6.3_

  - [ ] 7.2 Test Leather wallet connection
    - Connect Leather on testnet
    - Verify addresses retrieved correctly
    - Test disconnect and reconnect

    - Verify connection persists across page reload
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1, 6.2, 6.3_

  - [ ] 7.3 Test transaction flows
    - Create a project with both wallets
    - Fund escrow with both wallets
    - Verify transaction status updates correctly
    - Test transaction rejection
    - Test transaction failure scenarios
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.4 Test error scenarios
    - Test with no wallet installed
    - Test cancelling connection
    - Test rejecting transaction
    - Test network errors
    - Verify error messages are user-friendly
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 7.5 Test edge cases
    - Test with corrupted localStorage
    - Test rapid connect/disconnect
    - Test switching between wallets
    - Test with slow network
    - _Requirements: 6.5, 7.4_

- [ ] 8. Documentation and cleanup
  - [ ] 8.1 Update code comments
    - Add JSDoc comments to public functions
    - Document wallet connection flow
    - Document transaction execution flow
    - _Requirements: All_

  - [ ] 8.2 Remove deprecated code
    - Remove old wallet-type tracking code
    - Remove manual Leather provider declarations
    - Remove unused imports
    - Clean up console logs
    - _Requirements: All_

  - [ ] 8.3 Update README or documentation
    - Document supported wallets
    - Add wallet installation instructions
    - Document network configuration
    - Add troubleshooting guide
    - _Requirements: All_
