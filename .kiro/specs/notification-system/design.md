# Design Document: Comprehensive Notification System

## Architecture Overview

The notification system follows a three-tier architecture:

1. **Database Layer**: Supabase PostgreSQL with real-time subscriptions
2. **Backend Layer**: Edge Functions for secure notification creation
3. **Frontend Layer**: React components and hooks for UI and state management

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Notification  │  │Notification  │  │Notifications │     │
│  │    Bell      │  │   Dropdown   │  │     Page     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                       │
│                   │ useNotifications │                       │
│                   │      Hook        │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Supabase       │
                    │  Real-time      │
                    │  Subscription   │
                    └────────┬────────┘
┌────────────────────────────┼──────────────────────────────┐
│                    Backend Layer                            │
│                   ┌────────▼────────┐                       │
│                   │ create-         │                       │
│                   │ notification    │                       │
│                   │ Edge Function   │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                    Database Layer                           │
│                   ┌────────▼────────┐                       │
│                   │  notifications  │                       │
│                   │     Table       │                       │
│                   │   (with RLS)    │                       │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'proposal',
    'acceptance',
    'decline',
    'payment',
    'scout_earning',
    'announcement'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');
```

### Notification Data Structure

The `data` JSONB field stores type-specific information:

**Proposal Notification:**
```json
{
  "project_id": "uuid",
  "client_address": "SP...",
  "amount": 1000,
  "project_title": "Build a DApp"
}
```

**Acceptance/Decline Notification:**
```json
{
  "project_id": "uuid",
  "talent_address": "SP...",
  "contract_id": 123,
  "project_title": "Build a DApp"
}
```

**Payment Notification:**
```json
{
  "project_id": "uuid",
  "amount": 1000,
  "transaction_id": "0x...",
  "project_title": "Build a DApp"
}
```

**Scout Earning Notification:**
```json
{
  "project_id": "uuid",
  "amount": 50,
  "client_address": "SP...",
  "talent_address": "SP...",
  "project_title": "Build a DApp"
}
```

## Component Architecture

### NotificationBell Component

**Location:** `src/components/NotificationBell.tsx`

**Responsibilities:**
- Display notification icon in navigation
- Show unread count badge
- Toggle notification dropdown
- Subscribe to real-time updates

**Props:**
```typescript
interface NotificationBellProps {
  className?: string;
}
```

**State:**
```typescript
{
  isOpen: boolean;
  unreadCount: number;
  hasNewNotification: boolean; // For animation
}
```

### NotificationDropdown Component

**Location:** `src/components/NotificationDropdown.tsx`

**Responsibilities:**
- Display recent notifications (10 max)
- Mark notifications as read on view
- Provide action buttons
- Handle loading and empty states

**Props:**
```typescript
interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### NotificationItem Component

**Location:** `src/components/NotificationItem.tsx`

**Responsibilities:**
- Render individual notification
- Display appropriate icon based on type
- Show action button if applicable
- Handle click to mark as read

**Props:**
```typescript
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onAction?: () => void;
}
```

### NotificationsPage Component

**Location:** `src/pages/Notifications.tsx`

**Responsibilities:**
- Display full notification history
- Implement pagination/infinite scroll
- Provide filtering options
- Bulk actions (mark all as read)

## Hook Architecture

### useNotifications Hook

**Location:** `src/hooks/useNotifications.ts`

**Purpose:** Manage notification state and real-time updates

**API:**
```typescript
interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

function useNotifications(limit?: number): UseNotificationsReturn
```

**Implementation Details:**
- Fetches notifications on mount
- Subscribes to real-time updates
- Maintains local state with optimistic updates
- Handles reconnection logic
- Debounces rapid updates

### useNotificationTriggers Hook

**Location:** `src/hooks/useNotificationTriggers.ts`

**Purpose:** Provide methods to trigger notifications from various parts of the app

**API:**
```typescript
interface UseNotificationTriggersReturn {
  sendProposalNotification: (data: ProposalNotificationData) => Promise<void>;
  sendAcceptanceNotification: (data: AcceptanceNotificationData) => Promise<void>;
  sendDeclineNotification: (data: DeclineNotificationData) => Promise<void>;
  sendPaymentNotification: (data: PaymentNotificationData) => Promise<void>;
  sendScoutEarningNotification: (data: ScoutEarningNotificationData) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

function useNotificationTriggers(): UseNotificationTriggersReturn
```

## Edge Function Design

### create-notification Function

**Location:** `supabase/functions/create-notification/index.ts`

**Purpose:** Securely create notifications with validation

**Request:**
```typescript
{
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}
```

**Response:**
```typescript
{
  success: boolean;
  notification?: Notification;
  error?: string;
}
```

**Validation:**
1. Verify JWT authentication
2. Validate notification type
3. Validate required fields
4. Verify user_id exists in profiles
5. Sanitize message content
6. Validate data structure

## Integration Points

### 1. Proposal Flow Integration

**File:** `src/components/GigProposalModal.tsx`

