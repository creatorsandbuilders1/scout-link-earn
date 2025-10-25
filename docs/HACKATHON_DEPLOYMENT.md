# REFERYDO! - Hackathon Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project set up

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - REFERYDO! Hackathon Submission"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/referydo.git

# Push
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STACKS_NETWORK` (testnet or mainnet)
   - `VITE_CONTRACT_ADDRESS`
   - `VITE_CONTRACT_NAME`
6. Click "Deploy"

### Step 3: Deploy Supabase Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy create-project
supabase functions deploy create-application
supabase functions deploy create-recommendation
supabase functions deploy accept-project
supabase functions deploy decline-project
supabase functions deploy submit-work
supabase functions deploy create-notification
supabase functions deploy send-message
supabase functions deploy update-profile
supabase functions deploy upsert-post
supabase functions deploy create-scout-connection
supabase functions deploy toggle-follow
supabase functions deploy sync-on-chain-contract
```

---

## 📊 What's Deployed

### Frontend (Vercel)
- ✅ React SPA with all pages
- ✅ Wallet integration (Xverse & Leather)
- ✅ Real-time Supabase connection
- ✅ Smart contract integration
- ✅ Responsive design
- ✅ SEO optimized

### Backend (Supabase)
- ✅ PostgreSQL database with all tables
- ✅ 13 Edge Functions deployed
- ✅ Real-time subscriptions enabled
- ✅ Row Level Security configured
- ✅ Storage buckets configured

### Smart Contracts (Stacks)
- ✅ Project Escrow V6 deployed on testnet
- ✅ Verified and tested
- ✅ Ready for mainnet

---

## 🧪 Testing the Deployment

### 1. Test Wallet Connection
- Visit your Vercel URL
- Click "Connect Wallet"
- Connect with Xverse or Leather
- Verify profile creation

### 2. Test Discovery Hub
- Browse talent profiles
- Connect with a talent (as Scout)
- Verify connection appears in database

### 3. Test Job Board
- Post a project
- Apply to a project (as Talent)
- Recommend a talent (as Scout)
- Verify all appear in Workspace

### 4. Test Contract Creation
- As Client, hire a candidate from Workspace
- Fund the escrow
- As Talent, accept the proposal
- Verify contract appears on-chain

### 5. Test Complete Flow
- Submit work (as Talent)
- Approve work (as Client)
- Verify automatic payment distribution
- Check Scout commission received

---

## 🔧 Troubleshooting

### Issue: Environment Variables Not Working
**Solution**: Make sure to redeploy after adding env vars in Vercel

### Issue: Edge Functions Failing
**Solution**: Check Supabase logs:
```bash
supabase functions logs function-name
```

### Issue: Wallet Not Connecting
**Solution**: Ensure you're on the correct network (testnet/mainnet)

### Issue: Database Queries Failing
**Solution**: Verify RLS policies are correctly set

---

## 📈 Performance Optimization

### Already Implemented
- ✅ Code splitting with React.lazy
- ✅ Image optimization
- ✅ Efficient database queries with indexes
- ✅ Caching headers in vercel.json
- ✅ Minified production build

### Future Optimizations
- [ ] CDN for static assets
- [ ] Service worker for offline support
- [ ] Database query caching
- [ ] Image lazy loading

---

## 🎯 Hackathon Checklist

- [x] Code pushed to GitHub
- [x] Deployed to Vercel
- [x] Edge Functions deployed
- [x] Smart contracts deployed
- [x] README updated
- [x] Documentation organized
- [x] All Lovable references removed
- [x] Environment variables configured
- [x] Testing completed
- [ ] Demo video recorded
- [ ] Submission form filled

---

## 📹 Demo Script

### 1. Landing Page (30 seconds)
- Show hero section with logo
- Scroll through features
- Highlight three roles (Client, Talent, Scout)

### 2. Wallet Connection (30 seconds)
- Click "Connect Wallet"
- Show Xverse/Leather modal
- Connect and create profile

### 3. Discovery Hub (1 minute)
- Browse talent profiles
- Show visual portfolios
- Connect with a talent (Scout action)

### 4. Job Board (1 minute)
- Post a project
- Show job detail page
- Apply as Talent
- Recommend as Scout

### 5. Workspace (1 minute)
- Show "My Jobs" tab with candidates
- Review applications and recommendations
- Click "Hire Now"

### 6. Smart Contract (1 minute)
- Show contract creation modal
- Fund escrow
- Show on-chain transaction
- Demonstrate automatic payment

### 7. Closing (30 seconds)
- Recap key innovations
- Show Scout commission received
- End with tagline: "REFERYDO! - The future of work"

**Total: 5 minutes**

---

## 🏆 Submission Materials

### Required Files
1. **README.md** - ✅ Complete
2. **Demo Video** - Record using script above
3. **Presentation Deck** - Highlight key features
4. **Smart Contract Code** - In `/contracts` folder
5. **Architecture Diagram** - In `/docs`

### Submission Links
- **Live Demo**: [Your Vercel URL]
- **GitHub Repo**: [Your GitHub URL]
- **Smart Contract**: [Stacks Explorer URL]
- **Video Demo**: [YouTube/Loom URL]

---

## 💡 Judging Criteria Alignment

### Innovation (25%)
- ✅ First platform with guaranteed Scout commissions
- ✅ Hybrid off-chain/on-chain architecture
- ✅ Sovereign on-chain reputation

### Technical Implementation (25%)
- ✅ Full-stack Web3 application
- ✅ Smart contracts with atomic payments
- ✅ Real-time database with RLS
- ✅ Wallet-first authentication

### User Experience (25%)
- ✅ Intuitive UI/UX
- ✅ Visual-first design
- ✅ Complete end-to-end flow
- ✅ Responsive design

### Business Viability (25%)
- ✅ Clear value proposition
- ✅ Sustainable business model
- ✅ Addresses real market need
- ✅ Scalable architecture

---

## 🎉 You're Ready!

Your REFERYDO! platform is now:
- ✅ Deployed and accessible
- ✅ Fully functional
- ✅ Production-ready
- ✅ Hackathon-ready

**Good luck with the hackathon!** 🚀

---

**Built with ❤️ for the future of work**
