# 🔴 CRITICAL AUDIT: Attribution System Vulnerabilities

## Executive Summary

**Status:** 🔴 **CRITICAL VULNERABILITIES CONFIRMED**  
**Risk Level:** **HIGH - Economic Model Integrity at Risk**  
**Recommendation:** **IMMEDIATE ARCHITECTURAL UPGRADE REQUIRED**

---

## Part 1: Current State Analysis

### 1.1 Source of Truth: Where is scout_id stored?

**FINDING:** ❌ **localStorage ONLY** (Ephemeral, Vulnerable)

**Evidence:**

```typescript
// src/contexts/ScoutTrackingContext.tsx
const SCOUT_STORAGE_KEY = 'referydo_scout_address';
const SCOUT_TIMESTAMP_KEY = 'referydo_scout_timestamp';

// Scout address captured from URL and stored in localStorage
localStorage.setItem(SCOUT_STORAGE_KEY, scoutParam);
localStorage.setItem(SCOUT_TIMESTAMP_KEY, now.toString());
```

**Journey Map:**
```
1. Guest clicks referral link: /profile/talent?scout=SCOUT_A
   → localStorage: { scout: SCOUT_A, timestamp: NOW }

2. Guest connects wallet
   → Scout token read from localStorage
   → Token cleared immediately (one-time use)
   → Passed to update-profile Edge Function

3. Profile created
   → scoutAddress passed in request body
   → ❌ NOT STORED IN DATABASE
   → ❌ Lost forever after profile creation
```

**Current Database State:**
- `profiles` table: NO scout_address column
- `scout_connections` table: Only tracks Scout→Talent relationships
- `on_chain_contracts` table: Records scout_id ONLY after contract creation

**Conclusion:** Scout attribution exists ONLY in localStorage until contract creation. No persistent record of "who brought this client to this talent."

---

### 1.2 Vulnerability: Cache Clearing

**FINDING:** ✅ **CONFIRMED - Attribution Lost on Cache Clear**

**Attack Vector:**
```
1. User clicks Scout A's referral link
   → localStorage: { scout: SCOUT_A }

2. User connects wallet (becomes Client)
   → Scout token consumed
   → Profile created
   → ❌ No database record of Scout A

3. User clears browser cache
   → localStorage: { } (empty)

4. User returns to hire Talent
   → No Scout attribution exists
   → Scout A loses commission ❌
```

**Real-World Scenarios:**
- User clears cache for privacy
- User switches browsers
- User switches devices
- Browser auto-clears old data
- Incognito mode expires

**Impact:** Scout's hard work (marketing, outreach, relationship building) is erased. Economic model broken.

---

### 1.3 Commission Timing: When is finder_fee_percent decided?

**FINDING:** ❌ **AT MOMENT OF CONTRACT CALL** (Vulnerable to Gaming)

**Evidence:**

```typescript
// src/components/ProjectCreationModal.tsx
export const ProjectCreationModal: React.FC<Props> = ({
  scoutFeePercent  // ← Passed as prop from parent
}) => {
  // ...
  const result = await createProject({
    talentAddress,
    amountSTX: parseFloat(amount),
    scoutFeePercent,  // ← Used directly in contract call
    platformFeePercent
  });
};
```

**Where does scoutFeePercent come from?**

```typescript
// src/pages/Profile.tsx
<ProjectCreationModal
  scoutFeePercent={15}  // ← HARDCODED! Not from database
/>
```

**Current Flow:**
```
1. Client opens "Hire" modal
   → scoutFeePercent = 15 (hardcoded)

2. Talent changes their fee from 15% → 5%
   → Database updated

3. Client clicks "Create Project"
   → Still uses old 15% value ❌
   → OR uses new 5% value ❌
   → Either way, someone gets screwed
```

**Gaming Scenarios:**

**Scenario A: Talent Manipulation**
```
1. Talent sets fee to 20% to attract Scouts
2. Scout promotes Talent heavily
3. Client clicks referral link
4. Talent changes fee to 5% before Client hires
5. Scout earns 5% instead of promised 20% ❌
```

