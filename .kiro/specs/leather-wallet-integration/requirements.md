# Requirements Document

## Introduction

This specification defines the requirements for properly integrating Leather wallet support into the REFERYDO! platform using the unified `@stacks/connect` v8+ interface. The current implementation uses the legacy `sats-connect` approach which doesn't properly support Leather wallet. We need to migrate to the modern `@stacks/connect` package that provides a unified interface for both Xverse and Leather wallets.

## Glossary

- **System**: The REFERYDO! web application wallet integration system
- **Wallet Provider**: Browser extension that manages cryptocurrency keys (Xverse or Leather)
- **@stacks/connect**: Official Stacks SDK for wallet connections supporting SIP-030 standards
- **Connection State**: The persisted state of wallet connection in browser storage
- **Transaction Manager**: Service responsible for executing blockchain transactions
- **Stacks Address**: User's address on the Stacks blockchain
- **Payment Address**: User's Bitcoin payment address

## Requirements

### Requirement 1: Unified Wallet Connection

**User Story:** As a user, I want to connect either Xverse or Leather wallet seamlessly, so that I can use my preferred wallet without compatibility issues.

#### Acceptance Criteria

1. WHEN the user clicks "Connect Wallet", THE System SHALL display a modal with both Xverse and Leather wallet options
2. WHEN the user selects a wallet, THE System SHALL initiate connection using the `@stacks/connect` unified interface
3. WHEN the wallet connection succeeds, THE System SHALL store the connection state in local storage
4. WHEN the wallet connection fails, THE System SHALL display an appropriate error message to the user
5. WHEN the page reloads, THE System SHALL automatically restore the previous wallet connection from local storage

### Requirement 2: Wallet Provider Detection

**User Story:** As a user, I want the system to detect which wallets I have installed, so that I only see connection options for available wallets.

#### Acceptance Criteria

1. WHEN the wallet selection modal opens, THE System SHALL detect installed wallet providers
2. WHEN a wallet is not installed, THE System SHALL display an "Install" button with a link to the wallet's download page
3. WHEN multiple wallets are installed, THE System SHALL allow the user to choose their preferred wallet
4. WHEN the user has previously connected a wallet, THE System SHALL remember their preference for future connections

### Requirement 3: Transaction Execution

**User Story:** As a user, I want to execute blockchain transactions using my connected wallet, so that I can interact with smart contracts.

#### Acceptance Criteria

1. WHEN a transaction is initiated, THE System SHALL use the `request()` method with the appropriate Stacks method
2. WHEN executing a contract call, THE System SHALL use the `stx_callContract` method with proper parameters
3. WHEN the user signs a transaction, THE System SHALL track the transaction status through all states (signing, broadcasting, pending, success/failed)
4. WHEN a transaction fails, THE System SHALL provide a clear error message to the user
5. WHEN a transaction succeeds, THE System SHALL update the UI to reflect the successful operation

### Requirement 4: Address Management

**User Story:** As a user, I want the system to correctly retrieve my Stacks and Bitcoin addresses, so that I can receive funds and interact with contracts.

#### Acceptance Criteria

1. WHEN the wallet connects, THE System SHALL retrieve all user addresses using the `getAddresses` method
2. WHEN the application needs the Stacks address, THE System SHALL provide the correct Stacks address from the connected wallet
3. WHEN the application needs the Bitcoin payment address, THE System SHALL provide the correct Bitcoin address from the connected wallet
4. WHEN addresses are retrieved, THE System SHALL store them in the application state for efficient access

### Requirement 5: Network Configuration

**User Story:** As a developer, I want to configure the blockchain network (mainnet/testnet), so that the application works correctly in different environments.

#### Acceptance Criteria

1. WHEN the application initializes, THE System SHALL configure the network based on environment settings
2. WHEN connecting a wallet, THE System SHALL pass the correct network configuration to the wallet provider
3. WHEN executing transactions, THE System SHALL use the correct API endpoints for the configured network
4. WHEN polling transaction status, THE System SHALL query the appropriate network's API

### Requirement 6: Connection Persistence

**User Story:** As a user, I want my wallet connection to persist across page reloads, so that I don't have to reconnect every time.

#### Acceptance Criteria

1. WHEN a wallet connection is established, THE System SHALL store the connection data in local storage
2. WHEN the page loads, THE System SHALL check local storage for existing connection data
3. WHEN valid connection data exists, THE System SHALL restore the wallet connection automatically
4. WHEN the user disconnects, THE System SHALL clear all connection data from local storage
5. WHEN connection data is corrupted, THE System SHALL clear it and prompt the user to reconnect

### Requirement 7: Error Handling

**User Story:** As a user, I want clear feedback when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN a wallet is not installed, THE System SHALL display a message indicating the wallet needs to be installed
2. WHEN the user cancels a connection, THE System SHALL handle the cancellation gracefully without errors
3. WHEN a transaction fails, THE System SHALL display the specific error reason to the user
4. WHEN network requests fail, THE System SHALL retry with exponential backoff up to a maximum of 3 attempts
5. WHEN an unrecoverable error occurs, THE System SHALL log the error details for debugging purposes
