import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/contexts/WalletContext';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export function useNotifications(limit?: number) {
  const { stacksAddress } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!stacksAddress) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${stacksAddress}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${stacksAddress}`
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          );
          // Recalculate unread count
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [stacksAddress, limit]);

  const fetchNotifications = async () => {
    if (!stacksAddress) return;

    try {
      setLoading(true);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', stacksAddress)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      
      // Calculate unread count
      const unread = data?.filter((n: any) => !n.read).length || 0;
      setUnreadCount(unread);
      
      setError(null);
    } catch (err) {
      console.error('[useNotifications] Error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!stacksAddress) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', stacksAddress)
        .eq('read', false);

      setUnreadCount(count || 0);
    } catch (err) {
      console.error('[useNotifications] Error fetching unread count:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('id', notificationId);

      if (updateError) throw updateError;

      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!stacksAddress) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true } as any)
        .eq('user_id', stacksAddress)
        .eq('read', false);

      if (updateError) throw updateError;

      // Optimistic update
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
      throw err;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
