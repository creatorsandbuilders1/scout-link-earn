/**
 * Supabase Client Configuration
 * 
 * WALLET-FIRST ARCHITECTURE:
 * - NO Supabase Auth (no email/password, no social logins)
 * - User identity = Stacks Principal (wallet address)
 * - Public read access for all data
 * - Write operations via Edge Functions only
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file.'
    );
}

/**
 * Supabase client for public read access
 * 
 * This client uses the anon key which only has SELECT permissions.
 * All write operations (INSERT, UPDATE, DELETE) must go through Edge Functions.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Disable Supabase Auth completely
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
});

/**
 * Helper function to check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Helper function to validate Stacks address format
 */
export const isValidStacksAddress = (address: string): boolean => {
    return /^(SP|ST)[0-9A-Z]{38,41}$/.test(address);
};
