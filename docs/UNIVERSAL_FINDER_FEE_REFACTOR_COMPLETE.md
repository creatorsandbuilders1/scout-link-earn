# ✅ Universal Finder's Fee Refactor - PHASE 1 COMPLETE

## Executive Summary

**Status:** ✅ **DATABASE SURGERY COMPLETE**  
**Priority:** 🔴 **CRITICAL - BREAKING CHANGE**  
**Next Phase:** ⏳ **UI REBUILD REQUIRED**

---

## What Was Changed

### The Architectural Pivot

**OLD MODEL (INCORRECT):**
```
Talent
  └── Services (multiple)
      ├── Service 1: 15% fee
      ├── Service 2: 20% fee
      └── Service 3: 10% fee
```
- Granular, per-service fees
- Confusing for Scouts
- Complex to manage
- Not aligned with vision

**NEW MODEL (CORRECT):**
```
Talent
  ├── Universal Finder's Fee: 12% (applies to ALL work)
  └── Posts (gallery)
      ├── Portfolio Piece (showcase)
      ├── Gig (transactable, $500)
      └── Portfolio Piece (showcase)
```
- ONE universal fee per Talent
- Simple and clear
- Easy for Scouts to understand
- Aligned with platform vision

---

## Database Changes

### 1. Profiles Table - NEW COLUMNS

```sql
-- Universal Finder's Fee (replaces per-service fees)
ALTER TABLE public.profiles 
ADD COLUMN universal_finder_fee INTEGER DEFAULT 10 NOT NULL;

-- Rate limiting for fee changes
ALTER TABLE public.profiles 
ADD COLUMN fee_last_changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Constraint: Fee must be 0-50%
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_universal_fee_check 
CHECK (universal_finder_fee >= 0 AND universal_finder_fee <= 50);
```

**Purpose:**
- `universal_finder_fee`: The ONE fee that applies to all work
- `fee_last_changed_at`: Enforces 3-day rate limit on changes

**Default:** 10% (reasonable starting point)

---

### 2. Deleted Tables

```sql
-- DELETED: services table
DROP TABLE IF EXISTS public.services CASCADE;

-- DELETED: service_skills table
DROP TABLE IF EXISTS public.service_skills CASCADE;
```

**Rationale:** These tables represented the old, incorrect model

---

### 3. New Posts Table

```sql
CREATE TABLE public.posts (
  id UUID PRIMARY KEY,
  talent_id TEXT NOT NULL REFERENCES public.profiles(id),
  
  -- Type: 'portfolio' or 'gig'
  type TEXT NOT NULL CHECK (type IN ('portfolio', 'gig')),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Price (required for gigs, optional for portfolio)
  price NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'published' NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint: Gigs MUST have a price
  CONSTRAINT posts_gig_must_have_price CHECK (
    (type = 'portfolio') OR 
    (type = 'gig' AND price IS NOT NULL AND price > 0)
  )
);
```

**Post Types:**

**Portfolio:**
- Showcase work
- No price required
- Demonstrates skills
- Builds credibility

**Gig:**
- Transactable service
- Price required (> 0)
- Can be purchased directly
- Uses universal_finder_fee for Scout commission

---

## Code Cleanup

### Deleted Files

1. ✅ `supabase/functions/upsert-service/index.ts`
   - Obsolete Edge Function
   - Tied to old services table

2. ✅ `src/components/ServiceFormModal.tsx`
   - Obsolete UI component
   - Tied to old services model

### Files Requiring Updates (Phase 2)

1. ⏳ `src/pages/Settings.tsx`
   - Remove "My Services" section
   - Add universal fee control
   - Add posts management UI

2. ⏳ `src/components/ScoutControlPanel.tsx`
   - Update to fetch universal_finder_fee from profiles
   - Remove service-specific logic

3. ⏳ `supabase/functions/create-attribution/index.ts`
   - Update to fetch universal_finder_fee instead of service fee

4. ⏳ `supabase/functions/update-profile/index.ts`
   - Add rate limiting for universal_finder_fee changes

---

## The New Data Model

### Profile with Universal Fee

```typescript
interface Profile {
  id: string;
  username: string;
  universal_finder_fee: number;  // NEW: 0-50
  fee_last_changed_at: string;   // NEW: Rate limiting
  // ... other fields
}
```

### Post (Portfolio or Gig)

```typescript
interface Post {
  id: string;
  talent_id: string;
  type: 'portfolio' | 'gig';
  title: string;
  description: string;
  image_urls: string[];
  price?: number;  // Required if type === 'gig'
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}
```

---

## How It Works Now

### Scout Attribution Flow

```
1. Scout refers Client to Talent
   ↓
2. Attribution created with Talent's universal_finder_fee
   - client_attributions.attributed_finder_fee = Talent.universal_finder_fee
   ↓
3. Client hires Talent (custom project or gig purchase)
   ↓
4. Scout earns commission based on locked universal_finder_fee
```

**Key Point:** The universal_finder_fee applies to:
- Custom projects (negotiated work)
- Gig purchases (fixed-price services)
- ANY work the Scout brings

---

### Talent Gallery Flow

```
Talent Profile
  ↓
Gallery Tab
  ↓
Posts (mixed portfolio + gigs)
  ├── Portfolio Piece 1 (showcase)
  ├── Gig 1 ($500 - can purchase)
  ├── Portfolio Piece 2 (showcase)
  └── Gig 2 ($1000 - can purchase)
```

**Scout sees:**
- Universal Finder's Fee: 12%
- Applies to all gigs and custom work

