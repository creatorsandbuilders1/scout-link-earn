# Supabase Edge Functions - Complete! 🎉

## Overview

Successfully created 3 essential Edge Functions for REFERYDO! write operations. All functions use the `service_role` key to bypass RLS restrictions and provide secure write access to the database.

## ✅ Edge Functions Created

### 1. create-project
**File**: `supabase/functions/create-project/index.ts`

**Purpose**: Creates a new job listing on the Job Board (FREE, off-chain)

**Endpoint**: `POST /functions/v1/create-project`

**Request Body**:
```typescript
{
  clientId: string;        // Stacks Principal
  title: string;           // Project title
  description: string;     // Min 50 characters
  budgetMin: number;       // Must be > 0
  budgetMax: number;       // Must be >= budgetMin
  budgetType?: string;     // 'fixed' or 'hourly' (default: 'fixed')
  duration: string;        // e.g., '1-2 months'
  experienceLevel: string; // 'entry', 'intermediate', or 'expert'
  skills: string[];        // Array of skill names
}
```

**Response**:
```typescript
{
  success: boolean;
  project?: {
    id: string;
    client_id: string;
    title: string;
    // ... all project fields
    client: {
      id: string;
      username: string;
      avatar_url: string;
      headline: string;
    };
    project_skills: [
      { skill_name: string }
    ];
  };
  error?: string;
}
```

**Features**:
- ✅ Validates all input data
- ✅ Checks if client profile exists
- ✅ Inserts project into `projects` table
- ✅ Inserts skills into `project_skills` table
- ✅ Returns complete project with client info and skills
- ✅ Proper error handling and logging

**Validation**:
- Stacks address format validation
- Title required (non-empty)
- Description minimum 50 characters
- Budget validation (min > 0, max >= min)
- Duration required
- Experience level must be valid
- At least one skill required

---

### 2. update-profile
**File**: `supabase/functions/update-profile/index.ts`

**Purpose**: Creates or updates a user profile

**Endpoint**: `POST /functions/v1/update-profile`

**Request Body**:
```typescript
{
  stacksAddress: string;      // Stacks Principal (user ID)
  username?: string;          // Required for new profiles
  fullName?: string;
  avatarUrl?: string;
  headline?: string;
  about?: string;
  roles?: string[];           // ['talent', 'scout', 'client']
  talentAvailability?: boolean;
  gatedConnections?: boolean;
}
```

**Response**:
```typescript
{
  success: boolean;
  profile?: {
    id: string;
    username: string;
    full_name: string;
    // ... all profile fields
  };
  isNew?: boolean;  // true if created, false if updated
  error?: string;
}
```

**Features**:
- ✅ Creates new profile if doesn't exist
- ✅ Updates existing profile if exists
- ✅ Username validation (3-30 chars, alphanumeric + underscore)
- ✅ Checks for duplicate usernames
- ✅ Returns whether profile was created or updated
- ✅ Proper error handling

**Validation**:
- Stacks address format
- Username: 3-30 characters, alphanumeric + underscore only
- Username required for new profiles
- Duplicate username detection

---

### 3. sync-on-chain-contract
**File**: `supabase/functions/sync-on-chain-contract/index.ts`

**Purpose**: Mirrors blockchain contract data to Supabase for quick queries

**Endpoint**: `POST /functions/v1/sync-on-chain-contract`

**Request Body**:
```typescript
{
  projectId: number;          // On-chain project ID
  clientId: string;           // Stacks Principal
  talentId: string;           // Stacks Principal
  scoutId: string;            // Stacks Principal
  amountMicroStx: number;     // Amount in microSTX
  scoutFeePercent: number;    // Scout commission %
  platformFeePercent: number; // Platform fee %
  status: number;             // 0=Created, 1=Funded, 2=Completed, 3=Disputed
  createTxId: string;         // Transaction ID
  fundTxId?: string;          // Optional fund tx ID
  completeTxId?: string;      // Optional complete tx ID
  jobListingId?: string;      // Optional link to job listing
}
```

**Response**:
```typescript
{
  success: boolean;
  contract?: {
    project_id: number;
    client_id: string;
    talent_id: string;
    scout_id: string;
    // ... all contract fields
    client: { id, username, avatar_url };
    talent: { id, username, avatar_url };
    scout: { id, username, avatar_url };
    job_listing?: { id, title };
  };
  isNew?: boolean;  // true if created, false if updated
  error?: string;
}
```

**Features**:
- ✅ Creates new contract record if doesn't exist
- ✅ Updates existing contract (status, tx IDs, timestamps)
- ✅ Validates all Stacks addresses
- ✅ Automatically sets funded_at and completed_at timestamps
- ✅ Returns complete contract with related profiles
- ✅ Links to job listing if provided

**Use Cases**:
- After `create-project` smart contract call
- After `fund-escrow` smart contract call
- After `approve-and-distribute` smart contract call
- Periodic sync to ensure data consistency

---

## 🔐 Security Model

### Service Role Key
All Edge Functions use the `SUPABASE_SERVICE_ROLE_KEY` environment variable:
- ✅ Bypasses RLS write restrictions
- ✅ Never exposed to client
- ✅ Only available in Edge Functions
- ✅ Full database access

