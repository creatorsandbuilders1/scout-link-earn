# REFERYDO! Wallet Integration Plan
## Wallet-First Web3 Project - NO EMAIL AUTHENTICATION

## Overview
Transform REFERYDO! into a **wallet-first Web3 platform** using **Xverse wallet** (and optionally Leather wallet) for authentication and transactions. This eliminates traditional email/password authentication entirely.

---

## Phase 1: Dependencies & Setup

### 1.1 Install Required Packages
```bash
npm install sats-connect@2.0.0
```

**Key Library:**
- `sats-connect`: Official library for Xverse wallet integration
- Supports both Bitcoin and Stacks blockchain interactions
- Provides typed methods for all wallet operations

### 1.2 TypeScript Types
The `sats-connect` library provides full TypeScript support with:
- `Address` - Wallet address information
- `BitcoinNetworkType` - Mainnet/Testnet selection
- `AddressPurpose` - Payment, Ordinals, Stacks addresses
- `RpcErrorCode` - Error handling

---

## Phase 2: Core Wallet Infrastructure

### 2.1 Create Wallet Context (`src/contexts/WalletContext.tsx`)
```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { Address, BitcoinNetworkType, getAddress, AddressPurpose } from 'sats-connect';

interface WalletContextType {
  addresses: Address[];
  network: BitcoinNetworkType;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setNetwork: (network: BitcoinNetworkType) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [network, setNetwork] = useState<BitcoinNetworkType>(BitcoinNetworkType.Mainnet);

  const isConnected = addresses.length > 0;

  const connectWallet = async () => {
    getAddress({
      payload: {
        purposes: [
          AddressPurpose.Stacks,
          AddressPurpose.Payment,
          AddressPurpose.Ordinals,
        ],
        message: "REFERYDO! needs your wallet address to continue",
        network: { type: network },
      },
      onFinish: (response) => {
        setAddresses(response.addresses);
        // Store in localStorage for persistence
        localStorage.setItem('wallet_addresses', JSON.stringify(response.addresses));
      },
      onCancel: () => {
        console.log('User cancelled wallet connection');
      },
    });
  };

  const disconnectWallet = () => {
    setAddresses([]);
    localStorage.removeItem('wallet_addresses');
  };

  // Restore wallet connection on page load
  useEffect(() => {
    const stored = localStorage.getItem('wallet_addresses');
    if (stored) {
      try {
        setAddresses(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to restore wallet connection');
      }
    }
  }, []);

  return (
    <WalletContext.Provider value={{
      addresses,
      network,
      isConnected,
      connectWallet,
      disconnectWallet,
      setNetwork,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
```

### 2.2 Create useLocalStorage Hook (`src/hooks/useLocalStorage.ts`)
```typescript
import { useState } from "react";

const tryParse = <T>(val: string | null | undefined, defaultValue?: T) => {
  if (!val) return defaultValue;
  try {
    return JSON.parse(val) as T;
  } catch (e) {
    return defaultValue;
  }
};

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (newValue: T) => void] {
  const lookupKey = `referydo:${key}`;

  const [value, setValue] = useState(
    tryParse<T>(localStorage.getItem(lookupKey), defaultValue)
  );

  const set = (newValue: T | undefined) => {
    if (newValue === undefined) {
      localStorage.removeItem(lookupKey);
      setValue(defaultValue);
    } else {
      localStorage.setItem(lookupKey, JSON.stringify(newValue));
      setValue(newValue);
    }
  };

  return [value, set];
}
```

---

## Phase 3: Update Application Structure

### 3.1 Wrap App with WalletProvider (`src/main.tsx`)
```typescript
import { WalletProvider } from './contexts/WalletContext';

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
```

### 3.2 Create Protected Route Component (`src/components/ProtectedRoute.tsx`)
```typescript
import { Navigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

### 3.3 Update Routing (`src/App.tsx`)
```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
  <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
  {/* ... all other routes wrapped in ProtectedRoute */}
</Routes>
```

---

## Phase 4: Update Landing Page

### 4.1 Update Connect Wallet Button (`src/pages/Landing.tsx`)
```typescript
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const { connectWallet, isConnected } = useWallet();
  const navigate = useNavigate();

  const handleConnect = async () => {
    await connectWallet();
    // After successful connection, redirect to dashboard
    navigate('/dashboard');
  };

  // If already connected, show different button
  if (isConnected) {
    return <Navigate to="/dashboard" />;
  }

  return (
    // ... existing landing page code
    <Button onClick={handleConnect}>
      <Wallet className="mr-2 h-6 w-6" />
      CONNECT WALLET
    </Button>
  );
}
```

---

## Phase 5: Update Navigation Component

### 5.1 Update Navigation (`src/components/layout/Navigation.tsx`)
```typescript
import { useWallet } from '@/contexts/WalletContext';

