/**
 * Supabase Edge Function: get-auth-jwt
 * 
 * Generates a short-lived custom JWT for authenticated storage operations.
 * This JWT uses a dummy UUID for the 'sub' claim (to satisfy Supabase's requirements)
 * and stores the user's Stacks address in user_metadata.stacks_address.
 * RLS policies check the custom claim to identify the user for storage operations.
 * 
 * Security: This function validates that the user exists in the profiles table
 * before issuing a JWT.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts';

/**
 * Generate a random UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetAuthJWTRequest {
    stacksAddress: string;
}

interface GetAuthJWTResponse {
    success: boolean;
    jwt?: string;
    expiresAt?: number;
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
        const jwtSecret = Deno.env.get('JWT_SECRET')!;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const requestData: GetAuthJWTRequest = await req.json();

        console.log('[GET-AUTH-JWT] Request for:', requestData.stacksAddress);

        // Validate Stacks address
        if (!requestData.stacksAddress || !isValidStacksAddress(requestData.stacksAddress)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid Stacks address',
                } as GetAuthJWTResponse),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Verify user exists in profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', requestData.stacksAddress)
            .single();

        if (profileError || !profile) {
            console.error('[GET-AUTH-JWT] Profile not found:', profileError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Profile not found. Please create a profile first.',
                } as GetAuthJWTResponse),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Generate JWT
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = 3600; // 1 hour
        const expiresAt = now + expiresIn;

        // Create JWT payload with dummy UUID for sub and real Stacks address in user_metadata
        const payload = {
            aud: 'authenticated',
            exp: getNumericDate(expiresIn),
            sub: generateUUID(), // Dummy UUID to satisfy Supabase's requirements
            role: 'authenticated',
            iat: now,
            iss: supabaseUrl,
            user_metadata: {
                stacks_address: requestData.stacksAddress, // Real user identifier
            },
        };

        // Convert JWT secret to CryptoKey
        const encoder = new TextEncoder();
        const keyData = encoder.encode(jwtSecret);
        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Sign JWT
        const jwt = await create({ alg: 'HS256', typ: 'JWT' }, payload, key);

        console.log('[GET-AUTH-JWT] JWT generated for:', requestData.stacksAddress);

        return new Response(
            JSON.stringify({
                success: true,
                jwt,
                expiresAt,
            } as GetAuthJWTResponse),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('[GET-AUTH-JWT] Unexpected error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            } as GetAuthJWTResponse),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
