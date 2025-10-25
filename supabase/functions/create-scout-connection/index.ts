/**
 * Supabase Edge Function: create-scout-connection
 * 
 * Creates a Scout-Talent connection in the database.
 * This allows Scouts to build their roster of talent.
 * 
 * Security: Uses service_role key to bypass RLS write restrictions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateConnectionRequest {
  scoutId: string; // Stacks Principal
  talentId: string; // Stacks Principal
  notes?: string; // Optional notes
}

interface CreateConnectionResponse {
  success: boolean;
  connection?: any;
  error?: string;
  isNew?: boolean;
}

function isValidStacksAddress(address: string): boolean {
  return /^(SP|ST)[0-9A-Z]{38,41}$/.test(address);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const requestData: CreateConnectionRequest = await req.json();

    console.log('[CREATE-CONNECTION] Request:', {
      scoutId: requestData.scoutId,
      talentId: requestData.talentId,
    });

    // Validate Stacks addresses
    if (!requestData.scoutId || !isValidStacksAddress(requestData.scoutId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Scout address',
        } as CreateConnectionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!requestData.talentId || !isValidStacksAddress(requestData.talentId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Talent address',
        } as CreateConnectionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Can't connect to yourself
    if (requestData.scoutId === requestData.talentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot connect to yourself',
        } as CreateConnectionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if both profiles exist
    const { data: scoutProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', requestData.scoutId)
      .single();

    if (!scoutProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Scout profile not found',
        } as CreateConnectionResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: talentProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', requestData.talentId)
      .single();

    if (!talentProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Talent profile not found',
        } as CreateConnectionResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('scout_connections')
      .select('id, status')
      .eq('scout_id', requestData.scoutId)
      .eq('talent_id', requestData.talentId)
      .single();

    if (existingConnection) {
      // Connection already exists
      if (existingConnection.status === 'active') {
        return new Response(
          JSON.stringify({
            success: true,
            connection: existingConnection,
            isNew: false,
          } as CreateConnectionResponse),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Reactivate inactive connection
        const { data: updatedConnection, error: updateError } = await supabase
          .from('scout_connections')
          .update({ status: 'active' })
          .eq('id', existingConnection.id)
          .select()
          .single();

        if (updateError) {
          console.error('[CREATE-CONNECTION] Update error:', updateError);
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to reactivate connection: ${updateError.message}`,
            } as CreateConnectionResponse),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log('[CREATE-CONNECTION] Connection reactivated');

        // Update scout_connections_count for talent
        await supabase.rpc('increment_scout_connections', {
          talent_address: requestData.talentId,
        });

        return new Response(
          JSON.stringify({
            success: true,
            connection: updatedConnection,
            isNew: false,
          } as CreateConnectionResponse),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Create new connection
    const { data: newConnection, error: insertError } = await supabase
      .from('scout_connections')
      .insert({
        scout_id: requestData.scoutId,
        talent_id: requestData.talentId,
        notes: requestData.notes || null,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[CREATE-CONNECTION] Insert error:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create connection: ${insertError.message}`,
        } as CreateConnectionResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-CONNECTION] Connection created:', newConnection.id);

    // Update scout_connections_count for talent
    const { error: countError } = await supabase
      .from('profiles')
      .update({
        scout_connections_count: supabase.raw('scout_connections_count + 1'),
      })
      .eq('id', requestData.talentId);

    if (countError) {
      console.error('[CREATE-CONNECTION] Count update error:', countError);
      // Don't fail the operation, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        connection: newConnection,
        isNew: true,
      } as CreateConnectionResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[CREATE-CONNECTION] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as CreateConnectionResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
