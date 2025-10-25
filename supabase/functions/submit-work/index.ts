/**
 * Supabase Edge Function: submit-work
 * 
 * Allows a Talent to submit final work and request payment.
 * This is an OFF-CHAIN action that updates the database status.
 * 
 * Expected payload:
 * {
 *   projectId: number,
 *   talentId: string (Stacks address for verification),
 *   message: string (final message to client),
 *   deliverableUrls: string[] (URLs to uploaded files)
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { projectId, talentId, message, deliverableUrls } = await req.json();

    // Validation
    if (!projectId || !talentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: projectId and talentId'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!message || message.trim().length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message must be at least 10 characters'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the project exists, talent matches, and status is Active (1)
    const { data: project, error: projectError } = await supabase
      .from('on_chain_contracts')
      .select('*')
      .eq('project_id', projectId)
      .eq('talent_id', talentId)
      .eq('status', 1) // Must be in Active/Funded state
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project not found, you are not the talent, or project is not active'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update project with work submission (keep status as 1 for smart contract compatibility)
    const { data: updatedProject, error: updateError } = await supabase
      .from('on_chain_contracts')
      .update({
        work_submitted: true, // Mark as submitted but keep status = 1
        work_submitted_at: new Date().toISOString(),
        work_submission_message: message.trim(),
        work_deliverable_urls: deliverableUrls || []
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('[SUBMIT_WORK] Update error:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to submit work: ${updateError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[SUBMIT_WORK] Work submitted successfully for project:', projectId);

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Work submitted successfully',
        project: updatedProject
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[SUBMIT_WORK] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
