-- =====================================================
-- Add Project Title and Brief Columns
-- =====================================================
-- Adds columns to store project title and brief for proposals
-- =====================================================

-- Add project_title column
ALTER TABLE on_chain_contracts 
ADD COLUMN IF NOT EXISTS project_title TEXT;

-- Add project_brief column
ALTER TABLE on_chain_contracts 
ADD COLUMN IF NOT EXISTS project_brief TEXT;

-- Add comments
COMMENT ON COLUMN on_chain_contracts.project_title IS 'Title of the gig/project';
COMMENT ON COLUMN on_chain_contracts.project_brief IS 'Detailed project brief written by the client';

-- =====================================================
-- NOTES
-- =====================================================
-- project_title: The gig title from the original post
-- project_brief: The mandatory brief the client writes when sending a proposal
-- These fields are crucial for the Proposal & Acceptance flow
-- =====================================================
