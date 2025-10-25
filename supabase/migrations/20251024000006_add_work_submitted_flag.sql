-- =====================================================
-- Add work_submitted Flag for Smart Contract Compatibility
-- =====================================================
-- The smart contract approve-and-distribute function only
-- accepts status u1 (Funded/Active). We need to keep the
-- status as 1 but track work submission separately.
-- =====================================================

-- Add a separate column to track work submission status
ALTER TABLE on_chain_contracts 
ADD COLUMN IF NOT EXISTS work_submitted BOOLEAN DEFAULT FALSE;

-- Create index for work submission queries
CREATE INDEX IF NOT EXISTS idx_on_chain_contracts_work_submitted 
ON on_chain_contracts(work_submitted) 
WHERE work_submitted = TRUE;

-- Update comment to clarify the new approach
COMMENT ON COLUMN on_chain_contracts.work_submitted IS 
'TRUE when talent has submitted final work and is requesting payment. Status remains 1 (Active) for smart contract compatibility.';

-- =====================================================
-- NOTES
-- =====================================================
-- New Logic:
-- - Status stays 1 (Active) throughout the work phase
-- - work_submitted = TRUE indicates talent has delivered
-- - Client can approve when work_submitted = TRUE
-- - Smart contract sees status = 1 and allows approval
-- =====================================================
