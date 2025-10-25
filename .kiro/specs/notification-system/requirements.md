# Requirements Document: Comprehensive Notification System

## Introduction

This feature implements a real-time notification system that alerts users to important events across the REFERYDO platform. The system ensures users never miss critical updates about project proposals, acceptances, payments, and scout earnings, significantly enhancing user engagement and platform professionalism.

## Glossary

- **Notification**: A message sent to a user about an important event or update
- **Real-time**: Instant delivery using Supabase subscriptions
- **Notification Bell**: UI component in navigation showing notification count
- **Notification Dropdown**: Expandable list of recent notifications
- **Notification Trigger**: Event that causes a notification to be sent
- **Unread Count**: Number of notifications the user hasn't viewed yet
- **Notification Type**: Category of notification (proposal, acceptance, payment, etc.)
- **Notification Data**: Additional context stored as JSON (project_id, amount, etc.)

## Requirements

### Requirement 1: Notification Database Infrastructure

**User Story:** As a Platform Administrator, I want a robust notification storage system, so that all user notifications are properly tracked and managed.

#### Acceptance Criteria

1. THE System SHALL create a `notifications` table in Supabase with the following structure:
   - `id` (UUID, primary key)
   - `user_id` (text, references Stacks address)
   - `type` (text: 'proposal', 'acceptance', 'decline', 'payment', 'scout_earning', 'announcement')
   - `title` (text, max 255 characters)
   - `message` (text, max 1000 characters)
   - `data` (jsonb, for additional context)
   - `read` (boolean, default false)
   - `created_at` (timestamptz, default now())

2. THE System SHALL implement Row Level Security (RLS) policies ensuring users can only access their own notifications

3. THE System SHALL create appropriate indexes for performance on `user_id`, `created_at`, and `read` columns

4. THE System SHALL enable real-time subscriptions on the notifications table

### Requirement 2: Notification Bell Component

**User Story:** As a User, I want to see a notification bell in the navigation, so that I'm immediately aware when I have new notifications.

#### Acceptance Criteria

1. THE NotificationBell component SHALL display in the top navigation bar
2. THE NotificationBell SHALL show an unread count badge when there are unread notifications
3. THE badge SHALL display the exact number of unread notifications (up to 99+)
4. THE bell SHALL have a visual indicator (color/animation) when there are unread notifications
5. WHEN clicked, THE bell SHALL open a dropdown with recent notifications
6. THE bell SHALL be responsive and work on mobile devices
7. THE bell SHALL only be visible to authenticated users

### Requirement 3: Notification Dropdown Interface

**User Story:** As a User, I want to view my recent notifications in a dropdown, so that I can quickly see what's happened without leaving my current page.

#### Acceptance Criteria

1. THE dropdown SHALL display up to 10 most recent notifications
2. THE notifications SHALL be ordered by creation date (newest first)
3. EACH notification SHALL display:
   - Title
   - Message
   - Timestamp (relative: "2 minutes ago")
   - Read/unread status indicator
   - Action button (when applicable)
4. THE dropdown SHALL mark notifications as read when viewed
5. THE dropdown SHALL include a "View All" link to a full notifications page
6. THE dropdown SHALL include a "Mark All as Read" action
7. THE dropdown SHALL show a loading state while fetching notifications
8. THE dropdown SHALL show an empty state when no notifications exist

### Requirement 4: Real-time Notification Updates

**User Story:** As a User, I want to receive notifications instantly, so that I can respond to important events immediately.

#### Acceptance Criteria

1. THE System SHALL use Supabase real-time subscriptions for instant notification delivery
2. NEW notifications SHALL appear in the dropdown immediately without page refresh
3. THE unread count badge SHALL update in real-time
4. THE System SHALL handle connection drops and reconnect automatically
5. THE System SHALL batch multiple rapid notifications to prevent UI spam
6. THE System SHALL show a brief animation/highlight for new notifications

### Requirement 5: Proposal Notification Triggers

**User Story:** As a Talent, I want to be notified when I receive a project proposal, so that I can review and respond promptly.

**User Story:** As a Client, I want to be notified when my proposal is accepted or declined, so that I know the status of my project.

#### Acceptance Criteria

1. WHEN a Client sends a project proposal, THE System SHALL create a notification for the Talent with:
   - Type: 'proposal'
   - Title: "New Project Proposal"
   - Message: "{client_name} sent you a proposal for {project_title}"
   - Data: {project_id, client_address, amount}
   - Action: "View Proposal" button

