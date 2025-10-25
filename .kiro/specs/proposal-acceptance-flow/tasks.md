# Implementation Plan: Proposal & Acceptance Flow

## Overview
This implementation plan breaks down the Proposal & Acceptance flow into discrete, manageable coding tasks. Each task builds incrementally on previous steps, ensuring a systematic implementation of the feature.

---

## Part 1: Backend Foundation

- [x] 1. Update TypeScript types for new project statuses


  - Add `PendingAcceptance = 4` and `Declined = 5` to ProjectStatus enum in `src/types/contracts.ts`
  - Ensure enum values match the smart contract status values
  - _Requirements: 5.1_



- [ ] 2. Create database migration for status constraints
  - Create migration file `supabase/migrations/20251024000001_update_contract_status_constraints.sql`
  - Drop existing status check constraint on `on_chain_contracts` table
  - Add new constraint allowing status values 0, 1, 2, 3, 4, 5


  - Add descriptive comment explaining each status value
  - _Requirements: 5.2_

- [ ] 3. Create accept-project Edge Function
  - Create `supabase/functions/accept-project/index.ts`
  - Implement CORS headers for preflight requests
  - Validate required fields: projectId and talentId
  - Query database to verify project exists and is in Pending_Acceptance status (4)


  - Verify caller is the assigned talent for the project
  - Return project data for frontend to proceed with smart contract call
  - Handle errors with appropriate HTTP status codes
  - _Requirements: 5.3, 5.5_

- [ ] 4. Create decline-project Edge Function
  - Create `supabase/functions/decline-project/index.ts`
  - Implement CORS headers for preflight requests
  - Validate required fields: projectId and talentId
  - Query database to verify project exists and is in Pending_Acceptance status (4)
  - Verify caller is the assigned talent for the project
  - Return project data for frontend to proceed with smart contract call


  - Handle errors with appropriate HTTP status codes
  - _Requirements: 5.4, 5.6_

---

## Part 2: Frontend Hooks

- [ ] 5. Create useAcceptProject hook
  - Create `src/hooks/useAcceptProject.ts`
  - Implement state management for loading and error states
  - Verify wallet connection before proceeding
  - Call accept-project Edge Function for backend validation


  - Construct smart contract transaction using makeContractCall
  - Call accept-project function on project-escrow-v2 contract with projectId
  - Broadcast transaction to Stacks network
  - Trigger sync-on-chain-contract Edge Function to update database
  - Display success toast notification on completion
  - Display error toast with descriptive message on failure
  - Return boolean indicating success/failure
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.3, 6.5_

- [ ] 6. Create useDeclineProject hook
  - Create `src/hooks/useDeclineProject.ts`
  - Implement state management for loading and error states
  - Verify wallet connection before proceeding
  - Call decline-project Edge Function for backend validation
  - Construct smart contract transaction using makeContractCall
  - Call decline-project function on project-escrow-v2 contract with projectId


  - Broadcast transaction to Stacks network (triggers automatic refund)
  - Trigger sync-on-chain-contract Edge Function to update database
  - Display success toast notification on completion
  - Display error toast with descriptive message on failure
  - Return boolean indicating success/failure
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.2, 6.4, 6.6_

---

## Part 3: Client-Facing Components

- [ ] 7. Create GigProposalModal component
  - Create `src/components/GigProposalModal.tsx`
  - Import required UI components (Dialog, Button, Input, Textarea, Avatar, Badge)
  - Define GigProposalModalProps interface with all required props
  - Implement modal layout with DialogContent and DialogHeader
  - Display talent information section with avatar and username
  - Display gig details section with title and price


  - Create project brief textarea with label "Project Brief *"
  - Implement character counter showing current length vs minimum (50)
  - Add real-time validation preventing submission if brief < 50 characters
  - Calculate and display cost breakdown (gig price, scout fee, platform fee, total)
  - Conditionally render scout referral banner when hasActiveScoutSession is true
  - Display important notice section explaining escrow and refund terms
  - Implement submit button with text "Send Proposal & Deposit [Amount] STX"
  - Wire submit handler to call createProject and fundEscrow hooks
  - Display loading state during submission with "Sending Proposal..." text


  - Show success toast and close modal on successful submission
  - Show error toast with failure reason on error
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 7.1, 7.7, 8.1, 8.2, 8.3_

- [ ] 8. Update PostDetail page to use GigProposalModal
  - Open `src/pages/PostDetail.tsx`
  - Replace import of ProjectCreationModal with GigProposalModal
  - Update modal component usage to pass gigTitle and gigPrice props
  - Ensure all required props are passed correctly
  - _Requirements: 6.7_

---

## Part 4: Talent-Facing Components

