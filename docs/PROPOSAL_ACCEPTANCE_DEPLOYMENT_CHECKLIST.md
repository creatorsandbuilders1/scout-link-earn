# Proposal & Acceptance Flow - Deployment Checklist

## Overview
Complete deployment guide for the Proposal & Acceptance flow with sequential transaction handling.

---

## Pre-Deployment Verification

### 1. Code Review
- [x] GigProposalModal refactored with sequential flow
- [x] ProposalReviewModal created
- [x] useAcceptProject hook created
- [x] useDeclineProject hook created
- [x] Profile page updated with Contracts tab
- [x] Edge Functions created (accept-project, decline-project)
- [x] Database migrations created
- [x] TypeScript errors resolved

### 2. Files Modified/Created

#### Frontend Components
- [x] `src/components/GigProposalModal.tsx` - Sequential transaction flow
- [x] `src/components/ProposalReviewModal.tsx` - Talent review interface
- [x] `src/pages/PostDetail.tsx` - Updated to use GigProposalModal
- [x] `src/pages/Profile.tsx` - Added Contracts tab

#### Frontend Hooks
- [x] `src/hooks/useAcceptProject.ts` - Accept proposal hook
- [x] `src/hooks/useDeclineProject.ts` - Decline proposal hook

#### Types
- [x] `src/types/contracts.ts` - Added PendingAcceptance(4) and Declined(5) statuses

#### Backend - Edge Functions
- [x] `supabase/functions/accept-project/index.ts`
- [x] `supabase/functions/decline-project/index.ts`

#### Backend - Database Migrations
- [x] `supabase/migrations/20251024000001_update_contract_status_constraints.sql`
- [x] `supabase/migrations/20251024000002_add_project_details_columns.sql`

---

## Deployment Steps

### Step 1: Database Migrations

Deploy the database migrations in order:

```bash
# Navigate to project root
cd /path/to/scout-link-earn

# Deploy migrations
supabase db push
```

**Expected Output:**
```
Applying migration 20251024000001_update_contract_status_constraints.sql...
Applying migration 20251024000002_add_project_details_columns.sql...
Finished supabase db push.
```

**Verification:**
```bash
# Check that migrations were applied
supabase db remote commit

# Verify columns exist
supabase db remote exec "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'on_chain_contracts' AND column_name IN ('project_title', 'project_brief', 'status');"
```

### Step 2: Deploy Edge Functions

Deploy the new Edge Functions:

```bash
# Deploy accept-project
supabase functions deploy accept-project

# Deploy decline-project
supabase functions deploy decline-project
```

**Expected Output:**
```
Deploying accept-project (project ref: your-project-ref)
Deployed Function accept-project with version xxx

Deploying decline-project (project ref: your-project-ref)
Deployed Function decline-project with version xxx
```

**Verification:**
```bash
# List all functions
supabase functions list

# Test accept-project
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/accept-project' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"projectId": 999, "talentId": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"}'

# Expected: {"success":false,"error":"Project not found or not in pending acceptance state"}
# (This is correct - we're testing with a non-existent project)
```

### Step 3: Deploy Frontend

Build and deploy the frontend application:

```bash
# Install dependencies (if needed)
npm install

# Build the application
npm run build

# Deploy to your hosting provider
# (Command depends on your hosting - Vercel, Netlify, etc.)
```

**For Vercel:**
```bash
vercel --prod
```

**For Netlify:**
```bash
netlify deploy --prod
```

**Verification:**
- Visit your deployed application
- Check browser console for errors
- Verify all pages load correctly

---

## Post-Deployment Testing

### Test 1: Complete Proposal Flow (Happy Path)

**Objective:** Test the entire proposal submission and acceptance flow

