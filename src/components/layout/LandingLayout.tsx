/**
 * =====================================================
 * LANDING LAYOUT COMPONENT
 * =====================================================
 * 
 * Layout for the public landing page.
 * Includes LandingNavigation.
 * 
 * Used only by the Landing page.
 * =====================================================
 */

import { LandingNavigation } from "./LandingNavigation";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export const LandingLayout = ({ children }: LandingLayoutProps) => {
  return (
    <>
      <LandingNavigation />
      {children}
    </>
  );
};
