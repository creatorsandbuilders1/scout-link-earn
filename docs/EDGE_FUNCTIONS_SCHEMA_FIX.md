# Edge Functions Database Schema Fix - COMPLETE ✅

## Date: October 24, 2025

## Critical Issue Resolved

**Problem:** 404 (Not Found) error when Talent tries to accept a project, with error message "Project not found or not in pending acceptance state"

**Root Cause:** Edge Functions were using incorrect column names (`talent_address`, `client_address`, `scout_address`) instead of the actual database schema (`talent_id`, `client_id`, `scout_id`)

## The Issue

When a Talent clicked "Accept Project":
1. Frontend called `accept-project` Edge Function ✅
2. Edge Function queried database with `.eq('talent_address', talentId)` ❌
3. Database has column named `talent_id`, not `talent_address` ❌
4. Query returned no results → 404 error ❌

## Database Schema (Actual)

```sql
CREATE TABLE on_chain_contracts (
  project_id BIGINT,
  client_id TEXT,      -- NOT client_address
  talent_id TEXT,      -- NOT talent_address
  scout_id TEXT,       -- NOT scout_address
  amount_micro_stx BIGINT,  -- NOT amount
  status INT,
  ...
);
```

## Changes Made

### 1. accept-project Edge Function ✅

**File:** `supabase/functions/accept-project/index.ts`

**Query Fixed:**
```typescript
// BEFORE (Incorrect):
.eq('talent_address', talentId)

// AFTER (Correct):
.eq('talent_id', talentId)
```

**Response Fixed:**
```typescript
// BEFORE (Incorrect):
project: {
  id: project.project_id,
  clientAddress: project.client_address,
  talentAddress: project.talent_address,
  scoutAddress: project.scout_address,
  amount: project.amount,
  status: project.status
}

// AFTER (Correct):
project: {
  id: project.project_id,
  clientAddress: project.client_id,
  talentAddress: project.talent_id,
  scoutAddress: project.scout_id,
  amount: project.amount_micro_stx,
  status: project.status
}
```

### 2. decline-project Edge Function ✅

**File:** `supabase/functions/decline-project/index.ts`

**Same fixes applied:**
- Query: `.eq('talent_id', talentId)` instead of `.eq('talent_address', talentId)`
- Response: Uses `client_id`, `talent_id`, `scout_id`, `amount_micro_stx`

## Deployment Required

**CRITICAL:** These Edge Functions must be re-deployed to Supabase for the fixes to take effect.

### Deployment Commands

```bash
# Deploy accept-project function
supabase functions deploy accept-project

# Deploy decline-project function
supabase functions deploy decline-project

# Or deploy all functions at once
supabase functions deploy
```

## Expected Behavior After Deployment

### Accept Project Flow

1. **Talent clicks "Accept Project"** in Workspace
2. **Frontend calls Edge Function:**
   ```typescript
   POST /functions/v1/accept-project
   Body: { projectId: 5, talentId: "ST1P97PYTH8EMBP09XVM1RFXG0DDE8KYPG9GR9SJZ" }
   ```
3. **Edge Function queries database:**
   ```sql
   SELECT * FROM on_chain_contracts 
   WHERE project_id = 5 
   AND talent_id = 'ST1P97PYTH8EMBP09XVM1RFXG0DDE8KYPG9GR9SJZ'
   AND status = 4
   ```
4. **Query succeeds** ✅ (finds the contract)
5. **Edge Function returns 200:**
   ```json
   {
     "success": true,
     "message": "Project verified, ready for acceptance",
     "project": {
       "id": 5,
       "clientAddress": "STA2Q1NK2FD8H2HJYE7CF4N9VJGYE0T27802B1T8",
       "talentAddress": "ST1P97PYTH8EMBP09XVM1RFXG0DDE8KYPG9GR9SJZ",
       "scoutAddress": "STA2Q1NK2FD8H2HJYE7CF4N9VJGYE0T27802B1T8",
       "amount": 100000000,
       "status": 4
     }
   }
   ```
6. **Frontend proceeds with smart contract call** ✅
7. **Project accepted successfully** ✅

### Decline Project Flow

Same flow as accept, but with decline-project function.

## Test Data

The contract in the database that should now work:
```json
{
  "project_id": 5,
  "client_id": "STA2Q1NK2FD8H2HJYE7CF4N9VJGYE0T27802B1T8",
  "talent_id": "ST1P97PYTH8EMBP09XVM1RFXG0DDE8KYPG9GR9SJZ",
  "scout_id": "STA2Q1NK2FD8H2HJYE7CF4N9VJGYE0T27802B1T8",
  "amount_micro_stx": 100000000,
  "status": 4,
  "project_title": "Community Manager for your project! Instagram, X, Facebook",
  "project_brief": "HELLO! I need to run a marketing campaign! Help me! Can you work with me for a couple of hours Monday through Friday? let me know"
}
```

## Files Modified

1. ✅ `supabase/functions/accept-project/index.ts`
   - Query uses `talent_id` instead of `talent_address`
   - Response uses `client_id`, `talent_id`, `scout_id`, `amount_micro_stx`

2. ✅ `supabase/functions/decline-project/index.ts`
   - Query uses `talent_id` instead of `talent_address`
   - Response uses `client_id`, `talent_id`, `scout_id`, `amount_micro_stx`

## Verification Checklist

After deployment, verify:

- [ ] Edge Functions deployed successfully
- [ ] Talent can see pending proposal in Workspace
- [ ] Clicking "Accept Project" no longer shows 404 error
- [ ] Edge Function returns 200 with project data
- [ ] Smart contract call proceeds
- [ ] Project status updates to "Active"

## Related Fixes

This fix is part of a larger schema alignment effort:

1. ✅ **Frontend (useWorkspaceContracts)** - Fixed to use `client_id`, `talent_id`, `scout_id`
2. ✅ **Frontend (Workspace.tsx)** - Fixed to use correct column names
3. ✅ **Edge Functions (accept/decline)** - Fixed to use correct column names
4. ⏳ **Deployment** - Waiting for Edge Functions to be re-deployed

## Next Steps

1. **Deploy Edge Functions** (REQUIRED):
   ```bash
   supabase functions deploy accept-project
   supabase functions deploy decline-project
   ```

2. **Test the flow:**
   - Log in as Talent (ST1P97PYTH8EMBP09XVM1RFXG0DDE8KYPG9GR9SJZ)
   - Go to Workspace
   - See pending proposal
   - Click "Accept Project"
   - Verify no 404 error
   - Verify smart contract call proceeds

3. **Monitor logs:**
   ```bash
   supabase functions logs accept-project
   supabase functions logs decline-project
   ```

---

**Status:** CODE FIXED ✅ | DEPLOYMENT PENDING ⏳  
**Action Required:** Deploy Edge Functions to Supabase  
**Command:** `supabase functions deploy`
