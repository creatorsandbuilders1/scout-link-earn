import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';

interface ApplyToProjectModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

export const ApplyToProjectModal = ({
  open,
  onClose,
  projectId,
  onSuccess,
}: ApplyToProjectModalProps) => {
  const { stacksAddress } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stacksAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[APPLY-MODAL] Submitting application...');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-application`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            projectId,
            talentId: stacksAddress,
            coverLetter: coverLetter.trim(),
            proposedBudget: proposedBudget ? parseFloat(proposedBudget) : null,
            proposedTimeline: proposedTimeline.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application');
      }

      console.log('[APPLY-MODAL] Application submitted:', data.application.id);
      
      toast.success('Application submitted successfully!', {
        description: 'The client will review your application',
      });

      // Reset form
      setCoverLetter('');
      setProposedBudget('');
      setProposedTimeline('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[APPLY-MODAL] Error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCoverLetter('');
      setProposedBudget('');
      setProposedTimeline('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Briefcase className="h-6 w-6 text-action" />
            Apply to Project
          </DialogTitle>
          <DialogDescription>
            Submit your application to this project. The client will review your proposal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter" className="text-base font-semibold">
              Cover Letter <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Explain why you're the perfect fit for this project..."
              className="min-h-[150px] resize-none"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Tell the client about your relevant experience and approach
            </p>
          </div>

          {/* Proposed Budget */}
          <div className="space-y-2">
            <Label htmlFor="proposedBudget" className="text-base font-semibold">
              Proposed Budget (STX)
            </Label>
            <Input
              id="proposedBudget"
              type="number"
              value={proposedBudget}
              onChange={(e) => setProposedBudget(e.target.value)}
              placeholder="e.g., 5000"
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Propose your budget for this project
            </p>
          </div>

          {/* Proposed Timeline */}
          <div className="space-y-2">
            <Label htmlFor="proposedTimeline" className="text-base font-semibold">
              Proposed Timeline
            </Label>
            <Input
              id="proposedTimeline"
              value={proposedTimeline}
              onChange={(e) => setProposedTimeline(e.target.value)}
              placeholder="e.g., 2-3 weeks"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Optional: How long will it take you to complete this project?
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !coverLetter.trim()}
              className="flex-1 bg-action hover:bg-action/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
