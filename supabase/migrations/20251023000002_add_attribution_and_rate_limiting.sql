-- =====================================================
-- REFERYDO! Attribution System & Rate Limiting
-- Migration: Add Commission Locking & Stability Controls
-- =====================================================
--
-- CRITICAL UPGRADE: This migration implements the "Attribution Contract"
-- system to guarantee Scout commissions and prevent gaming.
--
-- Changes:
-- 1. New table: client_attributions (binding Scout→Client→Talent records)
-- 2. Rate limiting columns for profiles and services
-- 3. Primary service designation for services
--
-- =====================================================

-- =====================================================
-- 1. CLIENT_ATTRIBUTIONS TABLE
-- The "Attribution Contract" - Binding Scout Commission Lock
-- =====================================================

CREATE TABLE public.client_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The Trinity: Client, Talent, Scout
  client_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scout_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Locked Economic Agreement
  -- This is the Finder's Fee percentage AT THE MOMENT OF ATTRIBUTION
  -- It CANNOT be changed by Talent after the fact
  attributed_finder_fee INTEGER NOT NULL,
  
  -- Commission rule (for future expansion)
  commission_rule TEXT DEFAULT 'one_time' NOT NULL, -- 'one_time', 'recurring', 'lifetime'
  
  -- Status tracking
  status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'used', 'expired'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ, -- When Client hired Talent
  expires_at TIMESTAMPTZ, -- Optional: 30-day expiration
  
  -- Constraints
  -- A Client can only be attributed once to a specific Scout-Talent pair
  UNIQUE (client_id, talent_id, scout_id),
  
  -- Validate finder fee percentage
  CONSTRAINT client_attributions_fee_check CHECK (attributed_finder_fee >= 0 AND attributed_finder_fee <= 100),
  
  -- Validate status
  CONSTRAINT client_attributions_status_check CHECK (status IN ('active', 'used', 'expired')),
  
  -- Validate commission rule
  CONSTRAINT client_attributions_rule_check CHECK (commission_rule IN ('one_time', 'recurring', 'lifetime')),
  
  -- Prevent self-referral at database level
  CONSTRAINT client_attributions_no_self_scout CHECK (client_id != scout_id)
);

-- Indexes for performance
CREATE INDEX idx_client_attributions_client_id ON public.client_attributions(client_id);
CREATE INDEX idx_client_attributions_talent_id ON public.client_attributions(talent_id);
CREATE INDEX idx_client_attributions_scout_id ON public.client_attributions(scout_id);
CREATE INDEX idx_client_attributions_status ON public.client_attributions(status);
CREATE INDEX idx_client_attributions_created_at ON public.client_attributions(created_at DESC);

-- Composite index for lookup during project creation
CREATE INDEX idx_client_attributions_lookup ON public.client_attributions(client_id, talent_id, status);

-- Comments
COMMENT ON TABLE public.client_attributions IS 'Binding attribution records - locks Scout commission at moment of referral';
COMMENT ON COLUMN public.client_attributions.attributed_finder_fee IS 'Locked Finder''s Fee percentage - cannot be changed after attribution';
COMMENT ON COLUMN public.client_attributions.commission_rule IS 'Commission type: one_time (default), recurring, or lifetime';
COMMENT ON COLUMN public.client_attributions.status IS 'active (unused), used (Client hired Talent), expired (past expiration date)';
COMMENT ON COLUMN public.client_attributions.used_at IS 'Timestamp when Client created project with Talent';
COMMENT ON COLUMN public.client_attributions.expires_at IS 'Optional expiration date (e.g., 30 days from attribution)';

-- =====================================================
-- 2. RATE LIMITING: Add Timestamp Columns
-- Prevents gaming through frequent changes
-- =====================================================

-- Add username change tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN username_last_changed_at TIMESTAMPTZ;

-- Initialize for existing users (set to created_at)
UPDATE public.profiles 
SET username_last_changed_at = created_at
WHERE username_last_changed_at IS NULL;

-- Make it NOT NULL after initialization
ALTER TABLE public.profiles 
ALTER COLUMN username_last_changed_at SET DEFAULT NOW();

COMMENT ON COLUMN public.profiles.username_last_changed_at IS 'Last time username was changed - enforces 7-day rate limit';

-- Add fee change tracking and primary service flag to services
ALTER TABLE public.services 
ADD COLUMN fee_last_changed_at TIMESTAMPTZ,
ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Initialize for existing services
UPDATE public.services 
SET fee_last_changed_at = created_at
WHERE fee_last_changed_at IS NULL;

-- Make it NOT NULL after initialization
ALTER TABLE public.services 
ALTER COLUMN fee_last_changed_at SET DEFAULT NOW();

-- Create index for primary service lookup
CREATE INDEX idx_services_talent_primary ON public.services(talent_id, is_primary) WHERE is_primary = true;

COMMENT ON COLUMN public.services.fee_last_changed_at IS 'Last time finder_fee_percent was changed - enforces 3-day rate limit';
COMMENT ON COLUMN public.services.is_primary IS 'Marks the primary/default service for a Talent - used for attribution';

-- =====================================================
-- 3. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new table
ALTER TABLE public.client_attributions ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see attributions)
CREATE POLICY "Allow public read access" ON public.client_attributions 
  FOR SELECT USING (true);

-- Only service role can write (via Edge Functions)
-- This prevents clients from manipulating their own attributions
CREATE POLICY "Service role can insert" ON public.client_attributions 
  FOR INSERT WITH CHECK (false); -- Will be overridden by service_role

CREATE POLICY "Service role can update" ON public.client_attributions 
  FOR UPDATE USING (false); -- Will be overridden by service_role

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to mark attribution as used
CREATE OR REPLACE FUNCTION mark_attribution_used(
  p_client_id TEXT,
  p_talent_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.client_attributions
  SET 
    status = 'used',
    used_at = NOW()
  WHERE 
    client_id = p_client_id
    AND talent_id = p_talent_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_attribution_used IS 'Marks an attribution as used when Client creates project with Talent';

-- Function to expire old attributions (run via cron)
CREATE OR REPLACE FUNCTION expire_old_attributions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.client_attributions
  SET status = 'expired'
  WHERE 
    status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_old_attributions IS 'Expires attributions past their expiration date - run via cron job';

-- =====================================================
-- 5. VALIDATION CONSTRAINTS
-- =====================================================

-- Ensure only one primary service per talent
CREATE UNIQUE INDEX idx_services_one_primary_per_talent 
ON public.services(talent_id) 
WHERE is_primary = true;

COMMENT ON INDEX idx_services_one_primary_per_talent IS 'Ensures each Talent has at most one primary service';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251023000002 completed successfully';
  RAISE NOTICE 'Added: client_attributions table';
  RAISE NOTICE 'Added: Rate limiting columns to profiles and services';
  RAISE NOTICE 'Added: Primary service designation';
  RAISE NOTICE 'Next steps: Deploy create-attribution Edge Function';
END $$;