### CORS Configuration
All functions include proper CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Input Validation
Every function validates:
- Stacks address format
- Required fields
- Data types
- Business logic constraints

### Error Handling
Comprehensive error handling:
- 400: Bad Request (validation errors)
- 404: Not Found (missing resources)
- 409: Conflict (duplicate data)
- 500: Internal Server Error (unexpected errors)

---

## 📦 Deployment

### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref odewvxxcqqqfpanvsaij
```

### Deploy All Functions
```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy create-project
supabase functions deploy update-profile
supabase functions deploy sync-on-chain-contract
```

### Set Environment Variables
```bash
# Set service role key (required for all functions)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Test Deployment
```bash
# Test create-project
curl -X POST \
  https://odewvxxcqqqfpanvsaij.supabase.co/functions/v1/create-project \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "SP2...",
    "title": "Test Project",
    "description": "This is a test project description that is longer than 50 characters to pass validation.",
    "budgetMin": 1000,
    "budgetMax": 2000,
    "duration": "1-2 months",
    "experienceLevel": "intermediate",
    "skills": ["React", "TypeScript"]
  }'
```

---

## 🔄 Client Integration

### Example: Create Project from PostProjectWizard

```typescript
// src/components/PostProjectWizard.tsx

import { useWallet } from '@/contexts/WalletContext';

const handlePublish = async () => {
  const { stacksAddress } = useWallet();
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-project`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          clientId: stacksAddress,
          title: projectData.title,
          description: projectData.description,
          budgetMin: projectData.budgetMin,
          budgetMax: projectData.budgetMax,
          duration: projectData.duration,
          experienceLevel: projectData.experienceLevel,
          skills: projectData.skills,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      toast.success('Project posted successfully!');
      onSuccess?.(result.project.id);
    } else {
      toast.error(result.error || 'Failed to post project');
    }
  } catch (error) {
    console.error('Error posting project:', error);
    toast.error('An unexpected error occurred');
  }
};
```

### Example: Update Profile on First Connect

```typescript
// src/contexts/WalletContext.tsx

const connectWallet = async () => {
  await connect({ ... });
  
  const data = getLocalStorage();
  const stxAddr = data.addresses.stx?.[0]?.address;
  
  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', stxAddr)
    .single();
  
  if (!profile) {
    // Create profile via Edge Function
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          stacksAddress: stxAddr,
          username: generateUsername(stxAddr), // Generate from address
          roles: ['talent'],
        }),
      }
    );
  }
};
```

### Example: Sync Contract After Blockchain Transaction

```typescript
// src/hooks/useCreateProject.ts

const createProject = async (params: CreateProjectParams) => {
  // ... create on-chain contract
  const txId = await transactionManager.executeContractCall({ ... });
  
  // Sync to Supabase
  await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-on-chain-contract`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        projectId: 0, // Will be fetched from blockchain
        clientId: clientAddress,
        talentId: params.talentAddress,
        scoutId: finalScoutAddress,
        amountMicroStx: params.amountSTX * 1_000_000,
        scoutFeePercent: params.scoutFeePercent,
        platformFeePercent: params.platformFeePercent,
        status: 0, // Created
        createTxId: txId,
      }),
    }
  );
};
```

---

## 🧪 Testing

### Local Testing with Supabase CLI

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test locally
curl -X POST \
  http://localhost:54321/functions/v1/create-project \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### Test Checklist

**create-project**:
- [ ] Valid project creation
- [ ] Missing required fields
- [ ] Invalid Stacks address
- [ ] Description too short
- [ ] Invalid budget (max < min)
- [ ] Invalid experience level
- [ ] No skills provided
- [ ] Client profile doesn't exist

**update-profile**:
- [ ] Create new profile
- [ ] Update existing profile
- [ ] Invalid Stacks address
- [ ] Username too short
- [ ] Username too long
- [ ] Invalid username characters
- [ ] Duplicate username
- [ ] Missing username for new profile

**sync-on-chain-contract**:
- [ ] Create new contract
- [ ] Update existing contract
- [ ] Invalid project ID
- [ ] Invalid Stacks addresses
- [ ] Missing create tx ID
- [ ] Update with fund tx ID
- [ ] Update with complete tx ID

---

## 📊 Monitoring

### Logs
View function logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Select function
3. Click **Logs** tab

### Metrics
Monitor in Supabase Dashboard:
- Invocations count
- Error rate
- Execution time
- Success rate

---

## 🚀 Next Steps

### Phase 3: Frontend Integration
1. Update `PostProjectWizard` to call `create-project`
2. Update wallet connection to call `update-profile`
3. Update `useCreateProject` to call `sync-on-chain-contract`
4. Update Job Board to fetch from Supabase
5. Update Discovery Hub to fetch from Supabase

### Phase 4: Additional Functions (Future)
- `create-application` - Talent applies to project
- `create-recommendation` - Scout recommends talent
- `update-project-status` - Change project status
- `create-scout-connection` - Scout follows talent

---

## Summary

✅ **3 Edge Functions created**  
✅ **All write operations secured**  
✅ **Comprehensive validation**  
✅ **Proper error handling**  
✅ **CORS configured**  
✅ **Ready for deployment**  
✅ **Client integration examples provided**  

**Next**: Deploy functions and integrate with frontend! 🎊