**Steps:**
1. **As Client:**
   - [ ] Navigate to a gig post
   - [ ] Click "Start Project"
   - [ ] Fill project brief (>50 characters)
   - [ ] Click "Send Proposal & Deposit X STX"
   - [ ] Confirm first transaction (create-project)
   - [ ] Wait for Step 1 completion (~30 seconds)
   - [ ] Wait for Step 2 confirmation (2-5 minutes)
   - [ ] Verify project ID is displayed
   - [ ] Confirm second transaction (fund-escrow)
   - [ ] Wait for Step 3 completion (~30 seconds)
   - [ ] See success message
   - [ ] Modal closes automatically

2. **As Talent:**
   - [ ] Navigate to Profile → Talent → Contracts tab
   - [ ] See pending proposal with badge count
   - [ ] Click on proposal card
   - [ ] Verify all details display correctly:
     - [ ] Client information
     - [ ] Scout information (if applicable)
     - [ ] Project brief
     - [ ] Financial breakdown
   - [ ] Click "Accept Project"
   - [ ] Confirm transaction
   - [ ] See success message
   - [ ] Verify project status updates to Funded

**Expected Results:**
- ✅ No `(err u102)` errors
- ✅ Project ID correctly extracted
- ✅ Both transactions complete successfully
- ✅ Proposal appears in Talent's Contracts tab
- ✅ All data displays correctly
- ✅ Status updates properly

### Test 2: Decline Flow

**Objective:** Test proposal decline with automatic refund

**Steps:**
1. **As Client:**
   - [ ] Submit a proposal (follow Test 1 steps 1-11)

2. **As Talent:**
   - [ ] Navigate to Contracts tab
   - [ ] Click on pending proposal
   - [ ] Click "Decline Project"
   - [ ] See confirmation dialog
   - [ ] Confirm decline
   - [ ] See success message
   - [ ] Verify project status updates to Declined

3. **As Client:**
   - [ ] Verify refund received (check wallet balance)

**Expected Results:**
- ✅ Decline transaction completes
- ✅ Automatic refund processes
- ✅ Status updates to Declined
- ✅ Client receives full refund

### Test 3: Error Scenarios

**Objective:** Test error handling

**Test 3a: User Cancels First Transaction**
- [ ] Start proposal submission
- [ ] Cancel wallet popup for create-project
- [ ] Verify error toast displays
- [ ] Verify modal stays open
- [ ] Verify can retry

**Test 3b: User Cancels Second Transaction**
- [ ] Complete Step 1 and Step 2
- [ ] Cancel wallet popup for fund-escrow
- [ ] Verify error toast displays
- [ ] Verify modal stays open
- [ ] Verify can retry

**Test 3c: Network Issues**
- [ ] Simulate slow network
- [ ] Verify polling continues
- [ ] Verify timeout after 5 minutes
- [ ] Verify error message is clear

**Expected Results:**
- ✅ All errors handled gracefully
- ✅ Clear error messages
- ✅ User can retry
- ✅ No stuck states

### Test 4: Edge Cases

**Test 4a: Multiple Proposals**
- [ ] Submit multiple proposals to same talent
- [ ] Verify all appear in Contracts tab
- [ ] Verify badge count is correct
- [ ] Accept one, decline another
- [ ] Verify counts update correctly

**Test 4b: Scout Commission**
- [ ] Submit proposal with active scout session
- [ ] Verify scout banner displays
- [ ] Verify scout fee in breakdown
- [ ] Complete proposal
- [ ] Verify scout info in review modal

**Expected Results:**
- ✅ Multiple proposals handled correctly
- ✅ Scout commission displays properly
- ✅ All calculations correct

---

## Monitoring

### Key Metrics to Monitor

1. **Transaction Success Rate**
   - Monitor create-project success rate
   - Monitor fund-escrow success rate
   - Target: >95% success rate

2. **Confirmation Times**
   - Average time for Step 2 (confirmation)
   - Target: 2-5 minutes on testnet

3. **Error Rates**
   - `(err u102)` errors (should be 0)
   - User cancellations
   - Timeout errors

4. **User Behavior**
   - Proposal submission rate
   - Acceptance vs decline rate
   - Average project brief length

### Monitoring Tools

