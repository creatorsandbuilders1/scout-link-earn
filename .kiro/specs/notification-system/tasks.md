# Task Breakdown: Comprehensive Notification System

## Phase 1: Database Infrastructure

### Task 1.1: Create Notifications Table Migration
**Estimated Time:** 30 minutes
**Priority:** High
**Dependencies:** None

**Description:** Create Supabase migration for notifications table with proper schema, indexes, and RLS policies.

**Subtasks:**
- [ ] Create migration file `20251024000003_create_notifications_table.sql`
- [ ] Define notifications table schema with all required columns
- [ ] Add CHECK constraint for notification types
- [ ] Create indexes on user_id, created_at, read columns
- [ ] Create composite index for user_id + read (unread queries)
- [ ] Enable Row Level Security
- [ ] Create RLS policy for SELECT (users view own notifications)
- [ ] Create RLS policy for UPDATE (users update own notifications)
- [ ] Enable real-time replication for notifications table

**Acceptance Criteria:**
- Migration runs successfully without errors
- All indexes are created
- RLS policies prevent unauthorized access
- Real-time subscriptions work for notifications table

**Files to Create:**
- `supabase/migrations/20251024000003_create_notifications_table.sql`

---

### Task 1.2: Test Database Schema
**Estimated Time:** 15 minutes
**Priority:** High
**Dependencies:** Task 1.1

**Description:** Verify database schema works correctly with test data.

**Subtasks:**
- [ ] Run migration on local Supabase instance
- [ ] Insert test notifications
- [ ] Verify RLS policies work correctly
- [ ] Test real-time subscriptions
- [ ] Verify indexes improve query performance

**Acceptance Criteria:**
- Test notifications can be inserted
- RLS policies enforce security
- Real-time updates trigger correctly
- Query performance is acceptable

---

## Phase 2: Backend Infrastructure

### Task 2.1: Create Notification Edge Function
**Estimated Time:** 45 minutes
**Priority:** High
**Dependencies:** Task 1.1

**Description:** Create Edge Function for secure notification creation with validation.

**Subtasks:**
- [ ] Create `supabase/functions/create-notification/index.ts`
- [ ] Implement JWT authentication verification
- [ ] Implement notification type validation
- [ ] Implement required field validation
- [ ] Implement user_id existence check
- [ ] Implement data payload validation
- [ ] Add error handling and logging
- [ ] Return appropriate success/error responses

**Acceptance Criteria:**
- Function requires valid authentication
- Invalid notification types are rejected
- Missing required fields return 400 error
- Valid notifications are created successfully
- Errors are logged for debugging

**Files to Create:**
- `supabase/functions/create-notification/index.ts`

---

### Task 2.2: Deploy and Test Edge Function
**Estimated Time:** 15 minutes
**Priority:** High
**Dependencies:** Task 2.1

**Description:** Deploy Edge Function and verify it works correctly.

**Subtasks:**
- [ ] Deploy create-notification function to Supabase
- [ ] Test with valid notification data
- [ ] Test with invalid authentication
- [ ] Test with invalid notification type
- [ ] Test with missing required fields
- [ ] Verify notifications appear in database

**Acceptance Criteria:**
- Function deploys successfully
- Valid requests create notifications
- Invalid requests return appropriate errors
- Function logs are accessible

---

## Phase 3: Frontend Hooks

### Task 3.1: Create useNotifications Hook
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** Task 1.1

**Description:** Create React hook for fetching and managing notifications with real-time updates.

**Subtasks:**
- [ ] Create `src/hooks/useNotifications.ts`
- [ ] Implement initial notification fetch
- [ ] Implement real-time subscription setup
- [ ] Implement markAsRead function
- [ ] Implement markAllAsRead function
- [ ] Implement refetch function
- [ ] Calculate unread count
- [ ] Handle loading and error states
- [ ] Implement cleanup on unmount
- [ ] Add debouncing for rapid updates

**Acceptance Criteria:**
- Hook fetches notifications on mount
- Real-time updates appear instantly
- Mark as read updates database and local state
- Unread count is accurate
- Loading and error states work correctly
- Subscription cleans up properly

