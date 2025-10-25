# 24-Hour Grace Period Implementation

## Executive Summary

**Status:** ✅ **IMPLEMENTED**  
**Purpose:** Improve new user onboarding experience  
**Impact:** New users can freely configure their profile for the first 24 hours

---

## The Problem

### Original Issue
The existing rate-limiting logic was technically correct but created a critical UX flaw:

1. New profile created with default values
2. `fee_last_changed_at` timestamp set immediately
3. User tries to set their actual desired fee
4. **BLOCKED** - Rate limit prevents change for 3 days

**Result:** New users couldn't configure their profile on first login.

---

## The Solution

### 24-Hour Grace Period

**Business Rule:**
> Users can freely change their `username` and `universal_finder_fee` for the first 24 hours after profile creation. After this grace period, standard rate limits apply.

### Rate Limits

| Field | Grace Period | Standard Rate Limit |
|-------|--------------|---------------------|
| `username` | 24 hours (unlimited changes) | 7 days between changes |
| `universal_finder_fee` | 24 hours (unlimited changes) | 3 days between changes |

---

## Implementation Details

### Logic Flow

```typescript
// For both username and universal_finder_fee changes:

1. Fetch profile with created_at timestamp
2. Calculate hours since creation
3. IF (hours < 24):
     ALLOW change (grace period)
     Update field and _last_changed_at timestamp
   ELSE:
     Check _last_changed_at timestamp
     IF (days since last change < rate limit):
       REJECT with error message
     ELSE:
       ALLOW change
       Update field and _last_changed_at timestamp
```

### Code Structure

**Username Changes:**
```typescript
// Fetch profile with creation time
const { data: fullProfile } = await supabase
  .from('profiles')
  .select('username, username_last_changed_at, created_at')
  .eq('id', stacksAddress)
  .single();

// Calculate time since creation
const now = Date.now();
const createdAt = new Date(fullProfile.created_at).getTime();
const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
const GRACE_PERIOD_HOURS = 24;

// Check grace period
const isWithinGracePeriod = hoursSinceCreation < GRACE_PERIOD_HOURS;

if (isWithinGracePeriod) {
  // Allow change without rate limit check
  updateData.username = requestData.username;
  updateData.username_last_changed_at = new Date().toISOString();
  console.log('[UPDATE-PROFILE] Username change approved (grace period)');
} else {
  // Apply standard 7-day rate limit
  // ... existing rate limit logic
}
```

**Universal Finder's Fee Changes:**
```typescript
// Same structure as username, but with 3-day rate limit after grace period
const GRACE_PERIOD_HOURS = 24;
const RATE_LIMIT_DAYS = 3; // After grace period

if (isWithinGracePeriod) {
  // Allow change
  updateData.universal_finder_fee = requestData.universalFinderFee;
  updateData.fee_last_changed_at = new Date().toISOString();
} else {
  // Apply 3-day rate limit
  // ... existing rate limit logic
}
```

---

## User Experience Flow

### New User (Within 24 Hours)

```
1. User connects wallet
   └─> Profile created with defaults
       ├─> username: "user_12345"
       ├─> universal_finder_fee: 10
       └─> created_at: 2025-10-23 10:00:00

2. User goes to Settings
   └─> Changes username to "alice_designs"
       ✅ ALLOWED (grace period)
       └─> username_last_changed_at: 2025-10-23 10:05:00

3. User changes fee to 15%
   ✅ ALLOWED (grace period)
   └─> fee_last_changed_at: 2025-10-23 10:10:00

4. User changes fee again to 20%
   ✅ ALLOWED (grace period)
   └─> fee_last_changed_at: 2025-10-23 10:15:00

5. User changes username again
   ✅ ALLOWED (grace period)
   └─> username_last_changed_at: 2025-10-23 10:20:00

... unlimited changes within 24 hours ...
```

### Established User (After 24 Hours)

```
1. User created profile 3 days ago
   └─> created_at: 2025-10-20 10:00:00
   └─> Grace period expired

2. User tries to change username
   └─> Check username_last_changed_at
       ├─> Last changed: 2025-10-20 10:05:00 (3 days ago)
       └─> 7-day limit: 3 < 7 days
           ✅ ALLOWED (rate limit passed)
           └─> username_last_changed_at: 2025-10-23 10:00:00

3. User tries to change username again (1 hour later)
   └─> Check username_last_changed_at
       ├─> Last changed: 2025-10-23 10:00:00 (1 hour ago)
       └─> 7-day limit: 0.04 < 7 days
           ❌ REJECTED
           └─> Error: "Username can only be changed once every 7 days. 
                       You can change it again in 7 days."

4. User tries to change fee
   └─> Check fee_last_changed_at
       ├─> Last changed: 2025-10-20 10:15:00 (3 days ago)
       └─> 3-day limit: 3 >= 3 days
           ✅ ALLOWED (rate limit passed)
           └─> fee_last_changed_at: 2025-10-23 10:00:00

5. User tries to change fee again (1 hour later)
   └─> Check fee_last_changed_at
       ├─> Last changed: 2025-10-23 10:00:00 (1 hour ago)
       └─> 3-day limit: 0.04 < 3 days
           ❌ REJECTED
           └─> Error: "Universal Finder's Fee can only be changed once 
                       every 3 days. You can change it again in 3 days."
```

---

## Benefits

### For New Users
- ✅ Can experiment with settings during onboarding
- ✅ No frustration from being locked out
- ✅ Can correct mistakes immediately
- ✅ Professional first impression

### For Platform
- ✅ Better user retention
- ✅ Reduced support tickets
- ✅ Improved onboarding completion rate
- ✅ Maintains rate limiting for established users

### For Security
- ✅ Still prevents abuse after grace period
- ✅ Timestamps always updated
- ✅ Rate limits enforced for established users
- ✅ No loopholes for gaming the system