**Scenario B: Client Manipulation**
```
1. Client clicks Scout's link (20% fee)
2. Client waits for Talent to lower fee to 10%
3. Client hires at 10% fee
4. Scout earns 10% instead of 20% ❌
```

**Conclusion:** No "commission locking" exists. Fee is determined at contract creation, not at attribution moment.

---

## Part 2: Architectural Vulnerabilities

### 2.1 Missing: Attribution Contract

**Problem:** No binding record of Scout→Client→Talent relationship

**What's Missing:**
- No `client_attributions` table
- No locked-in commission rate
- No timestamp of attribution
- No expiration logic

**Impact:**
- Scout attribution can be lost
- Commission rates can change
- No audit trail
- No dispute resolution

---

### 2.2 Missing: Rate Limiting

**Problem:** Users can change critical data too frequently

**Vulnerabilities:**

**Username Changes:**
```sql
-- profiles table
username TEXT UNIQUE NOT NULL
-- ❌ No username_last_changed_at column
-- ❌ No rate limiting
```

**Impact:**
- User can change username constantly
- Breaks referral links
- Confuses Scouts and Clients
- No stability

**Finder's Fee Changes:**
```sql
-- services table
finder_fee_percent INTEGER DEFAULT 10
-- ❌ No fee_last_changed_at column
-- ❌ No rate limiting
```

**Impact:**
- Talent can bait-and-switch fees
- Scouts can't trust commission rates
- Economic model unstable

---

### 2.3 Missing: Database Persistence

**Problem:** Scout attribution not persisted after profile creation

**Current Flow:**
```typescript
// WalletContext.tsx - ensureProfileExists()
const response = await fetch('/functions/v1/update-profile', {
  body: JSON.stringify({
    stacksAddress: address,
    username: defaultUsername,
    scoutAddress: scoutReferralToken,  // ← Passed but not stored
  }),
});
```

**update-profile Edge Function:**
```typescript
// supabase/functions/update-profile/index.ts
interface UpdateProfileRequest {
  stacksAddress: string;
  username?: string;
  // ... other fields
  // ❌ scoutAddress NOT in interface
  // ❌ NOT stored in database
}
```

**Conclusion:** Scout address is passed but ignored. No persistence.

---

## Part 3: Confirmed Vulnerabilities Summary

| Vulnerability | Status | Severity | Impact |
|--------------|--------|----------|--------|
| **localStorage-only attribution** | ✅ CONFIRMED | 🔴 CRITICAL | Scout loses commission if cache cleared |
| **No commission locking** | ✅ CONFIRMED | 🔴 CRITICAL | Talent can change fees after Scout promotion |
| **No rate limiting** | ✅ CONFIRMED | 🟡 HIGH | Platform instability, gaming potential |
| **No attribution persistence** | ✅ CONFIRMED | 🔴 CRITICAL | No audit trail, no dispute resolution |
| **Hardcoded fee in UI** | ✅ CONFIRMED | 🟡 HIGH | Doesn't reflect actual database values |

---

## Part 4: Required Architectural Changes

### 4.1 New Table: `client_attributions`

**Purpose:** Binding record of Scout→Client→Talent relationship with locked commission

```sql
CREATE TABLE public.client_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The Trinity
  client_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scout_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Locked Economic Agreement
  attributed_finder_fee INTEGER NOT NULL,
  commission_rule TEXT DEFAULT 'one_time' NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'used', 'expired'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ, -- Optional: 30-day expiration
  
  -- Constraints
  UNIQUE (client_id, talent_id, scout_id),
  CONSTRAINT client_attributions_fee_check CHECK (attributed_finder_fee >= 0 AND attributed_finder_fee <= 100)
);
```

**When Created:** At the moment a new user connects wallet via referral link

**When Used:** At the moment Client creates project with Talent

---

### 4.2 Schema Upgrades: Rate Limiting

**profiles table:**
```sql
ALTER TABLE public.profiles 
ADD COLUMN username_last_changed_at TIMESTAMPTZ;

-- Initialize for existing users
UPDATE public.profiles 
SET username_last_changed_at = created_at;
```

