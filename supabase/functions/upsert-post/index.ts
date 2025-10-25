/**
 * Supabase Edge Function: upsert-post
 * 
 * Creates or updates a post (portfolio piece or gig) in the Talent's gallery.
 * 
 * Security: Uses service_role key to bypass RLS write restrictions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpsertPostRequest {
  postId?: string;           // If provided, update existing post
  talentId: string;          // Stacks address of Talent
  type: 'portfolio' | 'gig'; // Post type
  title: string;
  description?: string;
  imageUrls?: string[];      // Array of image URLs from Supabase Storage
  price?: number;            // Required if type is 'gig'
  status?: 'published' | 'draft' | 'archived';
}

interface UpsertPostResponse {
  success: boolean;
  post?: any;
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

    const requestData: UpsertPostRequest = await req.json();

    console.log('[UPSERT-POST] Request:', {
      postId: requestData.postId || 'NEW',
      talent: requestData.talentId,
      type: requestData.type,
      title: requestData.title,
    });

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!isValidStacksAddress(requestData.talentId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Talent address',
        } as UpsertPostResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!requestData.type || !['portfolio', 'gig'].includes(requestData.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Post type must be either "portfolio" or "gig"',
        } as UpsertPostResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!requestData.title || requestData.title.trim().length < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Title must be at least 3 characters',
        } as UpsertPostResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate gig pricing
    if (requestData.type === 'gig') {
      if (!requestData.price || requestData.price <= 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Gigs must have a price greater than 0',
          } as UpsertPostResponse),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // =====================================================
    // UPDATE EXISTING POST
    // =====================================================
    if (requestData.postId) {
      // Fetch existing post
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', requestData.postId)
        .eq('talent_id', requestData.talentId) // Security: ensure ownership
        .single();

      if (fetchError || !existingPost) {
        console.error('[UPSERT-POST] Post not found:', fetchError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Post not found or access denied',
          } as UpsertPostResponse),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update post
      const updateData: any = {
        type: requestData.type,
        title: requestData.title.trim(),
        description: requestData.description?.trim() || null,
        image_urls: requestData.imageUrls || existingPost.image_urls,
        status: requestData.status || existingPost.status,
      };

      // Update price (required for gigs, null for portfolio)
      if (requestData.type === 'gig') {
        updateData.price = requestData.price;
      } else {
        updateData.price = null;
      }

      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', requestData.postId)
        .select()
        .single();

      if (updateError) {
        console.error('[UPSERT-POST] Update error:', updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to update post: ${updateError.message}`,
          } as UpsertPostResponse),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('[UPSERT-POST] Post updated:', updatedPost.id);

      return new Response(
        JSON.stringify({
          success: true,
          post: updatedPost,
          isNew: false,
        } as UpsertPostResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // =====================================================
    // CREATE NEW POST
    // =====================================================

    const insertData: any = {
      talent_id: requestData.talentId,
      type: requestData.type,
      title: requestData.title.trim(),
      description: requestData.description?.trim() || null,
      image_urls: requestData.imageUrls || [],
      status: requestData.status || 'published',
    };

    // Set price (required for gigs, null for portfolio)
    if (requestData.type === 'gig') {
      insertData.price = requestData.price;
    } else {
      insertData.price = null;
    }

    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[UPSERT-POST] Insert error:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create post: ${insertError.message}`,
        } as UpsertPostResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[UPSERT-POST] Post created:', newPost.id);

    return new Response(
      JSON.stringify({
        success: true,
        post: newPost,
        isNew: true,
      } as UpsertPostResponse),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[UPSERT-POST] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as UpsertPostResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