**Files to Create:**
- `src/hooks/useNotifications.ts`

---

### Task 3.2: Create useNotificationTriggers Hook
**Estimated Time:** 45 minutes
**Priority:** High
**Dependencies:** Task 2.1

**Description:** Create React hook for triggering notifications from various app events.

**Subtasks:**
- [ ] Create `src/hooks/useNotificationTriggers.ts`
- [ ] Implement sendProposalNotification function
- [ ] Implement sendAcceptanceNotification function
- [ ] Implement sendDeclineNotification function
- [ ] Implement sendPaymentNotification function
- [ ] Implement sendScoutEarningNotification function
- [ ] Add error handling for each function
- [ ] Add loading state management
- [ ] Call create-notification Edge Function

**Acceptance Criteria:**
- Each trigger function creates correct notification
- Functions handle errors gracefully
- Loading states are managed correctly
- Functions can be called from anywhere in app

**Files to Create:**
- `src/hooks/useNotificationTriggers.ts`

---

## Phase 4: UI Components

### Task 4.1: Create NotificationBell Component
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** Task 3.1

**Description:** Create notification bell component for navigation with unread count badge.

**Subtasks:**
- [ ] Create `src/components/NotificationBell.tsx`
- [ ] Implement bell icon with Lucide React
- [ ] Add unread count badge
- [ ] Implement dropdown toggle
- [ ] Add pulse animation for new notifications
- [ ] Style for desktop and mobile
- [ ] Integrate useNotifications hook
- [ ] Handle click outside to close dropdown

**Acceptance Criteria:**
- Bell displays in navigation
- Unread count badge shows correct number
- Clicking toggles dropdown
- New notifications trigger animation
- Responsive on mobile
- Only visible when authenticated

**Files to Create:**
- `src/components/NotificationBell.tsx`

---

### Task 4.2: Create NotificationItem Component
**Estimated Time:** 45 minutes
**Priority:** High
**Dependencies:** Task 3.1

**Description:** Create component for rendering individual notification items.

**Subtasks:**
- [ ] Create `src/components/NotificationItem.tsx`
- [ ] Implement notification type icons
- [ ] Display title, message, timestamp
- [ ] Show read/unread indicator
- [ ] Add action button (when applicable)
- [ ] Implement mark as read on click
- [ ] Style with appropriate colors per type
- [ ] Format relative timestamps

**Acceptance Criteria:**
- Notification displays all information
- Correct icon for each type
- Clicking marks as read
- Action buttons work correctly
- Timestamps are human-readable
- Visual distinction between read/unread

**Files to Create:**
- `src/components/NotificationItem.tsx`

---

### Task 4.3: Create NotificationDropdown Component
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** Task 4.2

**Description:** Create dropdown component showing recent notifications.

**Subtasks:**
- [ ] Create `src/components/NotificationDropdown.tsx`
- [ ] Display up to 10 recent notifications
- [ ] Implement loading state
- [ ] Implement empty state
- [ ] Add "View All" link
- [ ] Add "Mark All as Read" button
- [ ] Style dropdown with proper positioning
- [ ] Make responsive for mobile
- [ ] Add scroll for many notifications

**Acceptance Criteria:**
- Dropdown shows recent notifications
- Loading state displays while fetching
- Empty state shows when no notifications
- "Mark All as Read" works correctly
- "View All" navigates to notifications page
- Dropdown positioned correctly
- Mobile version slides up from bottom

**Files to Create:**
- `src/components/NotificationDropdown.tsx`

---

### Task 4.4: Create NotificationsPage Component
**Estimated Time:** 1.5 hours
**Priority:** Medium
**Dependencies:** Task 4.2

**Description:** Create full notifications page with filtering and pagination.

**Subtasks:**
- [ ] Create `src/pages/Notifications.tsx`
- [ ] Display all notifications with pagination
- [ ] Implement filter by type
- [ ] Implement filter by read/unread
- [ ] Add "Mark All as Read" action
- [ ] Implement infinite scroll or pagination
- [ ] Style page layout
- [ ] Add loading and empty states
- [ ] Make responsive

