# Implementation Plan - Smart Contract Integration

## Overview

This implementation plan breaks down the smart contract integration into discrete, manageable coding tasks. Each task builds incrementally on previous tasks, with the goal of connecting the REFERYDO! frontend to the deployed Stacks smart contracts.

---

## Task List

- [x] 1. Set up project dependencies and configuration



  - Install @stacks/transactions, @stacks/network, @stacks/connect packages
  - Create contract configuration file with deployed addresses
  - Set up environment variables for network selection
  - _Requirements: 10_



- [ ] 1.1 Install Stacks dependencies
  - Run `npm install @stacks/transactions @stacks/network @stacks/connect`
  - Verify package versions are compatible


  - _Requirements: 10_

- [ ] 1.2 Create contract configuration file
  - Create `src/config/contracts.ts`
  - Define `ContractConfig` interface


  - Add testnet contract addresses: `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry` and `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow`
  - Implement `getContractConfig()` and `parseContractAddress()` functions
  - _Requirements: 10_



- [ ] 1.3 Create TypeScript type definitions
  - Create `src/types/contracts.ts`
  - Define `ProjectStatus` enum (Created=0, Funded=1, Completed=2, Disputed=3)
  - Define `ProjectData`, `TransactionState`, `TransactionStatus` interfaces
  - Define `CreateProjectResult` and `ContractCallResult` types


  - _Requirements: 10_

- [ ] 2. Implement base contract service layer
  - Create base `ContractService` class with common functionality
  - Implement read-only function call wrapper
  - Add Clarity response parsing utilities


  - Implement contract error code mapping
  - _Requirements: 9, 10_

- [ ] 2.1 Create base ContractService class
  - Create `src/services/contractService.ts`


  - Implement constructor with network configuration
  - Add `callReadOnly()` protected method for read-only contract calls
  - Add `parseReadOnlyResult()` for Clarity value parsing
  - Add `mapErrorCode()` for error message mapping
  - _Requirements: 9_




- [ ] 2.2 Implement ProfileRegistryService
  - Create `src/services/profileRegistryService.ts`
  - Extend `ContractService` base class
  - Implement `getProfile(userAddress)` read-only method
  - Handle optional return values from contract
  - _Requirements: 1_



- [ ] 2.3 Implement ProjectEscrowService
  - Create `src/services/projectEscrowService.ts`
  - Extend `ContractService` base class
  - Implement `getProjectData(projectId, senderAddress)` read-only method

  - Implement `calculatePayouts(amount, scoutFee, platformFee)` utility method
  - Parse project data from Clarity response to TypeScript interface
  - _Requirements: 4, 5, 6, 7_


- [x] 3. Implement transaction management system

  - Create `TransactionManager` class for handling contract calls
  - Implement transaction signing with `openContractCall`
  - Add transaction status polling and confirmation tracking



  - Implement post-condition creation utilities
  - _Requirements: 9_

- [ ] 3.1 Create TransactionManager class
  - Create `src/services/transactionManager.ts`


  - Implement constructor with network configuration
  - Add `executeContractCall()` method with status callback
  - Integrate with `@stacks/connect` for wallet interaction
  - _Requirements: 9_

- [x] 3.2 Implement transaction polling


  - Add `pollTransactionStatus()` private method
  - Query Stacks API for transaction status every 5 seconds
  - Handle success, failure, and timeout scenarios
  - Update status callback with transaction state changes
  - _Requirements: 9_

- [ ] 3.3 Add post-condition utilities
  - Implement `createSTXPostCondition()` method


  - Support different fungible condition codes (Equal, Greater, Less, etc.)
  - Add validation for post-condition parameters


  - _Requirements: 5, 9_

- [ ] 4. Create React context providers
  - Implement `ContractContext` for contract service access
  - Implement `ScoutTrackingContext` for referral tracking


  - Integrate contexts with existing `WalletContext`
  - _Requirements: 2, 3, 10_

- [ ] 4.1 Implement ContractContext
  - Create `src/contexts/ContractContext.tsx`
  - Initialize `ProfileRegistryService` and `ProjectEscrowService`
  - Initialize `TransactionManager` with network from WalletContext
  - Provide services through context value



  - Export `useContract()` hook
  - _Requirements: 10_

