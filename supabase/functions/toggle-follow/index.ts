/**
 * =====================================================
 * SUPABASE EDGE FUNCTION: toggle-follow
 * =====================================================
 * 
 * STRATEGIC PURPOSE:
 * Handles the SOCIAL LAYER "Follow" relationship.
 * This is a LOW-COMMITMENT action with NO economic implications.
 * 
 * This is DISTINCT from Scout connections (economic layer).
 * Following is purely social - no referral links, no commissions.
 * 
 * LOGIC:
 * - Accepts { followerId, followingId }
 * - Checks if relationship exists
 * - If exists: DELETE (unfollow)
 * - If doesn't exist: INSERT (follow)
 * - Counts are updated automatically via database trigger
 * 
 * SECURITY:
 * - Uses service_role key to bypass RLS write restrictions
 * - Validates Stacks addresses
 * - Prevents self-following
 * - Verifies both profiles exist
 * =====================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToggleFollowRequest {
  followerId: string; // Stacks Principal of the person doing the following
  followingId: string; // Stacks Principal of the person being followed
}

interface ToggleFollowResponse {
  success: boolean;
  isFollowing: boolean;
  followersCount?: number;
  error?: string;
}

function isValidStacksAddress(address: string): boolean {
  return /^(SP|ST)[0-9A-Z]{38,41}$/.test(address);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service_role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const requestData: ToggleFollowRequest = await req.json();

    console.log('[TOGGLE-FOLLOW] Request:', {
      followerId: requestData.followerId,
      followingId: requestData.followingId,
    });

    // =====================================================
    // VALIDATION
    // =====================================================

    // Validate follower address
    if (!requestData.followerId || !isValidStacksAddress(requestData.followerId)) {
      return new Response(
        JSON.stringify({
          success: false,
          isFollowing: false,
          error: 'Invalid follower address',
        } as ToggleFollowResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate following address
    if (!requestData.followingId || !isValidStacksAddress(requestData.followingId)) {
      return new Response(
        JSON.stringify({
          success: false,
          isFollowing: false,
          error: 'Invalid following address',
        } as ToggleFollowResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prevent self-following
    if (requestData.followerId === requestData.followingId) {
      return new Response(
        JSON.stringify({
          success: false,
          isFollowing: false,
          error: 'Cannot follow yourself',
        } as ToggleFollowResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // =====================================================
    // VERIFY PROFILES EXIST
    // =====================================================

    const { data: followerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', requestData.followerId)
      .single();

    if (!followerProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          isFollowing: false,
          error: 'Follower profile not found',
        } as ToggleFollowResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: followingProfile } = await supabase
      .from('profiles')
      .select('id, followers_count')
      .eq('id', requestData.followingId)
      .single();

    if (!followingProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          isFollowing: false,
          error: 'Profile to follow not found',
        } as ToggleFollowResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // =====================================================
    // TOGGLE FOLLOW RELATIONSHIP
    // =====================================================

    // Check if follow relationship already exists
    const { data: existingFollow } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', requestData.followerId)
      .eq('following_id', requestData.followingId)
      .maybeSingle();

    let isFollowing: boolean;
    let newFollowersCount: number;

    if (existingFollow) {
      // =====================================================
      // UNFOLLOW: Delete the relationship
      // =====================================================
      const { error: deleteError } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', requestData.followerId)
        .eq('following_id', requestData.followingId);

      if (deleteError) {
        console.error('[TOGGLE-FOLLOW] Delete error:', deleteError);
        return new Response(
          JSON.stringify({
            success: false,
            isFollowing: true,
            error: `Failed to unfollow: ${deleteError.message}`,
          } as ToggleFollowResponse),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      isFollowing = false;
      // Trigger will update count, but we calculate for response
      newFollowersCount = Math.max(0, (followingProfile.followers_count || 0) - 1);
      console.log('[TOGGLE-FOLLOW] Unfollowed successfully');
      
    } else {
      // =====================================================
      // FOLLOW: Create the relationship
      // =====================================================
      const { error: insertError } = await supabase
        .from('followers')
        .insert({
          follower_id: requestData.followerId,
          following_id: requestData.followingId,
        });

      if (insertError) {
        console.error('[TOGGLE-FOLLOW] Insert error:', insertError);
        return new Response(
          JSON.stringify({
            success: false,
            isFollowing: false,
            error: `Failed to follow: ${insertError.message}`,
          } as ToggleFollowResponse),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      isFollowing = true;
      // Trigger will update count, but we calculate for response
      newFollowersCount = (followingProfile.followers_count || 0) + 1;
      console.log('[TOGGLE-FOLLOW] Followed successfully');
    }

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================
    return new Response(
      JSON.stringify({
        success: true,
        isFollowing,
        followersCount: newFollowersCount,
      } as ToggleFollowResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('[TOGGLE-FOLLOW] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        isFollowing: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as ToggleFollowResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
