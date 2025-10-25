# Deploy Grace Period - Quick Guide

## Deployment Steps

### 1. Deploy Edge Function

```bash
# Navigate to project root
cd /path/to/your/project

# Deploy the updated function
supabase functions deploy update-profile

# Expected output:
# Deploying function update-profile...
# Function deployed successfully!
```

### 2. Verify Deployment

```bash
# Check function logs
supabase functions logs update-profile --tail

# You should see:
# [UPDATE-PROFILE] Function ready
```

### 3. Test with New User

```bash
# Create a test profile
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "stacksAddress": "SP2TEST...",
    "username": "test_user",
    "universalFinderFee": 10
  }'

# Immediately change the fee (should work - grace period)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "stacksAddress": "SP2TEST...",
    "universalFinderFee": 20
  }'

# Expected response:
# { "success": true, "profile": {...} }

# Check logs for:
# [UPDATE-PROFILE] Fee change approved (grace period): hoursSinceCreation=0.XX
```

### 4. Test Rate Limit After Grace Period

```sql
-- In Supabase SQL Editor, simulate grace period expiration
UPDATE profiles
SET created_at = NOW() - INTERVAL '25 hours'
WHERE id = 'SP2TEST...';

-- Now try to change fee again
-- Should check rate limit and reject if too soon
```

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "stacksAddress": "SP2TEST...",
    "universalFinderFee": 25
  }'

# Expected response (if changed recently):
# {
#   "success": false,
#   "error": "Universal Finder's Fee can only be changed once every 3 days..."
# }
```

---

## Monitoring

### Check Logs for Grace Period Usage

```bash
# Watch for grace period approvals
supabase functions logs update-profile --tail | grep "grace period"

# You should see:
# [UPDATE-PROFILE] Fee change approved (grace period): hoursSinceCreation=X.XX
# [UPDATE-PROFILE] Username change approved (grace period): hoursSinceCreation=X.XX
```

### Check Logs for Rate Limit Hits

```bash
# Watch for rate limit rejections
supabase functions logs update-profile --tail | grep "rate limit hit"

# You should see:
# [UPDATE-PROFILE] Fee change rate limit hit: daysSinceChange=X.XX
# [UPDATE-PROFILE] Username change rate limit hit: daysSinceChange=X.XX
```

---

## Database Queries

### Check Grace Period Status

```sql
-- See which users are in grace period
SELECT 
  id,
  username,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since_creation,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 < 24 
    THEN 'IN GRACE PERIOD'
    ELSE 'GRACE PERIOD EXPIRED'
  END AS grace_period_status,
  universal_finder_fee,
  fee_last_changed_at
FROM profiles
WHERE created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC;
```

### Check Recent Changes

```sql
-- See recent fee changes
SELECT 
  id,
  username,
  universal_finder_fee,
  fee_last_changed_at,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since_creation,
  EXTRACT(EPOCH FROM (NOW() - fee_last_changed_at)) / 24 AS days_since_fee_change
FROM profiles
WHERE fee_last_changed_at > NOW() - INTERVAL '7 days'
ORDER BY fee_last_changed_at DESC;
```

---

## Rollback Plan

If issues arise, you can rollback to the previous version:

### Option 1: Redeploy Previous Version

```bash
# Checkout previous commit
git checkout HEAD~1 supabase/functions/update-profile/index.ts

# Redeploy
supabase functions deploy update-profile

# Verify
supabase functions logs update-profile --tail
```

### Option 2: Disable Grace Period

If you need to temporarily disable the grace period without full rollback:

```typescript
// In update-profile/index.ts, change:
const GRACE_PERIOD_HOURS = 24;

// To:
const GRACE_PERIOD_HOURS = 0; // Disabled

// Redeploy
supabase functions deploy update-profile
```

---

## Success Criteria

✅ **Deployment Successful If:**

1. Function deploys without errors
2. New users can change settings multiple times within 24 hours
3. Rate limits apply after 24 hours
4. Logs show grace period approvals
5. No increase in error rates

❌ **Rollback If:**

1. Function fails to deploy
2. Grace period not working (changes blocked immediately)
3. Rate limits not working after grace period
4. Significant increase in errors
5. User complaints about functionality

---

## Post-Deployment Checklist

- [ ] Function deployed successfully
- [ ] Logs showing grace period approvals
- [ ] Test new user flow (create profile, change settings)
- [ ] Test established user flow (rate limits apply)
- [ ] Monitor error rates for 24 hours
- [ ] Check support tickets for issues
- [ ] Verify user feedback is positive
- [ ] Document any issues or improvements

---

## Support

### Common Issues

**Issue: Grace period not working**
```bash
# Check if created_at is being fetched
supabase functions logs update-profile --tail | grep "created_at"

# Verify database has created_at column
psql -c "SELECT created_at FROM profiles LIMIT 1;"
```

**Issue: Rate limits not applying after grace period**
```bash
# Check if grace period check is working
supabase functions logs update-profile --tail | grep "hoursSinceCreation"

# Verify timestamps are being updated
psql -c "SELECT fee_last_changed_at FROM profiles WHERE id = 'SP...';"
```

**Issue: Errors in logs**
```bash
# Check for errors
supabase functions logs update-profile --tail | grep "ERROR"

# Check function status
supabase functions list
```

---

## Contact

If you encounter issues during deployment:

1. Check the logs: `supabase functions logs update-profile --tail`
2. Review the error messages
3. Verify database schema
4. Test with curl commands
5. Rollback if necessary

---

**Status:** Ready for deployment  
**Estimated Deployment Time:** 5 minutes  
**Risk Level:** Low (can rollback easily)  
**Testing Required:** Yes (manual testing recommended)