**Acceptance Criteria:**
- Page displays all notifications
- Filters work correctly
- Pagination/infinite scroll works
- Mark all as read updates all notifications
- Page is responsive
- Loading and empty states display

**Files to Create:**
- `src/pages/Notifications.tsx`

---

### Task 4.5: Add Notifications Route
**Estimated Time:** 15 minutes
**Priority:** Medium
**Dependencies:** Task 4.4

**Description:** Add notifications page to app routing.

**Subtasks:**
- [ ] Add `/notifications` route to `src/App.tsx`
- [ ] Make route protected (require authentication)
- [ ] Update navigation to include notifications link (optional)

**Acceptance Criteria:**
- Route is accessible at `/notifications`
- Route requires authentication
- Page loads correctly

**Files to Modify:**
- `src/App.tsx`

---

## Phase 5: Integration

### Task 5.1: Integrate NotificationBell into Navigation
**Estimated Time:** 30 minutes
**Priority:** High
**Dependencies:** Task 4.1, Task 4.3

**Description:** Add notification bell to main navigation component.

**Subtasks:**
- [ ] Import NotificationBell into Navigation component
- [ ] Position bell in top-right area
- [ ] Ensure bell only shows when authenticated
- [ ] Test on desktop and mobile
- [ ] Verify dropdown positioning

**Acceptance Criteria:**
- Bell appears in navigation
- Bell only visible when logged in
- Dropdown opens correctly
- Works on all screen sizes

**Files to Modify:**
- `src/components/layout/Navigation.tsx`

---

### Task 5.2: Integrate Proposal Notifications
**Estimated Time:** 30 minutes
**Priority:** High
**Dependencies:** Task 3.2

**Description:** Trigger notifications when proposals are sent.

**Subtasks:**
- [ ] Import useNotificationTriggers in GigProposalModal
- [ ] Call sendProposalNotification after successful proposal
- [ ] Extract talent address from contract data
- [ ] Pass project details to notification
- [ ] Handle errors gracefully

**Acceptance Criteria:**
- Notification sent when proposal created
- Talent receives notification
- Notification contains correct data
- Errors don't block proposal flow

**Files to Modify:**
- `src/components/GigProposalModal.tsx`

---

### Task 5.3: Integrate Acceptance/Decline Notifications
**Estimated Time:** 30 minutes
**Priority:** High
**Dependencies:** Task 3.2

**Description:** Trigger notifications when proposals are accepted or declined.

**Subtasks:**
- [ ] Import useNotificationTriggers in useAcceptProject
- [ ] Call sendAcceptanceNotification after successful acceptance
- [ ] Import useNotificationTriggers in useDeclineProject
- [ ] Call sendDeclineNotification after successful decline
- [ ] Extract client address from contract data
- [ ] Pass project details to notifications
- [ ] Handle errors gracefully

**Acceptance Criteria:**
- Notification sent when proposal accepted
- Notification sent when proposal declined
- Client receives notifications
- Notifications contain correct data
- Errors don't block acceptance/decline flow

**Files to Modify:**
- `src/hooks/useAcceptProject.ts`
- `src/hooks/useDeclineProject.ts`

---

### Task 5.4: Integrate Payment Notifications
**Estimated Time:** 45 minutes
**Priority:** Medium
**Dependencies:** Task 3.2

**Description:** Trigger notifications when payments are released.

**Subtasks:**
- [ ] Identify payment release hooks/functions
- [ ] Import useNotificationTriggers
- [ ] Call sendPaymentNotification for talent
- [ ] Call sendPaymentNotification for client
- [ ] Extract transaction details
- [ ] Handle errors gracefully

**Acceptance Criteria:**
- Notification sent when payment released
- Both talent and client receive notifications
- Notifications contain transaction details
- Errors don't block payment flow

**Files to Modify:**
- Payment release hooks (TBD based on implementation)

---

### Task 5.5: Integrate Scout Earning Notifications
**Estimated Time:** 45 minutes
**Priority:** Medium
**Dependencies:** Task 3.2

**Description:** Trigger notifications when scouts earn commissions.

