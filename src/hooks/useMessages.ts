import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/contexts/WalletContext';

interface Message {
  id: string;
  contract_id: number;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useContractMessages(contractId: number | null) {
  const { stacksAddress } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!contractId || !stacksAddress) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();
    markMessagesAsRead();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`contract-messages-${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `contract_id=eq.${contractId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          // Mark as read if not sent by current user
          if (payload.new.sender_id !== stacksAddress) {
            markMessageAsRead(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [contractId, stacksAddress]);

  const fetchMessages = async () => {
    if (!contractId) return;

    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
      setError(null);
    } catch (err) {
      console.error('[useContractMessages] Error fetching:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!contractId || !stacksAddress) return;

    try {
      await supabase
        .from('messages')
        .update({ read: true } as any)
        .eq('contract_id', contractId)
        .eq('read', false)
        .neq('sender_id', stacksAddress);
    } catch (err) {
      console.error('[useContractMessages] Error marking as read:', err);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true } as any)
        .eq('id', messageId);
    } catch (err) {
      console.error('[useContractMessages] Error marking message as read:', err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!stacksAddress) {
      throw new Error('Wallet not connected');
    }

    if (!content.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (!contractId) {
      throw new Error('No contract selected');
    }

    try {
      setSending(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            contractId,
            content: content.trim()
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      return result;
    } catch (err) {
      console.error('[useContractMessages] Error sending:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: fetchMessages
  };
}
