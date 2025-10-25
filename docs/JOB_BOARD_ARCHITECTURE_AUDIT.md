# Job Board Architecture Audit Report

## Executive Summary
This audit confirms the existing database structure and identifies what needs to be built to complete the Job Board functionality. The foundation is solid - we have all necessary tables and the project creation flow already works. We need to add application and recommendation flows.

---

## 1. Database Schema Verification ✅

### Tables Already Exist (Confirmed)

#### `projects` Table
**Location**: `supabase/migrations/20251022000000_initial_schema.sql` (Lines 67-115)

**Structure**:
```sql
- id (UUID, PK)
- client_id (TEXT, FK to profiles)
- title (TEXT)
- description (TEXT)
- budget_min (NUMERIC)
- budget_max (NUMERIC)
- budget_type (TEXT: 'fixed' or 'hourly')
- duration (TEXT)
- experience_level (TEXT: 'entry', 'intermediate', 'expert')
- status (TEXT: 'open', 'in_progress', 'completed', 'cancelled')
- applications_count (INTEGER, default 0)
- recommendations_count (INTEGER, default 0)
- views_count (INTEGER, default 0)
- created_at, updated_at (TIMESTAMPTZ)
```

**Indexes**:
- `idx_projects_client_id`
- `idx_projects_status`
- `idx_projects_created_at`
- `idx_projects_budget`

**RLS**: Public read enabled, writes via Edge Functions only

---

#### `applications` Table
**Location**: `supabase/migrations/20251022000000_initial_schema.sql` (Lines 287-315)

**Structure**:
```sql
- id (UUID, PK)
- project_id (UUID, FK to projects)
- talent_id (TEXT, FK to profiles)
- cover_letter (TEXT)
- proposed_budget (NUMERIC)
- proposed_timeline (TEXT)
- status (TEXT: 'pending', 'accepted', 'rejected', 'withdrawn')
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(project_id, talent_id) - One application per talent per project
```

**Indexes**:
- `idx_applications_project_id`
- `idx_applications_talent_id`
- `idx_applications_status`
- `idx_applications_created_at`

**RLS**: Public read enabled, writes via Edge Functions only

---

#### `recommendations` Table
**Location**: `supabase/migrations/20251022000000_initial_schema.sql` (Lines 327-355)

**Structure**:
```sql
- id (UUID, PK)
- project_id (UUID, FK to projects)
- scout_id (TEXT, FK to profiles)
- talent_id (TEXT, FK to profiles)
- message (TEXT)
- status (TEXT: 'pending', 'accepted', 'rejected')
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(project_id, scout_id, talent_id) - One recommendation per scout per talent per project
```

**Indexes**:
- `idx_recommendations_project_id`
- `idx_recommendations_scout_id`
- `idx_recommendations_talent_id`
- `idx_recommendations_status`

**RLS**: Public read enabled, writes via Edge Functions only

---

#### `project_skills` Table
**Location**: `supabase/migrations/20251022000000_initial_schema.sql` (Lines 123-135)

**Structure**:
```sql
- project_id (UUID, FK to projects)
- skill_name (TEXT)
- PRIMARY KEY (project_id, skill_name)
```

**Index**: `idx_project_skills_skill_name`

---

#### `scout_connections` Table
**Location**: `supabase/migrations/20251022000000_initial_schema.sql` (Lines 189-217)

**Structure**:
```sql
- id (UUID, PK)
- scout_id (TEXT, FK to profiles)
- talent_id (TEXT, FK to profiles)
- status (TEXT: 'active', 'inactive')
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- UNIQUE(scout_id, talent_id)
```

**Purpose**: This is the Scout's "roster" - their connected talent they can recommend

---

## 2. Existing Functionality ✅

### What Already Works

#### Project Creation Flow
**Edge Function**: `supabase/functions/create-project/index.ts` ✅
- Validates client profile exists
- Creates project record
- Inserts skills into `project_skills` table
- Returns complete project with client info and skills

**Frontend Component**: `src/components/PostProjectWizard.tsx` ✅
- 5-step wizard for project creation
- Skill selection with autocomplete
- Budget and timeline configuration
- Experience level selection
- Calls `create-project` Edge Function

#### Job Board List Page
**Page**: `src/pages/Jobs.tsx` ✅
- Fetches all `status='open'` projects from Supabase
- Displays project cards with:
  - Title, description, client info
  - Budget, duration, experience level
  - Skills as badges
  - Applications and recommendations counts
- Links to job detail page (not yet implemented)
- Has placeholder buttons for "Apply" and "Recommend"

---

## 3. What Needs to Be Built 🔨

### Missing Components

#### 1. Job Detail Page
**File**: `src/pages/JobDetail.tsx` (DOES NOT EXIST)
**Route**: `/jobs/:projectId`

**Requirements**:
- Fetch full project details by ID
- Display all project information
- Show client profile
- List all applications (if user is client)
- List all recommendations
- Two action buttons:
  - "Apply Now" (for Talent)
  - "Recommend a Talent" (for Scouts)

