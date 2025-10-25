/**
 * Supabase Edge Function: create-project
 * 
 * Creates a new project listing on the Job Board.
 * This is a FREE operation (no blockchain transaction).
 * 
 * Security: Uses service_role key to bypass RLS write restrictions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Request body interface
interface CreateProjectRequest {
  clientId: string; // Stacks Principal address
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  budgetType?: string; // 'fixed' or 'hourly'
  duration: string;
  experienceLevel: string; // 'entry', 'intermediate', 'expert'
  skills: string[];
}

// Response interface
interface CreateProjectResponse {
  success: boolean;
  project?: any;
  error?: string;
}

/**
 * Validate Stacks address format
 */
function isValidStacksAddress(address: string): boolean {
  return /^(SP|ST)[0-9A-Z]{38,41}$/.test(address);
}

/**
 * Validate project data
 */
function validateProjectData(data: CreateProjectRequest): string | null {
  // Required fields
  if (!data.clientId || !isValidStacksAddress(data.clientId)) {
    return 'Invalid or missing clientId (must be a valid Stacks address)';
  }
  
  if (!data.title || data.title.trim().length === 0) {
    return 'Title is required';
  }
  
  if (!data.description || data.description.trim().length < 50) {
    return 'Description must be at least 50 characters';
  }
  
  if (!data.budgetMin || data.budgetMin <= 0) {
    return 'Budget minimum must be greater than 0';
  }
  
  if (!data.budgetMax || data.budgetMax < data.budgetMin) {
    return 'Budget maximum must be greater than or equal to minimum';
  }
  
  if (!data.duration || data.duration.trim().length === 0) {
    return 'Duration is required';
  }
  
  if (!data.experienceLevel || !['entry', 'intermediate', 'expert'].includes(data.experienceLevel)) {
    return 'Experience level must be: entry, intermediate, or expert';
  }
  
  if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
    return 'At least one skill is required';
  }
  
  return null; // Valid
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service_role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    const requestData: CreateProjectRequest = await req.json();
    
    console.log('[CREATE-PROJECT] Received request:', {
      clientId: requestData.clientId,
      title: requestData.title,
      skillsCount: requestData.skills?.length,
    });

    // Validate input data
    const validationError = validateProjectData(requestData);
    if (validationError) {
      console.error('[CREATE-PROJECT] Validation error:', validationError);
      return new Response(
        JSON.stringify({
          success: false,
          error: validationError,
        } as CreateProjectResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if client profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', requestData.clientId)
      .single();

    if (profileError || !profile) {
      console.error('[CREATE-PROJECT] Profile not found:', requestData.clientId);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Client profile not found. Please create a profile first.',
        } as CreateProjectResponse),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert project into database
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        client_id: requestData.clientId,
        title: requestData.title.trim(),
        description: requestData.description.trim(),
        budget_min: requestData.budgetMin,
        budget_max: requestData.budgetMax,
        budget_type: requestData.budgetType || 'fixed',
        duration: requestData.duration,
        experience_level: requestData.experienceLevel,
        status: 'open',
      })
      .select()
      .single();

    if (projectError) {
      console.error('[CREATE-PROJECT] Database error:', projectError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create project: ${projectError.message}`,
        } as CreateProjectResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-PROJECT] Project created:', project.id);

    // Insert skills into project_skills table
    if (requestData.skills && requestData.skills.length > 0) {
      const skillsData = requestData.skills.map((skill) => ({
        project_id: project.id,
        skill_name: skill.trim(),
      }));

      const { error: skillsError } = await supabase
        .from('project_skills')
        .insert(skillsData);

      if (skillsError) {
        console.error('[CREATE-PROJECT] Skills insert error:', skillsError);
        // Don't fail the whole operation, just log the error
        // The project was created successfully
      } else {
        console.log('[CREATE-PROJECT] Skills added:', requestData.skills.length);
      }
    }

    // Fetch complete project with skills
    const { data: completeProject, error: fetchError } = await supabase
      .from('projects')
      .select(`
        *,
        client:profiles!client_id(id, username, avatar_url, headline),
        project_skills(skill_name)
      `)
      .eq('id', project.id)
      .single();

    if (fetchError) {
      console.error('[CREATE-PROJECT] Fetch error:', fetchError);
      // Return basic project data if fetch fails
      return new Response(
        JSON.stringify({
          success: true,
          project: project,
        } as CreateProjectResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-PROJECT] Success! Project ID:', completeProject.id);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        project: completeProject,
      } as CreateProjectResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[CREATE-PROJECT] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as CreateProjectResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
