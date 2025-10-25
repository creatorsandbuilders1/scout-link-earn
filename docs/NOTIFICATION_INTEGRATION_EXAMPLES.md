# 🔔 Notification Integration Examples

## Copy-Paste Ready Code

These are ready-to-use code snippets for integrating notifications into your existing flows.

---

## 1. Proposal Received Notification

**File:** `src/components/GigProposalModal.tsx`  
**When:** After successful proposal creation  
**Location:** After the project is created in the database

```typescript
// Add this after successful project creation
const sendProposalNotification = async () => {
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: talentAddress, // The talent receiving the proposal
          type: 'proposal_received',
          title: 'New Project Proposal',
          message: `${clientName || 'A client'} sent you a proposal for "${projectTitle}"`,
          link: `/workspace/${projectId}`,
          data: {
            project_id: projectId,
            client_address: clientAddress,
            amount: projectAmount,
            project_title: projectTitle
          }
        }),
      }
    );
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send proposal notification:', error);
    // Don't block the proposal flow if notification fails
  }
};

// Call it after project creation
await sendProposalNotification();
```

---

## 2. Proposal Accepted Notification

**File:** `src/hooks/useAcceptProject.ts`  
**When:** After talent accepts a proposal  
**Location:** After successful blockchain transaction

```typescript
// Add this after successful acceptance
const sendAcceptanceNotification = async (
  clientAddress: string,
  projectId: string,
  projectTitle: string,
  talentName: string,
  contractId: number
) => {
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: clientAddress,
          type: 'proposal_accepted',
          title: 'Proposal Accepted! 🎉',
          message: `${talentName} accepted your proposal for "${projectTitle}"`,
          link: `/workspace/${projectId}`,
          data: {
            project_id: projectId,
            talent_address: stacksAddress,
            contract_id: contractId,
            project_title: projectTitle
          }
        }),
      }
    );
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send acceptance notification:', error);
  }
};

// Call it in your success handler
await sendAcceptanceNotification(
  clientAddress,
  projectId,
  projectTitle,
  talentName,
  contractId
);
```

---

## 3. Proposal Declined Notification

**File:** `src/hooks/useDeclineProject.ts`  
**When:** After talent declines a proposal  
**Location:** After successful database update

```typescript
// Add this after successful decline
const sendDeclineNotification = async (
  clientAddress: string,
  projectId: string,
  projectTitle: string,
  talentName: string
) => {
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: clientAddress,
          type: 'proposal_declined',
          title: 'Proposal Declined',
          message: `${talentName} declined your proposal for "${projectTitle}"`,
          link: `/workspace/${projectId}`,
          data: {
            project_id: projectId,
            talent_address: stacksAddress,
            project_title: projectTitle
          }
        }),
      }
    );
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send decline notification:', error);
  }
};

// Call it in your success handler
await sendDeclineNotification(
  clientAddress,
  projectId,
  projectTitle,
  talentName
);
```

---

## 4. Work Submitted Notification

**File:** `supabase/functions/submit-work/index.ts`  
**When:** After talent submits work  
**Location:** After database update, before response

```typescript
// Add this in the Edge Function after work submission
// Get client address from project
const { data: project } = await supabase
  .from('projects')
  .select('client_id, title, talent_id')
  .eq('id', projectId)
  .single();

if (project) {
  // Get talent name
  const { data: talentProfile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', project.talent_id)
    .single();

  const talentName = talentProfile?.full_name || talentProfile?.username || 'A talent';

  // Send notification to client
  await supabase
    .from('notifications')
    .insert({
      user_id: project.client_id,
      type: 'work_submitted',
      title: 'Work Submitted for Review',
      message: `${talentName} submitted work for "${project.title}"`,
      link: `/workspace/${projectId}`,
      data: {
        project_id: projectId,
        talent_address: project.talent_id,
        project_title: project.title
      }
    });
}
```

---

## 5. Payment Received Notification (Talent)

**File:** `src/hooks/useApproveAndDistribute.ts`  
**When:** After successful payment distribution  
**Location:** After blockchain transaction confirms

