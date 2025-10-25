import { useState, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface RecommendTalentModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
}

interface ConnectedTalent {
  id: string;
  talent_id: string;
  talent?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
}

export const RecommendTalentModal = ({
  open,
  onClose,
  projectId,
  onSuccess,
}: RecommendTalentModalProps) => {
  const { stacksAddress } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedTalents, setConnectedTalents] = useState<ConnectedTalent[]>([]);
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open && stacksAddress) {
      fetchConnectedTalents();
    }
  }, [open, stacksAddress]);

  const fetchConnectedTalents = async () => {
    try {
      setIsLoading(true);
      console.log('[RECOMMEND-MODAL] Fetching scout connections...');

      const { data, error } = await supabase
        .from('scout_connections')
        .select(`
          id,
          talent_id,
          talent:profiles!talent_id(id, username, avatar_url, headline)
        `)
        .eq('scout_id', stacksAddress)
        .eq('status', 'active');

      if (error) {
        console.error('[RECOMMEND-MODAL] Error fetching connections:', error);
        toast.error('Failed to load your roster');
        return;
      }

      console.log('[RECOMMEND-MODAL] Found connections:', data?.length || 0);
      setConnectedTalents(data || []);
    } catch (error) {
      console.error('[RECOMMEND-MODAL] Unexpected error:', error);
      toast.error('Failed to load your roster');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stacksAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedTalentId) {
      toast.error('Please select a talent to recommend');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[RECOMMEND-MODAL] Submitting recommendation...');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            projectId,
            scoutId: stacksAddress,
            talentId: selectedTalentId,
            message: message.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit recommendation');
      }

      console.log('[RECOMMEND-MODAL] Recommendation submitted:', data.recommendation.id);
      
      toast.success('Recommendation sent successfully!', {
        description: 'The talent and client have been notified',
      });

      // Reset form
      setSelectedTalentId(null);
      setMessage('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('[RECOMMEND-MODAL] Error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit recommendation'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedTalentId(null);
      setMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-primary" />
            Recommend a Talent
          </DialogTitle>
          <DialogDescription>
            Select a talent from your roster to recommend for this project. You'll earn a commission if they're hired!
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : connectedTalents.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg mb-2">No Connections Yet</h3>
              <p className="text-muted-foreground">
                You need to connect with talent before you can recommend them.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Visit the Discovery Hub to find and connect with talent.
              </p>
            </div>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Talent Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Select Talent <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                {connectedTalents.map((connection) => {
                  const talent = connection.talent;
                  const username = talent?.username || `user_${connection.talent_id.slice(-4)}`;
                  const isSelected = selectedTalentId === connection.talent_id;

                  return (
                    <button
                      key={connection.id}
                      type="button"
                      onClick={() => setSelectedTalentId(connection.talent_id)}
                      disabled={isSubmitting}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              talent?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${connection.talent_id}`
                            }
                          />
                          <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">@{username}</span>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          {talent?.headline && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {talent.headline}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                You have {connectedTalents.length} talent{connectedTalents.length !== 1 ? 's' : ''} in your roster
              </p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-base font-semibold">
                Recommendation Message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why do you think this talent is perfect for this project?"
                className="min-h-[100px] resize-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add a personal note to strengthen your recommendation
              </p>
            </div>

            {/* Commission Info */}
            {selectedTalentId && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-semibold text-success">Scout Commission</p>
                    <p className="text-sm text-muted-foreground">
                      If this talent is hired, you'll earn a commission guaranteed by the smart contract!
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                disabled={isSubmitting || !selectedTalentId}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Recommendation'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
