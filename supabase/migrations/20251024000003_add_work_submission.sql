-- Migration: Add Work Submission Support
-- Date: 2025-10-24
-- Purpose: Add columns and status for Talent work submission flow

-- Add new columns to on_chain_contracts table
ALTER TABLE on_chain_contracts
ADD COLUMN IF NOT EXISTS work_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS work_submission_message TEXT,
ADD COLUMN IF NOT EXISTS work_deliverable_urls TEXT[];

-- Add comment explaining the new status
COMMENT ON COLUMN on_chain_contracts.status IS 
'Contract status: 0=Created, 1=Funded/Active, 2=Completed, 3=Disputed, 4=Pending_Acceptance, 5=Declined, 6=Pending_Client_Approval';

-- Create index for work submission queries
CREATE INDEX IF NOT EXISTS idx_on_chain_contracts_work_submitted 
ON on_chain_contracts(work_submitted_at) 
WHERE work_submitted_at IS NOT NULL;
