# REFERYDO! - Decentralized Talent Marketplace 


> **Refer-You-Do**: The future of work powered by trust, transparency, and Stacks blockchain technology.

![REFERYDO! Logo](https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/logoreferydo.png)

More About Referydo, check this notion: https://harmless-oatmeal-afb.notion.site/REFERYDO-299ba1a293e8807b9e73f210bc218d1b

## 🎯 What is REFERYDO!?

REFERYDO! is a revolutionary Web3 talent (Users who offer digital services) marketplace built on the Stacks blockchain that transforms how freelancers, scouts, and clients connect and collaborate. Unlike traditional platforms that extract value, REFERYDO! distributes it fairly among all participants through smart contracts and guaranteed commissions. 

it gives everyone the opportunity to offer a service, be discovered by others, and allow other users get clients for you, all while guaranteeing their commissions—a place where incentives are aligned for everyone!

### The Problem We Solve

Traditional freelance platforms:
- Charge predatory 20%+ fees
- Own your reputation and reviews
- Provide no incentive for referrals
- Have delayed and disputed payments, Geographical limitations, payment systems that exclude some countries
- Lock you into their ecosystem

### Our Solution

REFERYDO! offers:
- **Fair 7% ecosystem fee** - Transparent, community-driven pricing
- **Sovereign on-chain reputation** - Your work history, owned by you forever- The proofs of your work are recorded in stacks on BTC.
- **Guaranteed Scout commissions** - Every referral gets paid automatically to their wallets!
- **Instant smart contract payouts** - When the work is done, the money is distributed instantly. No delays, only blockchain
- **Three-way value creation** - Clients, Talent, and Scouts all win, Each user can operate in all 3 roles

---

## 🏗️ Architecture

### Tech Stack

**Frontend**:
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Vite
- React Router
- Tanstack Query

**Backend**:
- Supabase (PostgreSQL + Edge Functions)
- Real-time subscriptions
- Row Level Security (RLS)

**Blockchain**:
- Stacks L2 (Bitcoin-secured)
- Clarity smart contracts
- Xverse & Leather wallet integration

**Storage**:
- Supabase Storage
- IPFS-ready architecture

---

## 🚀 Key Features

### 1. Wallet-First Authentication
- No emails, no passwords
- Connect with Xverse or Leather wallet
- Your wallet = Your identity

### 2. Discovery Hub
- Browse talent portfolios
- Visual-first showcase
- Skills-based filtering
- Scout connection system

### 3. Job Board
- Post projects for free (off-chain)
- Talent can apply directly
- Scouts can recommend from their roster, This is free networking in its purest form!
- Complete candidate review dashboard

### 4. Smart Contract Escrow
- Funds locked in transparent smart contract (on testnet right now)
- Automatic distribution on completion:
  - Talent receives payment
  - Scout receives commission
  - Platform receives fee
- Dispute resolution via community jury

### 5. Workspace
- Unified command center for all activities
- Job postings management (Clients)
- Application tracking (Talent)
- Recommendation tracking (Scouts)
- Active contract management
- Integrated messaging (coming soon)

### 6. Scout Economy
- Connect with talent you trust
- Earn commissions on successful referrals
- Build your reputation as a connector
- Guaranteed payouts via smart contracts

---

## 📊 User Roles 

Each user can assume these 3 roles at the same time, it is not exclusive, a talent can be a client, a scout can be a talent, and so on, this is natural and allows pure networking:

### 🎨 Talent
- Create dynamic profile with portfolio
- Set your own finder's fee (commission for scouts)
- Get discovered by scouts
- Apply to jobs
- Receive proposals
- Work with escrow protection

### 🔍 Scout
- Build your roster of trusted talent
- Recommend talent for projects
- Earn automatic commissions
- Track recommendation success
- Monetize your network

### 💼 Client
- Post projects for free
- Review applications and recommendations
- Hire with confidence
- Pay via smart contract escrow
- Approve work and release funds

---

## 🔐 Smart Contract Features

### Project Escrow Contract

**Status Flow**:
```
0: Created → 1: Funded → 2: Completed
                      ↓
                  3: Disputed (Community Resolution)
```

**Key Functions**:
- `create-project`: Initialize project with participants
- `fund-escrow`: Client locks funds in contract
- `approve-and-distribute`: Automatic payment distribution
- `submit-dispute`: Community-based resolution

**Security**:
- Immutable participant addresses
- Atomic fund distribution
- No single point of failure
- Transparent on-chain history

---

## 🎨 Design Philosophy

### Visual Identity
- **Bold Typography**: Black font-weight for impact
- **Neon Professional**: Blue (#2563EB), Green (#4ADE80), Orange (#F97316)
- **Floating Elements**: Dynamic, energetic UI
- **Glassmorphism**: Modern, premium feel

### UX Principles
- **Wallet-First**: No traditional auth friction
- **Visual Showcase**: Talent portfolios front and center
- **Economic Transparency**: All fees clearly displayed
- **Trust Signals**: Scout connections, on-chain reputation

---

## 📁 Project Structure

```
referydo/
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Wallet, Scout)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Route pages
│   ├── services/          # Business logic
│   └── types/             # TypeScript definitions
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
├── contracts/             # Clarity smart contracts
├── docs/                  # Documentation
└── public/                # Static assets
```

---


### Supabase Edge Functions

```bash
# Deploy all functions
supabase functions deploy create-project
supabase functions deploy create-application
supabase functions deploy create-recommendation
supabase functions deploy accept-project
supabase functions deploy submit-work
# ... and more
```


## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- Architecture guides
- API documentation
- Smart contract specs
- Deployment guides
- Feature implementation details


### Key Innovations

1. **Three-Way Value Creation**: First platform to guarantee Scout commissions via smart contracts
2. **Sovereign Reputation**: On-chain work history that users truly own
3. **Hybrid Architecture**: Off-chain job board + on-chain contracts for optimal UX
4. **Visual-First Discovery**: Talent showcase prioritizes portfolios over resumes
5. **Complete Workflow**: End-to-end from discovery to payment in one platform

---

## 🔗 Links

- **Live Demo**: https://www.referydo.xyz/
- **Smart Contracts**: 

https://explorer.hiro.so/txid/ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry?chain=testnet

iterations:

https://explorer.hiro.so/txid/0x0a82b710f47355688b163d2bfc3f62036ec36e112a6bdf1dd7f690509801c57e?chain=testnet

https://explorer.hiro.so/txid/0x16450f621874d88ef5ff73421c9bb1d8544005ceab46ebafaafe223584951269?chain=testnet

https://explorer.hiro.so/txid/0x7edce46fe54244a0c231cd0d0da0086fd34c2f0b0f4b00ea654fd3711d518c19?chain=testnet

https://explorer.hiro.so/txid/0x0fedd279dd252b479653c08bc945feca2082d87981589b90d35e916f503f2a8e?chain=testnet

https://explorer.hiro.so/address/ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV?chain=testnet


---

## 💡 Vision

REFERYDO! is building the future of work where:
- Your network is your net worth
- Trust is programmable
- Reputation is YOURS!
- Everyone gets paid fairly
- Blockchain enables, not complicates
---


