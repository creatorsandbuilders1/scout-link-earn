-- =====================================================
-- CRITICAL REFACTOR: CONTRACT-CENTRIC MESSAGING
-- =====================================================
-- This migration fixes the architectural flaw where messaging
-- was built as an isolated feature instead of being integrated
-- into the contract workspace.
-- =====================================================

-- =====================================================
-- STEP 1: DELETE THE CONVERSATIONS TABLE
-- =====================================================
-- The conversations table is REDUNDANT.
-- The on_chain_contracts table IS the conversation.
-- =====================================================

DROP TABLE IF EXISTS conversations CASCADE;

-- =====================================================
-- STEP 2: REFACTOR MESSAGES TABLE
-- =====================================================
-- Messages must be tied to contracts, not generic conversations
-- =====================================================

-- Drop the old foreign key and column
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE messages DROP COLUMN IF EXISTS conversation_id;

-- Add contract_id column
ALTER TABLE messages ADD COLUMN contract_id INTEGER NOT NULL;

-- Add foreign key to on_chain_contracts (uses project_id as PK)
ALTER TABLE messages 
  ADD CONSTRAINT messages_contract_id_fkey 
  FOREIGN KEY (contract_id) 
  REFERENCES on_chain_contracts(project_id) 
  ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_messages_conversation_id;
CREATE INDEX idx_messages_contract_id ON messages(contract_id);
CREATE INDEX idx_messages_contract_unread ON messages(contract_id, read) WHERE read = false;

-- =====================================================
-- STEP 3: ADD CONTRACT_ID TO NOTIFICATIONS
-- =====================================================
-- All notifications should reference the contract they're about
-- =====================================================

ALTER TABLE notifications ADD COLUMN contract_id INTEGER;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_contract_id_fkey 
  FOREIGN KEY (contract_id) 
  REFERENCES on_chain_contracts(project_id) 
  ON DELETE CASCADE;

CREATE INDEX idx_notifications_contract_id ON notifications(contract_id);

-- =====================================================
-- STEP 4: UPDATE RLS POLICIES FOR MESSAGES
-- =====================================================
-- Users can only see messages for contracts they're part of
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;

-- Users can view messages for contracts they're part of
CREATE POLICY "Users can view messages for their contracts"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM on_chain_contracts
      WHERE on_chain_contracts.project_id = messages.contract_id
      AND (
        on_chain_contracts.client_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR on_chain_contracts.talent_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can send messages for contracts they're part of
CREATE POLICY "Users can send messages for their contracts"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = current_setting('request.jwt.claims', true)::json->>'sub'
    AND EXISTS (
      SELECT 1 FROM on_chain_contracts
      WHERE on_chain_contracts.project_id = messages.contract_id
      AND (
        on_chain_contracts.client_id = sender_id
        OR on_chain_contracts.talent_id = sender_id
      )
    )
  );

-- Users can update messages for contracts they're part of (mark as read)
CREATE POLICY "Users can update messages for their contracts"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM on_chain_contracts
      WHERE on_chain_contracts.project_id = messages.contract_id
      AND (
        on_chain_contracts.client_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR on_chain_contracts.talent_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- =====================================================
-- STEP 5: HELPER FUNCTION FOR UNREAD MESSAGE COUNTS
-- =====================================================
-- Get unread message count for a specific contract
-- =====================================================

CREATE OR REPLACE FUNCTION get_contract_unread_count(
  p_contract_id INTEGER,
  p_user_id TEXT
)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM messages
  WHERE contract_id = p_contract_id
  AND read = false
  AND sender_id != p_user_id;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: HELPER FUNCTION FOR USER'S TOTAL UNREAD
-- =====================================================
-- Get total unread messages across all user's contracts
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_total_unread(
  p_user_id TEXT
)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM messages m
  INNER JOIN on_chain_contracts c ON m.contract_id = c.project_id
  WHERE m.read = false
  AND m.sender_id != p_user_id
  AND (c.client_id = p_user_id OR c.talent_id = p_user_id);
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE messages IS 'Messages are tied to contracts - this is where Client and Talent communicate about work';
COMMENT ON COLUMN messages.contract_id IS 'Every message belongs to a specific contract (the workspace)';
COMMENT ON COLUMN notifications.contract_id IS 'Most notifications are about a specific contract';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The messaging system is now CONTRACT-CENTRIC
-- Messages live in the Workspace, not in an isolated inbox
-- =====================================================
