/**
 * =====================================================
 * PROTECTED ROUTE COMPONENT
 * =====================================================
 * 
 * Ensures user is authenticated before accessing a route.
 * If not authenticated, redirects to landing page and
 * saves the original destination for return after login.
 * 
 * This enables direct linking:
 * - Scout shares /profile/panchito
 * - Client clicks link (not logged in)
 * - Client connects wallet
 * - Client is redirected to /profile/panchito (not /feed)
 * =====================================================
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected } = useWallet();
  const location = useLocation();

  if (!isConnected) {
    // Save the current location to return to after login
    console.log('[PROTECTED_ROUTE] Not authenticated, redirecting to landing. Return URL:', location.pathname);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
