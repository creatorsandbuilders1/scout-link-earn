import { useState } from 'react';
import { useCreateProject } from '@/hooks/useCreateProject';
import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, DollarSign } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  talentAddress: string;
  talentUsername: string;
  talentAvatar: string;
  scoutFeePercent: number;
}

export const ProjectCreationModal: React.FC<Props> = ({
  open,
  onClose,
  talentAddress,
  talentUsername,
  talentAvatar,
  scoutFeePercent
}) => {
  const { createProject, status, isLoading, scoutAddress } = useCreateProject();
  const { hasActiveScoutSession } = useScoutTracking();
  const [amount, setAmount] = useState('');
  
  const platformFeePercent = 5; // Fixed platform fee
  
  const calculateBreakdown = () => {
    const amountNum = parseFloat(amount) || 0;
    const scoutFee = (amountNum * scoutFeePercent) / 100;
    const platformFee = (amountNum * platformFeePercent) / 100;
    const talentPayout = amountNum - scoutFee - platformFee;
    
    return { scoutFee, platformFee, talentPayout };
  };

  const breakdown = calculateBreakdown();

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const result = await createProject({
      talentAddress,
      amountSTX: parseFloat(amount),
      scoutFeePercent,
      platformFeePercent
    });

    if (result) {
      // Success - could redirect to project page or show success message
      // For now, just close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trinity Visualization */}
          <div className="flex items-center justify-center gap-8 p-6 bg-muted/50 rounded-lg">
            {/* Client (You) */}
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold">Client</p>
              <p className="text-xs text-muted-foreground">You</p>
            </div>

            <div className="text-2xl text-muted-foreground">→</div>

            {/* Talent */}
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={talentAvatar} />
                <AvatarFallback>{talentUsername[0]}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold">Talent</p>
              <p className="text-xs text-muted-foreground">@{talentUsername}</p>
            </div>

            {hasActiveScoutSession && (
              <>
                <div className="text-2xl text-muted-foreground">←</div>
                
                {/* Scout */}
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-2 ring-2 ring-primary">
                    <AvatarFallback>
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-semibold text-primary">Scout</p>
                  <p className="text-xs text-muted-foreground">
                    {scoutAddress?.slice(0, 6)}...{scoutAddress?.slice(-4)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Project Amount (STX)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="10.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.1"
            />
          </div>

          {/* Fee Breakdown */}
          {amount && parseFloat(amount) > 0 && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Breakdown
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Talent Payout:</span>
                  <span className="font-semibold">{breakdown.talentPayout.toFixed(2)} STX</span>
                </div>
                
                {hasActiveScoutSession && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scout Commission ({scoutFeePercent}%):</span>
                    <span className="font-semibold text-primary">{breakdown.scoutFee.toFixed(2)} STX</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee ({platformFeePercent}%):</span>
                  <span className="font-semibold">{breakdown.platformFee.toFixed(2)} STX</span>
                </div>
                
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold">{amount} STX</span>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {status.state !== 'idle' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-2">Transaction Status:</p>
              <p className="text-sm text-muted-foreground">
                {status.state === 'signing' && 'Waiting for signature...'}
                {status.state === 'broadcasting' && 'Broadcasting transaction...'}
                {status.state === 'pending' && 'Confirming on blockchain...'}
                {status.state === 'success' && '✅ Project created successfully!'}
                {status.state === 'failed' && `❌ Error: ${status.error}`}
              </p>
              {status.txId && (
                <p className="text-xs text-muted-foreground mt-1">
                  TX: {status.txId.slice(0, 8)}...{status.txId.slice(-6)}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!amount || parseFloat(amount) <= 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
