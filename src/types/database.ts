/**
 * Database Types for Supabase
 * Generated from schema - keep in sync with migrations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string // Stacks Principal
          username: string
          full_name: string | null
          avatar_url: string | null
          headline: string | null
          about: string | null
          roles: string[]
          talent_availability: boolean
          gated_connections: boolean
          reputation: number
          scout_connections_count: number
          projects_completed_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          headline?: string | null
          about?: string | null
          roles?: string[]
          talent_availability?: boolean
          gated_connections?: boolean
          reputation?: number
          scout_connections_count?: number
          projects_completed_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          headline?: string | null
          about?: string | null
          roles?: string[]
          talent_availability?: boolean
          gated_connections?: boolean
          reputation?: number
          scout_connections_count?: number
          projects_completed_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          title: string
          description: string
          budget_min: number
          budget_max: number
          budget_type: string
          duration: string
          experience_level: string
          status: string
          applications_count: number
          recommendations_count: number
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          description: string
          budget_min: number
          budget_max: number
          budget_type?: string
          duration: string
          experience_level: string
          status?: string
          applications_count?: number
          recommendations_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          description?: string
          budget_min?: number
          budget_max?: number
          budget_type?: string
          duration?: string
          experience_level?: string
          status?: string
          applications_count?: number
          recommendations_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      project_skills: {
        Row: {
          project_id: string
          skill_name: string
        }
        Insert: {
          project_id: string
          skill_name: string
        }
        Update: {
          project_id?: string
          skill_name?: string
        }
      }
      services: {
        Row: {
          id: string
          talent_id: string
          title: string
          description: string
          price: number
          finder_fee_percent: number
          images: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          talent_id: string
          title: string
          description: string
          price: number
          finder_fee_percent?: number
          images?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          talent_id?: string
          title?: string
          description?: string
          price?: number
          finder_fee_percent?: number
          images?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_skills: {
        Row: {
          service_id: string
          skill_name: string
        }
        Insert: {
          service_id: string
          skill_name: string
        }
        Update: {
          service_id?: string
          skill_name?: string
        }
      }
      scout_connections: {
        Row: {
          id: string
          scout_id: string
          talent_id: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scout_id: string
          talent_id: string
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scout_id?: string
          talent_id?: string
          status?: string
          notes?: string | null
          created_at?: string
        }
      }
      on_chain_contracts: {
        Row: {
          project_id: number
          client_id: string
          talent_id: string
          scout_id: string
          amount_micro_stx: number
          scout_fee_percent: number
          platform_fee_percent: number
          status: number
          create_tx_id: string
          fund_tx_id: string | null
          complete_tx_id: string | null
          job_listing_id: string | null
          created_at: string
          funded_at: string | null
          completed_at: string | null
        }
        Insert: {
          project_id: number
          client_id: string
          talent_id: string
          scout_id: string
          amount_micro_stx: number
          scout_fee_percent: number
          platform_fee_percent: number
          status: number
          create_tx_id: string
          fund_tx_id?: string | null
          complete_tx_id?: string | null
          job_listing_id?: string | null
          created_at?: string
          funded_at?: string | null
          completed_at?: string | null
        }
        Update: {
          project_id?: number
          client_id?: string
          talent_id?: string
          scout_id?: string
          amount_micro_stx?: number
          scout_fee_percent?: number
          platform_fee_percent?: number
          status?: number
          create_tx_id?: string
          fund_tx_id?: string | null
          complete_tx_id?: string | null
          job_listing_id?: string | null
          created_at?: string
          funded_at?: string | null
          completed_at?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          project_id: string
          talent_id: string
          cover_letter: string | null
          proposed_budget: number | null
          proposed_timeline: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          talent_id: string
          cover_letter?: string | null
          proposed_budget?: number | null
          proposed_timeline?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          talent_id?: string
          cover_letter?: string | null
          proposed_budget?: number | null
          proposed_timeline?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          project_id: string
          scout_id: string
          talent_id: string
          message: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          scout_id: string
          talent_id: string
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          scout_id?: string
          talent_id?: string
          message?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