```typescript
// Add this after successful payment
const sendPaymentNotifications = async (
  talentAddress: string,
  clientAddress: string,
  amount: number,
  projectId: string,
  projectTitle: string,
  txId: string
) => {
  try {
    // Notify talent
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: talentAddress,
          type: 'payment_received',
          title: 'Payment Received! 💰',
          message: `You received ${amount} STX for "${projectTitle}"`,
          link: `/wallet`,
          data: {
            project_id: projectId,
            amount: amount,
            transaction_id: txId,
            project_title: projectTitle
          }
        }),
      }
    );

    // Notify client
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: clientAddress,
          type: 'payment_sent',
          title: 'Payment Sent',
          message: `Payment of ${amount} STX sent for "${projectTitle}"`,
          link: `/workspace/${projectId}`,
          data: {
            project_id: projectId,
            amount: amount,
            transaction_id: txId,
            project_title: projectTitle
          }
        }),
      }
    );
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send payment notifications:', error);
  }
};

// Call it after successful payment
await sendPaymentNotifications(
  talentAddress,
  clientAddress,
  paymentAmount,
  projectId,
  projectTitle,
  transactionId
);
```

---

## 6. Scout Commission Notification

**File:** `supabase/functions/sync-on-chain-contract/index.ts`  
**When:** After scout commission is distributed  
**Location:** After detecting commission payment on-chain

```typescript
// Add this when detecting scout commission payment
if (scoutAddress && scoutCommission > 0) {
  // Get project details
  const { data: project } = await supabase
    .from('projects')
    .select('title, client_id, talent_id')
    .eq('id', projectId)
    .single();

  if (project) {
    // Send notification to scout
    await supabase
      .from('notifications')
      .insert({
        user_id: scoutAddress,
        type: 'scout_earning',
        title: 'Commission Earned! 🎯',
        message: `You earned ${scoutCommission} STX commission from "${project.title}"`,
        link: `/wallet`,
        data: {
          project_id: projectId,
          amount: scoutCommission,
          client_address: project.client_id,
          talent_address: project.talent_id,
          project_title: project.title
        }
      });
  }
}
```

---

## 7. Platform Announcement (Admin)

**Use Case:** Send announcement to all users or specific user

```typescript
// Example: Send announcement to a specific user
const sendAnnouncement = async (userId: string, title: string, message: string) => {
  try {
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: userId,
          type: 'announcement',
          title: title,
          message: message,
          link: null, // or link to announcement page
          data: {
            announcement_id: 'some-id',
            priority: 'high'
          }
        }),
      }
    );
  } catch (error) {
    console.error('[NOTIFICATION] Failed to send announcement:', error);
  }
};

// Example: Send to all users (would need a batch function)
const sendAnnouncementToAll = async (title: string, message: string) => {
  // Get all user IDs
  const { data: users } = await supabase
    .from('profiles')
    .select('id');

  // Send to each user
  for (const user of users || []) {
    await sendAnnouncement(user.id, title, message);
  }
};
```

---

## 🎯 Integration Checklist

Use this checklist to track your notification integrations:

- [ ] **Proposal Received** - GigProposalModal.tsx
- [ ] **Proposal Accepted** - useAcceptProject.ts
- [ ] **Proposal Declined** - useDeclineProject.ts
- [ ] **Work Submitted** - submit-work Edge Function
- [ ] **Payment Received** - useApproveAndDistribute.ts (talent)
- [ ] **Payment Sent** - useApproveAndDistribute.ts (client)
- [ ] **Scout Commission** - sync-on-chain-contract Edge Function

---

## 🧪 Testing Each Integration

After adding each notification:

1. **Trigger the action** (send proposal, accept, etc.)
2. **Check notification bell** - should show unread count
3. **Click bell** - notification should appear in dropdown
4. **Click notification** - should navigate to correct page
5. **Verify mark as read** - unread count should decrease

---

## 🐛 Common Issues

### Notification not appearing?
- Check browser console for errors
- Verify user_id is correct (Stacks address)
- Check notification was created in database
- Verify real-time subscription is active

### Wrong user receiving notification?
- Double-check user_id parameter
- Verify you're using correct address (client vs talent)

### Notification link not working?
- Check link format matches your routes
- Verify project_id or other IDs are correct

---

## 💡 Best Practices

1. **Always wrap in try-catch** - Don't let notification failures block main flow
2. **Log errors** - Use console.error for debugging
3. **Include context** - Add relevant data to the `data` field
4. **Test thoroughly** - Verify each notification type works
5. **User-friendly messages** - Make notifications clear and actionable

---

## 🚀 Next Steps

1. Pick one integration to start with (e.g., Proposal Received)
2. Add the code to the appropriate file
3. Test it end-to-end
4. Move to the next integration
5. Repeat until all are done

**Estimated time per integration:** 10-15 minutes  
**Total time for all integrations:** 1-2 hours

---

**Happy integrating! 🎉**