- [ ] 4.2 Implement ScoutTrackingContext
  - Create `src/contexts/ScoutTrackingContext.tsx`
  - Read `scout` parameter from URL using `useSearchParams`


  - Store Scout address in localStorage with key `referydo_scout_address`
  - Store timestamp with key `referydo_scout_timestamp`
  - Implement 30-day expiration logic
  - Validate Stacks address format (ST/SP prefix)
  - Export `useScoutTracking()` hook
  - _Requirements: 2, 3_




- [ ] 4.3 Update App.tsx with new providers
  - Wrap app with `ContractProvider`
  - Wrap app with `ScoutTrackingProvider`
  - Ensure proper provider nesting order


  - _Requirements: 2, 3, 10_

- [ ] 5. Implement profile registration hook
  - Create `useRegisterProfile` custom hook
  - Handle profile registration transaction
  - Provide transaction status tracking
  - _Requirements: 1_

- [ ] 5.1 Create useRegisterProfile hook
  - Create `src/hooks/useRegisterProfile.ts`


  - Use `useContract()` to access `profileRegistry` service
  - Use `useWallet()` to get connected address
  - Implement `registerProfile(profileData)` function
  - Call `transactionManager.executeContractCall()` with register-profile function
  - Track transaction status with state
  - Return `{ registerProfile, status, isLoading }`
  - _Requirements: 1_


- [x] 6. Implement Scout referral link generation


  - Add onClick handler to "Get Referral Link" button
  - Generate referral URL with Scout address parameter
  - Implement copy-to-clipboard functionality
  - Add success toast notification


  - _Requirements: 2_

- [ ] 6.1 Update Profile page with referral link generation
  - Open `src/pages/Profile.tsx`
  - Import `useWallet()` hook to get Scout's address


  - Add `generateReferralLink()` function
  - Format URL as `${window.location.origin}/profile/${talent-username}?scout=${scoutAddress}`
  - Add onClick handler to "Get Referral Link" button (line 167-170)
  - Use `navigator.clipboard.writeText()` to copy link
  - Display success toast with `toast.success()`
  - _Requirements: 2_

- [ ] 7. Implement project creation hook and flow
  - Create `useCreateProject` custom hook
  - Integrate Scout tracking with project creation
  - Build project creation modal UI


  - _Requirements: 4_

- [ ] 7.1 Create useCreateProject hook
  - Create `src/hooks/useCreateProject.ts`
  - Use `useContract()` to access `projectEscrow` service
  - Use `useScoutTracking()` to get Scout address
  - Implement `createProject({ talentAddress, amountSTX, scoutFeePercent, platformFeePercent })` function
  - Convert STX to microSTX (multiply by 1,000,000)
  - Use Scout address from tracking or default to client address
  - Call `transactionManager.executeContractCall()` with create-project function


  - Pass parameters: talent (principal), scout (principal), amount (uint), scout-fee (uint), platform-fee (uint)
  - Return `{ createProject, status, isLoading, scoutAddress }`
  - _Requirements: 4_

- [ ] 7.2 Create ProjectCreationModal component
  - Create `src/components/ProjectCreationModal.tsx`


  - Accept props: open, onClose, talentAddress, talentUsername, talentAvatar, scoutFeePercent
  - Use `useCreateProject()` hook
  - Display Trinity visualization (Client, Talent, Scout)
  - Add amount input field
  - Calculate and display fee breakdown (Talent payout, Scout commission, Platform fee)
  - Show Scout info if active Scout session exists
  - Add "Create Project" button that calls `createProject()`
  - Display transaction status using `TransactionStatus` component
  - _Requirements: 3, 4_

- [x] 7.3 Integrate ProjectCreationModal into Profile page

  - Open `src/pages/Profile.tsx`
  - Import `ProjectCreationModal` component
  - Add state for modal open/close
  - Add "Hire" button that opens modal (if not own profile)
  - Pass talent information to modal
  - _Requirements: 4_

- [ ] 8. Implement escrow funding hook and flow
  - Create `useFundEscrow` custom hook

  - Build funding UI in project workspace
  - Add post-conditions for STX transfer
  - _Requirements: 5_

