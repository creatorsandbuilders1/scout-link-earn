-- =====================================================
-- REFERYDO! Initial Database Schema
-- Wallet-First Architecture - No Supabase Auth
-- =====================================================
-- 
-- CRITICAL: This is a "Wallet-First" application.
-- User authentication is handled by Stacks wallet (@stacks/connect).
-- The user's Stacks principal (wallet address) is their identifier.
-- Supabase acts as a publicly readable database with restricted writes.
--
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- Stores public, off-chain profile data for all users
-- =====================================================

CREATE TABLE public.profiles (
  -- Stacks Principal address as primary key (e.g., 'SP...' or 'ST...')
  id TEXT PRIMARY KEY,
  
  -- Profile information
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT,
  about TEXT,
  
  -- User roles (can have multiple)
  roles TEXT[] DEFAULT ARRAY['talent']::TEXT[],
  
  -- Availability and settings
  talent_availability BOOLEAN DEFAULT true,
  gated_connections BOOLEAN DEFAULT false,
  
  -- Reputation and stats (computed/cached from on-chain data)
  reputation INTEGER DEFAULT 0,
  scout_connections_count INTEGER DEFAULT 0,
  projects_completed_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint: Validate Stacks address format
  CONSTRAINT profiles_id_check CHECK (id ~* '^(SP|ST)[0-9A-Z]{38,41}$')
);

-- Indexes for performance
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_roles ON public.profiles USING GIN(roles);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles - Stacks Principal as primary identifier';
COMMENT ON COLUMN public.profiles.id IS 'User''s Stacks Principal address (SP... or ST...)';
COMMENT ON COLUMN public.profiles.roles IS 'Array of user roles: talent, scout, client';

-- =====================================================
-- 2. PROJECTS TABLE (Job Board Listings)
-- Stores job postings - FREE to create, NO blockchain
-- =====================================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client who posted the project
  client_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Project details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Budget information
  budget_min NUMERIC NOT NULL,
  budget_max NUMERIC NOT NULL,
  budget_type TEXT DEFAULT 'fixed', -- 'fixed' or 'hourly'
  
  -- Project scope
  duration TEXT NOT NULL,
  experience_level TEXT NOT NULL, -- 'entry', 'intermediate', 'expert'
  
  -- Status
  status TEXT DEFAULT 'open' NOT NULL, -- 'open', 'in_progress', 'completed', 'cancelled'
  
  -- Engagement metrics
  applications_count INTEGER DEFAULT 0,
  recommendations_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT projects_budget_check CHECK (budget_max >= budget_min),
  CONSTRAINT projects_status_check CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT projects_experience_check CHECK (experience_level IN ('entry', 'intermediate', 'expert'))
);

-- Indexes
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_budget ON public.projects(budget_min, budget_max);

-- Comments
COMMENT ON TABLE public.projects IS 'Job Board listings - FREE to post, NO blockchain';
COMMENT ON COLUMN public.projects.client_id IS 'Stacks Principal of the Client who posted';
COMMENT ON COLUMN public.projects.status IS 'Project status: open, in_progress, completed, cancelled';

-- =====================================================
-- 3. PROJECT_SKILLS TABLE
-- Many-to-many relationship between projects and skills
-- =====================================================

CREATE TABLE public.project_skills (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  
  PRIMARY KEY (project_id, skill_name)
);

-- Index
CREATE INDEX idx_project_skills_skill_name ON public.project_skills(skill_name);

-- Comments
COMMENT ON TABLE public.project_skills IS 'Skills required for each project';

-- =====================================================
-- 4. SERVICES TABLE
-- Talent-offered services with fixed pricing
-- =====================================================

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Talent offering the service
  talent_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Service details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  price NUMERIC NOT NULL,
  finder_fee_percent INTEGER DEFAULT 10, -- Scout commission percentage
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT services_price_check CHECK (price > 0),
  CONSTRAINT services_finder_fee_check CHECK (finder_fee_percent >= 0 AND finder_fee_percent <= 100)
);

-- Indexes
CREATE INDEX idx_services_talent_id ON public.services(talent_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_services_created_at ON public.services(created_at DESC);

-- Comments
COMMENT ON TABLE public.services IS 'Fixed-price services offered by talent';
COMMENT ON COLUMN public.services.finder_fee_percent IS 'Scout commission percentage (0-100)';

-- =====================================================
-- 5. SERVICE_SKILLS TABLE
-- Many-to-many relationship between services and skills
-- =====================================================

CREATE TABLE public.service_skills (
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  
  PRIMARY KEY (service_id, skill_name)
);

-- Index
CREATE INDEX idx_service_skills_skill_name ON public.service_skills(skill_name);

-- Comments
COMMENT ON TABLE public.service_skills IS 'Skills associated with each service';

-- =====================================================
-- 6. SCOUT_CONNECTIONS TABLE
-- Scout-Talent relationships (follows/roster)
-- =====================================================

CREATE TABLE public.scout_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scout and Talent principals
  scout_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Connection metadata
  status TEXT DEFAULT 'active', -- 'active', 'inactive'
  notes TEXT, -- Scout's private notes about the talent
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- A Scout can only connect with a Talent once
  UNIQUE (scout_id, talent_id),
  
  -- Can't connect to yourself
  CONSTRAINT scout_connections_self_check CHECK (scout_id != talent_id)
);

