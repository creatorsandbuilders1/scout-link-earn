import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Application {
  id: string;
  project_id: string;
  cover_letter: string | null;
  proposed_budget: number | null;
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
}

export const MyApplications = () => {
  const { stacksAddress } = useWallet();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stacksAddress) {
      fetchApplications();
    }
  }, [stacksAddress]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('[MY-APPLICATIONS] Fetching applications for:', stacksAddress);

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          project:projects(
            *,
            client:profiles!client_id(id, username, avatar_url)
          )
        `)
        .eq('talent_id', stacksAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MY-APPLICATIONS] Error:', error);
        toast.error('Failed to load your applications');
        return;
      }

      console.log('[MY-APPLICATIONS] Loaded applications:', data?.length || 0);
      setApplications(data || []);
    } catch (error) {
      console.error('[MY-APPLICATIONS] Unexpected error:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">Withdrawn</Badge>;
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

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
        <p className="text-muted-foreground">
          Browse the Job Board and apply to projects that match your skills
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => {
        const project = app.project;
        if (!project) return null;

        const client = project.client;
        const clientUsername = client?.username || `user_${project.client_id.slice(-4)}`;

        return (
          <Card key={app.id} className="shadow-soft hover:shadow-elevated transition-shadow">
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
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            client?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client_id}`
                          }
                        />
                        <AvatarFallback>{clientUsername[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Client: @{clientUsername}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {/* Application Details */}
                {app.cover_letter && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {app.cover_letter}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                  {app.proposed_budget && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-success">
                        Proposed: {app.proposed_budget} STX
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