- [ ] 9. Create ProposalReviewModal component
  - Create `src/components/ProposalReviewModal.tsx`
  - Import required UI components (Dialog, Button, Avatar, Badge, Separator)
  - Define ProposalReviewModalProps interface with project data structure
  - Implement modal layout with max height and scroll for long content
  - Display status badge "Pending Your Approval" in amber/yellow color
  - Show project title and formatted received date
  - Create client information card with avatar, username, and address
  - Conditionally render scout information card when scout exists
  - Display scout commission percentage badge in scout card
  - Create prominent project brief section with border and background highlight
  - Calculate talent payout (amount - scout fee - platform fee)
  - Display financial breakdown with itemized fees



  - Highlight talent payout in success/green color
  - Add important information section explaining escrow and terms
  - Implement "Decline Project" button with outline destructive styling
  - Implement "Accept Project" button with solid success styling
  - Create decline confirmation dialog with warning message
  - Wire Accept button to useAcceptProject hook
  - Wire Decline button to useDeclineProject hook with confirmation
  - Display loading states with "Accepting..." or "Declining..." text
  - Disable buttons during loading to prevent duplicate submissions
  - Call onStatusChange callback after successful accept/decline
  - Close modal after successful operation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.4, 7.5, 7.6, 8.4, 8.5_

---

## Part 5: Workspace Integration

- [ ] 10. Update Profile/Workspace to display pending proposals
  - Open `src/pages/Profile.tsx` or relevant workspace component
  - Add filter/section for projects with status Pending_Acceptance (4)
  - Display pending projects with "Pending Your Approval" visual indicator (yellow/amber badge)
  - Ensure contract cards for pending projects are clickable
  - Wire click handler to open ProposalReviewModal with project data
  - Pass project details including client info, scout info, and project brief
  - Implement onStatusChange callback to refresh project list after accept/decline
  - _Requirements: 2.1, 3.6, 4.8_

---

## Part 6: Testing & Validation

- [ ] 11. Test complete proposal submission flow
  - Test GigProposalModal opens correctly from PostDetail page
  - Verify project brief validation (< 50 chars shows error)
  - Verify project brief validation (>= 50 chars allows submission)
  - Test cost breakdown calculations are correct
  - Test scout banner displays when scout session is active
  - Submit proposal and verify create-project is called
  - Verify fund-escrow is called after create-project succeeds
  - Confirm success toast displays with correct message
  - Verify modal closes after successful submission
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.1, 7.2_

- [ ] 12. Test proposal review and acceptance flow
  - Navigate to workspace and verify pending project displays
  - Verify "Pending Your Approval" badge is visible
  - Click pending project and verify ProposalReviewModal opens
  - Verify all project details display correctly (client, scout, brief, finances)
  - Verify talent payout calculation is correct
  - Click "Accept Project" button
  - Verify accept-project Edge Function is called
  - Verify smart contract accept-project function is called
  - Confirm success toast displays
  - Verify project status updates to Funded (1) in workspace
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 13. Test proposal decline and refund flow
  - Navigate to workspace and open a pending project
  - Click "Decline Project" button
  - Verify confirmation dialog appears with warning message
  - Confirm decline action
  - Verify decline-project Edge Function is called
  - Verify smart contract decline-project function is called
  - Confirm success toast displays with refund message
  - Verify project status updates to Declined (5) in workspace
  - Verify client receives refund (check on blockchain or client wallet)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 14. Test error handling and edge cases
  - Test submission with wallet not connected (should show error)
  - Test accept/decline with wrong user (should fail validation)
  - Test accept/decline on project not in Pending_Acceptance status (should fail)
  - Test network timeout scenarios (should show error toast)
  - Test user rejecting transaction in wallet (should show error)
  - Verify all error messages are descriptive and actionable
  - _Requirements: 7.3_

---

## Deployment Checklist

- [ ] 15. Deploy backend changes
  - Run database migration: `supabase db push`
  - Deploy accept-project Edge Function: `supabase functions deploy accept-project`
  - Deploy decline-project Edge Function: `supabase functions deploy decline-project`
  - Verify Edge Functions are accessible and return correct responses
  - Test Edge Function validation logic with sample requests

- [ ] 16. Deploy frontend changes
  - Build frontend application
  - Verify no TypeScript errors
  - Verify no build warnings
  - Deploy to hosting environment
  - Test deployed application end-to-end

- [ ] 17. Post-deployment verification
  - Submit a test proposal on production
  - Verify proposal appears in talent workspace as pending
  - Accept a test proposal and verify status updates
  - Decline a test proposal and verify refund processes
  - Monitor error logs for any issues
  - Verify database status values are updating correctly

---

## Notes

- All tasks should be completed in order as they build on each other
- Each task should be tested individually before moving to the next
- Database migration should be deployed before Edge Functions
- Edge Functions should be deployed before frontend components
- The smart contract (project-escrow-v2) is already deployed and does not need changes
- Ensure all environment variables are set correctly (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
