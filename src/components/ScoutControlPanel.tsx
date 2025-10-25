import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, DollarSign, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ScoutControlPanelProps {
  talentUsername: string;
  talentId: string;
  scoutAddress: string;
}

export function ScoutControlPanel({ talentUsername, talentId, scoutAddress }: ScoutControlPanelProps) {
  const [finderFeePercent, setFinderFeePercent] = useState<number>(12);
  const [clientsReferred, setClientsReferred] = useState<number>(0);
  const [commissionsEarned, setCommissionsEarned] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Construct referral link
  const referralLink = `${window.location.origin}/profile/${talentUsername}?scout=${scoutAddress}`;

  useEffect(() => {
    fetchScoutData();
  }, [talentId, scoutAddress]);

  const fetchScoutData = async () => {
    try {
      setLoading(true);

      // Fetch Finder's Fee from talent's profile (universal fee)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('universal_finder_fee')
        .eq('id', talentId)
        .maybeSingle() as { data: { universal_finder_fee: number } | null; error: any };

      if (profileError) {
        console.error('[SCOUT_PANEL] Error fetching finder fee:', profileError);
      } else if (profile) {
        setFinderFeePercent(profile.universal_finder_fee || 10);
      }

      // Fetch performance statistics
      // TODO: Replace with actual data from projects table when available
      // For now, using placeholder values
      setClientsReferred(0);
      setCommissionsEarned(0);

    } catch (error) {
      console.error('[SCOUT_PANEL] Error fetching Scout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      toast.success('Referral link copied!', {
        description: 'Share this link to earn commission when clients hire this talent.'
      });
    }).catch(() => {
      toast.error('Failed to copy link to clipboard');
    });
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-elevated">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary">
            You are a Scout for @{talentUsername}
          </h3>
          <Badge className="bg-primary text-primary-foreground">
            Active Connection
          </Badge>
        </div>

        {/* Referral Link Tool */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm bg-background"
            />
            <Button
              onClick={copyReferralLink}
              className="bg-action hover:bg-action/90 text-white shrink-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link with potential clients to earn commission on successful hires
          </p>
        </div>

        {/* Economic Agreement */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span className="font-semibold">Current Finder's Fee:</span>
          </div>
          <span className="text-2xl font-bold text-success">
            {finderFeePercent}%
          </span>
        </div>

        {/* Performance Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Clients Referred</span>
            </div>
            <p className="text-2xl font-bold">{clientsReferred}</p>
          </div>
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-muted-foreground">Commissions Earned</span>
            </div>
            <p className="text-2xl font-bold text-success">{commissionsEarned} STX</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground text-center">
            Share your referral link to start earning commissions on every successful hire
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
