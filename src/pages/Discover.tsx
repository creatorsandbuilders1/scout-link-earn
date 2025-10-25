import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConnectionModal } from "@/components/ConnectionModal";
import { TalentCard } from "@/components/TalentCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TalentProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  roles: string[];
  talent_availability: boolean;
  reputation: number;
  scout_connections_count: number;
  projects_completed_count: number;
  universal_finder_fee: number;
  posts?: Array<{
    id: string;
  }>;
}

interface ConnectionModalState {
  open: boolean;
  talentId: string;
  talentUsername: string;
  talentAvatar: string;
  finderFeePercent: number;
  isReconnect: boolean;
}

export default function Discover() {
  const { stacksAddress, isConnected } = useWallet();
  const [sortBy, setSortBy] = useState("recommended");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingTalents, setConnectingTalents] = useState<Set<string>>(new Set());
  const [connectedTalents, setConnectedTalents] = useState<Set<string>>(new Set());
  const [connectionModal, setConnectionModal] = useState<ConnectionModalState>({
    open: false,
    talentId: '',
    talentUsername: '',
    talentAvatar: '',
    finderFeePercent: 0,
    isReconnect: false,
  });

  useEffect(() => {
    fetchTalents();
    if (isConnected && stacksAddress) {
      fetchConnections();
    }
  }, [isConnected, stacksAddress]);

  const fetchTalents = async () => {
    try {
      setLoading(true);
      console.log('[DISCOVER] Fetching talents...');

      // Only show Talents who have at least one published post
      let query = supabase
        .from('profiles')
        .select(`
          *,
          posts!inner(
            id
          )
        `)
        .contains('roles', ['talent'])
        .eq('posts.status', 'published');

      if (availableOnly) {
        query = query.eq('talent_availability', true);
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'connections':
          query = query.order('scout_connections_count', { ascending: false });
          break;
        case 'reputation':
          query = query.order('reputation', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('[DISCOVER] Error fetching talents:', error);
        toast.error('Failed to load talents');
        return;
      }

      console.log('[DISCOVER] Fetched talents:', data?.length || 0);
      setTalents(data || []);
    } catch (error) {
      console.error('[DISCOVER] Unexpected error:', error);
      toast.error('Failed to load talents');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    if (!stacksAddress) return;

    try {
      const { data, error } = await supabase
        .from('scout_connections')
        .select('talent_id')
        .eq('scout_id', stacksAddress)
        .eq('status', 'active') as { data: Array<{ talent_id: string }> | null; error: any };

      if (error) {
        console.error('[DISCOVER] Error fetching connections:', error);
        return;
      }

      const connectedIds = new Set(data?.map(c => c.talent_id) || []);
      setConnectedTalents(connectedIds);
    } catch (error) {
      console.error('[DISCOVER] Error fetching connections:', error);
    }
  };

  const handleConnectClick = (talent: TalentProfile) => {
    if (!isConnected || !stacksAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (stacksAddress === talent.id) {
      toast.error('Cannot connect to yourself');
      return;
    }

    // Get universal finder's fee from profile
    const finderFee = talent.universal_finder_fee || 10; // Default 10%

    // Open connection modal
    setConnectionModal({
      open: true,
      talentId: talent.id,
      talentUsername: talent.username,
      talentAvatar: talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.id}`,
      finderFeePercent: finderFee,
      isReconnect: false,
    });
  };

  const handleConnectionModalClose = async () => {
    const { talentId, isReconnect } = connectionModal;
    
    // Close modal
    setConnectionModal(prev => ({ ...prev, open: false }));

    // If this was a new connection (not reconnect), create the connection
    if (!isReconnect && talentId && stacksAddress) {
      setConnectingTalents(prev => new Set(prev).add(talentId));

      try {
        console.log('[DISCOVER] Creating connection:', { scoutId: stacksAddress, talentId });

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-scout-connection`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              scoutId: stacksAddress,
              talentId: talentId,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to create connection');
        }

        console.log('[DISCOVER] Connection created:', result.connection);

        // Update local state
        setConnectedTalents(prev => new Set(prev).add(talentId));

        // Update talent's connection count optimistically
        setTalents(prev => prev.map(t =>
          t.id === talentId
            ? { ...t, scout_connections_count: t.scout_connections_count + 1 }
            : t
        ));
      } catch (error) {
        console.error('[DISCOVER] Error creating connection:', error);
        toast.error('Failed to create connection', {
          description: error instanceof Error ? error.message : 'Please try again'
        });
      } finally {
        setConnectingTalents(prev => {
          const next = new Set(prev);
          next.delete(talentId);
          return next;
        });
      }
    }
  };

  const handleGetReferralLink = (talent: TalentProfile) => {
    const finderFee = talent.universal_finder_fee || 10;

    setConnectionModal({
      open: true,
      talentId: talent.id,
      talentUsername: talent.username,
      talentAvatar: talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.id}`,
      finderFeePercent: finderFee,
      isReconnect: true,
    });
  };

  useEffect(() => {
    fetchTalents();
  }, [sortBy, availableOnly]);

  const filteredTalents = talents;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="sticky top-20 shadow-soft">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold mb-4">Filters</h3>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input placeholder="Search talents..." />
                </div>

                <Separator />

                {/* Skills */}
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <Input placeholder="e.g., React, Design..." />
                  <p className="text-xs text-muted-foreground">Press enter to add</p>
                </div>

                <Separator />

                {/* Budget Range */}
                <div className="space-y-3">
                  <Label>Budget Range</Label>
                  <Slider defaultValue={[1000, 5000]} max={10000} step={100} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$1,000</span>
                    <span>$5,000</span>
                  </div>
                </div>

                <Separator />

                {/* Finder's Fee */}
                <div className="space-y-3">
                  <Label className="text-success">Finder's Fee %</Label>
                  <Slider
                    defaultValue={[10]}
                    max={20}
                    step={1}
                    className="[&_[role=slider]]:bg-success"
                  />
                  <p className="text-sm text-muted-foreground">Min: 10%</p>
                </div>

                <Separator />

                {/* Special Filters */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="available">Available Only</Label>
                    <Switch
                      id="available"
                      checked={availableOnly}
                      onCheckedChange={setAvailableOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Talent Grid */}
          <main className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black mb-2">Discovery Hub</h1>
                <p className="text-muted-foreground">
                  {filteredTalents.length} talented professionals ready to work
                </p>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="connections">Most Connections</SelectItem>
                  <SelectItem value="reputation">Highest Reputation</SelectItem>
                  <SelectItem value="finder_fee">Highest Finder's Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredTalents.length === 0 && (
              <Card className="shadow-soft p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-xl font-bold">No talents found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              </Card>
            )}

            {/* Talent Cards Grid */}
            {!loading && filteredTalents.length > 0 && (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTalents.map((talent) => {
                  const isConnectedToTalent = connectedTalents.has(talent.id);
                  const isConnecting = connectingTalents.has(talent.id);
                  const isOwnProfile = stacksAddress === talent.id;
                  
                  return (
                    <TalentCard
                      key={talent.id}
                      talent={talent}
                      isConnected={isConnectedToTalent}
                      isConnecting={isConnecting}
                      isOwnProfile={isOwnProfile}
                      onConnect={() => handleConnectClick(talent)}
                      onGetReferralLink={() => handleGetReferralLink(talent)}
                      isWalletConnected={isConnected}
                    />
                  );
                })}
              </div>
            )}

            {/* Load More */}
            <div className="flex justify-center pt-8">
              <Button variant="outline" size="lg">
                Load More Talents
              </Button>
            </div>
          </main>
        </div>

        {/* Connection Modal */}
        <ConnectionModal
          open={connectionModal.open}
          onClose={handleConnectionModalClose}
          talentUsername={connectionModal.talentUsername}
          talentAvatar={connectionModal.talentAvatar}
          talentId={connectionModal.talentId}
          scoutAvatar={stacksAddress ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${stacksAddress}` : ''}
          finderFeePercent={connectionModal.finderFeePercent}
          isReconnect={connectionModal.isReconnect}
        />
      </div>
    </div>
    </AppLayout>
  );
}
