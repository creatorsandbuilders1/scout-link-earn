/**
 * =====================================================
 * APP LAYOUT COMPONENT
 * =====================================================
 * 
 * Standard layout for authenticated pages.
 * Includes Navigation and optional ScoutBanner.
 * 
 * Pages opt into this layout via composition.
 * =====================================================
 */

import { Navigation } from "./Navigation";
import { ScoutBanner } from "../ScoutBanner";

interface AppLayoutProps {
  children: React.ReactNode;
  showScoutBanner?: boolean;
}

export const AppLayout = ({ 
  children, 
  showScoutBanner = true 
}: AppLayoutProps) => {
  return (
    <>
      <Navigation />
      {showScoutBanner && (
        <div className="container mx-auto px-4 pt-4">
          <ScoutBanner />
        </div>
      )}
      {children}
    </>
  );
};
