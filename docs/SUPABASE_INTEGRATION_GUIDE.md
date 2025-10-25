# Supabase Integration Guide - REFERYDO!

## 🎯 Architecture Overview

### Wallet-First Principle

**CRITICAL**: This is a "Wallet-First" application.

- ✅ User authentication = Stacks wallet (@stacks/connect)
- ✅ User identity = Stacks Principal (wallet address)
- ❌ NO Supabase Auth (no email/password, no social logins)
- ❌ NO auth.uid() in RLS policies

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Wallet Connected (Stacks Principal = User ID)          │
│                                                           │
│  ┌──────────────────┐         ┌──────────────────────┐ │
│  │ READ Operations  │         │ WRITE Operations     │ │
│  │ (Direct)         │         │ (Via Edge Functions) │ │
│  └────────┬─────────┘         └──────────┬───────────┘ │
│           │                               │              │
└───────────┼───────────────────────────────┼──────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────┐    ┌──────────────────────────┐
│  Supabase (anon key)  │    │  Edge Functions          │
│  - Public READ access │    │  (service_role key)      │
│  - SELECT only        │    │  - Validate signatures   │
│                       │    │  - INSERT/UPDATE/DELETE  │
└───────────────────────┘    └──────────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
                ┌───────────────────────┐
                │  Supabase Database    │
                │  - Public read (RLS)  │
                │  - Restricted write   │
                └───────────────────────┘
```

## 📦 What Was Created

### 1. Environment Configuration

**Files Created**:
- `.env.local` - Local environment variables (DO NOT COMMIT)
- `.env.example` - Template for environment variables

**Environment Variables**:
```bash
# Public - Safe to expose to client
VITE_SUPABASE_URL=https://odewvxxcqqqfpanvsaij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Private - NEVER expose to client (Edge Functions only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Database Schema

**File**: `supabase/migrations/20251022000000_initial_schema.sql`

**Tables Created**:

1. **profiles** - User profiles (Stacks Principal as ID)
   - id (TEXT, PRIMARY KEY) - Stacks address
   - username, full_name, avatar_url, headline, about
   - roles (TEXT[]) - ['talent', 'scout', 'client']
   - reputation, stats, availability

2. **projects** - Job Board listings (FREE, off-chain)
   - id (UUID)
   - client_id (Stacks Principal)
   - title, description, budget, duration, experience_level
   - status: 'open', 'in_progress', 'completed', 'cancelled'

3. **project_skills** - Skills for each project
   - project_id, skill_name

4. **services** - Talent-offered services
   - id (UUID)
   - talent_id (Stacks Principal)
   - title, description, price, finder_fee_percent
   - images (TEXT[])

5. **service_skills** - Skills for each service
   - service_id, skill_name

6. **scout_connections** - Scout-Talent relationships
   - scout_id, talent_id (Stacks Principals)
   - status, notes

7. **on_chain_contracts** - Mirror of blockchain contracts
   - project_id (INTEGER) - On-chain ID
   - client_id, talent_id, scout_id (Stacks Principals)
   - amount_micro_stx, fees, status
   - Transaction IDs (create_tx_id, fund_tx_id, complete_tx_id)

8. **applications** - Talent applications to projects
   - project_id, talent_id
   - cover_letter, proposed_budget, status

9. **recommendations** - Scout recommendations
   - project_id, scout_id, talent_id
   - message, status

### 3. Row Level Security (RLS)

**Configuration**:
```sql
-- All tables have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public READ access (SELECT)
CREATE POLICY "Allow public read access" ON public.profiles 
  FOR SELECT USING (true);

-- NO WRITE policies (INSERT/UPDATE/DELETE)
-- All writes go through Edge Functions
```

### 4. TypeScript Types

**File**: `src/types/database.ts`

Complete TypeScript definitions for all tables with:
- Row types (what you get from SELECT)
- Insert types (what you send to INSERT)
- Update types (what you send to UPDATE)

### 5. Supabase Client

**File**: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);
```

## 🚀 How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project: `odewvxxcqqqfpanvsaij`
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20251022000000_initial_schema.sql`
6. Paste and click **Run**
7. Verify all tables were created in **Table Editor**

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref odewvxxcqqqfpanvsaij

# Apply migration
supabase db push

# Verify
supabase db diff
```

## 📝 Usage Examples

### Reading Data (Direct from Client)

```typescript
import { supabase } from '@/lib/supabase';

// Get all open projects
const { data: projects, error } = await supabase
  .from('projects')
  .select('*, project_skills(skill_name)')
  .eq('status', 'open')
  .order('created_at', { ascending: false });

// Get user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', stacksAddress)
  .single();

// Get projects with client info
const { data: projectsWithClient } = await supabase
  .from('projects')
  .select(`
    *,
    client:profiles!client_id(username, avatar_url, headline),
    project_skills(skill_name)
  `)
  .eq('status', 'open');
```

### Writing Data (Via Edge Functions)

**Client Side**:
```typescript
// Call Edge Function to create project
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/create-project`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      stacksAddress: userStacksAddress,
      signature: signedMessage, // Wallet signature for verification
      projectData: {
        title: 'My Project',
        description: 'Project description',
        budget_min: 1000,
        budget_max: 2000,
        duration: '1-2 months',
        experience_level: 'intermediate',
        skills: ['React', 'TypeScript']
      }
    })
  }
);
```