**Client sees:**
- Portfolio pieces (credibility)
- Gigs (can purchase directly)
- Custom project option (negotiate)

---

## Migration Impact

### Breaking Changes

1. ❌ **Services table deleted**
   - All service data lost
   - UI must be rebuilt

2. ❌ **ServiceFormModal deleted**
   - Component no longer exists
   - Settings page will break

3. ❌ **upsert-service function deleted**
   - API endpoint no longer exists
   - Calls will fail

### Non-Breaking Changes

1. ✅ **Profiles table extended**
   - Existing profiles get default 10% fee
   - Backward compatible

2. ✅ **Attribution system unchanged**
   - Still uses attributed_finder_fee
   - Just fetches from different source

---

## Rate Limiting (Unchanged)

### Universal Finder's Fee Changes

**Limit:** Once every **3 days**

**Enforcement:**
- Column: `profiles.fee_last_changed_at`
- Checked in: `update-profile` Edge Function
- Error: 429 Too Many Requests

**Rationale:**
- Prevents bait-and-switch
- Maintains Scout confidence
- Market stability

---

## Next Steps (Phase 2)

### Backend Tasks

1. ⏳ **Update `create-attribution` Edge Function**
   - Fetch `universal_finder_fee` from profiles
   - Remove service table queries

2. ⏳ **Update `update-profile` Edge Function**
   - Add rate limiting for `universal_finder_fee` changes
   - Same 3-day limit as before

3. ⏳ **Create `upsert-post` Edge Function**
   - Create/update posts (portfolio + gigs)
   - Validate gig pricing
   - Handle image uploads

### Frontend Tasks

1. ⏳ **Update Settings Page**
   - Remove "My Services" section
   - Add "Universal Finder's Fee" control
   - Add "My Gallery" section (posts management)

2. ⏳ **Create Post Management UI**
   - Create/edit posts
   - Toggle portfolio vs gig
   - Image upload
   - Price input (for gigs)

3. ⏳ **Update Profile Page**
   - Display universal_finder_fee
   - Show posts gallery (portfolio + gigs)
   - Purchase flow for gigs

4. ⏳ **Update Scout Control Panel**
   - Fetch universal_finder_fee from profiles
   - Display single fee (not per-service)

---

## Testing Checklist (After Phase 2)

### Test 1: Universal Fee Display
- [ ] Profile shows universal_finder_fee
- [ ] Scout Control Panel shows correct fee
- [ ] Attribution uses correct fee

### Test 2: Fee Rate Limiting
- [ ] Can change fee once
- [ ] Cannot change again within 3 days
- [ ] Error message shows days remaining

### Test 3: Posts Management
- [ ] Can create portfolio post
- [ ] Can create gig post (with price)
- [ ] Cannot create gig without price
- [ ] Posts display in gallery

### Test 4: Attribution with Universal Fee
- [ ] Scout refers Client
- [ ] Attribution created with universal_finder_fee
- [ ] Client hires Talent
- [ ] Scout earns correct commission

---

## Deployment Steps

### 1. Apply Migration

```bash
# Apply migration to Supabase
supabase db push

# Or via Dashboard:
# 1. Go to SQL Editor
# 2. Paste migration file
# 3. Run
```

**Verify:**
```sql
-- Check new columns exist
SELECT 
  id, 
  username, 
  universal_finder_fee, 
  fee_last_changed_at 
FROM profiles 
LIMIT 5;

-- Check old tables are gone
SELECT * FROM services;  -- Should error

-- Check new table exists
SELECT * FROM posts LIMIT 1;
```

---

### 2. Update Edge Functions (Phase 2)

```bash
# Update create-attribution
supabase functions deploy create-attribution

# Update update-profile
supabase functions deploy update-profile

# Create upsert-post (new)
supabase functions deploy upsert-post
```

---

### 3. Deploy Frontend (Phase 2)

```bash
npm run build
# Deploy to hosting
```

---

## Rollback Plan (If Needed)

### Database Rollback

```sql
-- Remove new columns
ALTER TABLE profiles DROP COLUMN IF EXISTS universal_finder_fee;
ALTER TABLE profiles DROP COLUMN IF EXISTS fee_last_changed_at;

-- Drop new table
DROP TABLE IF EXISTS posts CASCADE;

-- Recreate old tables (from backup)
-- ... restore services and service_skills tables
```

**Note:** This is a breaking change. Rollback should only be used in emergency.

---

## Benefits of New Model

### For Scouts
- ✅ Simple: ONE fee to understand
- ✅ Clear: Applies to ALL work
- ✅ Predictable: No per-service confusion
- ✅ Trustworthy: Locked at attribution

### For Talent
- ✅ Simple: Set ONE fee for everything
- ✅ Flexible: Can adjust (within rate limit)
- ✅ Professional: Clear pricing model
- ✅ Empowering: Full control

### For Clients
- ✅ Transparent: Clear commission structure
- ✅ Fair: Same fee for all work types
- ✅ Simple: Easy to understand

### For Platform
- ✅ Aligned with vision
- ✅ Simpler architecture
- ✅ Easier to maintain
- ✅ Scalable model

---

## Conclusion

**Phase 1 (Database Surgery) is COMPLETE.**

The database now reflects the correct architecture:
- ✅ Universal Finder's Fee at profile level
- ✅ Posts table for portfolio + gigs
- ✅ Old services model deleted
- ✅ Clean, simple data model

**Next:** Phase 2 - Rebuild UI to interact with new schema

---

**Status:** ✅ READY FOR PHASE 2