---

#### 2. Application Modal
**Component**: `src/components/ApplyToProjectModal.tsx` (DOES NOT EXIST)

**Requirements**:
- Form fields:
  - Cover letter (textarea)
  - Proposed budget (number)
  - Proposed timeline (text)
- Validation
- Calls `create-application` Edge Function
- Success/error feedback

---

#### 3. Recommendation Modal
**Component**: `src/components/RecommendTalentModal.tsx` (DOES NOT EXIST)

**Requirements**:
- Fetch Scout's roster from `scout_connections` table
- Display list of connected talent
- Allow Scout to select a talent
- Message field (optional)
- Calls `create-recommendation` Edge Function
- Success/error feedback

---

#### 4. Create Application Edge Function
**File**: `supabase/functions/create-application/index.ts` (DOES NOT EXIST)

**Requirements**:
- Input: `{ projectId, talentId, coverLetter, proposedBudget, proposedTimeline }`
- Validation:
  - Project exists and is 'open'
  - Talent profile exists
  - No duplicate application (UNIQUE constraint)
- Insert into `applications` table
- Increment `projects.applications_count`
- Create notification for client
- Return created application

---

#### 5. Create Recommendation Edge Function
**File**: `supabase/functions/create-recommendation/index.ts` (DOES NOT EXIST)

**Requirements**:
- Input: `{ projectId, scoutId, talentId, message }`
- Validation:
  - Project exists and is 'open'
  - Scout and Talent profiles exist
  - Scout has connection with Talent (check `scout_connections`)
  - No duplicate recommendation (UNIQUE constraint)
- Insert into `recommendations` table
- Increment `projects.recommendations_count`
- Create notification for talent and client
- Return created recommendation

---

## 4. Integration Points with Existing System

### Scout Connections
The recommendation flow depends on `scout_connections` table which already exists and is populated via:
- **Edge Function**: `supabase/functions/create-scout-connection/index.ts` ✅
- **Frontend**: `src/components/ConnectionModal.tsx` ✅

### Notifications
Both applications and recommendations should trigger notifications via:
- **Edge Function**: `supabase/functions/create-notification/index.ts` ✅
- **Frontend**: `src/components/NotificationBell.tsx` ✅

### Smart Contract Integration
When a client accepts an application/recommendation, it should trigger the smart contract flow:
- **Edge Function**: `supabase/functions/accept-project/index.ts` ✅
- **Hook**: `src/hooks/useAcceptProject.ts` ✅
- This creates an on-chain contract and moves to the Workspace

---

## 5. Implementation Plan

### Phase 1: Backend (Edge Functions)
1. Create `create-application` Edge Function
2. Create `create-recommendation` Edge Function
3. Test both functions with curl/Postman

### Phase 2: Frontend Components
1. Create `JobDetail.tsx` page
2. Create `ApplyToProjectModal.tsx` component
3. Create `RecommendTalentModal.tsx` component
4. Update routing in `App.tsx`

### Phase 3: Integration
1. Wire modals to Edge Functions
2. Add loading states and error handling
3. Integrate notifications
4. Test complete flow: Post → Apply → Recommend → Accept

### Phase 4: Polish
1. Add "My Applications" tab to Jobs page
2. Add "Recommended" tab to Jobs page
3. Add application/recommendation status badges
4. Add real-time updates for counts

---

## 6. Key Architectural Decisions

### Why Edge Functions for Writes?
- **Security**: RLS policies prevent direct writes from client
- **Validation**: Centralized business logic
- **Atomicity**: Can update multiple tables in one transaction
- **Notifications**: Can trigger side effects (notifications, counters)

### Why Public Read?
- REFERYDO! is a public marketplace
- Discovery is core to the platform
- Users can see all opportunities and talent
- Privacy is handled at the profile level (gated_connections)

### Why No Blockchain for Applications?
- Applications are FREE and off-chain
- Only accepted projects go on-chain (via smart contract)
- This reduces friction and gas costs
- Keeps the Job Board accessible

---

## 7. Conclusion

✅ **Database Schema**: Complete and well-designed
✅ **Project Creation**: Fully functional
✅ **Job Board List**: Fully functional
🔨 **Job Detail Page**: Needs to be built
🔨 **Application Flow**: Needs to be built
🔨 **Recommendation Flow**: Needs to be built

**Estimated Effort**: 4-6 hours for complete implementation

**Risk Level**: Low - All foundations are in place, just need to connect the dots

---

## Next Steps

1. **Confirm Understanding**: Review this audit with the team
2. **Start with Backend**: Build Edge Functions first (easier to test)
3. **Then Frontend**: Build UI components
4. **Test End-to-End**: Complete flow from posting to accepting
5. **Deploy**: Push to production

---

**Audit Completed**: October 25, 2025
**Auditor**: Kiro AI Assistant
**Status**: Ready to proceed with implementation ✅
