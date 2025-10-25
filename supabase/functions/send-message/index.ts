import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  contractId: number;
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const senderId = user.id;

    // Parse request body
    const { contractId, content }: SendMessageRequest = await req.json();

    // Validate content
    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Message content cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (content.length > 5000) {
      return new Response(
        JSON.stringify({ success: false, error: "Message content too long (max 5000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contractId) {
      return new Response(
        JSON.stringify({ success: false, error: "contractId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is part of the contract (client or talent)
    const { data: contract, error: contractError } = await supabase
      .from('on_chain_contracts')
      .select('project_id, client_id, talent_id, project_title')
      .eq('project_id', contractId)
      .single();

    if (contractError || !contract) {
      return new Response(
        JSON.stringify({ success: false, error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify sender is either client or talent
    if (contract.client_id !== senderId && contract.talent_id !== senderId) {
      return new Response(
        JSON.stringify({ success: false, error: "You are not part of this contract" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        contract_id: contractId,
        sender_id: senderId,
        content: content.trim(),
        read: false
      })
      .select()
      .single();

    if (messageError) {
      console.error('[SEND_MESSAGE] Error inserting message:', messageError);
      throw new Error("Failed to send message");
    }

    // Get recipient ID (the other party in the contract)
    const recipientId = contract.client_id === senderId ? contract.talent_id : contract.client_id;

    // Get sender profile for notification
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', senderId)
      .single();

    const senderName = senderProfile?.full_name || senderProfile?.username || 'Someone';
    const contractTitle = contract.project_title || 'this project';

    // Create notification for recipient
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'new_message',
        title: 'New Message',
        message: `${senderName} sent you a message about "${contractTitle}"`,
        link: `/workspace/${contractId}`,
        contract_id: contractId,
        data: {
          contract_id: contractId,
          sender_id: senderId,
          message_preview: content.substring(0, 100),
          contract_title: contractTitle
        }
      });

    if (notificationError) {
      console.error('[SEND_MESSAGE] Error creating notification:', notificationError);
      // Don't fail the message send if notification fails
    }

    console.log('[SEND_MESSAGE] Message sent successfully:', message.id);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        contractId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('[SEND_MESSAGE] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
