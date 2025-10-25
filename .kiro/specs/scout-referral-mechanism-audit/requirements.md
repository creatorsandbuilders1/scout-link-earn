# Scout Referral Mechanism Audit - Requirements Document

## Introduction

This document contains the requirements for auditing and analyzing the current implementation of the REFERYDO! Scout referral link and commission tracking mechanism. The audit will compare the existing codebase against a "gold standard" specification to identify discrepancies, potential loopholes, and deviations from the core architectural design that ensures a Scout's commission is guaranteed.

## Glossary

- **System**: The REFERYDO! platform, including frontend application, backend services, and smart contracts
- **Scout**: A user who connects Clients with Talent and earns a commission for successful connections
- **Client**: A user who hires Talent for projects
- **Talent**: A user who provides services and completes projects
- **Referral Link**: A unique URL containing a Scout's address that tracks their connection to a potential Client
- **Scout Address**: The Stacks blockchain principal (wallet address) of the Scout
- **Smart Contract**: The Clarity smart contract deployed on Stacks blockchain that manages escrow and payments
- **localStorage**: Browser-based persistent storage mechanism
- **Trinity**: The three-party relationship between Client, Talent, and Scout in a project

## Requirements

### Requirement 1: Referral Link Generation Analysis

**User Story:** As an auditor, I want to verify that referral links are generated correctly with the Scout's address, so that I can confirm the tracking mechanism starts properly.

#### Acceptance Criteria

1. WHEN a Scout clicks the "Connect" button on a Talent's profile, THE System SHALL generate a unique shareable URL
2. THE System SHALL format the URL to include the Scout's Stacks address as a query parameter named "scout"
3. THE System SHALL use the format `https://referydo.xyz/profile/[talent-username]?scout=[SCOUT_STACKS_ADDRESS]`
4. THE System SHALL retrieve the Scout's address from the currently logged-in wallet session
5. THE System SHALL provide evidence of the code location where link generation occurs

### Requirement 2: Scout Address Capture and Persistence Analysis

**User Story:** As an auditor, I want to verify how the Scout's address is captured and stored when a Client uses a referral link, so that I can confirm the tracking persists across sessions.

#### Acceptance Criteria

1. WHEN a Client lands on the platform using a Scout's referral link, THE System SHALL immediately read the "scout" parameter from the URL
2. THE System SHALL store the captured Scout address in browser localStorage or session storage
3. THE System SHALL persist the Scout address across page navigations within the same session
4. THE System SHALL persist the Scout address even if the Client closes and reopens the browser
5. THE System SHALL provide evidence of the storage key name and storage mechanism used
6. THE System SHALL document the lifecycle and expiration policy of the stored Scout address

### Requirement 3: Visual Scout Acknowledgment Analysis

**User Story:** As an auditor, I want to verify that the UI reinforces the Scout's presence to the Client, so that I can confirm transparency in the referral relationship.

#### Acceptance Criteria

1. WHEN a Client arrives via a Scout's referral link, THE System SHALL display a visual indicator showing the Scout's identity
2. THE System SHALL display the Scout's username or profile information in a banner, toast, or persistent UI element
3. WHEN a Client creates a project, THE System SHALL display the Scout's profile as part of the "Trinity" visualization in the project creation modal
4. THE System SHALL maintain the Scout's visual presence throughout the project creation flow
5. THE System SHALL provide evidence of UI components that display Scout information

### Requirement 4: Transaction Assembly Analysis

**User Story:** As an auditor, I want to verify that the Scout's address is correctly passed to the smart contract during project creation, so that I can confirm the on-chain tracking is established.

#### Acceptance Criteria

1. WHEN a Client clicks the "Create & Fund Project" button, THE System SHALL retrieve the Client's address from the connected wallet
2. THE System SHALL retrieve the Talent's address from the profile being hired
3. THE System SHALL retrieve the Scout's address from localStorage or session storage
4. THE System SHALL construct a call to the `create-project` function in the smart contract
5. THE System SHALL pass the Client, Talent, and Scout addresses as distinct principal arguments to the contract call
6. THE System SHALL provide evidence of the onClick handler code that assembles the transaction
7. IF no Scout address is stored, THEN THE System SHALL handle the case appropriately (either with a null value or default address)