- [x] 8.1 Create useFundEscrow hook



  - Create `src/hooks/useFundEscrow.ts`
  - Use `useContract()` to access `projectEscrow` and `transactionManager`
  - Use `useWallet()` to get client address
  - Implement `fundEscrow(projectId, amountSTX)` function
  - Convert STX to microSTX


  - Create post-condition with `transactionManager.createSTXPostCondition()`
  - Use `FungibleConditionCode.Equal` to ensure exact amount
  - Call `transactionManager.executeContractCall()` with fund-escrow function
  - Set `postConditionMode` to Deny (0x02) to enforce post-conditions
  - Return `{ fundEscrow, status, isLoading }`
  - _Requirements: 5_

- [x] 8.2 Create project funding page/component

  - Create `src/pages/ProjectFunding.tsx` or add to existing workspace
  - Use `useProjectData()` hook to fetch project details
  - Display project information: Talent, Scout, Amount, Fee breakdown
  - Verify project status is 0 (Created)
  - Verify connected wallet matches project client address
  - Add "Fund Escrow" button
  - Call `fundEscrow()` on button click
  - Display transaction status
  - Redirect to project workspace on success
  - _Requirements: 5_




- [ ] 9. Implement project data fetching hook
  - Create `useProjectData` custom hook
  - Add caching with TTL


  - Implement auto-refresh option
  - Calculate payout breakdown
  - _Requirements: 6, 11_

- [ ] 9.1 Create useProjectData hook
  - Create `src/hooks/useProjectData.ts`
  - Accept options: `{ projectId, autoRefresh, refreshInterval }`
  - Use `useContract()` to access `projectEscrow` service
  - Use `useWallet()` to get sender address
  - Implement `fetchProjectData()` function that calls `projectEscrow.getProjectData()`

  - Store data, loading, and error states
  - Call `fetchProjectData()` on mount
  - Implement auto-refresh with `setInterval` if enabled
  - Calculate payouts using `projectEscrow.calculatePayouts()`
  - Return `{ data, payouts, loading, error, refetch }`
  - _Requirements: 6, 11_

- [x] 9.2 Create caching utility


  - Create `src/utils/contractCache.ts`
  - Implement `ContractCache` class with Map storage
  - Add `set(key, data, ttl)`, `get(key)`, `invalidate(key)` methods
  - Implement TTL expiration logic
  - Add `invalidatePattern(regex)` for bulk invalidation


  - Export singleton `contractCache` instance
  - Export `getCacheKey` helper functions
  - _Requirements: 11_

- [ ] 9.3 Integrate caching into useProjectData
  - Update `useProjectData` hook to use `contractCache`
  - Cache project data with 30-second TTL
  - Check cache before making contract call


  - Invalidate cache on refetch
  - _Requirements: 11_

- [ ] 10. Implement payout distribution hook and flow
  - Create `useApproveAndDistribute` custom hook
  - Build approval UI in project workspace
  - Display payout breakdown confirmation
  - _Requirements: 7_



- [ ] 10.1 Create useApproveAndDistribute hook
  - Create `src/hooks/useApproveAndDistribute.ts`
  - Use `useContract()` to access `projectEscrow` and `transactionManager`

  - Use `useWallet()` to get client address
  - Implement `approveAndDistribute(projectId)` function
  - Call `transactionManager.executeContractCall()` with approve-and-distribute function
  - Set `postConditionMode` to Allow (0x01) since contract handles transfers
  - Return `{ approveAndDistribute, status, isLoading }`
  - _Requirements: 7_


- [ ] 10.2 Update Workspace page with approval flow
  - Open `src/pages/Workspace.tsx`
  - Use `useProjectData()` to fetch project details
  - Use `useApproveAndDistribute()` hook
  - Display project status and milestone progress
  - Show "Approve & Distribute Funds" button when project status is 1 (Funded)

  - Verify connected wallet matches project client address
  - Display payout breakdown in confirmation modal
  - Call `approveAndDistribute()` on confirmation
  - Display transaction status
  - Update UI to show completed status on success
  - _Requirements: 6, 7_


- [ ] 11. Implement Scout earnings tracking
  - Create `useScoutEarnings` custom hook
  - Build Scout dashboard with earnings display
  - Show completed and pending earnings
  - _Requirements: 8_

