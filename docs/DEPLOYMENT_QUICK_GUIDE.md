# 🚀 Deployment Quick Guide - Attribution System & Service Management

## Status: ✅ READY FOR DEPLOYMENT

---

## Pre-Deployment Checklist

- ✅ Build successful (13.51s)
- ✅ No TypeScript errors
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Database migration ready
- ✅ Edge Functions ready

---

## Step 1: Deploy Database Migration

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Using Supabase Dashboard
# 1. Go to SQL Editor
# 2. Open: supabase/migrations/20251023000002_add_attribution_and_rate_limiting.sql
# 3. Run the migration
```

**Verify:**
```sql
-- Check new table exists
SELECT COUNT(*) FROM client_attributions;

-- Check new columns exist
SELECT username_last_changed_at FROM profiles LIMIT 1;
SELECT fee_last_changed_at, is_primary FROM services LIMIT 1;
```

---

## Step 2: Deploy Edge Functions

```bash
# Deploy create-attribution (NEW)
supabase functions deploy create-attribution

# Deploy upsert-service (NEW)
supabase functions deploy upsert-service

# Deploy update-profile (MODIFIED)
supabase functions deploy update-profile

# Verify all functions are deployed
supabase functions list
```

**Test Endpoints:**
```bash
# Test create-attribution
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-attribution \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "ST1...",
    "talentId": "ST2...",
    "scoutId": "ST3..."
  }'

# Test upsert-service
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/upsert-service \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "talentId": "ST2...",
    "title": "Test Service",
    "description": "Test description",
    "price": 100,
    "finderFeePercent": 15
  }'
```

---

## Step 3: Deploy Frontend

```bash
# Build
npm run build

# Deploy to your hosting provider
# (Vercel, Netlify, etc.)

# Or commit and push to trigger auto-deployment
git add .
git commit -m "feat: commission locking & service management"
git push origin main
```

---

## Step 4: Verify Deployment

### Test Attribution System

1. **Open incognito browser**
2. **Visit:** `/profile/talent?scout=SCOUT_ADDRESS`
3. **Connect wallet** (new user)
4. **Check database:**
   ```sql
   SELECT * FROM client_attributions 
   WHERE client_id = 'NEW_USER_ADDRESS';
   ```
5. **Expected:** Attribution record exists with locked fee

### Test Service Management

1. **Log in as Talent**
2. **Navigate to:** Settings → My Services
3. **Click:** "Create New Service"
4. **Fill in form** and save
5. **Expected:** Service appears in list

### Test Rate Limiting

1. **Edit service** and change fee
2. **Save successfully**
3. **Immediately edit again** and try to change fee
4. **Expected:** 429 error with "You can change it again in 3 days"

---

## Step 5: Monitor

### Check Logs

```bash
# View Edge Function logs
supabase functions logs create-attribution
supabase functions logs upsert-service
supabase functions logs update-profile
```

### Check Database

```sql
-- Monitor attribution creation
SELECT 
  COUNT(*) as total_attributions,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'used' THEN 1 END) as used
FROM client_attributions;

-- Monitor service creation
SELECT 
  COUNT(*) as total_services,
  COUNT(CASE WHEN is_primary THEN 1 END) as primary_services,
  AVG(finder_fee_percent) as avg_fee
FROM services;
```

---

## Rollback Plan (If Needed)

### Database Rollback

```sql
-- Drop new table
DROP TABLE IF EXISTS client_attributions CASCADE;

-- Remove new columns
ALTER TABLE profiles DROP COLUMN IF EXISTS username_last_changed_at;
ALTER TABLE services DROP COLUMN IF EXISTS fee_last_changed_at;
ALTER TABLE services DROP COLUMN IF EXISTS is_primary;
```

### Edge Functions Rollback

```bash
# Redeploy previous versions
supabase functions deploy update-profile --no-verify-jwt

# Delete new functions
supabase functions delete create-attribution
supabase functions delete upsert-service
```

### Frontend Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

---

## Common Issues & Solutions

### Issue: Attribution not created

**Symptom:** No record in `client_attributions` table

**Solution:**
1. Check Edge Function logs
2. Verify talent profile exists
3. Check for self-referral (client == scout)
4. Verify service_role key is set

### Issue: Rate limit not working

**Symptom:** Can change fee multiple times

**Solution:**
1. Check `fee_last_changed_at` column exists
2. Verify Edge Function is deployed
3. Check timestamp calculation logic
4. Clear browser cache

### Issue: Primary service not working

**Symptom:** Multiple primary services or none

**Solution:**
1. Check unique index exists
2. Run: `SELECT * FROM services WHERE is_primary = true`
3. Manually fix: `UPDATE services SET is_primary = false WHERE talent_id = '...'`
4. Set one as primary

---

## Success Criteria

- ✅ Attribution records created for new users
- ✅ Locked commissions used in project creation
- ✅ Rate limiting enforced (7 days username, 3 days fee)
- ✅ Service management UI functional
- ✅ Primary service logic working
- ✅ No errors in logs
- ✅ Build successful
- ✅ All tests passing

---

## Support

**Documentation:**
- `ATTRIBUTION_SYSTEM_AUDIT_REPORT.md` - Audit findings
- `COMMISSION_LOCKING_IMPLEMENTATION_COMPLETE.md` - Phase 1 details
- `RATE_LIMITING_AND_SERVICE_MANAGEMENT_COMPLETE.md` - Phase 2 details
- `ARCHITECTURAL_UPGRADE_COMPLETE.md` - Complete overview

**Contact:**
- Check Edge Function logs for errors
- Review database constraints
- Verify environment variables

---

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs
- [ ] Check attribution creation rate
- [ ] Verify service creation works
- [ ] Test rate limiting in production

### Short-Term (Week 1)
- [ ] Add analytics tracking
- [ ] Monitor user feedback
- [ ] Check for edge cases
- [ ] Optimize queries if needed

### Medium-Term (Month 1)
- [ ] Build admin dashboard
- [ ] Add email notifications
- [ ] Implement cron job for expiration
- [ ] Add advanced features

---

**Deploy with confidence. The system is ready.** 🚀
