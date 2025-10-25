/**
 * Supabase Edge Function: accept-project
 * 
 * Allows a Talent to accept a project proposal.
 * This validates the project state before the frontend calls 
 * the accept-project function on the project-escrow-v2 smart contract.
 * 
 * Expected payload:
 * {
 *   projectId: number,
 *   talentId: string (Stacks address for verification)
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
    const { projectId, talentId } = await req.json();

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the project exists and the talent matches
    const { data: project, error: projectError } = await supabase
      .from('on_chain_contracts')
      .select('*')
      .eq('project_id', projectId)
      .eq('talent_id', talentId)
      .eq('status', 4) // Must be in Pending_Acceptance state
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project not found or not in pending acceptance state'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return success with project data
    // The actual smart contract call will be made by the frontend hook
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Project verified, ready for acceptance',
        project: {
          id: project.project_id,
          clientAddress: project.client_id,
          talentAddress: project.talent_id,
          scoutAddress: project.scout_id,
          amount: project.amount_micro_stx,
          status: project.status
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ACCEPT_PROJECT] Error:', error);
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