- [ ] 11.1 Create useScoutEarnings hook
  - Create `src/hooks/useScoutEarnings.ts`
  - Use `useContract()` to access `projectEscrow` service

  - Use `useWallet()` to get Scout address
  - Implement logic to query projects where Scout address matches
  - Note: This is a simplified version - production needs proper indexing
  - Iterate through project IDs and filter by Scout address
  - Calculate commission for each project using `calculatePayouts()`

  - Calculate `totalEarned` (completed projects) and `pendingEarnings` (funded projects)
  - Return `{ earnings, totalEarned, pendingEarnings, loading, error }`
  - _Requirements: 8_

- [ ] 11.2 Update Dashboard with Scout earnings
  - Open `src/pages/Dashboard.tsx`
  - Use `useScoutEarnings()` hook

  - Display total earned and pending earnings cards
  - Show list of Scout connections with commission amounts
  - Add filtering: All, Active, Completed
  - Display earnings chart (optional)
  - _Requirements: 8_



- [ ] 12. Build UI components for transaction feedback
  - Create `TransactionStatus` component
  - Create `ScoutBanner` component
  - Add error handling utilities
  - _Requirements: 3, 9_


- [ ] 12.1 Create TransactionStatus component
  - Create `src/components/TransactionStatus.tsx`
  - Accept props: `{ status, networkType }`
  - Display different UI for each transaction state (Signing, Broadcasting, Pending, Success, Failed)
  - Show loading spinner for in-progress states
  - Show success/error icons for completed states
  - Display transaction ID with link to Stacks Explorer

  - Use Alert component from shadcn/ui
  - _Requirements: 9_

- [ ] 12.2 Create ScoutBanner component
  - Create `src/components/ScoutBanner.tsx`
  - Use `useScoutTracking()` hook

  - Display banner when active Scout session exists
  - Show Scout address (truncated)
  - Add dismiss button
  - Store dismissed state in component state
  - Use Alert component with primary styling
  - _Requirements: 3_

- [x] 12.3 Add ScoutBanner to main layout

  - Open `src/components/layout/Navigation.tsx` or create layout wrapper
  - Import and render `ScoutBanner` component
  - Position at top of page content
  - _Requirements: 3_

- [ ] 12.4 Create error handling utilities
  - Create `src/utils/contractErrors.ts`

  - Define `ContractErrorCode` enum (101-104)
  - Implement `getErrorMessage(code)` function
  - Implement `parseContractError(error)` function
  - Map contract error codes to user-friendly messages
  - _Requirements: 9_


- [ ] 12.5 Create ContractErrorBoundary component
  - Create `src/components/ContractErrorBoundary.tsx`
  - Extend React.Component with error boundary lifecycle
  - Catch contract-related errors
  - Display error alert with retry button
  - Wrap contract-heavy pages with this boundary

  - _Requirements: 9_

- [ ] 13. Implement validation utilities
  - Create address validation functions
  - Create amount validation functions
  - Create fee percentage validation

  - _Requirements: 2, 4, 5_

- [ ] 13.1 Create validation utilities
  - Create `src/utils/validation.ts`
  - Implement `validateStacksAddress(address, networkType)` function
  - Check for ST (testnet) or SP (mainnet) prefix
  - Validate address length and format
  - Implement `validateProjectAmount(amount)` function

  - Check amount is positive and within limits
  - Implement `validateFeePercent(percent)` function
  - Check percent is between 0 and 100
  - _Requirements: 2, 4, 5_

- [ ] 13.2 Integrate validation into hooks
  - Update `useCreateProject` to validate inputs before contract call
  - Update `useFundEscrow` to validate amount

  - Update Scout tracking to validate address format
  - Display validation errors to user
  - _Requirements: 2, 4, 5_

- [ ] 14. Replace mock data with on-chain data
  - Update Workspace page to use `useProjectData`

  - Update Profile page to use on-chain project history
  - Update Dashboard to use on-chain data
  - Remove mock data imports
  - _Requirements: 6, 8_

- [ ] 14.1 Update Workspace page
  - Open `src/pages/Workspace.tsx`
  - Replace `mockContracts` import with `useProjectData` hook calls

  - Fetch real project data for each contract
  - Update UI to display on-chain status
  - Handle loading and error states
  - _Requirements: 6_