export const Navigation = () => {
  const { addresses, disconnectWallet, isConnected } = useWallet();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnectWallet();
    navigate('/');
  };

  // Get primary payment address
  const paymentAddress = addresses.find(a => a.purpose === 'payment');
  const displayAddress = paymentAddress 
    ? `${paymentAddress.address.slice(0, 6)}...${paymentAddress.address.slice(-4)}`
    : '';

  return (
    <header>
      {/* ... existing nav items */}
      
      {isConnected && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{displayAddress.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {displayAddress}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile">View Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/wallet">Wallet / Earnings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
};
```

---

## Phase 6: User Profile & Identity

### 6.1 Create User Profile Hook (`src/hooks/useUserProfile.ts`)
```typescript
import { useWallet } from '@/contexts/WalletContext';
import { useLocalStorage } from './useLocalStorage';

interface UserProfile {
  walletAddress: string;
  username?: string;
  full_name?: string;
  headline?: string;
  avatar?: string;
  // ... other profile fields
}

export const useUserProfile = () => {
  const { addresses } = useWallet();
  const paymentAddress = addresses.find(a => a.purpose === 'payment')?.address || '';
  
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    `profile_${paymentAddress}`,
    { walletAddress: paymentAddress }
  );

  return { profile, setProfile };
};
```

### 6.2 Update Profile Page
Users can set their display name, avatar, etc., but authentication is always via wallet address.

---

## Phase 7: Transaction Integration

### 7.1 Create Transaction Hook (`src/hooks/useTransactions.ts`)
```typescript
import { request, RpcErrorCode } from 'sats-connect';

export const useTransactions = () => {
  const sendBTC = async (recipient: string, amount: number) => {
    const response = await request("sendTransfer", {
      recipients: [{ address: recipient, amount }],
    });

    if (response.status === "success") {
      return response.result.txid;
    } else if (response.error.code === RpcErrorCode.USER_REJECTION) {
      throw new Error('User cancelled transaction');
    } else {
      throw new Error(response.error.message);
    }
  };

  const sendSTX = async (recipient: string, amount: number) => {
    const response = await request("stx_transferStx", {
      recipient,
      amount: amount.toString(),
    });

    if (response.status === "success") {
      return response.result.txid;
    } else {
      throw new Error(response.error.message);
    }
  };

  return { sendBTC, sendSTX };
};
```

---

## Phase 8: Backend Integration (Future)

### 8.1 Wallet-Based Authentication
When you add a backend, use **wallet signature verification**:

1. **Frontend:** User signs a message with their wallet
2. **Backend:** Verifies the signature matches the wallet address
3. **Backend:** Issues JWT token tied to wallet address

```typescript
// Example: Sign message for authentication
const signAuthMessage = async () => {
  const response = await request("signMessage", {
    message: `Sign this message to authenticate with REFERYDO!\nTimestamp: ${Date.now()}`,
  });
  
  if (response.status === "success") {
    // Send signature to backend for verification
    return {
      address: response.result.address,
      signature: response.result.signature,
    };
  }
};
```

---

## Phase 9: Data Storage Strategy

### 9.1 Local Storage (Current Phase)
- Wallet addresses
- User preferences
- Profile information
- Connection state

### 9.2 Future: Decentralized Storage
- **IPFS** for user profiles and content
- **Stacks blockchain** for reputation data
- **Smart contracts** for escrow and payments

---

## Implementation Checklist

### ✅ Phase 1: Setup
- [ ] Install `sats-connect@2.0.0`
- [ ] Create TypeScript types

### ✅ Phase 2: Core Infrastructure
- [ ] Create `WalletContext`
- [ ] Create `useLocalStorage` hook
- [ ] Create `useWallet` hook

### ✅ Phase 3: Application Structure
- [ ] Wrap app with `WalletProvider`
- [ ] Create `ProtectedRoute` component
- [ ] Update routing with protection

### ✅ Phase 4: Landing Page
- [ ] Update Connect Wallet button
- [ ] Add wallet connection logic
- [ ] Add redirect after connection

### ✅ Phase 5: Navigation
- [ ] Display wallet address
- [ ] Add disconnect functionality
- [ ] Update user menu

### ✅ Phase 6: User Identity
- [ ] Create `useUserProfile` hook
- [ ] Update Profile page
- [ ] Link profile to wallet address

### ✅ Phase 7: Transactions
- [ ] Create `useTransactions` hook
- [ ] Implement BTC transfers
- [ ] Implement STX transfers
- [ ] Update Wallet page

### ✅ Phase 8: Testing
- [ ] Test wallet connection
- [ ] Test protected routes
- [ ] Test disconnect flow
- [ ] Test persistence

---

## Key Benefits

### 🔐 Security
- No passwords to manage or leak
- Cryptographic authentication
- User controls their keys

### 🚀 User Experience
- One-click authentication
- No email verification
- Instant access

### 💎 Web3 Native
- True decentralization
- Blockchain-based reputation
- Smart contract escrow

### 🌐 Future-Proof
- Ready for DeFi integration
- NFT support built-in
- Multi-chain capable

---

## Network Configuration

### Mainnet (Production)
- Bitcoin mainnet
- Stacks mainnet
- Real transactions

### Testnet (Development)
- Bitcoin testnet
- Stacks testnet
- Test transactions (no real value)

**Recommendation:** Start with Testnet for development, switch to Mainnet for production.

---

## Error Handling

### Common Scenarios
1. **User cancels connection** - Show friendly message
2. **Wallet not installed** - Prompt to install Xverse
3. **Network mismatch** - Allow network switching
4. **Transaction failure** - Clear error messages

---

## Next Steps After Implementation

1. **Smart Contracts:** Deploy escrow contracts on Stacks
2. **Reputation System:** Store reputation on-chain
3. **Payment Automation:** Automatic finder's fee distribution
4. **Dispute Resolution:** On-chain voting mechanism

---

This plan transforms REFERYDO! into a true Web3 platform where **your wallet is your identity**. No emails, no passwords, just pure blockchain-based authentication and transactions! 🚀