### Requirement 5: Smart Contract Project Creation Analysis

**User Story:** As an auditor, I want to verify that the smart contract accepts and stores the Scout's address immutably, so that I can confirm the on-chain guarantee is established.

#### Acceptance Criteria

1. THE Smart Contract SHALL define a `create-project` function that accepts a `scout: principal` parameter
2. THE Smart Contract SHALL store the Scout's address in the project data map or tuple
3. THE Smart Contract SHALL associate the Scout's address with the unique project ID
4. THE Smart Contract SHALL make the Scout's address immutable after project creation
5. THE Smart Contract SHALL provide evidence of the function signature and data storage implementation

### Requirement 6: Smart Contract Payout Guarantee Analysis

**User Story:** As an auditor, I want to verify that the smart contract guarantees the Scout's payout based on stored on-chain data, so that I can confirm the commission is mathematically guaranteed.

#### Acceptance Criteria

1. THE Smart Contract SHALL define an `approve-and-distribute` function for releasing funds
2. THE Smart Contract SHALL fetch the project data using the project ID
3. THE Smart Contract SHALL read the stored Talent address, Scout address, and fee percentages from the project data
4. THE Smart Contract SHALL execute an atomic three-way transfer of funds to Talent, Scout, and platform treasury
5. THE Smart Contract SHALL ensure the Scout's payout is a non-negotiable part of the distribution logic
6. THE Smart Contract SHALL prevent any code path where distribution completes without paying the stored Scout address
7. THE Smart Contract SHALL provide evidence of the payout distribution logic

### Requirement 7: Security and Loophole Analysis

**User Story:** As an auditor, I want to identify potential security vulnerabilities and loopholes in the Scout tracking mechanism, so that I can recommend improvements.

#### Acceptance Criteria

1. THE Audit SHALL identify scenarios where a Client could bypass Scout tracking by clearing localStorage
2. THE Audit SHALL identify scenarios where a Client could bypass Scout tracking by using a different browser or device
3. THE Audit SHALL identify scenarios where a Client could bypass Scout tracking by manually modifying URL parameters
4. THE Audit SHALL identify scenarios where the Scout address could be lost during the session
5. THE Audit SHALL identify scenarios where the smart contract could fail to pay the Scout
6. THE Audit SHALL identify race conditions or timing issues in the tracking mechanism
7. THE Audit SHALL identify potential front-running or manipulation attacks
8. THE Audit SHALL document each identified vulnerability with severity level and potential impact

### Requirement 8: Implementation Gap Analysis

**User Story:** As an auditor, I want to compare the current implementation against the gold standard specification, so that I can identify missing features and deviations.

#### Acceptance Criteria

1. THE Audit SHALL document each component of the gold standard specification
2. THE Audit SHALL indicate whether each component is implemented, partially implemented, or missing
3. THE Audit SHALL provide file paths and code snippets as evidence for each finding
4. THE Audit SHALL categorize gaps by severity (Critical, High, Medium, Low)
5. THE Audit SHALL prioritize gaps based on impact to Scout commission guarantee
6. THE Audit SHALL provide specific recommendations for addressing each gap

### Requirement 9: Final Assessment and Recommendations

**User Story:** As an auditor, I want to receive a comprehensive summary of findings and actionable recommendations, so that I can understand the current state and next steps.

#### Acceptance Criteria

1. THE Audit SHALL provide an executive summary of the overall implementation status
2. THE Audit SHALL indicate whether the current implementation aligns with the gold standard
3. THE Audit SHALL list the most critical deviations that need immediate attention
4. THE Audit SHALL provide prioritized recommendations for improvement
5. THE Audit SHALL estimate the effort required for each recommendation
6. THE Audit SHALL identify any architectural changes needed to achieve the gold standard
7. THE Audit SHALL provide a roadmap for implementing the recommendations
