/**
 * Supabase Edge Function: sync-on-chain-contract
 * 
 * Mirrors blockchain contract data to Supabase for quick queries.
 * Called after a contract is created/funded/completed on-chain.
 * 
 * Security: Uses service_role key to bypass RLS write restrictions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Full sync request (for initial creation)
interface FullSyncRequest {
  projectId: number;
  clientId: string;
  talentId: string;
  scoutId: string;
  amountMicroStx: number;
  scoutFeePercent: number;
  platformFeePercent: number;
  status: number;
  createTxId: string;
  fundTxId?: string;
  completeTxId?: string;
  jobListingId?: string;
  projectTitle?: string;
  projectBrief?: string;
}

// Partial sync request (for updates)
interface PartialSyncRequest {
  projectId: number;
  txId?: string;
  newStatus?: number;
  projectTitle?: string;
  projectBrief?: string;
  fundTxId?: string;
  completeTxId?: string;
}

type SyncContractRequest = FullSyncRequest | PartialSyncRequest;

interface SyncContractResponse {
  success: boolean;
  contract?: any;
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

    const requestData: SyncContractRequest = await req.json();
    
    console.log('[SYNC-CONTRACT] Syncing project:', requestData.projectId, requestData);

    // Validate required fields
    if (requestData.projectId === undefined || requestData.projectId < 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid project ID',
        } as SyncContractResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if this is a full sync (has clientId) or partial update
    const isFullSync = 'clientId' in requestData && requestData.clientId;
    
    if (isFullSync) {
      // Validate addresses for full sync
      if (!isValidStacksAddress(requestData.clientId) ||
          !isValidStacksAddress(requestData.talentId) ||
          !isValidStacksAddress(requestData.scoutId)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid Stacks address(es)',
          } as SyncContractResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!requestData.createTxId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Create transaction ID is required for full sync',
          } as SyncContractResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if contract already exists
    const { data: existingContract } = await supabase
      .from('on_chain_contracts')
      .select('*')
      .eq('project_id', requestData.projectId)
      .single();

    let contract;
    let isNew = false;

    if (existingContract) {
      // Update existing contract
      const updateData: any = {};

      // Handle status update
      if ('newStatus' in requestData && requestData.newStatus !== undefined) {
        updateData.status = requestData.newStatus;
      } else if ('status' in requestData) {
        updateData.status = requestData.status;
      }

      // Handle project details
      if (requestData.projectTitle) {
        updateData.project_title = requestData.projectTitle;
      }
      if (requestData.projectBrief) {
        updateData.project_brief = requestData.projectBrief;
      }

      // Handle transaction IDs
      if (requestData.fundTxId) {
        updateData.fund_tx_id = requestData.fundTxId;
        updateData.funded_at = new Date().toISOString();
      }
      if (requestData.completeTxId) {
        updateData.complete_tx_id = requestData.completeTxId;
        updateData.completed_at = new Date().toISOString();
      }

      // Only update if there's something to update
      if (Object.keys(updateData).length === 0) {
        console.log('[SYNC-CONTRACT] No updates needed');
        contract = existingContract;
      } else {
        const { data, error } = await supabase
          .from('on_chain_contracts')
          .update(updateData)
          .eq('project_id', requestData.projectId)
          .select()
          .single();

        if (error) {
          console.error('[SYNC-CONTRACT] Update error:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to update contract: ${error.message}`,
            } as SyncContractResponse),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        contract = data;
        console.log('[SYNC-CONTRACT] Contract updated:', updateData);
      }

    } else {
      // Insert new contract - only for full sync
      if (!isFullSync) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Contract does not exist. Full sync data required for creation.',
          } as SyncContractResponse),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const fullData = requestData as FullSyncRequest;
      
      const { data, error } = await supabase
        .from('on_chain_contracts')
        .insert({
          project_id: fullData.projectId,
          client_id: fullData.clientId,
          talent_id: fullData.talentId,
          scout_id: fullData.scoutId,
          amount_micro_stx: fullData.amountMicroStx,
          scout_fee_percent: fullData.scoutFeePercent,
          platform_fee_percent: fullData.platformFeePercent,
          status: fullData.status,
          create_tx_id: fullData.createTxId,
          fund_tx_id: fullData.fundTxId || null,
          complete_tx_id: fullData.completeTxId || null,
          job_listing_id: fullData.jobListingId || null,
          project_title: fullData.projectTitle || null,
          project_brief: fullData.projectBrief || null,
          funded_at: fullData.fundTxId ? new Date().toISOString() : null,
          completed_at: fullData.completeTxId ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error('[SYNC-CONTRACT] Insert error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create contract: ${error.message}`,
          } as SyncContractResponse),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      contract = data;
      isNew = true;
      console.log('[SYNC-CONTRACT] Contract created');
    }

    // Fetch complete contract with related data
    const { data: completeContract } = await supabase
      .from('on_chain_contracts')
      .select(`
        *,
        client:profiles!client_id(id, username, avatar_url),
        talent:profiles!talent_id(id, username, avatar_url),
        scout:profiles!scout_id(id, username, avatar_url),
        job_listing:projects(id, title)
      `)
      .eq('project_id', requestData.projectId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        contract: completeContract || contract,
        isNew,
      } as SyncContractResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[SYNC-CONTRACT] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as SyncContractResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
