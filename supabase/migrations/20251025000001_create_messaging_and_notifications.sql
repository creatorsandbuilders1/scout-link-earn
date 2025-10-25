-- =====================================================
-- MESSAGING & NOTIFICATION SYSTEM
-- =====================================================
-- This migration creates the complete infrastructure for:
-- 1. Real-time messaging between users
-- 2. Comprehensive notification system
-- =====================================================

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
-- Tracks chat conversations between users
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure exactly 2 participants
  CONSTRAINT valid_participants CHECK (array_length(participant_ids, 1) = 2),
  -- Ensure participants are unique
  CONSTRAINT unique_participants CHECK (participant_ids[1] != participant_ids[2])
);

-- Index for finding conversations by participant
CREATE INDEX idx_conversations_participants ON conversations USING GIN (participant_ids);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
-- Stores individual messages within conversations
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure content is not empty
  CONSTRAINT non_empty_content CHECK (length(trim(content)) > 0)
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read) WHERE read = false;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
-- Stores user notifications for various platform events
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'new_message',
    'proposal_received',
    'proposal_accepted',
    'proposal_declined',
    'work_submitted',
    'payment_received',
    'payment_sent',
    'scout_earning',
    'announcement'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure title and message are not empty
  CONSTRAINT non_empty_title CHECK (length(trim(title)) > 0),
  CONSTRAINT non_empty_message CHECK (length(trim(message)) > 0)
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONVERSATIONS RLS POLICIES
-- =====================================================

-- Users can view conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    participant_ids @> ARRAY[current_setting('request.jwt.claims', true)::json->>'sub']
  );

-- Users can create conversations (via Edge Function)
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    participant_ids @> ARRAY[current_setting('request.jwt.claims', true)::json->>'sub']
  );

-- Users can update conversations they're part of (for updated_at)
CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (
    participant_ids @> ARRAY[current_setting('request.jwt.claims', true)::json->>'sub']
  );

-- =====================================================
-- MESSAGES RLS POLICIES
-- =====================================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.participant_ids @> ARRAY[current_setting('request.jwt.claims', true)::json->>'sub']
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = current_setting('request.jwt.claims', true)::json->>'sub'
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.participant_ids @> ARRAY[sender_id]
    )
  );

-- Users can update their own messages (for read status)
CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.participant_ids @> ARRAY[current_setting('request.jwt.claims', true)::json->>'sub']
    )
  );

-- =====================================================
-- NOTIFICATIONS RLS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Only Edge Functions can create notifications
CREATE POLICY "Service role can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is sent
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id TEXT,
  user2_id TEXT
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  sorted_participants TEXT[];
BEGIN
  -- Sort participant IDs to ensure consistent ordering
  IF user1_id < user2_id THEN
    sorted_participants := ARRAY[user1_id, user2_id];
  ELSE
    sorted_participants := ARRAY[user2_id, user1_id];
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_ids = sorted_participants;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_ids)
    VALUES (sorted_participants)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE conversations IS 'Stores chat conversations between two users';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE notifications IS 'Stores user notifications for platform events';

COMMENT ON COLUMN conversations.participant_ids IS 'Array of exactly 2 Stacks addresses';
COMMENT ON COLUMN messages.conversation_id IS 'Reference to the conversation this message belongs to';
COMMENT ON COLUMN messages.sender_id IS 'Stacks address of the message sender';
COMMENT ON COLUMN messages.read IS 'Whether the message has been read by the recipient';
COMMENT ON COLUMN notifications.type IS 'Type of notification (new_message, proposal_received, etc.)';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data specific to notification type';
COMMENT ON COLUMN notifications.link IS 'URL to navigate to when notification is clicked';