**Subtasks:**
- [ ] Identify scout commission calculation logic
- [ ] Import useNotificationTriggers
- [ ] Call sendScoutEarningNotification after commission
- [ ] Extract scout address and commission amount
- [ ] Handle errors gracefully

**Acceptance Criteria:**
- Notification sent when scout earns commission
- Scout receives notification
- Notification contains earning details
- Errors don't block commission flow

**Files to Modify:**
- Scout commission logic (TBD based on implementation)

---

## Phase 6: Testing & Polish

### Task 6.1: End-to-End Testing
**Estimated Time:** 1 hour
**Priority:** High
**Dependencies:** All integration tasks

**Description:** Test complete notification flows end-to-end.

**Subtasks:**
- [ ] Test proposal → notification flow
- [ ] Test acceptance → notification flow
- [ ] Test decline → notification flow
- [ ] Test payment → notification flow (if implemented)
- [ ] Test scout earning → notification flow (if implemented)
- [ ] Test real-time updates
- [ ] Test mark as read functionality
- [ ] Test notification page
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

**Acceptance Criteria:**
- All notification flows work correctly
- Real-time updates appear instantly
- No console errors
- Works across browsers
- Mobile experience is smooth

---

### Task 6.2: Performance Optimization
**Estimated Time:** 45 minutes
**Priority:** Medium
**Dependencies:** Task 6.1

**Description:** Optimize notification system performance.

**Subtasks:**
- [ ] Verify database indexes are used
- [ ] Optimize real-time subscription queries
- [ ] Add debouncing to rapid updates
- [ ] Implement pagination for large notification lists
- [ ] Test with large number of notifications
- [ ] Profile component render performance

**Acceptance Criteria:**
- Queries execute in < 200ms
- Real-time updates don't cause lag
- Large notification lists perform well
- No unnecessary re-renders

---

### Task 6.3: Error Handling & Edge Cases
**Estimated Time:** 30 minutes
**Priority:** Medium
**Dependencies:** Task 6.1

**Description:** Handle error scenarios and edge cases.

**Subtasks:**
- [ ] Test with network disconnection
- [ ] Test with invalid notification data
- [ ] Test with missing user profiles
- [ ] Test with database errors
- [ ] Add user-friendly error messages
- [ ] Add retry logic where appropriate

**Acceptance Criteria:**
- Network errors handled gracefully
- Invalid data doesn't crash app
- Error messages are user-friendly
- System recovers from errors

---

### Task 6.4: Documentation
**Estimated Time:** 30 minutes
**Priority:** Low
**Dependencies:** Task 6.1

**Description:** Document notification system implementation.

**Subtasks:**
- [ ] Create NOTIFICATION_SYSTEM_COMPLETE.md
- [ ] Document database schema
- [ ] Document Edge Function API
- [ ] Document hook usage
- [ ] Document component props
- [ ] Add code examples
- [ ] Document deployment steps

**Acceptance Criteria:**
- Documentation is complete and accurate
- Examples are clear and working
- Deployment steps are documented

**Files to Create:**
- `NOTIFICATION_SYSTEM_COMPLETE.md`

---

## Summary

**Total Estimated Time:** ~12-14 hours

**Phase Breakdown:**
- Phase 1 (Database): ~45 minutes
- Phase 2 (Backend): ~1 hour
- Phase 3 (Hooks): ~1.75 hours
- Phase 4 (UI): ~4.75 hours
- Phase 5 (Integration): ~3 hours
- Phase 6 (Testing): ~2.75 hours

**Critical Path:**
1. Database Infrastructure (Phase 1)
2. Backend Infrastructure (Phase 2)
3. Frontend Hooks (Phase 3)
4. UI Components (Phase 4)
5. Integration (Phase 5)
6. Testing (Phase 6)

**Priority Tasks:**
- All Phase 1, 2, 3 tasks (infrastructure)
- Tasks 4.1, 4.2, 4.3 (core UI)
- Tasks 5.1, 5.2, 5.3 (core integrations)
- Task 6.1 (testing)

**Can Be Deferred:**
- Task 4.4 (full notifications page)
- Tasks 5.4, 5.5 (payment/scout notifications)
- Tasks 6.2, 6.3, 6.4 (optimization and polish)
