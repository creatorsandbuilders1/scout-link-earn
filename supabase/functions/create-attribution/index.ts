/**
 * Supabase Edge Function: create-attribution
 * 
 * Creates a binding attribution record when a new user connects via referral link.
 * This "locks in" the Scout's commission at the moment of attribution.
 * 
 * CRITICAL: This is called ONLY for NEW users connecting via Scout referral.
 * 
 * Security: Uses service_role key to bypass RLS write restrictions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAttributionRequest {
  clientId: string;   // New user's Stacks address
  talentId: string;   // Talent they landed on
  scoutId: string;    // Scout who referred them
}

interface CreateAttributionResponse {
  success: boolean;
  attribution?: any;
  error?: string;
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

    const requestData: CreateAttributionRequest = await req.json();

    console.log('[CREATE-ATTRIBUTION] Request:', {
      client: requestData.clientId,
      talent: requestData.talentId,
      scout: requestData.scoutId,
    });

    // =====================================================
    // VALIDATION
    // =====================================================

    // Validate all addresses
    if (!isValidStacksAddress(requestData.clientId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid client address',
        } as CreateAttributionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!isValidStacksAddress(requestData.talentId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid talent address',
        } as CreateAttributionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!isValidStacksAddress(requestData.scoutId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid scout address',
        } as CreateAttributionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // =====================================================
    // CRITICAL SECURITY: Prevent Self-Referral
    // =====================================================
    if (requestData.clientId === requestData.scoutId) {
      console.warn('[CREATE-ATTRIBUTION] Self-referral blocked:', requestData.clientId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Self-referral not allowed',
        } as CreateAttributionResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // =====================================================
    // CHECK FOR EXISTING ATTRIBUTION
    // =====================================================
    const { data: existingAttribution } = await supabase
      .from('client_attributions')
      .select('id')
      .eq('client_id', requestData.clientId)
      .eq('talent_id', requestData.talentId)
      .eq('scout_id', requestData.scoutId)
      .maybeSingle();

    if (existingAttribution) {
      console.log('[CREATE-ATTRIBUTION] Attribution already exists');
      return new Response(
        JSON.stringify({
          success: true,
          attribution: existingAttribution,
        } as CreateAttributionResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // =====================================================
    // FETCH TALENT'S CURRENT UNIVERSAL FINDER'S FEE
    // =====================================================
    // This is the CRITICAL step: we lock in the fee at attribution time
    const { data: talentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('universal_finder_fee')
      .eq('id', requestData.talentId)
      .single();

    if (profileError) {
      console.error('[CREATE-ATTRIBUTION] Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch Talent profile',
        } as CreateAttributionResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use Talent's universal finder fee (defaults to 10% if not set)
    const finderFeePercent = talentProfile.universal_finder_fee || 10;

    console.log('[CREATE-ATTRIBUTION] Locking in Universal Finder\'s Fee:', finderFeePercent + '%');

    // =====================================================
    // CREATE ATTRIBUTION RECORD
    // =====================================================
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiration

    const { data: attribution, error: insertError } = await supabase
      .from('client_attributions')
      .insert({
        client_id: requestData.clientId,
        talent_id: requestData.talentId,
        scout_id: requestData.scoutId,
        attributed_finder_fee: finderFeePercent,
        commission_rule: 'one_time',
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[CREATE-ATTRIBUTION] Insert error:', insertError);

      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Attribution already exists',
          } as CreateAttributionResponse),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create attribution: ${insertError.message}`,
        } as CreateAttributionResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-ATTRIBUTION] Attribution created successfully:', attribution.id);

    return new Response(
      JSON.stringify({
        success: true,
        attribution,
      } as CreateAttributionResponse),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[CREATE-ATTRIBUTION] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as CreateAttributionResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