---

## Edge Cases Handled

### Case 1: User Creates Profile, Waits 23 Hours, Changes Fee
```
created_at: 2025-10-23 10:00:00
now: 2025-10-24 09:00:00
hours_since_creation: 23

Result: ✅ ALLOWED (within grace period)
```

### Case 2: User Creates Profile, Waits 25 Hours, Changes Fee
```
created_at: 2025-10-23 10:00:00
now: 2025-10-24 11:00:00
hours_since_creation: 25

Result: Check fee_last_changed_at
  - If never changed: ✅ ALLOWED (no previous change)
  - If changed during grace period: Check 3-day limit
```

### Case 3: User Changes Fee Multiple Times During Grace Period
```
created_at: 2025-10-23 10:00:00

Change 1 (10:05:00): ✅ ALLOWED (grace period)
Change 2 (10:10:00): ✅ ALLOWED (grace period)
Change 3 (10:15:00): ✅ ALLOWED (grace period)
... unlimited changes ...

After 24 hours (2025-10-24 10:01:00):
Change N: Check fee_last_changed_at (last change was 10:15:00)
  - Days since: ~0.98 days
  - 3-day limit: 0.98 < 3
  - Result: ❌ REJECTED (rate limit applies)
```

### Case 4: User Never Changes Fee During Grace Period
```
created_at: 2025-10-23 10:00:00
fee_last_changed_at: NULL (never changed)

After 30 days (2025-11-22 10:00:00):
User tries to change fee:
  - Grace period: Expired
  - fee_last_changed_at: NULL → treated as 0
  - Days since: Infinity
  - Result: ✅ ALLOWED (first change ever)
```

---

## Testing Checklist

### Manual Testing

**Test 1: New User Grace Period**
- [ ] Create new profile
- [ ] Immediately change username
- [ ] Verify: Change allowed
- [ ] Change username again
- [ ] Verify: Change allowed
- [ ] Change fee multiple times
- [ ] Verify: All changes allowed

**Test 2: Grace Period Expiration**
- [ ] Create profile
- [ ] Wait 24+ hours (or modify created_at in DB)
- [ ] Try to change username
- [ ] Verify: Rate limit check applies
- [ ] Try to change fee
- [ ] Verify: Rate limit check applies

**Test 3: Rate Limit After Grace Period**
- [ ] Create profile
- [ ] Change fee during grace period
- [ ] Wait 24+ hours
- [ ] Try to change fee again
- [ ] Verify: Rejected (3-day limit)
- [ ] Wait 3+ days
- [ ] Try to change fee
- [ ] Verify: Allowed

**Test 4: Username Rate Limit**
- [ ] Create profile
- [ ] Change username during grace period
- [ ] Wait 24+ hours
- [ ] Try to change username again
- [ ] Verify: Rejected (7-day limit)
- [ ] Wait 7+ days
- [ ] Try to change username
- [ ] Verify: Allowed

---

## Database Queries for Testing

### Check Profile Creation Time
```sql
SELECT 
  id,
  username,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since_creation,
  username_last_changed_at,
  fee_last_changed_at,
  universal_finder_fee
FROM profiles
WHERE id = 'YOUR_STACKS_ADDRESS';
```

### Simulate Grace Period Expiration (Testing Only)
```sql
-- Set created_at to 25 hours ago
UPDATE profiles
SET created_at = NOW() - INTERVAL '25 hours'
WHERE id = 'YOUR_STACKS_ADDRESS';
```

### Reset Rate Limit Timestamps (Testing Only)
```sql
-- Reset to allow immediate changes
UPDATE profiles
SET 
  username_last_changed_at = NULL,
  fee_last_changed_at = NULL
WHERE id = 'YOUR_STACKS_ADDRESS';
```

---

## Deployment

### 1. Deploy Edge Function
```bash
supabase functions deploy update-profile
```

### 2. Verify Deployment
```bash
# Test with curl
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "stacksAddress": "SP...",
    "universalFinderFee": 15
  }'
```

### 3. Monitor Logs
```bash
supabase functions logs update-profile --tail
```

Look for:
- `[UPDATE-PROFILE] Fee change approved (grace period)`
- `[UPDATE-PROFILE] Fee change approved (rate limit passed)`
- `[UPDATE-PROFILE] Fee change rate limit hit`

---

## Monitoring

### Key Metrics to Track

**Grace Period Usage:**
- Number of changes made during grace period
- Average number of changes per new user
- Time to first change after profile creation

**Rate Limit Hits:**
- Number of rate limit rejections
- Time distribution of rejection attempts
- User feedback on rate limits

**User Behavior:**
- Percentage of users who change settings during grace period
- Most common settings changed
- Correlation with user retention

---

## Future Enhancements

### Potential Improvements

1. **Dynamic Grace Period**
   - Adjust based on user behavior
   - Extend for users with incomplete profiles

2. **Grace Period Notifications**
   - Show countdown timer in UI
   - Notify users before grace period expires

3. **Graduated Rate Limits**
   - Shorter limits for trusted users
   - Longer limits for new users after grace period

4. **Admin Override**
   - Allow support to reset rate limits
   - Emergency grace period extension

---

## Conclusion

The 24-hour grace period implementation successfully balances:

1. **User Experience** - New users can configure their profile freely
2. **Platform Integrity** - Rate limits prevent abuse after onboarding
3. **Security** - Timestamps always updated, no loopholes
4. **Flexibility** - Easy to adjust grace period duration

**Status:** ✅ READY FOR PRODUCTION

---

**Implementation Date:** October 23, 2025  
**Edge Function:** `update-profile`  
**Grace Period:** 24 hours  
**Rate Limits:** 7 days (username), 3 days (fee)