After successful proposal submission:
```typescript
await sendProposalNotification({
  user_id: talentAddress,
  project_id: projectId,
  client_address: clientAddress,
  amount: projectAmount,
  project_title: projectTitle
});
```

### 2. Acceptance Flow Integration

**File:** `src/hooks/useAcceptProject.ts`

After successful acceptance:
```typescript
await sendAcceptanceNotification({
  user_id: clientAddress,
  project_id: projectId,
  talent_address: talentAddress,
  contract_id: contractId,
  project_title: projectTitle
});
```

### 3. Decline Flow Integration

**File:** `src/hooks/useDeclineProject.ts`

After successful decline:
```typescript
await sendDeclineNotification({
  user_id: clientAddress,
  project_id: projectId,
  talent_address: talentAddress,
  project_title: projectTitle
});
```

### 4. Payment Flow Integration

**File:** `src/hooks/useFundEscrow.ts` or payment release hooks

After payment release:
```typescript
// Notify talent
await sendPaymentNotification({
  user_id: talentAddress,
  project_id: projectId,
  amount: paymentAmount,
  transaction_id: txId,
  project_title: projectTitle
});

// Notify client
await sendPaymentNotification({
  user_id: clientAddress,
  project_id: projectId,
  amount: paymentAmount,
  transaction_id: txId,
  project_title: projectTitle
});
```

### 5. Scout Earnings Integration

**File:** Scout commission calculation logic

After commission calculation:
```typescript
await sendScoutEarningNotification({
  user_id: scoutAddress,
  project_id: projectId,
  amount: commissionAmount,
  client_address: clientAddress,
  talent_address: talentAddress,
  project_title: projectTitle
});
```

## UI/UX Design

### Notification Bell States

1. **No Notifications:** Gray bell icon
2. **Unread Notifications:** Blue bell icon with red badge showing count
3. **New Notification:** Brief pulse animation
4. **Dropdown Open:** Bell highlighted, dropdown visible below

### Notification Types & Icons

- **Proposal:** 📋 Clipboard icon
- **Acceptance:** ✅ Check circle icon
- **Decline:** ❌ X circle icon
- **Payment:** 💰 Dollar sign icon
- **Scout Earning:** 🎯 Target icon
- **Announcement:** 📢 Megaphone icon

### Color Coding

- **Unread:** White/light background
- **Read:** Gray/muted background
- **Proposal:** Blue accent
- **Acceptance:** Green accent
- **Decline:** Red accent
- **Payment:** Purple accent
- **Scout Earning:** Orange accent

### Responsive Design

**Desktop:**
- Bell in top-right navigation
- Dropdown width: 400px
- Positioned below bell with arrow

**Mobile:**
- Bell in navigation bar
- Dropdown full-width
- Slides up from bottom

## Performance Considerations

### Optimization Strategies

1. **Pagination:** Load 10 notifications at a time in dropdown
2. **Indexing:** Database indexes on user_id, created_at, read
3. **Caching:** Cache unread count in local state
4. **Debouncing:** Debounce real-time updates (500ms)
5. **Lazy Loading:** Load notification page content on demand
6. **Connection Pooling:** Reuse Supabase connection

### Real-time Subscription Management

```typescript
// Subscribe only when user is authenticated
useEffect(() => {
  if (!userAddress) return;

  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userAddress}`
      },
      handleNewNotification
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [userAddress]);
```

## Error Handling

### Frontend Error Scenarios

1. **Failed to fetch notifications:** Show error message, retry button
2. **Failed to mark as read:** Revert optimistic update, show toast
3. **Real-time connection lost:** Show reconnecting indicator
4. **Failed to send notification:** Log error, don't block user action

### Backend Error Scenarios

1. **Invalid authentication:** Return 401 error
2. **Invalid notification data:** Return 400 with validation errors
3. **Database error:** Return 500, log for investigation
4. **User not found:** Return 404 error

## Testing Strategy

### Unit Tests

- Test notification hooks (useNotifications, useNotificationTriggers)
- Test notification components render correctly
- Test notification type validation
- Test mark as read functionality

### Integration Tests

- Test real-time subscription updates
- Test notification creation flow end-to-end
- Test notification triggers from various actions
- Test RLS policies enforce security

### E2E Tests

- Test complete proposal → notification flow
- Test acceptance → notification flow
- Test payment → notification flow
- Test notification bell interaction
- Test notification page functionality

## Security Considerations

1. **RLS Policies:** Users can only access their own notifications
2. **Authentication:** All Edge Functions require valid JWT
3. **Input Validation:** Sanitize all user input
4. **XSS Prevention:** Escape notification messages
5. **Rate Limiting:** Prevent notification spam
6. **Audit Logging:** Log all notification creation events

## Future Enhancements

1. **Notification Preferences:** Allow users to configure notification types
2. **Email Notifications:** Send email for critical notifications
3. **Push Notifications:** Browser push notifications
4. **Notification Grouping:** Group similar notifications
5. **Notification Snooze:** Temporarily hide notifications
6. **Rich Notifications:** Support images, links, formatting
7. **Notification Search:** Search notification history
8. **Notification Export:** Export notification data
