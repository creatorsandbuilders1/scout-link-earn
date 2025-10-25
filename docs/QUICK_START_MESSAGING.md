# 🚀 Quick Start: Messaging & Notifications

## ⚡ Deploy in 5 Minutes

### Step 1: Deploy Database Migration
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy/paste: supabase/migrations/20251025000001_create_messaging_and_notifications.sql
# 3. Click Run
```

### Step 2: Deploy Edge Functions
```bash
# Deploy both functions
supabase functions deploy send-message
supabase functions deploy create-notification
```

### Step 3: Deploy Frontend
```bash
# Build and deploy
npm run build
# Deploy to your hosting
```

### Step 4: Test It!
1. Visit a profile
2. Click "Send Inquiry"
3. Send a message
4. Check the notification bell
5. ✅ Done!

---

## 📁 Files Created

### Database:
- `supabase/migrations/20251025000001_create_messaging_and_notifications.sql`

### Backend:
- `supabase/functions/send-message/index.ts`
- `supabase/functions/create-notification/index.ts`

### Frontend Hooks:
- `src/hooks/useMessages.ts`
- `src/hooks/useConversations.ts`
- `src/hooks/useNotifications.ts`

### Frontend Pages:
- `src/pages/Messages.tsx`
- `src/pages/Notifications.tsx`

### Frontend Components:
- `src/components/NotificationBell.tsx`
- `src/components/NotificationDropdown.tsx`
- `src/components/NotificationItem.tsx`

### Updated Files:
- `src/components/layout/Navigation.tsx` (added NotificationBell & functional MessageSquare)
- `src/pages/Profile.tsx` (added "Send Inquiry" button)
- `src/App.tsx` (added /messages and /notifications routes)

---

## ✅ What Works Now

### Messaging:
- ✅ Real-time 1-on-1 chat
- ✅ "Send Inquiry" button on profiles
- ✅ Unread message counts
- ✅ Auto-mark as read
- ✅ Conversation list with previews

### Notifications:
- ✅ Real-time notification delivery
- ✅ Notification bell with unread count
- ✅ Dropdown with recent notifications
- ✅ Full notifications page
- ✅ Mark as read / Mark all as read
- ✅ Filter by all/unread

---

## 🔧 Add Notification Triggers

To send notifications from your existing flows, use this pattern:

```typescript
await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    user_id: recipientAddress,
    type: 'proposal_received', // or other type
    title: 'New Proposal',
    message: 'You received a new proposal',
    link: '/workspace/123',
    data: { project_id: '123' }
  })
});
```

### Available Types:
- `new_message`
- `proposal_received`
- `proposal_accepted`
- `proposal_declined`
- `work_submitted`
- `payment_received`
- `payment_sent`
- `scout_earning`
- `announcement`

---

## 🎯 Integration Points

Add these to your existing flows:

1. **GigProposalModal.tsx** - After proposal sent → notify talent
2. **useAcceptProject.ts** - After acceptance → notify client
3. **useDeclineProject.ts** - After decline → notify client
4. **submit-work Edge Function** - After work submitted → notify client
5. **useApproveAndDistribute.ts** - After payment → notify both parties
6. **sync-on-chain-contract** - After commission → notify scout

See `MESSAGING_AND_NOTIFICATIONS_COMPLETE.md` for detailed examples.

---

## 🐛 Troubleshooting

### Messages not appearing?
- Check Supabase real-time is enabled
- Verify RLS policies are active
- Check browser console for errors

### Notifications not showing?
- Verify Edge Functions are deployed
- Check notification bell is imported in Navigation
- Test with browser console open

### Unread counts wrong?
- Refresh the page
- Check database for orphaned records
- Verify RLS policies

---

## 📊 Database Tables

### conversations
- Stores 1-on-1 chats
- 2 participants per conversation
- Auto-updates timestamp

### messages
- Individual chat messages
- Links to conversation
- Tracks read/unread

### notifications
- All platform notifications
- 9 types supported
- Links to relevant pages

---

## 🎉 You're Done!

The messaging and notification system is now live. Users can:
- Chat before forming contracts
- Receive instant notifications
- Stay informed of all platform activity

Next: Add notification triggers to your existing flows for complete coverage.

---

**Need Help?** Check `MESSAGING_AND_NOTIFICATIONS_COMPLETE.md` for full documentation.