2. WHEN a Talent accepts a proposal, THE System SHALL create a notification for the Client with:
   - Type: 'acceptance'
   - Title: "Proposal Accepted"
   - Message: "{talent_name} accepted your proposal for {project_title}"
   - Data: {project_id, talent_address, contract_id}
   - Action: "View Contract" button

3. WHEN a Talent declines a proposal, THE System SHALL create a notification for the Client with:
   - Type: 'decline'
   - Title: "Proposal Declined"
   - Message: "{talent_name} declined your proposal for {project_title}"
   - Data: {project_id, talent_address}

### Requirement 6: Payment Notification Triggers

**User Story:** As a Talent, I want to be notified when payment is released, so that I know I've been paid.

**User Story:** As a Client, I want to be notified when payment is processed, so that I have confirmation of the transaction.

#### Acceptance Criteria

1. WHEN payment is released to a Talent, THE System SHALL create a notification with:
   - Type: 'payment'
   - Title: "Payment Received"
   - Message: "You received {amount} STX for {project_title}"
   - Data: {project_id, amount, transaction_id}

2. WHEN a Client releases payment, THE System SHALL create a notification with:
   - Type: 'payment'
   - Title: "Payment Sent"
   - Message: "Payment of {amount} STX sent for {project_title}"
   - Data: {project_id, amount, transaction_id}

### Requirement 7: Scout Commission Notification Triggers

**User Story:** As a Scout, I want to be notified when I earn a commission, so that I can track my earnings.

#### Acceptance Criteria

1. WHEN a Scout earns a commission, THE System SHALL create a notification with:
   - Type: 'scout_earning'
   - Title: "Commission Earned"
   - Message: "You earned {amount} STX commission from {project_title}"
   - Data: {project_id, amount, client_address, talent_address}
   - Action: "View Earnings" button

### Requirement 8: Notification Management Hooks

**User Story:** As a Developer, I want reusable hooks for notification management, so that I can easily integrate notifications throughout the application.

#### Acceptance Criteria

1. THE System SHALL provide a `useNotifications` hook that:
   - Fetches user notifications with pagination
   - Subscribes to real-time notification updates
   - Provides methods to mark notifications as read
   - Provides method to mark all notifications as read
   - Returns loading and error states
   - Returns unread count

2. THE System SHALL provide a `useNotificationTriggers` hook that:
   - Provides methods to send notifications for each event type
   - Handles notification creation via Edge Functions
   - Validates notification data before sending
   - Returns success/error states

### Requirement 9: Edge Function for Notification Creation

**User Story:** As a Developer, I want a secure backend function for creating notifications, so that notification creation is validated and controlled.

#### Acceptance Criteria

1. THE System SHALL create a `create-notification` Edge Function that:
   - Validates the authenticated user
   - Validates notification data structure
   - Creates notification in database
   - Returns success/error response
   - Logs notification creation for audit

2. THE Edge Function SHALL validate:
   - User authentication
   - Notification type is valid
   - Required fields are present
   - User_id exists in profiles table
   - Data payload is valid JSON

### Requirement 10: Notification Page (Full View)

**User Story:** As a User, I want to view all my notifications in a dedicated page, so that I can review my complete notification history.

#### Acceptance Criteria

1. THE System SHALL provide a `/notifications` route
2. THE page SHALL display all notifications with infinite scroll or pagination
3. THE page SHALL allow filtering by notification type
4. THE page SHALL allow filtering by read/unread status
5. THE page SHALL provide bulk actions (mark all as read, delete)
6. THE page SHALL show notification details and action buttons

## Non-Functional Requirements

### Performance
- Notification queries SHALL return results in < 200ms
- Real-time updates SHALL appear within 1 second of creation
- The notification bell SHALL not impact page load performance

### Security
- All notification data SHALL be protected by RLS policies
- Users SHALL only access their own notifications
- Notification creation SHALL require authentication

### Scalability
- The system SHALL handle 10,000+ notifications per user
- Real-time subscriptions SHALL scale to 1,000+ concurrent users
- Database indexes SHALL maintain performance at scale

### Usability
- Notifications SHALL be clear and actionable
- The UI SHALL be intuitive and require no training
- Mobile experience SHALL be equivalent to desktop

## Out of Scope

- Push notifications to mobile devices
- Email notification delivery
- SMS notification delivery
- Notification preferences/settings (future enhancement)
- Notification sound effects
- Browser push notifications