-- Indexes
CREATE INDEX idx_scout_connections_scout_id ON public.scout_connections(scout_id);
CREATE INDEX idx_scout_connections_talent_id ON public.scout_connections(talent_id);
CREATE INDEX idx_scout_connections_status ON public.scout_connections(status);

-- Comments
COMMENT ON TABLE public.scout_connections IS 'Scout-Talent follow relationships';
COMMENT ON COLUMN public.scout_connections.scout_id IS 'Stacks Principal of the Scout';
COMMENT ON COLUMN public.scout_connections.talent_id IS 'Stacks Principal of the Talent';

-- =====================================================
-- 7. ON_CHAIN_CONTRACTS TABLE
-- Mirror of blockchain contract data for quick access
-- =====================================================

CREATE TABLE public.on_chain_contracts (
  -- On-chain project ID
  project_id INTEGER PRIMARY KEY,
  
  -- Contract participants (Stacks Principals)
  client_id TEXT NOT NULL REFERENCES public.profiles(id),
  talent_id TEXT NOT NULL REFERENCES public.profiles(id),
  scout_id TEXT NOT NULL REFERENCES public.profiles(id),
  
  -- Financial details (in microSTX)
  amount_micro_stx BIGINT NOT NULL,
  scout_fee_percent INTEGER NOT NULL,
  platform_fee_percent INTEGER NOT NULL,
  
  -- Contract status (mirrors blockchain)
  status INTEGER NOT NULL, -- 0=Created, 1=Funded, 2=Completed, 3=Disputed
  
  -- Transaction IDs
  create_tx_id TEXT NOT NULL,
  fund_tx_id TEXT,
  complete_tx_id TEXT,
  
  -- Optional: Link to off-chain project listing
  job_listing_id UUID REFERENCES public.projects(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  funded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT on_chain_contracts_status_check CHECK (status IN (0, 1, 2, 3)),
  CONSTRAINT on_chain_contracts_amount_check CHECK (amount_micro_stx > 0)
);

-- Indexes
CREATE INDEX idx_on_chain_contracts_client_id ON public.on_chain_contracts(client_id);
CREATE INDEX idx_on_chain_contracts_talent_id ON public.on_chain_contracts(talent_id);
CREATE INDEX idx_on_chain_contracts_scout_id ON public.on_chain_contracts(scout_id);
CREATE INDEX idx_on_chain_contracts_status ON public.on_chain_contracts(status);
CREATE INDEX idx_on_chain_contracts_create_tx_id ON public.on_chain_contracts(create_tx_id);

-- Comments
COMMENT ON TABLE public.on_chain_contracts IS 'Mirror of blockchain contracts for quick queries';
COMMENT ON COLUMN public.on_chain_contracts.project_id IS 'On-chain project ID from smart contract';
COMMENT ON COLUMN public.on_chain_contracts.status IS '0=Created, 1=Funded, 2=Completed, 3=Disputed';

-- =====================================================
-- 8. APPLICATIONS TABLE
-- Talent applications to job postings
-- =====================================================

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Project and applicant
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  talent_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Application details
  cover_letter TEXT,
  proposed_budget NUMERIC,
  proposed_timeline TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- One application per talent per project
  UNIQUE (project_id, talent_id),
  
  -- Constraints
  CONSTRAINT applications_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'))
);

-- Indexes
CREATE INDEX idx_applications_project_id ON public.applications(project_id);
CREATE INDEX idx_applications_talent_id ON public.applications(talent_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);

-- Comments
COMMENT ON TABLE public.applications IS 'Talent applications to job postings';

-- =====================================================
-- 9. RECOMMENDATIONS TABLE
-- Scout recommendations of talent for projects
-- =====================================================

CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Project, Scout, and Talent
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scout_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Recommendation details
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- One recommendation per scout per talent per project
  UNIQUE (project_id, scout_id, talent_id),
  
  -- Constraints
  CONSTRAINT recommendations_status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Indexes
CREATE INDEX idx_recommendations_project_id ON public.recommendations(project_id);
CREATE INDEX idx_recommendations_scout_id ON public.recommendations(scout_id);
CREATE INDEX idx_recommendations_talent_id ON public.recommendations(talent_id);
CREATE INDEX idx_recommendations_status ON public.recommendations(status);

-- Comments
COMMENT ON TABLE public.recommendations IS 'Scout recommendations of talent for projects';

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Public Read, Restricted Write
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.on_chain_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS for all tables
CREATE POLICY "Allow public read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.project_skills FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.service_skills FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.scout_connections FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.on_chain_contracts FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.recommendations FOR SELECT USING (true);

-- NO INSERT/UPDATE/DELETE POLICIES
-- All write operations will be handled via Edge Functions with service_role key
-- This prevents unauthorized direct database modifications

-- =====================================================
-- INITIAL DATA (Optional - for testing)
-- =====================================================

-- You can add seed data here if needed
-- For now, we'll keep it empty and populate via the application

-- =====================================================
-- END OF MIGRATION
-- =====================================================