**services table:**
```sql
ALTER TABLE public.services 
ADD COLUMN fee_last_changed_at TIMESTAMPTZ,
ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Initialize for existing services
UPDATE public.services 
SET fee_last_changed_at = created_at;
```

---

### 4.3 New Edge Function: `create-attribution`

**Purpose:** Create binding attribution record when new user connects via referral

**Trigger:** Called from `WalletContext.ensureProfileExists()` for NEW users only

**Logic:**
```typescript
1. Receive: clientId, talentId, scoutId
2. Fetch Talent's current finder_fee_percent from services table
3. Create client_attributions record with locked fee
4. Return success
```

---

### 4.4 Modified Hook: `useCreateProject`

**Purpose:** Use locked commission from `client_attributions` table

**Logic:**
```typescript
1. Client opens "Hire" modal
2. Query client_attributions table:
   - WHERE client_id = current user
   - WHERE talent_id = selected talent
   - WHERE status = 'active'
3. IF attribution exists:
   - Use attributed_finder_fee (locked)
   - Use scout_id from record
   - Display as non-editable
4. ELSE:
   - Fetch current fee from services table
   - Use current user as scout (self-hire)
```

---

### 4.5 Rate Limiting Logic

**Username Changes:**
```typescript
// update-profile Edge Function
const lastChanged = profile.username_last_changed_at;
const daysSinceChange = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);

if (daysSinceChange < 7) {
  return error('You can change your username again in ${7 - daysSinceChange} days');
}
```

**Finder's Fee Changes:**
```typescript
// upsert-service Edge Function
const lastChanged = service.fee_last_changed_at;
const daysSinceChange = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);

if (daysSinceChange < 3) {
  return error('You can change your fee again in ${3 - daysSinceChange} days');
}
```

---

## Part 5: Implementation Priority

### Phase 1: Critical (Deploy Immediately)
1. ✅ Create `client_attributions` table migration
2. ✅ Create `create-attribution` Edge Function
3. ✅ Modify `WalletContext` to call `create-attribution`
4. ✅ Modify `useCreateProject` to query `client_attributions`

### Phase 2: High Priority (Deploy Within 48h)
5. ✅ Add rate limiting columns to `profiles` and `services`
6. ✅ Implement rate limiting in `update-profile` Edge Function
7. ✅ Create `upsert-service` Edge Function with rate limiting
8. ✅ Build UI for Talent to manage services and fees

### Phase 3: Polish (Deploy Within 1 Week)
9. ✅ Add expiration logic to attributions (30 days)
10. ✅ Build admin dashboard to view attributions
11. ✅ Add analytics for Scout performance

---

## Part 6: Risk Assessment

### Without This Upgrade

**Economic Risks:**
- Scouts lose commissions due to cache clearing
- Talent can manipulate fees after Scout promotion
- No audit trail for disputes
- Platform reputation damaged

**Technical Risks:**
- No single source of truth
- Data integrity compromised
- Gaming vulnerabilities
- Scalability issues

**Business Risks:**
- Scouts won't trust platform
- Talent can exploit system
- Legal liability for lost commissions
- Platform failure

### With This Upgrade

**Benefits:**
- ✅ Scout attribution guaranteed
- ✅ Commission rates locked
- ✅ Platform stability
- ✅ Audit trail for disputes
- ✅ Trust and credibility
- ✅ Scalable architecture

---

## Conclusion

**The current system has CRITICAL vulnerabilities that threaten the entire economic model.**

**Confirmed Issues:**
1. ✅ Scout attribution stored ONLY in localStorage (ephemeral)
2. ✅ Attribution lost if user clears cache
3. ✅ Commission rate determined at contract creation (not locked)
4. ✅ No rate limiting on username or fee changes
5. ✅ No database persistence of Scout→Client→Talent relationship

**Required Action:** Implement the `client_attributions` table and commission locking system IMMEDIATELY.

**This is not optional. This is the foundation of the economic model.**

---

**Next Steps:** Proceed to Part 2 - Implementation
