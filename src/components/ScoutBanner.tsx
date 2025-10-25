import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const ScoutBanner: React.FC = () => {
  const { scoutAddress, hasActiveScoutSession, clearScoutSession } = useScoutTracking();
  const [dismissed, setDismissed] = useState(false);

  if (!hasActiveScoutSession || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <Alert className="mb-4 bg-primary/10 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link2 className="h-4 w-4 text-primary" />
          <div>
            <AlertDescription className="font-semibold text-primary">
              You were referred by a Scout
            </AlertDescription>
            <AlertDescription className="text-sm text-muted-foreground mt-1">
              Address: {scoutAddress?.slice(0, 8)}...{scoutAddress?.slice(-6)}
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};
