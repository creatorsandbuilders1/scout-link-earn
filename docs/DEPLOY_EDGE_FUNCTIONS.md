# Deploy Edge Functions to Supabase

## Quick Deployment Guide

### Step 1: Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Link to Your Project

```bash
supabase link --project-ref odewvxxcqqqfpanvsaij
```

### Step 4: Set Environment Variables

The Edge Functions need the service role key to write to the database:

```bash
supabase secrets set SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXd2eHhjcXFxZnBhbnZzYWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA4ODQxNiwiZXhwIjoyMDc2NjY0NDE2fQ.mnbwQLXBXk-nxNCy-5TmZfTHztOy8MmqrHjk3mnDSNw
```

### Step 5: Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy
```

Or deploy individually:

```bash
supabase functions deploy create-project
supabase functions deploy update-profile
supabase functions deploy sync-on-chain-contract
```

### Step 6: Verify Deployment

Check in Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions**
4. You should see all 3 functions listed

---

## Testing Deployed Functions

### Test create-project

```bash
curl -X POST \
  https://odewvxxcqqqfpanvsaij.supabase.co/functions/v1/create-project \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXd2eHhjcXFxZnBhbnZzYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODg0MTYsImV4cCI6MjA3NjY2NDQxNn0.WKN20Tm7XIzBhiSASeNSsz09vJ0n4mda30qv3Pu-_mc" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "title": "Test Project",
    "description": "This is a test project description that is longer than 50 characters to pass validation.",
    "budgetMin": 1000,
    "budgetMax": 2000,
    "duration": "1-2 months",
    "experienceLevel": "intermediate",
    "skills": ["React", "TypeScript"]
  }'
```

### Test update-profile

```bash
curl -X POST \
  https://odewvxxcqqqfpanvsaij.supabase.co/functions/v1/update-profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXd2eHhjcXFxZnBhbnZzYWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODg0MTYsImV4cCI6MjA3NjY2NDQxNn0.WKN20Tm7XIzBhiSASeNSsz09vJ0n4mda30qv3Pu-_mc" \
  -H "Content-Type: application/json" \
  -d '{
    "stacksAddress": "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "username": "testuser",
    "fullName": "Test User",
    "headline": "Web3 Developer",
    "roles": ["talent", "client"]
  }'
```

---

## Troubleshooting

### Error: "Command not found: supabase"
**Solution**: Install Supabase CLI globally
```bash
npm install -g supabase
```

### Error: "Not logged in"
**Solution**: Login to Supabase
```bash
supabase login
```

### Error: "Project not linked"
**Solution**: Link to your project
```bash
supabase link --project-ref odewvxxcqqqfpanvsaij
```

### Error: "Missing environment variable"
**Solution**: Set the service role key
```bash
supabase secrets set SERVICE_ROLE_KEY=your_key_here
```

### Error: "Function deployment failed"
**Solution**: Check function logs
```bash
supabase functions logs create-project
```

---

## Viewing Logs

```bash
# View logs for a specific function
supabase functions logs create-project

# Follow logs in real-time
supabase functions logs create-project --follow
```

Or view in Dashboard:
1. Go to **Edge Functions**
2. Click on function name
3. Click **Logs** tab

---

## Updating Functions

After making changes to function code:

```bash
# Redeploy the updated function
supabase functions deploy create-project
```

---

## Summary

✅ Install Supabase CLI  
✅ Login to Supabase  
✅ Link to project  
✅ Set service role key  
✅ Deploy functions  
✅ Test endpoints  
✅ Monitor logs  

Your Edge Functions are now live and ready to use! 🚀