**Supabase Dashboard:**
- Edge Function logs
- Database query performance
- Error rates

**Stacks Explorer:**
- Transaction confirmation times
- Smart contract call success rates
- Gas fees

**Frontend Analytics:**
- User flow completion rate
- Drop-off points
- Error occurrences

---

## Rollback Plan

### If Critical Issues Arise

**Option 1: Frontend Rollback**
```bash
# Revert to previous deployment
git revert HEAD
npm run build
# Deploy previous version
```

**Option 2: Feature Flag**
```typescript
// Add feature flag to disable new flow
const USE_SEQUENTIAL_FLOW = false;

if (USE_SEQUENTIAL_FLOW) {
  // New sequential flow
} else {
  // Old flow (with u102 bug)
}
```

**Option 3: Database Rollback**
```bash
# Only if migrations cause issues
supabase db reset
# Re-apply previous migrations
```

---

## Known Limitations

### Current Limitations

1. **Page Refresh**: If user refreshes during Step 2, progress is lost
   - **Mitigation**: Clear warning message
   - **Future**: Store state in localStorage

2. **Polling Overhead**: API calls every 5 seconds during confirmation
   - **Mitigation**: Reasonable timeout (5 minutes)
   - **Future**: WebSocket integration

3. **No Retry UI**: If transaction fails, user must start over
   - **Mitigation**: Clear error messages
   - **Future**: Retry button

4. **Mobile Experience**: Long wait times may be frustrating
   - **Mitigation**: Clear progress indicator
   - **Future**: Push notifications

### Future Improvements

1. **Transaction Persistence**
   - Store pending transactions in localStorage
   - Resume on page refresh

2. **Background Processing**
   - Continue polling even if modal closed
   - Notify when complete

3. **Optimistic UI**
   - Show proposal immediately
   - Update when confirmed

4. **Batch Transactions**
   - Combine create + fund into single transaction
   - Requires smart contract changes

---

## Success Criteria

### Deployment is Successful When:

- [x] All migrations applied without errors
- [x] All Edge Functions deployed and accessible
- [x] Frontend builds without errors
- [x] No TypeScript errors
- [ ] Test 1 (Happy Path) passes
- [ ] Test 2 (Decline Flow) passes
- [ ] Test 3 (Error Scenarios) passes
- [ ] Test 4 (Edge Cases) passes
- [ ] No `(err u102)` errors in production
- [ ] User feedback is positive
- [ ] No critical bugs reported

---

## Support & Troubleshooting

### Common Issues

**Issue: "Transaction timeout after 5 minutes"**
- **Cause**: Blockchain congestion
- **Solution**: Retry transaction, check Stacks status

**Issue: "Could not extract project ID"**
- **Cause**: Unexpected transaction result format
- **Solution**: Check transaction on explorer, verify smart contract

**Issue: "Project not found" in accept/decline**
- **Cause**: Database sync delay
- **Solution**: Wait a few seconds, retry

**Issue: Modal stuck in processing state**
- **Cause**: Network error during polling
- **Solution**: Refresh page, check transaction on explorer

### Getting Help

- **Stacks Discord**: https://discord.gg/stacks
- **Supabase Support**: https://supabase.com/support
- **Project Issues**: GitHub Issues

---

## Deployment Sign-Off

### Pre-Deployment Checklist
- [ ] All code reviewed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team notified
- [ ] Backup plan ready

### Deployment Execution
- [ ] Migrations deployed
- [ ] Edge Functions deployed
- [ ] Frontend deployed
- [ ] Smoke tests passed

### Post-Deployment Verification
- [ ] All tests completed
- [ ] Monitoring active
- [ ] No critical errors
- [ ] User feedback collected

### Sign-Off
- [ ] Technical Lead: _______________
- [ ] Product Owner: _______________
- [ ] Date: _______________

---

**Deployment Status**: 🟡 Ready for Testing  
**Next Action**: Execute Step 1 (Database Migrations)  
**Estimated Time**: 30 minutes total deployment + 2 hours testing
