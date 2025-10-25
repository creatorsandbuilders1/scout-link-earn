-- =====================================================
-- Update Contract Status Constraints for project-escrow-v2
-- =====================================================
-- This migration updates the on_chain_contracts table
-- to support the new status values from project-escrow-v2:
-- 4 = Pending_Acceptance (funded but awaiting talent acceptance)
-- 5 = Declined (talent declined with automatic refund)
-- =====================================================

-- Drop the existing check constraint
ALTER TABLE on_chain_contracts 
DROP CONSTRAINT IF EXISTS on_chain_contracts_status_check;

-- Add the updated check constraint with new status values
ALTER TABLE on_chain_contracts 
ADD CONSTRAINT on_chain_contracts_status_check 
CHECK (status IN (0, 1, 2, 3, 4, 5));

-- Add comments for clarity
COMMENT ON COLUMN on_chain_contracts.status IS 
'Project status: 0=Created, 1=Funded, 2=Completed, 3=Disputed, 4=Pending_Acceptance, 5=Declined';

-- =====================================================
-- NOTES
-- =====================================================
-- Status 4 (Pending_Acceptance): Project is funded but waiting for talent acceptance
-- Status 5 (Declined): Talent declined the project, funds refunded to client
-- This supports the new Proposal & Acceptance flow in project-escrow-v2
-- =====================================================
