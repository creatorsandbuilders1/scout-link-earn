-- =====================================================
-- REFERYDO! Universal Finder's Fee Refactor
-- Migration: Pivot from per-service to profile-level fees
-- =====================================================
--
-- CRITICAL ARCHITECTURAL CHANGE:
-- This migration implements the Universal Finder's Fee model.
-- 
-- OLD MODEL (INCORRECT):
-- - Multiple services per Talent
-- - Each service has its own finder_fee_percent
-- - Confusing and granular
--
-- NEW MODEL (CORRECT):
-- - ONE universal_finder_fee per Talent profile
-- - Applies to ALL work (custom projects + gigs)
-- - Simple and clear
--
-- Changes:
-- 1. Add universal_finder_fee to profiles table
-- 2. Add fee_last_changed_at to profiles for rate limiting
-- 3. Drop obsolete services and service_skills tables
-- 4. Create new posts table (portfolio + gigs)
--
-- =====================================================

-- =====================================================
-- 1. ADD UNIVERSAL FINDER'S FEE TO PROFILES
-- =====================================================

-- Add universal finder's fee column
ALTER TABLE public.profiles 
ADD COLUMN universal_finder_fee INTEGER DEFAULT 10 NOT NULL;

-- Add rate limiting column for fee changes
ALTER TABLE public.profiles 
ADD COLUMN fee_last_changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Add constraint to ensure fee is between 0 and 50
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_universal_fee_check CHECK (universal_finder_fee >= 0 AND universal_finder_fee <= 50);

-- Create index for fee queries
CREATE INDEX idx_profiles_universal_fee ON public.profiles(universal_finder_fee);

-- Comments
COMMENT ON COLUMN public.profiles.universal_finder_fee IS 'Universal Finder''s Fee percentage (0-50) - applies to ALL work brought by Scouts';
COMMENT ON COLUMN public.profiles.fee_last_changed_at IS 'Last time universal_finder_fee was changed - enforces 3-day rate limit';

-- =====================================================
-- 2. DROP OBSOLETE TABLES
-- =====================================================

-- Drop service_skills table (dependent on services)
DROP TABLE IF EXISTS public.service_skills CASCADE;

-- Drop services table
DROP TABLE IF EXISTS public.services CASCADE;

-- Log deletion
DO $$
BEGIN
  RAISE NOTICE 'Deleted obsolete tables: services, service_skills';
  RAISE NOTICE 'These tables are replaced by the new posts table';
END $$;

-- =====================================================
-- 3. CREATE NEW POSTS TABLE
-- =====================================================

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Talent who created this post
  talent_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Post type: 'portfolio' (showcase) or 'gig' (transactable service)
  type TEXT NOT NULL CHECK (type IN ('portfolio', 'gig')),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Media (array of image URLs from Supabase Storage)
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Price (only applicable for gigs)
  price NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'published' NOT NULL CHECK (status IN ('published', 'draft', 'archived')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  -- A gig MUST have a price, portfolio pieces don't need one
  CONSTRAINT posts_gig_must_have_price CHECK (
    (type = 'portfolio') OR 
    (type = 'gig' AND price IS NOT NULL AND price > 0)
  ),
  
  -- Title must be at least 3 characters
  CONSTRAINT posts_title_length CHECK (LENGTH(title) >= 3)
);

-- Indexes for performance
CREATE INDEX idx_posts_talent_id ON public.posts(talent_id);
CREATE INDEX idx_posts_type ON public.posts(type);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_posts_talent_type_status ON public.posts(talent_id, type, status);

-- Comments
COMMENT ON TABLE public.posts IS 'Unified content table - stores both portfolio pieces and transactable gigs';
COMMENT ON COLUMN public.posts.type IS 'Content type: portfolio (showcase) or gig (transactable service)';
COMMENT ON COLUMN public.posts.title IS 'Post title - displayed in gallery';
COMMENT ON COLUMN public.posts.description IS 'Post description - supports markdown';
COMMENT ON COLUMN public.posts.image_urls IS 'Array of image URLs from Supabase Storage bucket';
COMMENT ON COLUMN public.posts.price IS 'Price in STX - required for gigs, optional for portfolio';
COMMENT ON COLUMN public.posts.status IS 'Publication status: published (visible), draft (hidden), archived (hidden)';

-- =====================================================
-- 4. ADD UPDATED_AT TRIGGER
-- =====================================================

-- Apply updated_at trigger to posts table
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Allow public read access to published posts" ON public.posts 
  FOR SELECT USING (status = 'published');

-- Talent can read all their own posts (including drafts)
CREATE POLICY "Talent can read own posts" ON public.posts 
  FOR SELECT USING (talent_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only service role can write (via Edge Functions)
CREATE POLICY "Service role can insert" ON public.posts 
  FOR INSERT WITH CHECK (false); -- Will be overridden by service_role

CREATE POLICY "Service role can update" ON public.posts 
  FOR UPDATE USING (false); -- Will be overridden by service_role

CREATE POLICY "Service role can delete" ON public.posts 
  FOR DELETE USING (false); -- Will be overridden by service_role

-- =====================================================
-- 6. DATA MIGRATION (IF NEEDED)
-- =====================================================

-- If there was existing data in services table, we would migrate it here
-- Since this is a fresh refactor, no migration needed

-- =====================================================
-- 7. UPDATE EXISTING PROFILES
-- =====================================================

-- Initialize fee_last_changed_at for existing profiles
UPDATE public.profiles 
SET fee_last_changed_at = created_at
WHERE fee_last_changed_at IS NULL;

-- Set default universal_finder_fee for existing profiles (if any don't have it)
UPDATE public.profiles 
SET universal_finder_fee = 10
WHERE universal_finder_fee IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 20251023000003 completed successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '1. Added universal_finder_fee to profiles (default: 10%%)';
  RAISE NOTICE '2. Added fee_last_changed_at to profiles for rate limiting';
  RAISE NOTICE '3. Deleted obsolete services and service_skills tables';
  RAISE NOTICE '4. Created new posts table (portfolio + gigs)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Delete upsert-service Edge Function';
  RAISE NOTICE '2. Update frontend to use universal_finder_fee';
  RAISE NOTICE '3. Build new posts management UI';
  RAISE NOTICE '========================================';
END $$;
