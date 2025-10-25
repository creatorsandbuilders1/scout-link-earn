# Complete Audit and Fix - Work Submission Flow

## Date: October 24, 2025

## 🔍 CURRENT STATE AUDIT

### 1. Edge Function Code ✅
**File:** `supabase/functions/submit-work/index.ts`

**Status:** CORRECT - Uses `work_submitted: true`

```typescript
.update({
  work_submitted: true, // ✅ Correct
  work_submitted_at: new Date().toISOString(),
  work_submission_message: message.trim(),
  work_deliverable_urls: deliverableUrls || []
})
```

### 2. Migration File ✅
**File:** `supabase/migrations/20251024000006_add_work_submitted_flag.sql`

**Status:** EXISTS and CORRECT

```sql
ALTER TABLE on_chain_contracts 
ADD COLUMN IF NOT EXISTS work_submitted BOOLEAN DEFAULT FALSE;
```

### 3. Frontend Code ✅
**File:** `src/pages/ContractDetail.tsx`

**Status:** CORRECT - Uses `work_submitted` flag

```typescript
const workSubmitted = project?.work_submitted === true;
```

## ❌ THE PROBLEM

**Error:** `Could not find the 'work_submitted' column`

**Root Cause:** The migration has NOT been applied to the database yet!

## 🎯 THE SOLUTION

### Step 1: Apply the Migration

```bash
supabase db push
```

This will apply migration `20251024000006_add_work_submitted_flag.sql` to your database.

### Step 2: Verify the Column Exists

Run this query in Supabase SQL Editor:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'on_chain_contracts'
AND column_name = 'work_submitted';
```

**Expected Result:**
```
column_name     | data_type | is_nullable | column_default
work_submitted  | boolean   | YES         | false
```

### Step 3: Redeploy Edge Function (if needed)

```bash
supabase functions deploy submit-work
```

### Step 4: Test the Flow

1. Create a test project
2. Fund the escrow
3. Accept as talent
4. Submit work (should work now!)
5. Verify `work_submitted = true` in database
6. Approve as client

## 📊 MIGRATION HISTORY

### Existing Migrations (in order):

1. `20251022000000_initial_schema.sql` - Base schema
2. `20251023000001_add_followers_system.sql`
3. `20251023000002_add_attribution_and_rate_limiting.sql`
4. `20251023000003_universal_finder_fee_refactor.sql`
5. `20251023000004_storage_rls_policies.sql`
6. `20251023000005_update_storage_rls_custom_claim.sql`
7. `20251024000001_update_contract_status_constraints.sql` - Added status 4, 5
8. `20251024000002_add_project_details_columns.sql`
9. `20251024000003_add_work_submission.sql` - Added work_submitted_at, work_submission_message, work_deliverable_urls
10. `20251024000004_add_status_6_constraint.sql` - Added status 6
11. **`20251024000006_add_work_submitted_flag.sql`** - ⚠️ NOT APPLIED YET

### What Each Migration Added to on_chain_contracts:

**Initial Schema:**
- project_id, client_id, talent_id, scout_id
- amount_micro_stx, scout_fee_percent, platform_fee_percent
- status (0, 1, 2, 3)
- create_tx_id, fund_tx_id, complete_tx_id
- created_at, funded_at, completed_at

**Migration 20251024000001:**
- Updated status constraint to include 4, 5

**Migration 20251024000002:**
- Added project_title, project_description, project_brief

**Migration 20251024000003:**
- Added work_submitted_at (TIMESTAMPTZ)
- Added work_submission_message (TEXT)
- Added work_deliverable_urls (TEXT[])

**Migration 20251024000004:**
- Updated status constraint to include 6

**Migration 20251024000006 (NOT APPLIED):**
- **Adds work_submitted (BOOLEAN)** ← THIS IS WHAT WE NEED!

## 🔧 COMPLETE FIX PROCEDURE

### Option A: Apply Migration (Recommended)

```bash
# 1. Apply the migration
supabase db push

# 2. Verify it worked
supabase db diff

