# Quick Deployment Guide

## 🚀 Fast Track Deployment

Copy and paste these commands in order for quick deployment.

---

## Step 1: Database Migrations (2 minutes)

```bash
# Deploy migrations
supabase db push

# Verify migrations
supabase db remote exec "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'on_chain_contracts' 
AND column_name IN ('project_title', 'project_brief', 'status');
"
```

**Expected Output:**
```
column_name    | data_type
---------------+-----------
status         | integer
project_title  | text
project_brief  | text
```

---

## Step 2: Deploy Edge Functions (3 minutes)

```bash
# Deploy both new functions
supabase functions deploy accept-project && \
supabase functions deploy decline-project

# Verify deployment
supabase functions list
```

**Expected Output:**
```
accept-project    deployed
decline-project   deployed
```

---

## Step 3: Test Edge Functions (2 minutes)

```bash
# Set your project ref and anon key
export PROJECT_REF="your-project-ref"
export ANON_KEY="your-anon-key"

# Test accept-project (should return error for non-existent project)
curl -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/accept-project" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"projectId": 999, "talentId": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"}'

# Test decline-project (should return error for non-existent project)
curl -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/decline-project" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"projectId": 999, "talentId": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"}'
```

**Expected Response (both):**
```json
{
  "success": false,
  "error": "Project not found or not in pending acceptance state"
}
```

✅ This is correct! The functions are working.

---

## Step 4: Deploy Frontend (5 minutes)

```bash
# Build
npm run build

# Deploy (choose your platform)

# For Vercel:
vercel --prod

# For Netlify:
netlify deploy --prod

# For custom server:
# Upload dist/ folder to your server
```

---

## Step 5: Smoke Test (10 minutes)

### Test 1: Submit Proposal

1. Open your deployed app
2. Navigate to a gig
3. Click "Start Project"
4. Fill project brief (>50 chars)
5. Click "Send Proposal & Deposit X STX"
6. Confirm first transaction
7. **Wait 2-5 minutes** for confirmation
8. Confirm second transaction
9. Verify success message

**✅ Success Criteria:**
- No `(err u102)` errors
- Both transactions complete
- Success message displays

### Test 2: Review Proposal

1. Switch to talent account
2. Go to Profile → Talent → Contracts
3. See pending proposal
4. Click to review
5. Click "Accept Project"
6. Confirm transaction
7. Verify status updates

**✅ Success Criteria:**
- Proposal displays correctly
- Accept transaction completes
- Status updates to Funded

---

## Verification Checklist

Quick checklist to verify everything is working:

```bash
# 1. Check migrations
supabase db remote exec "SELECT COUNT(*) FROM on_chain_contracts WHERE status IN (4, 5);"

# 2. Check Edge Functions
supabase functions list | grep -E "(accept-project|decline-project)"

# 3. Check frontend build
ls -la dist/

# 4. Check deployment
curl -I https://your-app-url.com
```

---

## Rollback (if needed)

```bash
# Rollback frontend
git revert HEAD
npm run build
# Deploy previous version

# Rollback database (only if critical)
supabase db reset
# Re-apply previous migrations

# Rollback Edge Functions
# Delete from Supabase Dashboard → Edge Functions
```

---

## Monitoring Commands

```bash
# Watch Edge Function logs
supabase functions logs accept-project --tail
supabase functions logs decline-project --tail

# Check database
supabase db remote exec "
SELECT 
  project_id, 
  status, 
  project_title, 
  LENGTH(project_brief) as brief_length,
  created_at 
FROM on_chain_contracts 
WHERE status = 4 
ORDER BY created_at DESC 
LIMIT 10;
"

# Check recent transactions
# Visit: https://explorer.hiro.so/txid/YOUR_TX_ID?chain=testnet
```

---

## Troubleshooting

### Issue: Migration fails
```bash
# Check current migrations
supabase db remote commit

# Reset and retry
supabase db reset
supabase db push
```

### Issue: Edge Function not found
```bash
# Redeploy
supabase functions deploy accept-project --no-verify-jwt
supabase functions deploy decline-project --no-verify-jwt
```

### Issue: Frontend build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Success! 🎉

If all steps completed without errors, your deployment is successful!

**Next Steps:**
1. Monitor logs for 24 hours
2. Gather user feedback
3. Track success metrics
4. Plan Phase 2 enhancements

---

## Quick Reference

**Supabase Dashboard**: https://app.supabase.com/project/YOUR_PROJECT_REF

**Stacks Explorer**: https://explorer.hiro.so/?chain=testnet

**Documentation**:
- Full deployment guide: `PROPOSAL_ACCEPTANCE_DEPLOYMENT_CHECKLIST.md`
- Implementation details: `PROPOSAL_ACCEPTANCE_IMPLEMENTATION_COMPLETE.md`
- Sequential flow fix: `GIG_PROPOSAL_SEQUENTIAL_FLOW_FIX.md`

---

**Total Deployment Time**: ~20 minutes  
**Total Testing Time**: ~10 minutes  
**Total**: ~30 minutes from start to finish
