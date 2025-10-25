-- =====================================================
-- DUAL-RELATIONSHIP SYSTEM: SOCIAL LAYER (FOLLOW)
-- =====================================================
-- This migration adds the "Follow" mechanic to REFERYDO!
-- 
-- STRATEGIC PURPOSE:
-- Follow is the LOW-COMMITMENT social layer.
-- It is NOT an economic partnership.
-- It does NOT generate referral links.
-- It does NOT grant commission eligibility.
-- 
-- This is DISTINCT from "Connect" (the economic layer).
-- =====================================================

-- Create followers table for social layer relationships
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure uniqueness and prevent self-following
  UNIQUE (follower_id, following_id),
  CONSTRAINT followers_self_check CHECK (follower_id != following_id)
);

-- Add follower/following counts to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Enable RLS on followers table
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read followers (public social data)
CREATE POLICY "Followers are publicly readable" ON public.followers
  FOR SELECT USING (true);

-- Policy: Only Edge Functions can modify followers (for consistency)
-- This prevents direct client manipulation and ensures proper count updates
CREATE POLICY "Followers can only be modified via service role" ON public.followers
  FOR ALL USING (false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON public.followers(created_at DESC);

-- =====================================================
-- AUTOMATIC COUNT UPDATES
-- =====================================================
-- This trigger ensures follower/following counts stay in sync
-- =====================================================

CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for the person doing the following
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers_count for the person being followed
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for the person unfollowing
    UPDATE public.profiles 
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers_count for the person being unfollowed
    UPDATE public.profiles 
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.followers;
CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Grant necessary permissions
GRANT SELECT ON public.followers TO anon, authenticated;
GRANT ALL ON public.followers TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The social layer (Follow) is now separate from the economic layer (Connect).
-- Users can Follow for inspiration without economic commitment.
-- Only Connect creates Scout relationships and commission eligibility.
-- =====================================================
