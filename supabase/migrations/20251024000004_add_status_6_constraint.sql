-- =====================================================
-- Add Status 6 (Pending_Client_Approval) to Constraints
-- =====================================================
-- This migration updates the status constraint to include
-- the new status 6: Pending_Client_Approval
-- (Talent has submitted work, waiting for client approval)
-- =====================================================

-- Drop the existing check constraint
ALTER TABLE on_chain_contracts 
DROP CONSTRAINT IF EXISTS on_chain_contracts_status_check;

-- Add the updated check constraint with status 6
ALTER TABLE on_chain_contracts 
ADD CONSTRAINT on_chain_contracts_status_check 
CHECK (status IN (0, 1, 2, 3, 4, 5, 6));

-- Update comment to include new status
COMMENT ON COLUMN on_chain_contracts.status IS 
'Project status: 0=Created, 1=Funded/Active, 2=Completed, 3=Disputed, 4=Pending_Acceptance, 5=Declined, 6=Pending_Client_Approval';

-- =====================================================
-- NOTES
-- =====================================================
-- Status 6 (Pending_Client_Approval): Talent has submitted final work
-- and is requesting payment. Client must review and approve.
-- This is an OFF-CHAIN status change (no blockchain transaction).
-- =====================================================
