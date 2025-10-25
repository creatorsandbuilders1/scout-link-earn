# Requirements Document: Proposal & Acceptance Flow

## Introduction

This feature transforms the gig hiring process from instant hiring to a professional proposal-based system. When a Client wants to hire a Talent for a gig, they must submit a proposal with a detailed project brief. The Talent then reviews the proposal and can either accept or decline it. If declined, the Client receives an automatic refund. This leverages the newly deployed project-escrow-v2 smart contract with accept-project and decline-project functions.

## Glossary

- **Client**: The user who wants to hire a Talent for a gig and submits a project proposal
- **Talent**: The user who offers gigs and receives project proposals to review
- **Scout**: An optional referrer who earns commission if they connected the Client to the Talent
- **Project Brief**: A mandatory text description written by the Client explaining project requirements
- **Proposal**: The combination of project brief, gig details, and escrow deposit sent by Client to Talent
- **Pending_Acceptance**: Status (4) indicating a project is funded and awaiting Talent's decision
- **Declined**: Status (5) indicating Talent rejected the proposal and Client was refunded
- **GigProposalModal**: The UI component where Clients create and submit proposals
- **ProposalReviewModal**: The UI component where Talents review and respond to proposals
- **project-escrow-v2**: The smart contract deployed at ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow-v2

## Requirements

### Requirement 1: Client Proposal Submission

**User Story:** As a Client, I want to submit a detailed project proposal to a Talent, so that they understand my requirements before accepting the work.

#### Acceptance Criteria

1. WHEN the Client clicks "Start Project" on a gig, THE GigProposalModal SHALL display with talent information, gig details, and cost breakdown
2. THE GigProposalModal SHALL require a project brief with minimum 50 characters before submission
3. THE GigProposalModal SHALL display the total deposit amount including gig price, scout fee, and platform fee
4. WHEN the Client submits the proposal, THE System SHALL call create-project and fund-escrow functions on project-escrow-v2
5. WHEN fund-escrow completes successfully, THE System SHALL set project status to Pending_Acceptance (4)
6. THE GigProposalModal SHALL display "Send Proposal & Deposit [Amount] STX" as the submission button text
7. THE GigProposalModal SHALL show scout commission information when an active scout session exists

### Requirement 2: Talent Proposal Review

**User Story:** As a Talent, I want to review project proposals with full details, so that I can make informed decisions about which projects to accept.

#### Acceptance Criteria

1. WHEN a project has status Pending_Acceptance, THE System SHALL display it in the Talent's workspace with a "Pending Your Approval" indicator
2. WHEN the Talent clicks on a pending project, THE ProposalReviewModal SHALL display with client information, scout information, project brief, and financial breakdown
3. THE ProposalReviewModal SHALL prominently display the project brief as the most critical information
4. THE ProposalReviewModal SHALL show the Talent's payout amount after deducting scout and platform fees
5. THE ProposalReviewModal SHALL provide "Accept Project" and "Decline Project" action buttons
6. THE ProposalReviewModal SHALL display important terms including escrow security and refund policy

### Requirement 3: Project Acceptance

**User Story:** As a Talent, I want to accept a project proposal, so that I can begin work with funds secured in escrow.

#### Acceptance Criteria

1. WHEN the Talent clicks "Accept Project", THE System SHALL call the accept-project function on project-escrow-v2 with the project ID
2. THE accept-project function SHALL verify the caller is the assigned Talent for the project
3. THE accept-project function SHALL verify the project status is Pending_Acceptance (4)
4. WHEN accept-project succeeds, THE System SHALL update project status to Funded (1)
5. THE System SHALL display a success notification to the Talent confirming acceptance
6. THE System SHALL update the contract card in the workspace to reflect the new Funded status
7. THE System SHALL close the ProposalReviewModal after successful acceptance

### Requirement 4: Project Decline with Refund

**User Story:** As a Talent, I want to decline a project proposal I cannot fulfill, so that the Client receives their funds back automatically.

#### Acceptance Criteria

1. WHEN the Talent clicks "Decline Project", THE System SHALL display a confirmation dialog explaining the refund process
2. WHEN the Talent confirms decline, THE System SHALL call the decline-project function on project-escrow-v2 with the project ID
3. THE decline-project function SHALL verify the caller is the assigned Talent for the project
4. THE decline-project function SHALL verify the project status is Pending_Acceptance (4)
5. WHEN decline-project succeeds, THE System SHALL automatically refund the full amount to the Client
6. THE System SHALL update project status to Declined (5)
7. THE System SHALL display a success notification to the Talent confirming decline and refund
8. THE System SHALL update the contract card in the workspace to reflect the Declined status

### Requirement 5: Backend Type and Schema Updates

**User Story:** As a Developer, I want the backend types and database schema to support the new proposal flow, so that the system correctly handles all project states.

#### Acceptance Criteria

1. THE ProjectStatus enum SHALL include Pending_Acceptance = 4 and Declined = 5 values
2. THE on_chain_contracts table status column check constraint SHALL allow values 0, 1, 2, 3, 4, and 5
3. THE System SHALL provide an accept-project Edge Function for backend validation
4. THE System SHALL provide a decline-project Edge Function for backend validation
5. THE accept-project Edge Function SHALL verify the project exists, is in Pending_Acceptance status, and the caller is the assigned Talent
6. THE decline-project Edge Function SHALL verify the project exists, is in Pending_Acceptance status, and the caller is the assigned Talent

### Requirement 6: Frontend Hooks and Integration

**User Story:** As a Developer, I want React hooks for accept and decline operations, so that the UI can easily interact with the smart contract.

#### Acceptance Criteria

1. THE System SHALL provide a useAcceptProject hook that calls the accept-project smart contract function
2. THE System SHALL provide a useDeclineProject hook that calls the decline-project smart contract function
3. THE useAcceptProject hook SHALL handle loading states, success states, and error states
4. THE useDeclineProject hook SHALL handle loading states, success states, and error states
5. THE useAcceptProject hook SHALL trigger database synchronization after successful transaction
6. THE useDeclineProject hook SHALL trigger database synchronization after successful transaction
7. THE PostDetail page SHALL use GigProposalModal instead of ProjectCreationModal for gig posts

### Requirement 7: User Experience and Feedback

**User Story:** As a User (Client or Talent), I want clear feedback during proposal operations, so that I understand what is happening at each step.

#### Acceptance Criteria

1. WHEN a proposal is being submitted, THE System SHALL display a loading state with "Sending Proposal..." text
2. WHEN a proposal submission succeeds, THE System SHALL display a success toast notification
3. WHEN a proposal submission fails, THE System SHALL display an error toast with the failure reason
4. WHEN a project is being accepted, THE System SHALL display a loading state with "Accepting..." text
5. WHEN a project is being declined, THE System SHALL display a loading state with "Declining..." text
6. THE System SHALL disable action buttons during loading states to prevent duplicate submissions
7. THE System SHALL provide character count feedback for the project brief textarea

### Requirement 8: Scout Commission Transparency

**User Story:** As a Client, I want to see scout commission information during proposal submission, so that I understand all fees involved.

#### Acceptance Criteria

1. WHEN an active scout session exists, THE GigProposalModal SHALL display a "Scout Referral Active" banner
2. THE banner SHALL show the scout's commission percentage
3. THE cost breakdown SHALL itemize the scout fee separately from the platform fee
4. THE ProposalReviewModal SHALL display scout information when a scout is involved in the project
5. THE ProposalReviewModal SHALL show the scout's commission percentage in their information card
