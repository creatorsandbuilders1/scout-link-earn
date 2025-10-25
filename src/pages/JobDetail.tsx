import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Briefcase, Users, TrendingUp, ArrowLeft, Loader2, 
  Calendar, DollarSign, Clock, Target, CheckCircle 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { ApplyToProjectModal } from "@/components/ApplyToProjectModal";
import { RecommendTalentModal } from "@/components/RecommendTalentModal";

interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  budget_type: string;
  duration: string;
  experience_level: string;
  status: string;
  created_at: string;
  applications_count: number;
  recommendations_count: number;
  client?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  project_skills?: Array<{ skill_name: string }>;
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
  };
}

export default function JobDetail() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stacksAddress } = useWallet();
  
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    if (!projectId) {
      navigate('/jobs');
      return;
    }

    try {
      setLoading(true);
      console.log('[JOB-DETAIL] Fetching project:', projectId);

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client:profiles!client_id(id, username, avatar_url, headline),
          project_skills(skill_name)
        `)
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        console.error('[JOB-DETAIL] Project error:', projectError);
        toast.error('Failed to load project');
        navigate('/jobs');
        return;
      }

      const typedProject = projectData as Project;
      setProject(typedProject);

      // Fetch applications (if user is client)
      if (stacksAddress === typedProject.client_id) {
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select(`
            *,
            talent:profiles!talent_id(id, username, avatar_url, headline)
          `)
          .eq('project_id', projectId!)
          .order('created_at', { ascending: false });

        if (!appsError && appsData) {
          setApplications(appsData);
        }
      }

      // Check if current user has applied
      if (stacksAddress) {
        const { data: userApp } = await supabase
          .from('applications')
          .select('id')
          .eq('project_id', projectId)
          .eq('talent_id', stacksAddress)
          .single();

        setHasApplied(!!userApp);
      }

      // Fetch recommendations
      const { data: recsData, error: recsError } = await supabase
        .from('recommendations')
        .select(`
          *,
          scout:profiles!scout_id(id, username, avatar_url),
          talent:profiles!talent_id(id, username, avatar_url, headline)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!recsError && recsData) {
        setRecommendations(recsData);
      }

    } catch (error) {
      console.error('[JOB-DETAIL] Unexpected error:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    setShowApplyModal(false);
    setHasApplied(true);
    fetchProjectDetails(); // Refresh to update counts
    toast.success('Application submitted successfully!');
  };

  const handleRecommendationSuccess = () => {
    setShowRecommendModal(false);
    fetchProjectDetails(); // Refresh to update counts
    toast.success('Recommendation sent successfully!');
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <p>Project not found</p>
        </div>
      </AppLayout>
    );
  }

  const skills = project.project_skills?.map(ps => ps.skill_name) || [];
  const clientUsername = project.client?.username || `user_${project.client_id.slice(-4)}`;
  const isClient = stacksAddress === project.client_id;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="mb-6 gap-2"
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Job Board
          </Button>

          {/* Main Project Card */}
          <Card className="shadow-soft mb-6">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-4xl font-black text-primary mb-4">
                    {project.title}
                  </h1>
                  
                  {/* Client Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={project.client?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client_id}`} />
                      <AvatarFallback>{clientUsername[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link to={`/profile/${project.client_id}`} className="font-semibold hover:underline">
                        @{clientUsername}
                      </Link>
                      {project.client?.headline && (
                        <p className="text-sm text-muted-foreground">{project.client.headline}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Key Info Pills */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-bold">{project.budget_min.toLocaleString()}-{project.budget_max.toLocaleString()} STX</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-bold">{project.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-action" />
                    <div>
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="font-bold capitalize">{project.experience_level}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Posted</p>
                      <p className="font-bold">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold mb-2">Project Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                {!isClient && project.status === 'open' && (
                  <div className="flex gap-4">
                    <Button 
                      className="flex-1 bg-action hover:bg-action/90 gap-2"
                      onClick={() => setShowApplyModal(true)}
                      disabled={hasApplied}
                    >
                      {hasApplied ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Already Applied
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-5 w-5" />
                          Apply Now
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setShowRecommendModal(true)}
                    >
                      <TrendingUp className="h-5 w-5" />
                      Recommend a Talent
                    </Button>
                  </div>
                )}

                {/* Social Proof */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {project.applications_count} Applications
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {project.recommendations_count} Recommendations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications (Client View Only) */}
          {isClient && applications.length > 0 && (
            <Card className="shadow-soft mb-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Applications ({applications.length})</h2>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={app.talent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.talent_id}`} />
                            <AvatarFallback>{app.talent?.username?.[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link to={`/profile/${app.talent_id}`} className="font-semibold hover:underline">
                              @{app.talent?.username || `user_${app.talent_id.slice(-4)}`}
                            </Link>
                            {app.talent?.headline && (
                              <p className="text-sm text-muted-foreground">{app.talent.headline}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={app.status === 'pending' ? 'secondary' : 'default'}>
                          {app.status}
                        </Badge>
                      </div>
                      {app.cover_letter && (
                        <p className="mt-3 text-sm text-muted-foreground">{app.cover_letter}</p>
                      )}
                      {app.proposed_budget && (
                        <p className="mt-2 text-sm font-semibold">Proposed Budget: {app.proposed_budget} STX</p>
                      )}
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Recommendations ({recommendations.length})</h2>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={rec.talent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.talent_id}`} />
                          <AvatarFallback>{rec.talent?.username?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link to={`/profile/${rec.talent_id}`} className="font-semibold hover:underline">
                              @{rec.talent?.username || `user_${rec.talent_id.slice(-4)}`}
                            </Link>
                            <span className="text-sm text-muted-foreground">
                              recommended by @{rec.scout?.username || `user_${rec.scout_id.slice(-4)}`}
                            </span>
                          </div>
                          {rec.talent?.headline && (
                            <p className="text-sm text-muted-foreground">{rec.talent.headline}</p>
                          )}
                          {rec.message && (
                            <p className="mt-2 text-sm">{rec.message}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <ApplyToProjectModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        projectId={projectId!}
        onSuccess={handleApplicationSuccess}
      />

      <RecommendTalentModal
        open={showRecommendModal}
        onClose={() => setShowRecommendModal(false)}
        projectId={projectId!}
        onSuccess={handleRecommendationSuccess}
      />
    </AppLayout>
  );
}
