# Smart Contract Integration - Requirements Document

## Introduction

This document defines the requirements for integrating the deployed REFERYDO! smart contracts on Stacks Testnet with the frontend application. The smart contracts provide the foundational backend logic for profile registration, project creation, escrow management, and atomic payouts. This integration will transform the platform from a UI prototype to a fully functional Web3 application with guaranteed Scout commissions.

## Glossary

- **System**: The REFERYDO! frontend application
- **Smart Contract**: Clarity smart contracts deployed on Stacks Testnet
- **Profile Registry Contract**: Contract at `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry`
- **Project Escrow Contract**: Contract at `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow`
- **Client**: A user who creates and funds projects (tx-sender in create-project)
- **Talent**: A user who completes work and receives payment
- **Scout**: A user who connects Clients with Talent and earns commission
- **Project ID**: A unique uint identifier for each project (auto-incremented)
- **Project Status**: uint value (0: Created, 1: Funded, 2: Completed, 3: Disputed)
- **Escrow**: STX tokens held by the contract until project completion
- **Atomic Payout**: Simultaneous, guaranteed distribution to Talent, Scout, and Platform
- **tx-sender**: The Stacks principal (wallet address) initiating the transaction
- **Principal**: A Stacks blockchain address (wallet or contract)

## Requirements

### Requirement 1: Profile Registration Integration

**User Story:** As a user, I want to register my REFERYDO! profile on-chain, so that my profile is permanently linked to my Stacks wallet address.

#### Acceptance Criteria

1. WHEN a user connects their wallet for the first time, THE System SHALL prompt them to register their profile on-chain
2. THE System SHALL call the `register-profile` function on the Profile Registry Contract
3. THE System SHALL pass a profile data string (max 256 UTF-8 characters) containing a reference to the user's off-chain profile
4. THE System SHALL use the connected wallet address as tx-sender for the transaction
5. THE System SHALL display transaction status (pending, success, error) to the user
6. WHEN the transaction succeeds, THE System SHALL store the transaction ID for reference
7. THE System SHALL provide a function to retrieve profile data using `get-profile` read-only function
8. THE System SHALL handle cases where a user updates their existing profile registration

### Requirement 2: Scout Referral Link Generation

**User Story:** As a Scout, I want to generate a referral link for a Talent's profile, so that I can share it with potential Clients and earn commission.

#### Acceptance Criteria

1. WHEN a logged-in Scout clicks "Get Referral Link" on a Talent's profile, THE System SHALL retrieve the Scout's wallet address from WalletContext
2. THE System SHALL generate a URL in the format `https://referydo.xyz/profile/[talent-username]?scout=[SCOUT_STACKS_ADDRESS]`
3. THE System SHALL validate that the Scout's wallet address is a valid Stacks principal
4. THE System SHALL copy the generated link to the clipboard
5. THE System SHALL display a success toast notification with the copied link
6. THE System SHALL provide a "Share" button with social media integration options
7. THE System SHALL log the link generation event for analytics

### Requirement 3: Scout Address Capture and Persistence

**User Story:** As a Client arriving via a Scout's referral link, I want the Scout's address to be remembered throughout my session, so that the Scout receives credit when I create a project.

#### Acceptance Criteria

1. WHEN a user lands on any page with a `?scout=[ADDRESS]` URL parameter, THE System SHALL immediately capture the Scout address
2. THE System SHALL validate that the Scout address is a valid Stacks principal format
3. THE System SHALL store the Scout address in localStorage with key `referydo_scout_address`
4. THE System SHALL store a timestamp with key `referydo_scout_timestamp`
5. THE System SHALL set an expiration period of 30 days for the Scout tracking
6. WHEN a user navigates to any page, THE System SHALL check for an active Scout session
7. IF the Scout session has expired, THEN THE System SHALL clear the Scout address from storage
8. THE System SHALL persist the Scout address across browser sessions until expiration
9. THE System SHALL display a dismissible banner showing "Referred by @[ScoutUsername]" when a Scout session is active

### Requirement 4: Project Creation Flow

**User Story:** As a Client, I want to create a project and specify the Talent, Scout, amount, and fee percentages, so that the project is recorded on-chain with all parties identified.

#### Acceptance Criteria

