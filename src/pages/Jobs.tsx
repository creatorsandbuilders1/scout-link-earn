import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { PostProjectWizard } from "@/components/PostProjectWizard";

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
  client?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  project_skills?: Array<{ skill_name: string }>;
  applications_count?: number;
  recommendations_count?: number;
}

export default function Jobs() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [showPostProjectWizard, setShowPostProjectWizard] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('[JOBS] Fetching projects from Supabase...');

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:profiles!client_id(id, username, avatar_url, headline),
          project_skills(skill_name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[JOBS] Error fetching projects:', error);
        toast.error('Failed to load projects', {
          description: 'Please try refreshing the page'
        });
        return;
      }

      console.log('[JOBS] Fetched projects:', data?.length || 0);
      setProjects(data || []);
    } catch (error) {
      console.error('[JOBS] Unexpected error:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">Job Board</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${projects.length} active opportunities waiting for you`}
            </p>
          </div>
          
          <Button 
            className="bg-action hover:bg-action/90 gap-2"
            onClick={() => setShowPostProjectWizard(true)}
          >
            + Post a Project
          </Button>
        </div>

        {/* Sorting */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Badge variant="secondary">All Projects</Badge>
            <Badge variant="outline">My Applications</Badge>
            <Badge variant="outline">Recommended</Badge>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="budget-high">Budget (High to Low)</SelectItem>
              <SelectItem value="activity">Most Activity</SelectItem>
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
        {!loading && projects.length === 0 && (
          <Card className="shadow-soft p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-xl font-bold">No projects yet</h3>
              <p className="text-muted-foreground">
                Be the first to post a project on the Job Board!
              </p>
              <Button 
                className="bg-action hover:bg-action/90"
                onClick={() => setShowPostProjectWizard(true)}
              >
                Post a Project
              </Button>
            </div>
          </Card>
        )}

        {/* Job Cards */}
        {!loading && projects.length > 0 && (
          <div className="space-y-4">
            {projects.map((project) => {
              const skills = project.project_skills?.map(ps => ps.skill_name) || [];
              const clientUsername = project.client?.username || `user_${project.client_id.slice(-4)}`;
              
              return (
                <Card key={project.id} className="shadow-soft hover:shadow-elevated transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h2 className="text-2xl font-bold text-primary hover:underline cursor-pointer">
                            {project.title}
                          </h2>
                          
                          {/* Client Info */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={project.client?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client_id}`} />
                              <AvatarFallback>{clientUsername[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>Posted by @{clientUsername}</span>
                          </div>
                        </div>
                        
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>

                      {/* Key Data Pills */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="gap-1">
                          💰 {project.budget_min.toLocaleString()}-{project.budget_max.toLocaleString()} STX
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          ⏱️ {project.duration}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          🎯 {project.experience_level}
                        </Badge>
                      </div>

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        {/* Social Proof */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {project.applications_count || 0} Applications
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {project.recommendations_count || 0} Recommendations
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Recommend
                          </Button>
                          <Button size="sm" className="bg-action hover:bg-action/90 gap-2" asChild>
                            <Link to={`/jobs/${project.id}`}>
                              Apply (2 Credits)
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/jobs/${project.id}`}>
                              View Details <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* Post Project Wizard */}
      <PostProjectWizard
        open={showPostProjectWizard}
        onClose={() => setShowPostProjectWizard(false)}
        onSuccess={(projectId) => {
          console.log('[JOBS] Project posted:', projectId);
          setShowPostProjectWizard(false);
          fetchProjects(); // Refresh the list
          toast.success('Project posted successfully!');
        }}
      />
    </AppLayout>
  );
}
