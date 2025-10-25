/**
 * Supabase Edge Function: update-profile
 * 
 * Creates or updates a user profile.
 * Used when a user first connects their wallet or updates their info.
 * 
 * Security: Uses service_role key to bypass RLS write restrictions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateProfileRequest {
    stacksAddress: string; // Stacks Principal (user ID)
    username?: string;
    fullName?: string;
    avatarUrl?: string;
    headline?: string;
    about?: string;
    roles?: string[]; // ['talent', 'scout', 'client']
    talentAvailability?: boolean;
    gatedConnections?: boolean;
    universalFinderFee?: number; // 0-50
}

interface UpdateProfileResponse {
    success: boolean;
    profile?: any;
    error?: string;
    isNew?: boolean; // True if profile was created, false if updated
}

function isValidStacksAddress(address: string): boolean {
    return /^(SP|ST)[0-9A-Z]{38,41}$/.test(address);
}

function validateUsername(username: string): string | null {
    if (username.length < 3) {
        return 'Username must be at least 3 characters';
    }
    if (username.length > 30) {
        return 'Username must be less than 30 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
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

        const requestData: UpdateProfileRequest = await req.json();

        console.log('[UPDATE-PROFILE] Request for:', requestData.stacksAddress);

        // Validate Stacks address
        if (!requestData.stacksAddress || !isValidStacksAddress(requestData.stacksAddress)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid Stacks address',
                } as UpdateProfileResponse),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Validate username if provided
        if (requestData.username) {
            const usernameError = validateUsername(requestData.username);
            if (usernameError) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: usernameError,
                    } as UpdateProfileResponse),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }
        }

        // Check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', requestData.stacksAddress)
            .single();

        let profile;
        let isNew = false;

        if (existingProfile) {
            // Update existing profile
            const updateData: any = {};

            // =====================================================
            // RATE LIMITING: Username Changes (7-day limit)
            // With 24-hour grace period for new users
            // =====================================================
            if (requestData.username !== undefined) {
                // Fetch full profile to check last username change and creation time
                const { data: fullProfile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('username, username_last_changed_at, created_at')
                    .eq('id', requestData.stacksAddress)
                    .single();

                if (fetchError) {
                    console.error('[UPDATE-PROFILE] Error fetching profile:', fetchError);
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Failed to fetch profile',
                        } as UpdateProfileResponse),
                        {
                            status: 500,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                // Check if username is actually changing
                if (fullProfile.username !== requestData.username) {
                    const now = Date.now();
                    const createdAt = new Date(fullProfile.created_at).getTime();
                    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
                    const GRACE_PERIOD_HOURS = 24;

                    // Check if within grace period
                    const isWithinGracePeriod = hoursSinceCreation < GRACE_PERIOD_HOURS;

                    if (isWithinGracePeriod) {
                        // Grace period - allow change without rate limit check
                        updateData.username = requestData.username;
                        updateData.username_last_changed_at = new Date().toISOString();
                        console.log('[UPDATE-PROFILE] Username change approved (grace period):', {
                            user: requestData.stacksAddress,
                            hoursSinceCreation: hoursSinceCreation.toFixed(2),
                        });
                    } else {
                        // Grace period expired - apply standard rate limit
                        const lastChanged = fullProfile.username_last_changed_at
                            ? new Date(fullProfile.username_last_changed_at).getTime()
                            : 0;
                        const daysSinceChange = (now - lastChanged) / (1000 * 60 * 60 * 24);
                        const RATE_LIMIT_DAYS = 7;

                        if (daysSinceChange < RATE_LIMIT_DAYS) {
                            const daysRemaining = Math.ceil(RATE_LIMIT_DAYS - daysSinceChange);
                            console.warn('[UPDATE-PROFILE] Username change rate limit hit:', {
                                user: requestData.stacksAddress,
                                daysSinceChange,
                                daysRemaining,
                            });

                            return new Response(
                                JSON.stringify({
                                    success: false,
                                    error: `Username can only be changed once every ${RATE_LIMIT_DAYS} days. You can change it again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
                                } as UpdateProfileResponse),
                                {
                                    status: 429, // Too Many Requests
                                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                                }
                            );
                        }

                        // Rate limit passed - update username and timestamp
                        updateData.username = requestData.username;
                        updateData.username_last_changed_at = new Date().toISOString();
                        console.log('[UPDATE-PROFILE] Username change approved (rate limit passed)');
                    }
                }
            }

            // =====================================================
            // RATE LIMITING: Universal Finder's Fee Changes (3-day limit)
            // With 24-hour grace period for new users
            // =====================================================
            if (requestData.universalFinderFee !== undefined) {
                // Validate fee range
                if (requestData.universalFinderFee < 0 || requestData.universalFinderFee > 50) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Universal Finder\'s Fee must be between 0 and 50',
                        } as UpdateProfileResponse),
                        {
                            status: 400,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                // Fetch full profile to check last fee change and creation time
                const { data: fullProfile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('universal_finder_fee, fee_last_changed_at, created_at')
                    .eq('id', requestData.stacksAddress)
                    .single();

                if (fetchError) {
                    console.error('[UPDATE-PROFILE] Error fetching profile:', fetchError);
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Failed to fetch profile',
                        } as UpdateProfileResponse),
                        {
                            status: 500,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                // Check if fee is actually changing
                if (fullProfile.universal_finder_fee !== requestData.universalFinderFee) {
                    const now = Date.now();
                    const createdAt = new Date(fullProfile.created_at).getTime();
                    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
                    const GRACE_PERIOD_HOURS = 24;

                    // Check if within grace period
                    const isWithinGracePeriod = hoursSinceCreation < GRACE_PERIOD_HOURS;

                    if (isWithinGracePeriod) {
                        // Grace period - allow change without rate limit check
                        updateData.universal_finder_fee = requestData.universalFinderFee;
                        updateData.fee_last_changed_at = new Date().toISOString();
                        console.log('[UPDATE-PROFILE] Fee change approved (grace period):', {
                            user: requestData.stacksAddress,
                            hoursSinceCreation: hoursSinceCreation.toFixed(2),
                            old: fullProfile.universal_finder_fee,
                            new: requestData.universalFinderFee,
                        });
                    } else {
                        // Grace period expired - apply standard rate limit
                        const lastChanged = fullProfile.fee_last_changed_at
                            ? new Date(fullProfile.fee_last_changed_at).getTime()
                            : 0;
                        const daysSinceChange = (now - lastChanged) / (1000 * 60 * 60 * 24);
                        const RATE_LIMIT_DAYS = 3;

                        if (daysSinceChange < RATE_LIMIT_DAYS) {
                            const daysRemaining = Math.ceil(RATE_LIMIT_DAYS - daysSinceChange);
                            console.warn('[UPDATE-PROFILE] Fee change rate limit hit:', {
                                user: requestData.stacksAddress,
                                daysSinceChange,
                                daysRemaining,
                            });

                            return new Response(
                                JSON.stringify({
                                    success: false,
                                    error: `Universal Finder's Fee can only be changed once every ${RATE_LIMIT_DAYS} days. You can change it again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
                                } as UpdateProfileResponse),
                                {
                                    status: 429, // Too Many Requests
                                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                                }
                            );
                        }

                        // Rate limit passed - update fee and timestamp
                        updateData.universal_finder_fee = requestData.universalFinderFee;
                        updateData.fee_last_changed_at = new Date().toISOString();
                        console.log('[UPDATE-PROFILE] Fee change approved (rate limit passed):', {
                            old: fullProfile.universal_finder_fee,
                            new: requestData.universalFinderFee,
                        });
                    }
                }
            }

            if (requestData.fullName !== undefined) updateData.full_name = requestData.fullName;
            if (requestData.avatarUrl !== undefined) updateData.avatar_url = requestData.avatarUrl;
            if (requestData.headline !== undefined) updateData.headline = requestData.headline;
            if (requestData.about !== undefined) updateData.about = requestData.about;
            if (requestData.roles !== undefined) updateData.roles = requestData.roles;
            if (requestData.talentAvailability !== undefined) updateData.talent_availability = requestData.talentAvailability;
            if (requestData.gatedConnections !== undefined) updateData.gated_connections = requestData.gatedConnections;

            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', requestData.stacksAddress)
                .select()
                .single();

            if (error) {
                console.error('[UPDATE-PROFILE] Update error:', error);

                // Check for username uniqueness violation
                if (error.code === '23505' && error.message.includes('username')) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Username is already taken',
                        } as UpdateProfileResponse),
                        {
                            status: 409,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        success: false,
                        error: `Failed to update profile: ${error.message}`,
                    } as UpdateProfileResponse),
                    {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }

            profile = data;
            console.log('[UPDATE-PROFILE] Profile updated');

        } else {
            // Create new profile
            if (!requestData.username) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Username is required for new profiles',
                    } as UpdateProfileResponse),
                    {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }

            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: requestData.stacksAddress,
                    username: requestData.username,
                    full_name: requestData.fullName || null,
                    avatar_url: requestData.avatarUrl || null,
                    headline: requestData.headline || null,
                    about: requestData.about || null,
                    roles: requestData.roles || ['talent', 'scout', 'client'],
                    talent_availability: requestData.talentAvailability ?? true,
                    gated_connections: requestData.gatedConnections ?? false,
                })
                .select()
                .single();

            if (error) {
                console.error('[UPDATE-PROFILE] Insert error:', error);

                // Check if username is already taken
                if (error.code === '23505' && error.message.includes('username')) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Username is already taken',
                        } as UpdateProfileResponse),
                        {
                            status: 409,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        success: false,
                        error: `Failed to create profile: ${error.message}`,
                    } as UpdateProfileResponse),
                    {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                );
            }

            profile = data;
            isNew = true;
            console.log('[UPDATE-PROFILE] Profile created');
        }

        return new Response(
            JSON.stringify({
                success: true,
                profile,
                isNew,
            } as UpdateProfileResponse),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('[UPDATE-PROFILE] Unexpected error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            } as UpdateProfileResponse),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
