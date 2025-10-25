/**
 * Supabase Edge Function: create-application
 * 
 * Creates a new application from a Talent to a Project.
 * This is a FREE operation (no blockchain transaction).
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

interface CreateApplicationRequest {
  projectId: string;
  talentId: string;
  coverLetter?: string;
  proposedBudget?: number;
  proposedTimeline?: string;
}

interface CreateApplicationResponse {
  success: boolean;
  application?: any;
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

    const requestData: CreateApplicationRequest = await req.json();
    
    console.log('[CREATE-APPLICATION] Request:', {
      projectId: requestData.projectId,
      talentId: requestData.talentId,
    });

    // Validate input
    if (!requestData.projectId || !requestData.talentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'projectId and talentId are required',
        } as CreateApplicationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidStacksAddress(requestData.talentId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid talentId format',
        } as CreateApplicationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if project exists and is open
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, status, client_id')
      .eq('id', requestData.projectId)
      .single();

    if (projectError || !project) {
      console.error('[CREATE-APPLICATION] Project not found:', requestData.projectId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project not found',
        } as CreateApplicationResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (project.status !== 'open') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project is not accepting applications',
        } as CreateApplicationResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if talent profile exists
    const { data: talent, error: talentError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', requestData.talentId)
      .single();

    if (talentError || !talent) {
      console.error('[CREATE-APPLICATION] Talent not found:', requestData.talentId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Talent profile not found',
        } as CreateApplicationResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate application
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('project_id', requestData.projectId)
      .eq('talent_id', requestData.talentId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'You have already applied to this project',
        } as CreateApplicationResponse),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create application
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert({
        project_id: requestData.projectId,
        talent_id: requestData.talentId,
        cover_letter: requestData.coverLetter || null,
        proposed_budget: requestData.proposedBudget || null,
        proposed_timeline: requestData.proposedTimeline || null,
        status: 'pending',
      })
      .select(`
        *,
        talent:profiles!talent_id(id, username, avatar_url, headline)
      `)
      .single();

    if (applicationError) {
      console.error('[CREATE-APPLICATION] Insert error:', applicationError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create application: ${applicationError.message}`,
        } as CreateApplicationResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CREATE-APPLICATION] Application created:', application.id);

    // Increment applications_count on project
    const { error: updateError } = await supabase
      .from('projects')
      .update({ applications_count: (project as any).applications_count + 1 })
      .eq('id', requestData.projectId);

    if (updateError) {
      console.error('[CREATE-APPLICATION] Count update error:', updateError);
      // Don't fail the operation, just log
    }

    // Create notification for client
    try {
      await supabase.from('notifications').insert({
        user_id: project.client_id,
        type: 'application_received',
        title: 'New Application',
        message: `@${talent.username} applied to your project`,
        link: `/jobs/${requestData.projectId}`,
        metadata: {
          projectId: requestData.projectId,
          talentId: requestData.talentId,
          applicationId: application.id,
        },
      });
    } catch (notifError) {
      console.error('[CREATE-APPLICATION] Notification error:', notifError);
      // Don't fail the operation
    }

    console.log('[CREATE-APPLICATION] Success!');

    return new Response(
      JSON.stringify({
        success: true,
        application,
      } as CreateApplicationResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CREATE-APPLICATION] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as CreateApplicationResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
