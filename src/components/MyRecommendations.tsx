import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Recommendation {
  id: string;
  project_id: string;
  talent_id: string;
  message: string | null;
  status: string;
  created_at: string;
  project?: {
    id: string;
    title: string;
    description: string;
    budget_min: number;
    budget_max: number;
    status: string;
    client_id: string;
    client?: {
      id: string;
      username: string | null;
      avatar_url: string | null;
    };
  };
  talent?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
}

export const MyRecommendations = () => {
  const { stacksAddress } = useWallet();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stacksAddress) {
      fetchRecommendations();
    }
  }, [stacksAddress]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log('[MY-RECOMMENDATIONS] Fetching recommendations for:', stacksAddress);

      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          project:projects(
            *,
            client:profiles!client_id(id, username, avatar_url)
          ),
          talent:profiles!talent_id(id, username, avatar_url, headline)
        `)
        .eq('scout_id', stacksAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MY-RECOMMENDATIONS] Error:', error);
        toast.error('Failed to load your recommendations');
        return;
      }

      console.log('[MY-RECOMMENDATIONS] Loaded recommendations:', data?.length || 0);
      setRecommendations(data || []);
    } catch (error) {
      console.error('[MY-RECOMMENDATIONS] Unexpected error:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-success">Hired</Badge>;
      case 'rejected':
        return <Badge variant="outline">Not Selected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
        <p className="text-muted-foreground">
          Find jobs on the Job Board and recommend talent from your roster
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => {
        const project = rec.project;
        const talent = rec.talent;
        if (!project || !talent) return null;

        const client = project.client;
        const clientUsername = client?.username || `user_${project.client_id.slice(-4)}`;
        const talentUsername = talent.username || `user_${rec.talent_id.slice(-4)}`;

        return (
          <Card key={rec.id} className="shadow-soft hover:shadow-elevated transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/jobs/${project.id}`}
                      className="text-xl font-bold text-primary hover:underline"
                    >
                      {project.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              talent.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.talent_id}`
                            }
                          />
                          <AvatarFallback>{talentUsername[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>Recommended: @{talentUsername}</span>
                      </div>
                      <span>•</span>
                      <span>Client: @{clientUsername}</span>
                    </div>
                  </div>
                  {getStatusBadge(rec.status)}
                </div>

                {/* Recommendation Message */}
                {rec.message && (
                  <p className="text-sm text-muted-foreground italic">
                    "{rec.message}"
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Recommended {new Date(rec.created_at).toLocaleDateString()}</span>
                  {rec.status === 'accepted' && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-success">
                        🎉 You earned a commission!
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