# 3. Check the column exists
# Run in Supabase SQL Editor:
SELECT * FROM information_schema.columns 
WHERE table_name = 'on_chain_contracts' 
AND column_name = 'work_submitted';
```

### Option B: Manual SQL (If migration fails)

If `supabase db push` doesn't work, run this SQL directly in Supabase SQL Editor:

```sql
-- Add the column
ALTER TABLE on_chain_contracts 
ADD COLUMN IF NOT EXISTS work_submitted BOOLEAN DEFAULT FALSE;

-- Add the index
CREATE INDEX IF NOT EXISTS idx_on_chain_contracts_work_submitted 
ON on_chain_contracts(work_submitted) 
WHERE work_submitted = TRUE;

-- Add the comment
COMMENT ON COLUMN on_chain_contracts.work_submitted IS 
'TRUE when talent has submitted final work and is requesting payment. Status remains 1 (Active) for smart contract compatibility.';
```

### Option C: Reset and Reapply All Migrations

If there are migration conflicts:

```bash
# WARNING: This will reset your database!
supabase db reset

# This will reapply ALL migrations in order
```

## 🧪 VERIFICATION STEPS

### 1. Check Database Schema

```sql
-- List all columns in on_chain_contracts
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'on_chain_contracts'
ORDER BY ordinal_position;
```

**Expected columns (should include):**
- project_id
- client_id, talent_id, scout_id
- amount_micro_stx, scout_fee_percent, platform_fee_percent
- status
- work_submitted ← **THIS MUST BE PRESENT**
- work_submitted_at
- work_submission_message
- work_deliverable_urls
- create_tx_id, fund_tx_id, complete_tx_id
- created_at, funded_at, completed_at
- project_title, project_description, project_brief

### 2. Test Submit Work

```typescript
// In browser console after submitting work:
const { data, error } = await supabase
  .from('on_chain_contracts')
  .select('project_id, status, work_submitted, work_submitted_at')
  .eq('project_id', YOUR_PROJECT_ID)
  .single();

console.log(data);
// Should show: { project_id: X, status: 1, work_submitted: true, work_submitted_at: "..." }
```

### 3. Check Edge Function Logs

```bash
supabase functions logs submit-work --tail
```

Look for:
- ✅ `[SUBMIT_WORK] Work submitted successfully for project: X`
- ❌ `[SUBMIT_WORK] Update error: ...` (should NOT appear)

## 🎯 WHY THIS HAPPENED

### Timeline of Events:

1. **Initial Implementation** - Used `status = 6` for work submission
2. **Smart Contract V4** - Requires `status = 1` for approval
3. **Identified Conflict** - Status 6 breaks smart contract
4. **Created Solution** - Add `work_submitted` flag, keep status = 1
5. **Updated Code** - Edge Function and Frontend updated ✅
6. **Created Migration** - File created ✅
7. **❌ MISSED STEP** - Migration NOT applied to database!

### The Disconnect

- **Code is correct** ✅
- **Migration file exists** ✅
- **Migration NOT applied** ❌

This is why you're getting the "column not found" error - the code is trying to use a column that doesn't exist in the database yet.

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Run `supabase db push` to apply migration
- [ ] Verify `work_submitted` column exists in database
- [ ] Redeploy Edge Function: `supabase functions deploy submit-work`
- [ ] Test work submission flow
- [ ] Verify `work_submitted = true` after submission
- [ ] Verify status remains `1` after submission
- [ ] Test client approval flow
- [ ] Verify smart contract accepts status = 1
- [ ] Verify funds distribute correctly

## 📝 FINAL NOTES

### The Core Issue

The entire codebase is correct. The only missing piece is **applying the migration to the database**.

### Why It Worked Before

Before the V4 contract, we were using `status = 6`. The migration for status 6 (`20251024000004`) WAS applied, so that worked.

Now we're using `work_submitted` flag, but its migration (`20251024000006`) has NOT been applied yet.

### The Fix

Simply run:
```bash
supabase db push
```

That's it. Everything else is already correct.

---

**Status:** Ready to Deploy  
**Action Required:** Apply migration  
**Expected Result:** Work submission will work correctly
