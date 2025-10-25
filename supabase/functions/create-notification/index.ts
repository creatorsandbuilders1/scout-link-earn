import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateNotificationRequest {
  user_id: string;
  type: 'new_message' | 'proposal_received' | 'proposal_accepted' | 'proposal_declined' | 
        'work_submitted' | 'payment_received' | 'payment_sent' | 'scout_earning' | 'announcement';
  title: string;
  message: string;
  link?: string;
  data?: Record<string, any>;
}

const VALID_NOTIFICATION_TYPES = [
  'new_message',
  'proposal_received',
  'proposal_accepted',
  'proposal_declined',
  'work_submitted',
  'payment_received',
  'payment_sent',
  'scout_earning',
  'announcement'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user (optional - can be called by service)
    const authHeader = req.headers.get("Authorization");
    let authenticatedUser = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      authenticatedUser = user;
    }

    // Parse request body
    const notificationData: CreateNotificationRequest = await req.json();

    // Validate required fields
    if (!notificationData.user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notificationData.type) {
      return new Response(
        JSON.stringify({ success: false, error: "type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_NOTIFICATION_TYPES.includes(notificationData.type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid notification type. Must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notificationData.title || notificationData.title.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "title is required and cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!notificationData.message || notificationData.message.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "message is required and cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate title and message length
    if (notificationData.title.length > 255) {
      return new Response(
        JSON.stringify({ success: false, error: "title too long (max 255 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (notificationData.message.length > 1000) {
      return new Response(
        JSON.stringify({ success: false, error: "message too long (max 1000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', notificationData.user_id)
      .single();

    if (userError || !userProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title.trim(),
        message: notificationData.message.trim(),
        link: notificationData.link || null,
        data: notificationData.data || {},
        read: false
      })
      .select()
      .single();

    if (notificationError) {
      console.error('[CREATE_NOTIFICATION] Error creating notification:', notificationError);
      throw new Error("Failed to create notification");
    }

    console.log('[CREATE_NOTIFICATION] Notification created:', {
      id: notification.id,
      user_id: notificationData.user_id,
      type: notificationData.type
    });

    return new Response(
      JSON.stringify({
        success: true,
        notification
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[CREATE_NOTIFICATION] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
