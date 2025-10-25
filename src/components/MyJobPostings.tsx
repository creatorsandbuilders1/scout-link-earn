import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, TrendingUp, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { ProjectCreationModal } from '@/components/ProjectCreationModal';
import { Link } from 'react-router-dom';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  applications_count: number;
  recommendations_count: number;
  applications?: Application[];
  recommendations?: Recommendation[];
}

interface Application {
  id: string;
  talent_id: string;
  cover_letter: string | null;
  proposed_budget: number | null;
  proposed_timeline: string | null;
  status: string;
  created_at: string;
  talent?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
    universal_finder_fee: number;
  };
}

interface Recommendation {
  id: string;
  scout_id: string;
  talent_id: string;
  message: string | null;
  status: string;
  created_at: string;
  scout?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  talent?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
    universal_finder_fee: number;
  };
}

export const MyJobPostings = () => {
  const { stacksAddress } = useWallet();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    talentAddress: string;
    talentUsername: string;
    talentAvatar: string;
    scoutFeePercent: number;
    scoutAddress?: string;
    projectId: string;
    applicationId?: string;
    recommendationId?: string;
  } | null>(null);

  useEffect(() => {
    if (stacksAddress) {
      fetchJobPostings();
    }
  }, [stacksAddress]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      console.log('[MY-JOB-POSTINGS] Fetching jobs for client:', stacksAddress);

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          applications(
            *,
            talent:profiles!talent_id(id, username, avatar_url, headline, universal_finder_fee)
          ),
          recommendations(
            *,
            talent:profiles!talent_id(id, username, avatar_url, headline, universal_finder_fee),
            scout:profiles!scout_id(id, username, avatar_url)
          )
        `)
        .eq('client_id', stacksAddress)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MY-JOB-POSTINGS] Error:', error);
        toast.error('Failed to load your job postings');
        return;
      }

      console.log('[MY-JOB-POSTINGS] Loaded jobs:', data?.length || 0);
      setJobs(data || []);
    } catch (error) {
      console.error('[MY-JOB-POSTINGS] Unexpected error:', error);
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleHireCandidate = (
    talent: any,
    projectId: string,
    scoutAddress?: string,
    applicationId?: string,
    recommendationId?: string
  ) => {
    const username = talent.username || `user_${talent.id.slice(-4)}`;
    const avatar = talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.id}`;
    const finderFee = talent.universal_finder_fee || 10;

    setSelectedCandidate({
      talentAddress: talent.id,
      talentUsername: username,
      talentAvatar: avatar,
      scoutFeePercent: finderFee,
      scoutAddress,
      projectId,
      applicationId,
      recommendationId,
    });
    setHireModalOpen(true);
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Job Postings Yet</h3>
        <p className="text-muted-foreground">
          Post a job on the Job Board to start receiving applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        const isExpanded = expandedJob === job.id;
        const totalCandidates = (job.applications?.length || 0) + (job.recommendations?.length || 0);

        return (
          <Card key={job.id} className="shadow-soft">
            <CardContent className="p-6">
              {/* Job Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-primary mb-2">{job.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">
                        💰 {job.budget_min.toLocaleString()}-{job.budget_max.toLocaleString()} STX
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {job.applications_count || 0} Applications
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        {job.recommendations_count || 0} Recommendations
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-success">OPEN</Badge>
                </div>

                {/* Expand/Collapse Button */}
                {totalCandidates > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => toggleJobExpansion(job.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide Candidates ({totalCandidates})
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        View Candidates ({totalCandidates})
                      </>
                    )}
                  </Button>
                )}

                {/* Candidates List (Expanded) */}
                {isExpanded && (
                  <div className="space-y-6 pt-4 border-t">
                    {/* Applications */}
                    {job.applications && job.applications.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Applications ({job.applications.length})
                        </h4>
                        <div className="space-y-3">
                          {job.applications.map((app) => {
                            const talent = app.talent;
                            if (!talent) return null;
                            const username = talent.username || `user_${app.talent_id.slice(-4)}`;

                            return (
                              <Card key={app.id} className="p-4 bg-muted/30">
                                <div className="flex items-start gap-3">
                                  <Avatar>
                                    <AvatarImage
                                      src={
                                        talent.avatar_url ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.talent_id}`
                                      }
                                    />
                                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-2">
                                    <div>
                                      <Link
                                        to={`/profile/${app.talent_id}`}
                                        className="font-semibold hover:underline"
                                      >
                                        @{username}
                                      </Link>
                                      {talent.headline && (
                                        <p className="text-sm text-muted-foreground">
                                          {talent.headline}
                                        </p>
                                      )}
                                    </div>
                                    {app.cover_letter && (
                                      <p className="text-sm text-muted-foreground">
                                        {app.cover_letter}
                                      </p>
                                    )}
                                    {app.proposed_budget && (
                                      <p className="text-sm font-semibold text-success">
                                        Proposed: {app.proposed_budget} STX
                                      </p>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        disabled
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        Start Chat
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-action hover:bg-action/90 gap-2"
                                        onClick={() =>
                                          handleHireCandidate(
                                            talent,
                                            job.id,
                                            undefined,
                                            app.id,
                                            undefined
                                          )
                                        }
                                      >
                                        Hire Now
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {job.recommendations && job.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Recommendations ({job.recommendations.length})
                        </h4>
                        <div className="space-y-3">
                          {job.recommendations.map((rec) => {
                            const talent = rec.talent;
                            const scout = rec.scout;
                            if (!talent) return null;
                            const talentUsername = talent.username || `user_${rec.talent_id.slice(-4)}`;
                            const scoutUsername = scout?.username || `user_${rec.scout_id.slice(-4)}`;

                            return (
                              <Card key={rec.id} className="p-4 bg-primary/5">
                                <div className="flex items-start gap-3">
                                  <Avatar>
                                    <AvatarImage
                                      src={
                                        talent.avatar_url ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.talent_id}`
                                      }
                                    />
                                    <AvatarFallback>{talentUsername[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-2">
                                    <div>
                                      <Link
                                        to={`/profile/${rec.talent_id}`}
                                        className="font-semibold hover:underline"
                                      >
                                        @{talentUsername}
                                      </Link>
                                      <p className="text-sm text-muted-foreground">
                                        Recommended by @{scoutUsername}
                                      </p>
                                      {talent.headline && (
                                        <p className="text-sm text-muted-foreground">
                                          {talent.headline}
                                        </p>
                                      )}
                                    </div>
                                    {rec.message && (
                                      <p className="text-sm text-muted-foreground italic">
                                        "{rec.message}"
                                      </p>
                                    )}
                                    <Badge className="bg-success/10 text-success text-xs">
                                      Scout earns {talent.universal_finder_fee}% commission
                                    </Badge>
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        disabled
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                        Start Chat
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-action hover:bg-action/90 gap-2"
                                        onClick={() =>
                                          handleHireCandidate(
                                            talent,
                                            job.id,
                                            rec.scout_id,
                                            undefined,
                                            rec.id
                                          )
                                        }
                                      >
                                        Hire Now
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Hire Modal */}
      {selectedCandidate && (
        <ProjectCreationModal
          open={hireModalOpen}
          onClose={() => {
            setHireModalOpen(false);
            setSelectedCandidate(null);
          }}
          talentAddress={selectedCandidate.talentAddress}
          talentUsername={selectedCandidate.talentUsername}
          talentAvatar={selectedCandidate.talentAvatar}
          scoutFeePercent={selectedCandidate.scoutFeePercent}
        />
      )}
    </div>
  );
};
