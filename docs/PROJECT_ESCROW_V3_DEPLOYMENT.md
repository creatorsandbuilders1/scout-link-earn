# Project Escrow V3 Deployment Guide

## Critical Bug Fix: Arithmetic Underflow (err u2)

### The Problem

**Failed Transaction:** `0x9534e4822396345eee13921fd82a7cc39e0976651df8d4d3066a11122894de0f`  
**Error Code:** `(err u2)` - Clarity arithmetic underflow error

The `approve-and-distribute` function in v2 was performing unsafe subtraction:

```clarity
;; ❌ UNSAFE - Can cause underflow
(talent-payout (- total-amount scout-payout platform-payout))
```

When `scout-payout + platform-payout > total-amount`, this causes an arithmetic underflow, crashing the transaction.

### The Fix

Version 3 implements safe arithmetic:

```clarity
;; ✅ SAFE - Uses checked-sub with error handling
(total-fees (+ scout-payout platform-payout))
(talent-payout (unwrap! (checked-sub total-amount total-fees) ERR-FEE-CALCULATION-ERROR))
```

**New Error Constant:**
- `ERR-FEE-CALCULATION-ERROR (err u105)` - Returned when fees exceed total amount

## Deployment Steps

### 1. Deploy the V3 Contract

```bash
# Navigate to contracts directory
cd contracts

# Deploy to testnet
clarinet deployments apply --manifest-path deployments/default.testnet-manifest.toml

# Or deploy manually using Clarinet console
clarinet console

# In console:
(contract-call? .project-escrow-v3 create-project ...)
```

**Alternative: Deploy via Hiro Platform**
1. Go to https://platform.hiro.so/
2. Connect your wallet
3. Create new contract deployment
4. Paste the contents of `project-escrow-v3.clar`
5. Deploy to testnet
6. Save the contract address

### 2. Update Frontend Configuration

Update the contract address in your environment configuration:

**File:** `.env.local`

```bash
# OLD v2 address
# VITE_PROJECT_ESCROW_CONTRACT=ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow-v2

# NEW v3 address (replace with your deployed address)
VITE_PROJECT_ESCROW_CONTRACT=ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow-v3
```

**File:** `src/config/contracts.ts`

```typescript
export const CONTRACTS = {
  testnet: {
    profileRegistry: 'ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry',
    projectEscrow: 'ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow-v3', // ✅ Updated
  },
  mainnet: {
    profileRegistry: 'SP...',
    projectEscrow: 'SP...project-escrow-v3', // ✅ Updated for mainnet
  }
};
```

### 3. Rebuild and Redeploy Frontend

```bash
# Install dependencies (if needed)
npm install

# Build the frontend
npm run build

# Deploy to Vercel
vercel --prod
```

### 4. Test the Fix

Create a test project and verify the complete flow:

1. **Create Project** - Client creates project
2. **Fund Escrow** - Client funds the escrow
3. **Accept Project** - Talent accepts the work
4. **Submit Work** - Talent submits deliverables
5. **Approve & Distribute** - Client approves (this should now work!)

**Expected Result:** Transaction succeeds, funds distributed correctly, no underflow errors.

## What Changed in V3

### New Error Constant

```clarity
(define-constant ERR-FEE-CALCULATION-ERROR (err u105))
```

### Refactored approve-and-distribute Function

**Before (v2):**
```clarity
(let
  (
    (total-amount (get amount project))
    (scout-payout (/ (* total-amount (get scout-fee-percent project)) u100))
    (platform-payout (/ (* total-amount (get platform-fee-percent project)) u100))
    (talent-payout (- total-amount scout-payout platform-payout))  ;; ❌ UNSAFE
  )
  ;; ... payouts
)
```

**After (v3):**
```clarity
(let
  (
    (total-amount (get amount project))
    (scout-payout (/ (* total-amount (get scout-fee-percent project)) u100))
    (platform-payout (/ (* total-amount (get platform-fee-percent project)) u100))
    
    ;; ✅ SAFE: Calculate total fees first
    (total-fees (+ scout-payout platform-payout))
    ;; ✅ SAFE: Use checked-sub with error handling
    (talent-payout (unwrap! (checked-sub total-amount total-fees) ERR-FEE-CALCULATION-ERROR))
  )
  ;; ... payouts
)
```

## Benefits

✅ **No More Underflow Errors** - Safe arithmetic prevents crashes  
✅ **Better Error Messages** - Clear error code when fees exceed amount  
✅ **Production Ready** - Robust error handling for edge cases  
✅ **Backward Compatible** - Same function signatures, drop-in replacement  

## Migration Notes

### Existing Projects on V2

Projects already created on v2 will remain on v2. You have two options:

**Option 1: Keep Both Contracts**
- V2 projects complete on v2 contract
- New projects use v3 contract
- Update frontend to support both contract addresses based on project version

**Option 2: Fresh Start (Recommended for Testnet)**
- Deploy v3 as the primary contract
- Archive v2 projects
- All new projects use v3

### Database Updates

No database schema changes required. The contract interface remains the same.

## Verification Checklist

- [ ] V3 contract deployed successfully
- [ ] Contract address updated in `.env.local`
- [ ] Contract address updated in `src/config/contracts.ts`
- [ ] Frontend rebuilt with new configuration
- [ ] Frontend deployed to production
- [ ] Test project created successfully
- [ ] Test project funded successfully
- [ ] Test project accepted by talent
- [ ] Test work submitted by talent
- [ ] Test approval completes without errors
- [ ] Funds distributed correctly to all parties

## Rollback Plan

If issues arise with v3:

1. Revert `.env.local` to v2 contract address
2. Revert `src/config/contracts.ts` to v2 contract address
3. Rebuild and redeploy frontend
4. Investigate v3 issues in testnet environment

## Support

If you encounter any issues during deployment:

1. Check the Stacks Explorer for transaction details
2. Verify contract address is correct in configuration
3. Ensure wallet is connected to correct network (testnet/mainnet)
4. Check browser console for frontend errors

---

**Status:** Ready for Deployment  
**Priority:** CRITICAL - Fixes production-blocking bug  
**Version:** 3.0.0  
**Date:** October 24, 2025
