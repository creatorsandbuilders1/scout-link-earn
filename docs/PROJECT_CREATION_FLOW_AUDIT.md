# Project Creation Flow Audit

## Current State Analysis

### ✅ What's Correct

1. **Separation of Concerns**
   - ✅ `ProjectCreationModal` is for **hiring a specific talent** (blockchain transaction)
   - ✅ This triggers `create-project` smart contract function
   - ✅ Funds are deposited into escrow immediately
   - ✅ Scout tracking is properly integrated

2. **Smart Contract Integration**
   - ✅ `useCreateProject` hook calls blockchain
   - ✅ Creates on-chain contract with Client, Talent, Scout
   - ✅ Funds escrow in same transaction flow
   - ✅ Transaction status tracking works

3. **Data Structure**
   - ✅ Mock data has `Job` type for job postings
   - ✅ Mock data has `Contract` type for active projects
   - ✅ Clear distinction between posting and hiring

### ❌ What's Missing

1. **"Post a Project" Flow**
   - ❌ No UI for clients to post job opportunities
   - ❌ No wizard/guided flow for project posting
   - ❌ "+ Post a Project" button exists but doesn't work
   - ❌ No way to create entries in `mockJobs` array

2. **Job Board Integration**
   - ❌ Jobs exist in mock data but no creation flow
   - ❌ No connection between posting and hiring

## Required Implementation

### Phase 1: Post a Project (NO Blockchain)
**Purpose**: Client publishes a job opportunity to attract talent

**Flow**:
1. Click "+ Post a Project" button
2. Open full-screen modal wizard (Typeform-style)
3. Steps:
   - Project title
   - Required skills (tags)
   - Project description (rich text)
   - Budget & duration
   - Experience level
4. Preview & publish
5. **Result**: New entry in Job Board (mock data for now)
6. **Cost**: FREE - No blockchain transaction

### Phase 2: Hire Talent (WITH Blockchain)
**Purpose**: Client selects specific talent and creates on-chain contract

**Flow**:
1. Client finds talent (Discovery Hub or applications)
2. Clicks "Hire [Talent]" button
3. Opens `ProjectCreationModal` (existing component)
4. Shows Trinity (Client → Talent ← Scout)
5. Enter amount and review breakdown
6. Click "Create Contract & Fund Escrow"
7. **Result**: Blockchain transactions
   - `create-project` - Creates on-chain contract
   - `fund-escrow` - Deposits STX to escrow
8. **Cost**: Gas fees + escrow amount

## Correct Flow Sequence

```
1. POST PROJECT (Free, Off-chain)
   ↓
   Job appears on Job Board
   ↓
2. TALENT DISCOVERY
   - Talents apply
   - Scouts recommend
   - Client searches
   ↓
3. NEGOTIATION
   - Messages
   - Proposals
   - Agreement
   ↓
4. HIRE TALENT (Blockchain)
   - Create contract on-chain
   - Fund escrow
   - Work begins
```

## Implementation Plan

### Component to Create: `PostProjectWizard`
- Full-screen modal
- Multi-step form (5 steps)
- Typeform-style UX
- Saves to mock data (later: Supabase)
- NO blockchain interaction

### Component to Keep: `ProjectCreationModal`
- Used for hiring specific talent
- Triggers blockchain transactions
- Creates on-chain contract
- Funds escrow

### Navigation Update
- "+ Post a Project" button opens `PostProjectWizard`
- NOT `ProjectCreationModal`

## Summary

**Current State**: We have the "hiring" part (Phase 2) but missing the "posting" part (Phase 1).

**What to Build**: A wizard flow for posting job opportunities that's completely separate from the blockchain contract creation.

**Key Distinction**:
- **Post Project** = Publish job listing (free, off-chain)
- **Hire Talent** = Create contract & escrow (paid, on-chain)
