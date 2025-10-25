/**
 * Supabase Edge Function: create-recommendation
 * 
 * Creates a new recommendation from a Scout for a Talent to a Project.
 * Scout must have an active connection with the Talent.
 * 
 * Security: Uses service_role key to bypass RLS write restrictions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateRecommendationRequest {
  projectId: string;
  scoutId: string;
  talentId: string;
  message?: string;
}

interface CreateRecommendationResponse {
  success: boolean;
  recommendation?: any;
  error?: string;
}

/**
 * Validate Stacks address format
 */
function isValidStacksAddress(address: string): boolean {
  return /^(SP|ST)[0-9A-Z]{38,41}$/.test(address);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const requestData: CreateRecommendationRequest = await req.json();
    
    console.log('[CREATE-RECOMMENDATION] Request:', {
      projectId: requestData.projectId,
      scoutId: requestData.scoutId,
      talentId: requestData.talentId,
    });

    // Validate input
    if (!requestData.projectId || !requestData.scoutId || !requestData.talentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'projectId, scoutId, and talentId are required',
        } as CreateRecommendationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidStacksAddress(requestData.scoutId) || !isValidStacksAddress(requestData.talentId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid address format',
        } as CreateRecommendationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if project exists and is open
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, client_id, title')
      .eq('id', requestData.projectId)
      .single();

    if (projectError || !project) {
      console.error('[CREATE-RECOMMENDATION] Project not found:', requestData.projectId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project not found',
        } as CreateRecommendationResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (project.status !== 'open') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project is not accepting recommendations',
        } as CreateRecommendationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if scout and talent profiles exist
    const { data: scout, error: scoutError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', requestData.scoutId)
      .single();

    if (scoutError || !scout) {
      console.error('[CREATE-RECOMMENDATION] Scout not found:', requestData.scoutId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Scout profile not found',
        } as CreateRecommendationResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: talent, error: talentError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', requestData.talentId)
      .single();

    if (talentError || !talent) {
      console.error('[CREATE-RECOMMENDATION] Talent not found:', requestData.talentId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Talent profile not found',
        } as CreateRecommendationResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if scout has connection with talent
    const { data: connection, error: connectionError } = await supabase
      .from('scout_connections')
      .select('id, status')
      .eq('scout_id', requestData.scoutId)
      .eq('talent_id', requestData.talentId)
      .single();

    if (connectionError || !connection || connection.status !== 'active') {
      console.error('[CREATE-RECOMMENDATION] No active connection found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'You must have an active connection with this talent to recommend them',
        } as CreateRecommendationResponse),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate recommendation
    const { data: existing } = await supabase
      .from('recommendations')
      .select('id')
      .eq('project_id', requestData.projectId)
      .eq('scout_id', requestData.scoutId)
      .eq('talent_id', requestData.talentId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'You have already recommended this talent for this project',
        } as CreateRecommendationResponse),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create recommendation
    const { data: recommendation, error: recommendationError } = await supabase
      .from('recommendations')
      .insert({
        project_id: requestData.projectId,
        scout_id: requestData.scoutId,
        talent_id: requestData.talentId,
        message: requestData.message || null,
        status: 'pending',
      })
      .select(`
        *,
        scout:profiles!scout_id(id, username, avatar_url),
        talent:profiles!talent_id(id, username, avatar_url, headline)
      `)
      .single();

    if (recommendationError) {
      console.error('[CREATE-RECOMMENDATION] Insert error:', recommendationError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create recommendation: ${recommendationError.message}`,
        } as CreateRecommendationResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CREATE-RECOMMENDATION] Recommendation created:', recommendation.id);

    // Increment recommendations_count on project
    const { error: updateError } = await supabase
      .from('projects')
      .update({ recommendations_count: (project as any).recommendations_count + 1 })
      .eq('id', requestData.projectId);

    if (updateError) {
      console.error('[CREATE-RECOMMENDATION] Count update error:', updateError);
      // Don't fail the operation
    }

    // Create notifications
    try {
      // Notify talent
      await supabase.from('notifications').insert({
        user_id: requestData.talentId,
        type: 'recommendation_received',
        title: 'New Recommendation',
        message: `@${scout.username} recommended you for a project`,
        link: `/jobs/${requestData.projectId}`,
        metadata: {
          projectId: requestData.projectId,
          scoutId: requestData.scoutId,
          recommendationId: recommendation.id,
        },
      });

      // Notify client
      await supabase.from('notifications').insert({
        user_id: project.client_id,
        type: 'recommendation_received',
        title: 'New Recommendation',
        message: `@${scout.username} recommended @${talent.username} for your project`,
        link: `/jobs/${requestData.projectId}`,
        metadata: {
          projectId: requestData.projectId,
          scoutId: requestData.scoutId,
          talentId: requestData.talentId,
          recommendationId: recommendation.id,
        },
      });
    } catch (notifError) {
      console.error('[CREATE-RECOMMENDATION] Notification error:', notifError);
      // Don't fail the operation
    }

    console.log('[CREATE-RECOMMENDATION] Success!');

    return new Response(
      JSON.stringify({
        success: true,
        recommendation,
      } as CreateRecommendationResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CREATE-RECOMMENDATION] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as CreateRecommendationResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
