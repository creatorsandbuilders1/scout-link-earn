# Project Escrow v2 - Deployment Guide

## Overview

This document provides instructions for deploying the upgraded `project-escrow-v2.clar` smart contract with Proposal & Acceptance flow support.

## What's New in v2

### New Features
1. ✅ **Proposal & Acceptance Flow** - Talents must explicitly accept or decline projects
2. ✅ **Automatic Refunds** - Declined projects automatically refund the Client
3. ✅ **New Status States** - Added Pending_Acceptance (u4) and Declined (u5)
4. ✅ **Talent Functions** - Two new talent-initiated functions

### New Functions
- `accept-project(project-id)` - Talent accepts work
- `decline-project(project-id)` - Talent declines with automatic refund

### Modified Functions
- `fund-escrow(project-id)` - Now sets status to u4 (Pending_Acceptance) instead of u1 (Funded)

### Status Flow Comparison

**v1 Flow:**
```
Created (0) → Funded (1) → Completed (2)
```

**v2 Flow:**
```
Created (0) → Pending_Acceptance (4) → Funded (1) → Completed (2)
                                    ↓
                                Declined (5) [with refund]
```

---

## Deployment Actions

### Step 1: Deploy to Stacks Testnet

You will deploy this contract using the Hiro Stacks Sandbox (as you did with v1).

**File to Deploy:** `contracts/project-escrow-v2.clar`

**Important Notes:**
- This will be a **NEW contract deployment** with a **NEW address**
- The old v1 contract will remain on-chain but will no longer be used for new projects
- Save the new contract address after deployment

### Step 2: Update Frontend Configuration

After deployment, update the contract address in your frontend:

**File:** `src/config/contracts.ts`

**Change:**
```typescript
export const CONTRACTS: Record<'testnet' | 'mainnet', ContractConfig> = {
  testnet: {
    profileRegistry: 'ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry',
    projectEscrow: 'YOUR_NEW_V2_ADDRESS_HERE.project-escrow-v2',  // UPDATE THIS
    network: new StacksTestnet()
  },
  // ...
};
```

### Step 3: Update TypeScript Types

**File:** `src/types/contracts.ts`

Add the new status values:

```typescript
export enum ProjectStatus {
  Created = 0,
  Funded = 1,
  Completed = 2,
  Disputed = 3,
  PendingAcceptance = 4,  // NEW
  Declined = 5             // NEW
}
```

### Step 4: Create New Hooks

You'll need to create two new React hooks for the new functions:

**File:** `src/hooks/useAcceptProject.ts`
```typescript
// Hook for talent to accept projects
export const useAcceptProject = () => {
  // Implementation similar to useFundEscrow
  // Calls accept-project contract function
};
```

**File:** `src/hooks/useDeclineProject.ts`
```typescript
// Hook for talent to decline projects
export const useDeclineProject = () => {
  // Implementation similar to useFundEscrow
  // Calls decline-project contract function
};
```

### Step 5: Update UI Components

Add UI for the new acceptance flow:

1. **Talent Notification Component**
   - Shows when project is in Pending_Acceptance state
   - Displays "Accept" and "Decline" buttons

2. **Client Status Display**
   - Shows "Waiting for Talent acceptance..." message
   - Updates when Talent accepts or declines

3. **Status Badge Component**
   - Add cases for PendingAcceptance and Declined statuses

---

## Testing Checklist

### Contract Testing

- [ ] Deploy contract to testnet
- [ ] Verify contract address is correct
- [ ] Test `create-project` function
- [ ] Test `fund-escrow` function (should set status to u4)
- [ ] Test `accept-project` function (talent only)
- [ ] Test `decline-project` function (talent only, verify refund)
- [ ] Test `approve-and-distribute` function (after acceptance)
- [ ] Verify unauthorized users cannot call talent functions
- [ ] Verify status transitions are correct

### Frontend Testing

- [ ] Update contract address in config
- [ ] Test project creation flow
- [ ] Test funding flow
- [ ] Test acceptance UI (talent view)
- [ ] Test decline UI (talent view)
- [ ] Test refund receipt (client view)
- [ ] Test status display updates
- [ ] Test error handling

---

## Contract Verification

### Function Signatures

**Existing (Unchanged):**
```clarity
(define-public (create-project (talent principal) (scout principal) (amount uint) (scout-fee uint) (platform-fee uint)))
(define-public (approve-and-distribute (project-id uint)))
(define-read-only (get-project-data (project-id uint)))
```

**Modified:**
```clarity
(define-public (fund-escrow (project-id uint)))
;; Now sets status to u4 instead of u1
```

**New:**
```clarity
(define-public (accept-project (project-id uint)))
(define-public (decline-project (project-id uint)))
```

### Status Values

```clarity
u0 = Created
u1 = Funded
u2 = Completed
u3 = Disputed
u4 = Pending_Acceptance (NEW)
u5 = Declined (NEW)
```

---

## Migration Strategy

### For Existing Projects (v1)

**Option 1: Complete Existing Projects**
- Let all v1 projects complete naturally
- Start using v2 for new projects only
- No migration needed

**Option 2: Dual Operation**
- Keep v1 contract address for old projects
- Use v2 contract address for new projects
- Frontend checks project version and uses appropriate contract

**Recommended:** Option 1 (Complete existing, use v2 for new)

### For New Projects

All new projects created after v2 deployment will:
1. Use the new contract address
2. Require talent acceptance after funding
3. Support talent decline with automatic refund

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate Action:**
   - Revert `src/config/contracts.ts` to v1 address
   - New projects will use v1 contract

2. **Fix Issues:**
   - Debug and fix v2 contract
   - Redeploy as v2.1

3. **Re-enable:**
   - Update config to v2.1 address
   - Resume using new contract

**Note:** Projects already created on v2 will remain on v2 contract.

---

## Security Considerations

### Authorization Checks

✅ **accept-project:**
- Only talent can call
- Only works in Pending_Acceptance state

✅ **decline-project:**
- Only talent can call
- Only works in Pending_Acceptance state
- Automatic refund to client

### Fund Safety

✅ **Refund Mechanism:**
- Full amount returned to client
- Atomic transaction (refund + status change)
- No partial refunds

✅ **Status Validation:**
- All functions check current status
- Prevents invalid state transitions

---

## Support & Documentation

### Contract Source
- **Location:** `contracts/project-escrow-v2.clar`
- **Audit Report:** `PROJECT_ESCROW_AUDIT_VERIFIED.md`

### Frontend Integration
- **Config:** `src/config/contracts.ts`
- **Types:** `src/types/contracts.ts`
- **Hooks:** `src/hooks/useAcceptProject.ts`, `src/hooks/useDeclineProject.ts`

### Testing
- Test on Stacks Testnet before mainnet
- Use small amounts for initial tests
- Verify all status transitions

---

## Quick Start

1. Deploy `contracts/project-escrow-v2.clar` to Stacks Testnet via Hiro Sandbox
2. Copy the new contract address
3. Update `src/config/contracts.ts` with new address
4. Update `src/types/contracts.ts` with new status values
5. Create new hooks for accept/decline functions
6. Add UI components for acceptance flow
7. Test thoroughly on testnet
8. Deploy to mainnet when ready

---

## Status

📋 **Contract:** Ready for deployment  
🔧 **Frontend:** Requires updates after deployment  
✅ **Audit:** Complete and verified  
🚀 **Next Step:** Deploy to Hiro Stacks Sandbox

---

**Version:** 2.0  
**Date:** October 24, 2025  
**Status:** Ready for Deployment
