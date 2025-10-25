import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWallet } from './WalletContext';

/**
 * =====================================================
 * SCOUT TRACKING CONTEXT
 * =====================================================
 * 
 * Tracks Scout referral sessions for commission attribution.
 * 
 * CRITICAL SECURITY:
 * - Prevents self-referral loops (users can't be their own Scout)
 * - 30-day session duration
 * - URL parameter capture with validation
 * =====================================================
 */

interface ScoutTrackingContextValue {
  scoutAddress: string | null;
  hasActiveScoutSession: boolean;
  clearScoutSession: () => void;
}

const SCOUT_STORAGE_KEY = 'referydo_scout_address';
const SCOUT_TIMESTAMP_KEY = 'referydo_scout_timestamp';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

const ScoutTrackingContext = createContext<ScoutTrackingContextValue | null>(null);

export const ScoutTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [scoutAddress, setScoutAddress] = useState<string | null>(null);
  const { stacksAddress } = useWallet();

  // Initialize and capture Scout from URL
  useEffect(() => {
    // ✅ CRITICAL FIX: If user is logged in, clear Scout session
    // Scout sessions are ONLY for guests. Database is source of truth for logged-in users.
    if (stacksAddress) {
      if (localStorage.getItem(SCOUT_STORAGE_KEY)) {
        console.log('[SCOUT_TRACKING] User logged in, clearing Scout session');
        clearScoutSession();
      }
      setScoutAddress(null);
      return;
    }
    
    // ✅ Only guests (not logged in) can have Scout sessions
    
    // Check URL for scout parameter
    const scoutParam = searchParams.get('scout');
    
    if (scoutParam && isValidStacksAddress(scoutParam)) {
      // Valid Scout session from URL
      const now = Date.now();
      localStorage.setItem(SCOUT_STORAGE_KEY, scoutParam);
      localStorage.setItem(SCOUT_TIMESTAMP_KEY, now.toString());
      setScoutAddress(scoutParam);
      console.log('[SCOUT_TRACKING] Scout session captured for guest:', scoutParam);
      return;
    }

    // Check for existing Scout session
    const storedScout = localStorage.getItem(SCOUT_STORAGE_KEY);
    const storedTimestamp = localStorage.getItem(SCOUT_TIMESTAMP_KEY);

    if (storedScout && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp);
      const now = Date.now();
      
      // Check if session is still valid
      if (now - timestamp < SESSION_DURATION) {
        setScoutAddress(storedScout);
        console.log('[SCOUT_TRACKING] Existing Scout session restored for guest:', storedScout);
      } else {
        // Session expired, clear it
        console.log('[SCOUT_TRACKING] Scout session expired, clearing');
        clearScoutSession();
      }
    }
  }, [searchParams, stacksAddress]);

  const clearScoutSession = () => {
    localStorage.removeItem(SCOUT_STORAGE_KEY);
    localStorage.removeItem(SCOUT_TIMESTAMP_KEY);
    setScoutAddress(null);
  };

  const value = {
    scoutAddress,
    hasActiveScoutSession: scoutAddress !== null,
    clearScoutSession
  };

  return (
    <ScoutTrackingContext.Provider value={value}>
      {children}
    </ScoutTrackingContext.Provider>
  );
};

export const useScoutTracking = () => {
  const context = useContext(ScoutTrackingContext);
  if (!context) {
    throw new Error('useScoutTracking must be used within ScoutTrackingProvider');
  }
  return context;
};

// Validate Stacks address format
function isValidStacksAddress(address: string): boolean {
  // Testnet addresses start with ST, mainnet with SP
  return /^(ST|SP)[0-9A-Z]{38,41}$/.test(address);
}