**Edge Function** (to be created):
```typescript
// supabase/functions/create-project/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role for writes
);

Deno.serve(async (req) => {
  const { stacksAddress, signature, projectData } = await req.json();
  
  // 1. Verify signature (wallet signed message)
  const isValid = await verifyStacksSignature(stacksAddress, signature);
  if (!isValid) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 2. Insert project (service_role has write access)
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      client_id: stacksAddress,
      ...projectData
    })
    .select()
    .single();
    
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
  
  // 3. Insert skills
  if (projectData.skills?.length > 0) {
    await supabase
      .from('project_skills')
      .insert(
        projectData.skills.map(skill => ({
          project_id: project.id,
          skill_name: skill
        }))
      );
  }
  
  return new Response(JSON.stringify({ project }), { status: 200 });
});
```

## 🔐 Security Model

### Public Data
All data is **publicly readable** by design:
- User profiles
- Job listings
- Services
- Applications
- Recommendations

This is intentional - REFERYDO! is a public marketplace.

### Write Protection
All write operations require:
1. **Wallet signature** - Proves user owns the Stacks address
2. **Edge Function validation** - Server-side verification
3. **Service role key** - Only Edge Functions can write

### No Direct Writes
```typescript
// ❌ This will FAIL (no INSERT policy)
const { error } = await supabase
  .from('projects')
  .insert({ title: 'My Project' });

// ✅ This works (via Edge Function)
const response = await fetch('/functions/v1/create-project', {
  method: 'POST',
  body: JSON.stringify({ projectData })
});
```

## 📊 Data Relationships

```
profiles (Stacks Principal)
├─ projects (client_id → profiles.id)
│  └─ project_skills
├─ services (talent_id → profiles.id)
│  └─ service_skills
├─ scout_connections (scout_id, talent_id → profiles.id)
├─ applications (talent_id → profiles.id, project_id → projects.id)
├─ recommendations (scout_id, talent_id → profiles.id, project_id → projects.id)
└─ on_chain_contracts (client_id, talent_id, scout_id → profiles.id)
```

## 🔄 Migration from Mock Data

### Current State
- Data in `src/lib/mockData.ts`
- Hardcoded arrays
- No persistence

### After Migration
- Data in Supabase
- Real-time updates
- Persistent storage

### Migration Steps

1. **Update PostProjectWizard** to call Edge Function
2. **Create Edge Functions** for write operations
3. **Update data fetching** to use Supabase queries
4. **Seed initial data** (optional)

## 🧪 Testing

### Verify Migration
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Test Read Access
```typescript
// Should work (public read)
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(10);

console.log('Profiles:', data);
```

### Test Write Protection
```typescript
// Should fail (no write policy)
const { error } = await supabase
  .from('profiles')
  .insert({ id: 'SP123', username: 'test' });

console.log('Expected error:', error); // Should be permission denied
```

## 📚 Next Steps

### Phase 1: Edge Functions (Required for Writes)
Create Edge Functions for:
- `create-project` - Post new job listing
- `update-profile` - Update user profile
- `create-application` - Apply to project
- `create-recommendation` - Scout recommends talent
- `sync-on-chain-contract` - Mirror blockchain data

### Phase 2: Update Components
- Update `PostProjectWizard` to call `create-project` function
- Update Job Board to fetch from Supabase
- Update Discovery Hub to fetch from Supabase
- Update Profile pages to fetch from Supabase

### Phase 3: Real-time Features
- Subscribe to new projects
- Subscribe to applications
- Subscribe to recommendations
- Live updates without refresh

## 🔑 Environment Variables Reference

```bash
# .env.local (DO NOT COMMIT)
VITE_SUPABASE_URL=https://odewvxxcqqqfpanvsaij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXd2eHhjcXFxZnBhbnZzYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODg0MTYsImV4cCI6MjA3NjY2NDQxNn0.WKN20Tm7XIzBhiSASeNSsz09vJ0n4mda30qv3Pu-_mc

# Edge Functions only (NEVER in client code)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXd2eHhjcXFxZnBhbnZzYWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA4ODQxNiwiZXhwIjoyMDc2NjY0NDE2fQ.mnbwQLXBXk-nxNCy-5TmZfTHztOy8MmqrHjk3mnDSNw
```

## ✅ Summary

**What's Ready**:
- ✅ Database schema designed
- ✅ Migration SQL created
- ✅ TypeScript types generated
- ✅ Supabase client configured
- ✅ Environment variables set
- ✅ RLS policies configured
- ✅ Documentation complete

**What's Next**:
1. Apply migration to Supabase
2. Create Edge Functions for writes
3. Update components to use Supabase
4. Test end-to-end flow

**Architecture Confirmed**:
- ✅ Wallet-First (no Supabase Auth)
- ✅ Public read access
- ✅ Restricted writes via Edge Functions
- ✅ Stacks Principal as user ID

The foundation is ready for full Supabase integration! 🚀
