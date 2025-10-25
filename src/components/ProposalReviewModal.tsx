import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  DollarSign, 
  FileText, 
  User, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAcceptProject } from '@/hooks/useAcceptProject';
import { useDeclineProject } from '@/hooks/useDeclineProject';

interface ProposalReviewModalProps {
  open: boolean;
  onClose: () => void;
  project: {
    id: number;
    title: string;
    description: string;
    amount: number;
    scoutFeePercent: number;
    platformFeePercent: number;
    status: number;
    createdAt: string;
    client: {
      address: string;
      username?: string;
      avatar?: string;
    };
    scout?: {
      address: string;
      username?: string;
      avatar?: string;
    };
  };
  onStatusChange: () => void;
}

export function ProposalReviewModal({
  open,
  onClose,
  project,
  onStatusChange,
}: ProposalReviewModalProps) {
  const [showConfirmDecline, setShowConfirmDecline] = useState(false);
  const { acceptProject, isLoading: isAccepting } = useAcceptProject();
  const { declineProject, isLoading: isDeclining } = useDeclineProject();

  const isLoading = isAccepting || isDeclining;

  // Calculate fees
  const scoutFee = Math.round((project.amount * project.scoutFeePercent) / 100);
  const platformFee = Math.round((project.amount * project.platformFeePercent) / 100);
  const talentPayout = project.amount - scoutFee - platformFee;

  const handleAccept = async () => {
    try {
      const success = await acceptProject(project.id);
      if (success) {
        onStatusChange();
        onClose();
      }
    } catch (error) {
      console.error('[PROPOSAL_REVIEW] Accept error:', error);
    }
  };

  const handleDecline = async () => {
    try {
      const success = await declineProject(project.id);
      if (success) {
        onStatusChange();
        onClose();
      }
    } catch (error) {
      console.error('[PROPOSAL_REVIEW] Decline error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            Project Proposal Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 px-4 py-2 text-sm font-semibold">
              <Clock className="h-4 w-4 mr-2" />
              Pending Your Approval
            </Badge>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p className="text-sm text-muted-foreground">
                Received {formatDate(project.createdAt)}
              </p>
            </div>

            {/* Client Information */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Information
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={project.client.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client.address}`} 
                  />
                  <AvatarFallback>
                    {(project.client.username || project.client.address)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {project.client.username || 'Anonymous Client'}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {project.client.address.slice(0, 8)}...{project.client.address.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Scout Information (if applicable) */}
            {project.scout && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Scout Information
                </h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={project.scout.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.scout.address}`} 
                    />
                    <AvatarFallback>
                      {(project.scout.username || project.scout.address)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {project.scout.username || 'Anonymous Scout'}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {project.scout.address.slice(0, 8)}...{project.scout.address.slice(-8)}
                    </p>
                    <Badge className="bg-success/10 text-success text-xs mt-1">
                      Earns {project.scoutFeePercent}% commission
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Project Brief - MOST IMPORTANT */}
            <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" />
                Project Brief
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Project Value</span>
                  <span className="font-semibold">{project.amount} STX</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>Your Payout</span>
                  <span className="font-semibold text-success">{talentPayout} STX</span>
                </div>
                {project.scout && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Scout Fee ({project.scoutFeePercent}%)</span>
                    <span>{scoutFee} STX</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee ({project.platformFeePercent}%)</span>
                  <span>{platformFee} STX</span>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Important Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• The client's funds are already secured in escrow</li>
                <li>• If you accept, you commit to completing this project</li>
                <li>• If you decline, the client receives an automatic full refund</li>
                <li>• Payment is released when the client approves your completed work</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          {!showConfirmDecline ? (
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDecline(true)}
                disabled={isLoading}
                className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline Project
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1 bg-success hover:bg-success/90 text-white"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Project
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Decline Confirmation */
            <div className="space-y-4 pt-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold text-destructive mb-2">Confirm Decline</h4>
                <p className="text-sm text-destructive/80">
                  Are you sure you want to decline this project? The client will receive an automatic 
                  full refund of {project.amount} STX. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDecline(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDecline}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isDeclining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Confirm Decline
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