- [ ] 14.2 Update Profile page project history
  - Open `src/pages/Profile.tsx`
  - Replace hardcoded `completedProjects` with on-chain data

  - Query projects where user is client, talent, or scout
  - Display real project data and status
  - _Requirements: 6, 8_

- [ ] 14.3 Update Dashboard
  - Open `src/pages/Dashboard.tsx`

  - Replace mock data with on-chain queries
  - Use `useScoutEarnings` for Scout data
  - Use `useProjectData` for active projects
  - Update metrics to reflect real on-chain data
  - _Requirements: 6, 8_



- [ ] 15. Add gas fee estimation and display
  - Implement gas fee estimation utility
  - Display estimated fees in transaction modals
  - Show total cost including gas
  - _Requirements: 12_

- [x] 15.1 Create gas fee estimation utility

  - Create `src/utils/gasEstimation.ts`
  - Implement `estimateContractCallFee()` function
  - Use Stacks API to get current fee rates
  - Calculate estimated fee based on transaction complexity
  - Convert microSTX to STX for display
  - Add USD conversion (optional, requires price API)
  - _Requirements: 12_


- [ ] 15.2 Add fee display to ProjectCreationModal
  - Update `src/components/ProjectCreationModal.tsx`
  - Call `estimateContractCallFee()` when amount changes
  - Display estimated gas fee below amount input
  - Show total cost: project amount + gas fee
  - Update on network condition changes

  - _Requirements: 12_

- [ ] 15.3 Add fee display to funding flow
  - Update project funding page/component
  - Display estimated gas fee for fund-escrow transaction
  - Show total cost: escrow amount + gas fee
  - Warn if gas fees are unusually high

  - _Requirements: 12_

- [ ] 16. Write unit tests for services
  - Test ProfileRegistryService methods
  - Test ProjectEscrowService methods
  - Test TransactionManager functionality
  - Test caching utilities

  - _Requirements: 1, 4, 5, 6, 7, 9, 11_

- [ ] 16.1 Test ProfileRegistryService
  - Create `src/services/__tests__/profileRegistryService.test.ts`
  - Test `getProfile()` with valid address
  - Test `getProfile()` with non-existent profile

  - Mock contract call responses
  - _Requirements: 1_

- [ ] 16.2 Test ProjectEscrowService
  - Create `src/services/__tests__/projectEscrowService.test.ts`
  - Test `getProjectData()` with valid project ID
  - Test `getProjectData()` with non-existent project
  - Test `calculatePayouts()` with various fee percentages
  - Verify payout calculations are correct

  - Test edge cases (zero fees, 100% fees, etc.)
  - _Requirements: 4, 5, 6, 7_

- [ ] 16.3 Test TransactionManager
  - Create `src/services/__tests__/transactionManager.test.ts`


  - Test `executeContractCall()` success flow
  - Test `executeContractCall()` cancellation
  - Test `pollTransactionStatus()` with different outcomes
  - Test post-condition creation
  - Mock wallet interactions
  - _Requirements: 9_


- [ ] 16.4 Test caching utilities
  - Create `src/utils/__tests__/contractCache.test.ts`
  - Test `set()` and `get()` operations
  - Test TTL expiration
  - Test `invalidate()` and `invalidatePattern()`
  - Test cache hit/miss scenarios
  - _Requirements: 11_


- [ ] 17. Write integration tests for hooks
  - Test useCreateProject hook
  - Test useFundEscrow hook
  - Test useApproveAndDistribute hook
  - Test useProjectData hook
  - Test useScoutTracking hook

  - _Requirements: 2, 4, 5, 6, 7_

- [ ] 17.1 Test useCreateProject
  - Create `src/hooks/__tests__/useCreateProject.test.tsx`
  - Test project creation with Scout address
  - Test project creation without Scout address
  - Test transaction status updates
  - Test error handling
  - Mock contract calls and wallet
  - _Requirements: 4_

- [ ] 17.2 Test useFundEscrow
  - Create `src/hooks/__tests__/useFundEscrow.test.tsx`
  - Test escrow funding with valid project
  - Test post-condition creation
  - Test error handling for insufficient balance
  - _Requirements: 5_

