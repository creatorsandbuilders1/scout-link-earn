# Supabase Setup Checklist ✅

## Pre-Integration Checklist

### ✅ Phase 1: Environment Setup (COMPLETE)

- [x] Created `.env.local` with Supabase credentials
- [x] Created `.env.example` template
- [x] Updated `.gitignore` to exclude sensitive files
- [x] Installed `@supabase/supabase-js` package

**Verification**:
```bash
# Check if .env.local exists
ls .env.local

# Check if package is installed
npm list @supabase/supabase-js
```

### ✅ Phase 2: Database Schema (COMPLETE)

- [x] Created migration file: `supabase/migrations/20251022000000_initial_schema.sql`
- [x] Defined 9 tables matching project structure
- [x] Configured RLS for public read, restricted write
- [x] Added indexes for performance
- [x] Added triggers for updated_at timestamps

**Tables Created**:
1. profiles (Stacks Principal as ID)
2. projects (Job Board listings)
3. project_skills
4. services
5. service_skills
6. scout_connections
7. on_chain_contracts
8. applications
9. recommendations

### ✅ Phase 3: TypeScript Configuration (COMPLETE)

- [x] Created `src/types/database.ts` with full type definitions
- [x] Created `src/lib/supabase.ts` client configuration
- [x] Configured client with auth disabled (Wallet-First)

### ✅ Phase 4: Documentation (COMPLETE)

- [x] Created `SUPABASE_INTEGRATION_GUIDE.md`
- [x] Created `SUPABASE_SETUP_CHECKLIST.md`
- [x] Documented architecture and security model
- [x] Provided usage examples

---

## Next Steps (TODO)

### 🔲 Phase 5: Apply Migration to Supabase

**Option A: Via Dashboard** (Recommended)
1. Go to https://supabase.com/dashboard
2. Select project: `odewvxxcqqqfpanvsaij`
3. Navigate to **SQL Editor**
4. Copy contents of `supabase/migrations/20251022000000_initial_schema.sql`
5. Paste and click **Run**
6. Verify in **Table Editor**

**Option B: Via CLI**
```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref odewvxxcqqqfpanvsaij

# Apply migration
supabase db push
```

**Verification**:
```sql
-- Run in SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 9 tables
```

### 🔲 Phase 6: Test Database Connection

Create a test file to verify connection:

```typescript
// test-supabase.ts
import { supabase, isSupabaseConfigured } from './src/lib/supabase';

async function testConnection() {
  console.log('Supabase configured:', isSupabaseConfigured());
  
  // Test read access
  const { data, error } = await supabase
    .from('profiles')
    .select('count');
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Connection successful!', data);
  }
}

testConnection();
```

Run:
```bash
npx tsx test-supabase.ts
```

### 🔲 Phase 7: Create Edge Functions

Create Edge Functions for write operations:

1. **create-project** - Post new job listing
   ```bash
   supabase functions new create-project
   ```

2. **update-profile** - Update user profile
   ```bash
   supabase functions new update-profile
   ```

3. **create-application** - Apply to project
   ```bash
   supabase functions new create-application
   ```

4. **create-recommendation** - Scout recommends talent
   ```bash
   supabase functions new create-recommendation
   ```

5. **sync-on-chain-contract** - Mirror blockchain data
   ```bash
   supabase functions new sync-on-chain-contract
   ```

### 🔲 Phase 8: Update PostProjectWizard

Modify `src/components/PostProjectWizard.tsx`:

```typescript
const handlePublish = async () => {
  try {
    // Call Edge Function instead of mock data
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-project`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          stacksAddress: userStacksAddress,
          projectData: {
            title: projectData.title,
            description: projectData.description,
            budget_min: projectData.budgetMin,
            budget_max: projectData.budgetMax,
            duration: projectData.duration,
            experience_level: projectData.experienceLevel,
            skills: projectData.skills
          }
        })
      }
    );
    
    const { project } = await response.json();
    onSuccess?.(project.id);
  } catch (error) {
    console.error('Failed to create project:', error);
  }
};
```

### 🔲 Phase 9: Update Job Board

Modify job fetching to use Supabase:

```typescript
// Before (mock data)
import { mockJobs } from '@/lib/mockData';

// After (Supabase)
import { supabase } from '@/lib/supabase';

const { data: jobs } = await supabase
  .from('projects')
  .select(`
    *,
    client:profiles!client_id(username, avatar_url, headline),
    project_skills(skill_name)
  `)
  .eq('status', 'open')
  .order('created_at', { ascending: false });
```

### 🔲 Phase 10: Update Discovery Hub

Modify talent fetching to use Supabase:

```typescript
const { data: talents } = await supabase
  .from('profiles')
  .select('*')
  .contains('roles', ['talent'])
  .eq('talent_availability', true)
  .order('reputation', { ascending: false });
```

---

## Verification Tests

### Test 1: Environment Variables
```bash
# Should print Supabase URL
echo $VITE_SUPABASE_URL

# Or in Node
node -e "console.log(process.env.VITE_SUPABASE_URL)"
```

### Test 2: Database Tables
```sql
-- Run in Supabase SQL Editor
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Test 3: RLS Policies
```sql
-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public';
```

### Test 4: Read Access (Should Work)
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

console.log('Read test:', data ? 'SUCCESS' : 'FAILED');
```

### Test 5: Write Access (Should Fail)
```typescript
const { error } = await supabase
  .from('profiles')
  .insert({ id: 'SP123', username: 'test' });

console.log('Write test:', error ? 'CORRECTLY BLOCKED' : 'ERROR - SHOULD BE BLOCKED');
```

---

## Troubleshooting

### Issue: "Missing environment variables"
**Solution**: Ensure `.env.local` exists and contains:
```bash
VITE_SUPABASE_URL=https://odewvxxcqqqfpanvsaij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Issue: "Permission denied for table"
**Solution**: Check RLS policies are created:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Issue: "Cannot read from database"
**Solution**: Verify anon key has SELECT permission:
```sql
-- Should show SELECT policy
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'SELECT';
```

### Issue: "Can write to database (shouldn't be able to)"
**Solution**: Verify NO INSERT/UPDATE/DELETE policies exist:
```sql
-- Should return 0 rows
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd IN ('INSERT', 'UPDATE', 'DELETE');
```

---

## Summary

### ✅ Completed
- Environment configuration
- Database schema design
- TypeScript types
- Supabase client setup
- Documentation

### 🔲 Remaining
- Apply migration to Supabase
- Create Edge Functions
- Update components to use Supabase
- Test end-to-end flow

### 🎯 Ready to Proceed
The foundation is complete. Next step is to apply the migration to your Supabase project and start creating Edge Functions for write operations.

**Estimated Time to Complete**:
- Apply migration: 5 minutes
- Create Edge Functions: 2-3 hours
- Update components: 3-4 hours
- Testing: 1-2 hours

**Total**: ~1 day of development work