1. WHEN a Client clicks "Hire" on a Talent's profile, THE System SHALL open a project creation modal
2. THE System SHALL pre-fill the Talent's wallet address from their profile
3. THE System SHALL retrieve the Scout's wallet address from localStorage if a Scout session exists
4. IF no Scout session exists, THEN THE System SHALL use a default/null Scout address
5. THE System SHALL allow the Client to input the project amount in STX
6. THE System SHALL display the Scout fee percentage (from Talent's profile settings)
7. THE System SHALL display the platform fee percentage (fixed at 5%)
8. THE System SHALL calculate and display the breakdown: Talent payout, Scout commission, Platform fee
9. WHEN the Client clicks "Create Project", THE System SHALL call the `create-project` function on the Project Escrow Contract
10. THE System SHALL pass parameters: talent (principal), scout (principal), amount (uint), scout-fee (uint), platform-fee (uint)
11. THE System SHALL use the connected Client wallet as tx-sender
12. THE System SHALL display transaction status and wait for confirmation
13. WHEN the transaction succeeds, THE System SHALL receive and store the returned project-id
14. THE System SHALL redirect the Client to the project funding page with the project-id

### Requirement 5: Escrow Funding Flow

**User Story:** As a Client, I want to fund the escrow for my created project, so that the STX tokens are locked in the contract until project completion.

#### Acceptance Criteria

1. WHEN a Client navigates to the funding page for a project, THE System SHALL fetch project data using `get-project-data` read-only function
2. THE System SHALL verify that the project status is 0 (Created)
3. THE System SHALL verify that the connected wallet matches the project's client address
4. THE System SHALL display the project details: Talent, Scout, Amount, Fee breakdown
5. THE System SHALL display a "Fund Escrow" button with the amount in STX
6. WHEN the Client clicks "Fund Escrow", THE System SHALL call the `fund-escrow` function on the Project Escrow Contract
7. THE System SHALL pass the project-id as a parameter
8. THE System SHALL initiate an STX transfer of the project amount from the Client to the contract
9. THE System SHALL display transaction status and wait for confirmation
10. WHEN the transaction succeeds, THE System SHALL update the local project status to 1 (Funded)
11. THE System SHALL redirect the Client to the project workspace/dashboard
12. IF the transaction fails, THEN THE System SHALL display an error message with retry option

### Requirement 6: Project Workspace and Milestone Tracking

**User Story:** As a project participant (Client, Talent, or Scout), I want to view the project status and milestones, so that I can track progress toward completion.

#### Acceptance Criteria

1. WHEN a user navigates to a project workspace, THE System SHALL fetch project data using `get-project-data` read-only function
2. THE System SHALL display the project status: Created, Funded, Completed, or Disputed
3. THE System SHALL display all three participants: Client, Talent, Scout with avatars and usernames
4. THE System SHALL display the escrow amount and fee breakdown
5. THE System SHALL display milestone progress (off-chain tracking)
6. THE System SHALL allow the Talent to submit milestone completion evidence
7. THE System SHALL allow the Client to review and approve milestones
8. WHEN all milestones are approved, THE System SHALL enable the "Approve & Distribute Funds" button for the Client
9. THE System SHALL refresh project data periodically to reflect on-chain status changes
10. THE System SHALL display transaction history for the project

### Requirement 7: Payout Distribution Flow

**User Story:** As a Client, I want to approve the completed project and trigger the payout distribution, so that the Talent, Scout, and Platform receive their payments atomically.

#### Acceptance Criteria

1. WHEN a Client clicks "Approve & Distribute Funds", THE System SHALL verify the project status is 1 (Funded)
2. THE System SHALL verify that the connected wallet matches the project's client address
3. THE System SHALL display a confirmation modal showing the payout breakdown
4. THE System SHALL show: Talent payout amount, Scout commission amount, Platform fee amount
5. WHEN the Client confirms, THE System SHALL call the `approve-and-distribute` function on the Project Escrow Contract
6. THE System SHALL pass the project-id as a parameter
7. THE System SHALL display transaction status and wait for confirmation
8. WHEN the transaction succeeds, THE System SHALL verify that all three transfers occurred atomically
9. THE System SHALL update the project status to 2 (Completed)
10. THE System SHALL display a success message with transaction details
11. THE System SHALL show individual transaction links for Talent, Scout, and Platform payouts
12. THE System SHALL update the user's wallet balance display
13. THE System SHALL send notifications to all three parties about the completed payout

### Requirement 8: Scout Dashboard and Earnings Tracking

**User Story:** As a Scout, I want to view all projects where I earned commission, so that I can track my earnings and successful connections.

#### Acceptance Criteria

1. WHEN a Scout navigates to their dashboard, THE System SHALL query all projects where their address is the scout principal
2. THE System SHALL display a list of projects with status: Pending, Funded, Completed
3. THE System SHALL calculate total earnings from completed projects
4. THE System SHALL display pending earnings from funded but not completed projects
5. THE System SHALL show the Client and Talent for each connection
6. THE System SHALL display the commission percentage and amount for each project
7. THE System SHALL provide filtering options: All, Active, Completed
8. THE System SHALL display a chart showing earnings over time
9. THE System SHALL show conversion rate: links generated vs. projects created

### Requirement 9: Transaction Status and Error Handling

**User Story:** As a user, I want clear feedback on transaction status and errors, so that I understand what's happening and can take corrective action if needed.

#### Acceptance Criteria

1. WHEN a user initiates any contract call, THE System SHALL display a loading state with transaction status
2. THE System SHALL show transaction stages: Signing, Broadcasting, Pending, Confirming
3. THE System SHALL display the transaction ID once broadcast
4. THE System SHALL provide a link to view the transaction on the Stacks Explorer
5. WHEN a transaction succeeds, THE System SHALL display a success toast with transaction details
6. WHEN a transaction fails, THE System SHALL display the error code and human-readable message
7. THE System SHALL map contract error codes to user-friendly messages:
   - ERR-NOT-AUTHORIZED (u101): "You are not authorized to perform this action"
   - ERR-PROJECT-NOT-FOUND (u102): "Project not found"
   - ERR-WRONG-STATUS (u103): "Project is in the wrong status for this action"
   - ERR-FUNDING-FAILED (u104): "Failed to transfer funds to escrow"
8. THE System SHALL provide retry options for failed transactions
9. THE System SHALL log all transaction attempts for debugging
10. THE System SHALL handle wallet disconnection gracefully during transactions

### Requirement 10: Contract Configuration and Network Management

**User Story:** As a developer, I want to configure contract addresses and network settings, so that the application can work on testnet and mainnet.

#### Acceptance Criteria

1. THE System SHALL store contract addresses in a configuration file
2. THE System SHALL define separate configurations for testnet and mainnet
3. THE System SHALL use the following testnet addresses:
   - Profile Registry: `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry`
   - Project Escrow: `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow`
4. THE System SHALL detect the connected wallet's network (testnet/mainnet)
5. THE System SHALL use the appropriate contract addresses based on the network
6. THE System SHALL display a warning banner if the user is on the wrong network
7. THE System SHALL provide a network switcher in the UI
8. THE System SHALL validate that contract addresses are accessible before making calls
9. THE System SHALL provide clear error messages if contracts are not found

### Requirement 11: Read-Only Data Fetching and Caching

**User Story:** As a user, I want the application to load project data quickly, so that I have a responsive experience.

#### Acceptance Criteria

1. THE System SHALL use read-only contract calls for fetching data (no gas fees)
2. THE System SHALL implement caching for frequently accessed project data
3. THE System SHALL set a cache TTL (time-to-live) of 30 seconds for project data
4. THE System SHALL invalidate cache when a user performs a write operation
5. THE System SHALL implement optimistic UI updates for better perceived performance
6. THE System SHALL show stale data with a "Refreshing..." indicator while fetching updates
7. THE System SHALL batch multiple read-only calls when possible
8. THE System SHALL implement error boundaries for failed data fetches
9. THE System SHALL provide manual refresh buttons for critical data

### Requirement 12: Gas Fee Estimation and Display

**User Story:** As a user, I want to see estimated gas fees before confirming transactions, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN a user initiates a contract call, THE System SHALL estimate the gas fee
2. THE System SHALL display the estimated fee in STX and USD equivalent
3. THE System SHALL show the total cost: project amount + gas fee (for funding transactions)
4. THE System SHALL warn users if gas fees are unusually high
5. THE System SHALL allow users to adjust gas fee priority (low, medium, high)
6. THE System SHALL display the estimated transaction time based on fee priority
7. THE System SHALL update fee estimates if network conditions change
8. THE System SHALL show historical average fees for reference
