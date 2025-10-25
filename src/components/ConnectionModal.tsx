import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ConnectionModalProps {
  open: boolean;
  onClose: () => void;
  talentUsername: string;
  talentAvatar: string;
  talentId: string;
  scoutAvatar: string;
  finderFeePercent: number;
  isReconnect?: boolean;
}

export const ConnectionModal = ({
  open,
  onClose,
  talentUsername,
  talentAvatar,
  talentId,
  scoutAvatar,
  finderFeePercent,
  isReconnect = false,
}: ConnectionModalProps) => {
  const [copied, setCopied] = useState(false);

  // Generate referral link
  const referralLink = `${window.location.origin}/profile/${talentUsername}?scout=${talentId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success('Referral link copied!', {
        description: 'Share this link to earn commissions'
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-6 py-4">
          {/* Headline */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-primary">
              {isReconnect 
                ? `Your Scout Link for @${talentUsername}`
                : `You are about to become a Scout for @${talentUsername}!`
              }
            </h2>
            {!isReconnect && (
              <p className="text-lg text-muted-foreground">
                Start earning commissions by connecting clients with talent
              </p>
            )}
          </div>

          {/* Visual Connection Flow */}
          <div className="flex items-center justify-center gap-4 py-6">
            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-2 ring-4 ring-primary ring-offset-2">
                <AvatarImage src={scoutAvatar} />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold">You (Scout)</p>
            </div>

            <div className="flex items-center gap-2">
              <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
              <div className="text-2xl">🔗</div>
              <ArrowRight className="h-8 w-8 text-primary animate-pulse" />
            </div>

            <div className="text-center">
              <Avatar className="h-20 w-20 mx-auto mb-2 ring-4 ring-success ring-offset-2">
                <AvatarImage src={talentAvatar} />
                <AvatarFallback>{talentUsername?.[0]?.toUpperCase() || 'T'}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold">@{talentUsername}</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6 space-y-3">
            <h3 className="font-bold text-lg">How it works:</h3>
            <p className="text-muted-foreground leading-relaxed">
              By connecting, you will generate a unique referral link. Share this link with potential clients. 
              If a client hires <span className="font-semibold text-foreground">@{talentUsername}</span> through your link, 
              you will earn a <span className="font-bold text-success text-lg">{finderFeePercent}% commission</span> on 
              the project, guaranteed by the REFERYDO! smart contract.
            </p>
          </div>

          {/* Finder's Fee Highlight */}
          <div className="bg-success/10 border-2 border-success rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Your Commission</p>
            <p className="text-4xl font-black text-success">{finderFeePercent}%</p>
            <p className="text-sm text-success font-semibold mt-1">FINDER'S FEE</p>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Your Unique Referral Link:</label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopyLink}
                className="gap-2 min-w-[120px]"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link on social media, in communities, or directly with potential clients
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className="w-full h-12 text-lg font-bold bg-action hover:bg-action/90"
          >
            {isReconnect ? "Got It!" : "Got It, Let's Go! 🚀"}
          </Button>

          {!isReconnect && (
            <p className="text-center text-sm text-muted-foreground">
              You can access this link anytime from the Connected button
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
