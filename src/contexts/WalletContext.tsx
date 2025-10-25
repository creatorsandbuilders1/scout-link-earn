import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface WalletContextType {
  isConnected: boolean;
  stacksAddress: string | null;
  bitcoinAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  network: 'mainnet' | 'testnet';
  profileExists: boolean;
  isCheckingProfile: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  console.log('[WALLET] Initializing WalletProvider...');
  
  const [connected, setConnected] = useState<boolean>(false);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [network] = useState<'mainnet' | 'testnet'>('testnet'); // TODO: Make configurable via env
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);
  
  console.log('[WALLET] WalletProvider initialized:', { network, isConnected: connected });

  /**
   * Create attribution record for Scout referral
   * ✅ CRITICAL: Locks in Scout commission at moment of attribution
   */
  const createAttribution = async (clientAddress: string, scoutAddress: string) => {
    try {
      // Extract talent ID from current URL if on profile page
      const pathMatch = window.location.pathname.match(/^\/profile\/(.+)$/);
      if (!pathMatch) {
        console.log('[WALLET] Not on profile page, skipping attribution');
        return;
      }

      // Get talent username from URL
      const talentUsername = pathMatch[1];

      // Fetch talent's address from database
      const { data: talentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', talentUsername)
        .maybeSingle() as { data: { id: string } | null; error: any };

      if (!talentProfile) {
        console.warn('[WALLET] Talent profile not found for attribution');
        return;
      }

      console.log('[WALLET] Creating attribution record:', {
        client: clientAddress,
        talent: talentProfile.id,
        scout: scoutAddress,
      });

      // Call create-attribution Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-attribution`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            clientId: clientAddress,
            talentId: talentProfile.id,
            scoutId: scoutAddress,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[WALLET] Failed to create attribution:', result.error);
        return;
      }

      console.log('[WALLET] Attribution created successfully:', result.attribution);
    } catch (error) {
      console.error('[WALLET] Error creating attribution:', error);
      // Don't fail profile creation if attribution fails
    }
  };

  /**
   * Check if profile exists in database, create if not
   * ✅ CRITICAL FIX: Handles Scout referral token as one-time use
   */
  const ensureProfileExists = async (address: string, scoutReferralToken: string | null): Promise<boolean> => {
    try {
      setIsCheckingProfile(true);
      console.log('[WALLET] Checking profile for:', address);
      console.log('[WALLET] Scout referral token captured:', scoutReferralToken ? 'YES' : 'NO');

      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', address)
        .maybeSingle() as { data: { id: string; username: string } | null; error: any };

      if (fetchError) {
        console.error('[WALLET] Error checking profile:', fetchError);
        return false;
      }

      if (existingProfile) {
        console.log('[WALLET] Returning user detected:', existingProfile.username);
        console.log('[WALLET] Scout referral token discarded (returning user)');
        setProfileExists(true);
        return true;
      }

      // Profile doesn't exist - create it
      console.log('[WALLET] New user detected, creating profile...');
      if (scoutReferralToken) {
        console.log('[WALLET] Attributing new user to Scout:', scoutReferralToken);
      }

      // Generate default username from address (last 8 characters)
      const defaultUsername = `user_${address.slice(-8).toLowerCase()}`;

      // Call update-profile Edge Function to create profile
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            stacksAddress: address,
            username: defaultUsername,
            roles: ['talent', 'scout', 'client'], // All roles by default
            talentAvailability: true,
            gatedConnections: false,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('[WALLET] Failed to create profile:', result.error);
        toast.error('Failed to create profile', {
          description: result.error || 'Please try again'
        });
        return false;
      }

      console.log('[WALLET] Profile created successfully:', result.profile);
      setProfileExists(true);

      // ✅ CRITICAL: Create attribution record if Scout referral exists
      if (scoutReferralToken) {
        await createAttribution(address, scoutReferralToken);
      }
      
      toast.success('Welcome to REFERYDO!', {
        description: `Your profile has been created as @${defaultUsername}`
      });

      return true;
    } catch (error) {
      console.error('[WALLET] Error ensuring profile exists:', error);
      toast.error('Profile check failed', {
        description: 'Please try reconnecting your wallet'
      });
      return false;
    } finally {
      setIsCheckingProfile(false);
    }
  };

  /**
   * Connect wallet using @stacks/connect unified interface
   * Supports both Xverse and Leather wallets
   * Automatically creates profile if it doesn't exist
   * ✅ CRITICAL FIX: Treats Scout referral data as one-time token
   */
  const connectWallet = async () => {
    try {
      console.log('[WALLET] Initiating wallet connection...');
      
      // ✅ CRITICAL FIX: Read Scout token BEFORE connecting
      const scoutReferralToken = localStorage.getItem('referydo_scout_address');
      console.log('[WALLET] Scout referral token found:', scoutReferralToken ? 'YES' : 'NO');
      
      // ✅ IMMEDIATELY clear from localStorage (one-time token)
      localStorage.removeItem('referydo_scout_address');
      localStorage.removeItem('referydo_scout_timestamp');
      console.log('[WALLET] Scout referral token cleared from storage');
      
      // Use @stacks/connect to show wallet selection and connect
      await connect({
        forceWalletSelect: true, // Always show wallet picker
        approvedProviderIds: ['LeatherProvider', 'xverse'], // Support both wallets
      });
      
      // Retrieve addresses from localStorage (managed by @stacks/connect)
      const data = getLocalStorage();
      console.log('[WALLET] Connection data:', data);
      
      if (data?.addresses) {
        // Extract Stacks address
        const stxAddr = data.addresses.stx?.[0]?.address;
        if (stxAddr) {
          setStacksAddress(stxAddr);
          console.log('[WALLET] Stacks address:', stxAddr);
          
          // ✅ Check/create profile with Scout token (used only for new users)
          await ensureProfileExists(stxAddr, scoutReferralToken);
        }
        
        // Extract Bitcoin address
        const btcAddr = data.addresses.btc?.[0]?.address;
        if (btcAddr) {
          setBitcoinAddress(btcAddr);
          console.log('[WALLET] Bitcoin address:', btcAddr);
        }
        
        setConnected(true);
        console.log('[WALLET] Wallet connected successfully');
      }
    } catch (error) {
      console.error('[WALLET] Failed to connect wallet:', error);
      throw error;
    }
  };

  /**
   * Disconnect wallet and clear all state
   * ✅ CRITICAL FIX: Also clears Scout session data to prevent contamination
   */
  const disconnectWallet = () => {
    console.log('[WALLET] Disconnecting wallet...');
    
    // Use @stacks/connect to clear connection
    disconnect();
    
    // Clear local state
    setConnected(false);
    setStacksAddress(null);
    setBitcoinAddress(null);
    setProfileExists(false);
    
    // ✅ CRITICAL FIX: Clear Scout session data
    localStorage.removeItem('referydo_scout_address');
    localStorage.removeItem('referydo_scout_timestamp');
    console.log('[WALLET] Scout session data cleared');
    
    console.log('[WALLET] Wallet disconnected');
  };

  /**
   * Restore wallet connection on page load
   * Uses @stacks/connect's localStorage to check for existing connection
   * Also checks if profile exists for restored connection
   */
  useEffect(() => {
    console.log('[WALLET] Checking for existing connection...');
    
    const restoreConnection = async () => {
      try {
        // Check if wallet is connected using @stacks/connect
        const connected = isConnected();
        
        if (connected) {
          // Retrieve stored addresses
          const data = getLocalStorage();
          console.log('[WALLET] Found existing connection:', data);
          
          if (data?.addresses) {
            // Restore Stacks address
            const stxAddr = data.addresses.stx?.[0]?.address;
            if (stxAddr) {
              setStacksAddress(stxAddr);
              
              // Check if profile exists (don't create on restore, just check)
              const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', stxAddr)
                .maybeSingle() as { data: { id: string } | null; error: any };
              
              if (profile) {
                setProfileExists(true);
              }
            }
            
            // Restore Bitcoin address
            const btcAddr = data.addresses.btc?.[0]?.address;
            if (btcAddr) {
              setBitcoinAddress(btcAddr);
            }
            
            setConnected(true);
            console.log('[WALLET] Connection restored successfully');
          }
        } else {
          console.log('[WALLET] No existing connection found');
        }
      } catch (error) {
        console.error('[WALLET] Failed to restore connection:', error);
        // Clear corrupted data
        disconnect();
        setConnected(false);
        setStacksAddress(null);
        setBitcoinAddress(null);
        setProfileExists(false);
      }
    };
    
    restoreConnection();
  }, []);

  return (
    <WalletContext.Provider value={{
      isConnected: connected,
      stacksAddress,
      bitcoinAddress,
      connectWallet,
      disconnectWallet,
      network,
      profileExists,
      isCheckingProfile,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