- [ ] 17.3 Test useProjectData
  - Create `src/hooks/__tests__/useProjectData.test.tsx`
  - Test data fetching on mount
  - Test auto-refresh functionality
  - Test caching behavior
  - Test payout calculation
  - _Requirements: 6, 11_

- [ ] 17.4 Test useScoutTracking
  - Create `src/contexts/__tests__/ScoutTrackingContext.test.tsx`
  - Test Scout address capture from URL
  - Test localStorage persistence
  - Test session expiration
  - Test address validation
  - _Requirements: 2, 3_


- [ ] 18. Testing and validation on testnet
  - Test complete project flow end-to-end
  - Verify Scout tracking works correctly
  - Test with real STX on testnet
  - Verify atomic payouts
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8_

- [ ] 18.1 Test profile registration
  - Connect wallet on testnet
  - Register profile with test data
  - Verify transaction succeeds
  - Verify profile data is stored on-chain
  - Query profile using read-only function
  - _Requirements: 1_

- [ ] 18.2 Test Scout referral flow
  - Generate referral link as Scout
  - Open link in incognito/different browser
  - Verify Scout address is captured
  - Verify localStorage persistence
  - Verify Scout banner displays
  - _Requirements: 2, 3_

- [ ] 18.3 Test project creation
  - Create project as Client via Scout link
  - Verify Scout address is included in transaction
  - Verify project is created on-chain with correct data
  - Verify project ID is returned
  - Check project status is 0 (Created)
  - _Requirements: 4_

- [ ] 18.4 Test escrow funding
  - Fund project escrow with test STX
  - Verify STX transfer to contract
  - Verify project status updates to 1 (Funded)
  - Check contract balance increases
  - _Requirements: 5_

- [ ] 18.5 Test payout distribution
  - Approve and distribute funds
  - Verify atomic three-way payout
  - Check Talent receives correct amount
  - Check Scout receives correct commission
  - Check Platform receives correct fee
  - Verify project status updates to 2 (Completed)
  - Verify contract balance decreases to zero
  - _Requirements: 7_

- [ ] 18.6 Test Scout earnings tracking
  - View Scout dashboard
  - Verify completed projects show correct commission
  - Verify pending earnings for funded projects
  - Check total earnings calculation
  - _Requirements: 8_

- [ ] 19. Documentation and deployment preparation
  - Create user documentation
  - Document contract addresses
  - Create deployment checklist
  - Prepare for mainnet deployment
  - _Requirements: 10_

- [ ] 19.1 Create user documentation
  - Document how to connect wallet
  - Document how to generate referral links
  - Document how to create and fund projects
  - Document how to approve and distribute payouts
  - Add screenshots and examples
  - _Requirements: All_

- [ ] 19.2 Create developer documentation
  - Document contract integration architecture
  - Document custom hooks usage
  - Document error handling patterns
  - Add code examples
  - Document testing procedures
  - _Requirements: All_

- [ ] 19.3 Prepare mainnet deployment
  - Update contract addresses for mainnet (when deployed)
  - Update network configuration
  - Test with mainnet wallet connections
  - Set up error monitoring (Sentry, etc.)
  - Set up analytics tracking
  - Create rollback plan
  - _Requirements: 10_

---

## Summary

This implementation plan provides a step-by-step roadmap for integrating the deployed REFERYDO! smart contracts with the React frontend. The tasks are organized to build incrementally:

1. **Foundation** (Tasks 1-4): Set up dependencies, services, and contexts
2. **Core Features** (Tasks 5-11): Implement hooks for all contract interactions
3. **UI Components** (Tasks 12-13): Build user-facing components and validation
4. **Data Migration** (Task 14): Replace mock data with on-chain data
5. **Enhancements** (Task 15): Add gas fee estimation
6. **Testing** (Tasks 16-18): Comprehensive testing strategy
7. **Deployment** (Task 19): Documentation and mainnet preparation

Each task includes specific file paths, function names, and requirement references to ensure clear implementation guidance. Optional testing tasks are marked with `*` to allow focus on core functionality first.

**Total Estimated Time:** 8-10 weeks for complete implementation and testing.
