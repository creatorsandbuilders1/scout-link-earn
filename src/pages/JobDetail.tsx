import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Briefcase, DollarSign, Clock, TrendingUp, Users, 
  ArrowLeft, Check, Star
} from "lucide-react";
import { mockJobs } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function JobDetail() {
  const { id } = useParams();
  const [hasApplied, setHasApplied] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  
  // Find job or use first one as fallback
  const job = mockJobs.find(j => j.id === id) || mockJobs[0];
  
  const fullDescription = `${job.description}

**Project Scope:**
We're looking for an experienced professional who can deliver high-quality work within the specified timeline. This project requires:

• Deep understanding of the Web3 ecosystem
• Strong portfolio demonstrating relevant experience
• Excellent communication skills
• Ability to work independently and meet deadlines
• Experience with modern design/development tools

**Deliverables:**
• Complete project documentation
• Source files and assets
• Ongoing support during launch phase
• Regular progress updates

**Timeline:**
The project should be completed within ${job.duration}. We're flexible with scheduling but expect consistent progress updates.

**What We Offer:**
• Competitive compensation within stated budget range
• Opportunity for long-term collaboration
• Portfolio-worthy project for your professional growth
• Direct communication with stakeholders
• Fast payment upon milestone completion`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Board
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Description */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-elevated">
              <CardHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${job.client_id}`} />
                        <AvatarFallback>C</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">@client_{job.client_id.slice(-2)}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-action text-action" />
                          <span>97% reputation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Data Pills */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${job.budget_min.toLocaleString()}-${job.budget_max.toLocaleString()}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {job.duration}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {job.level}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {job.applications_count} Applications
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">Project Description</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                    {fullDescription}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-bold text-lg mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} className="bg-primary/10 text-primary hover:bg-primary/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-bold text-lg mb-3">Client's Hiring History</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This client has completed 12 projects with a 98% satisfaction rate
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Spent:</span>
                      <span className="font-bold">$45,000+</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Projects Posted:</span>
                      <span className="font-bold">15</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Rating:</span>
                      <span className="font-bold">4.9 ⭐</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Action Panel */}
          <div className="space-y-4">
            <Card className="shadow-elevated sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Take Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Apply Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-action hover:bg-action/90 h-14 text-base"
                        disabled={hasApplied}
                      >
                        {hasApplied ? (
                          <>
                            <Check className="h-5 w-5 mr-2" />
                            Applied
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        (This will use 2 of your Proposal Credits)
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Submit Your Proposal</DialogTitle>
                      <DialogDescription>
                        Tell the client why you're the perfect fit for this project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Cover Letter</Label>
                        <Textarea 
                          placeholder="Introduce yourself and explain how you can help..."
                          className="min-h-[200px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Your Rate (USD)</Label>
                          <input
                            type="number"
                            placeholder="e.g., 5000"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Estimated Timeline</Label>
                          <input
                            type="text"
                            placeholder="e.g., 2 weeks"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-action hover:bg-action/90"
                        onClick={() => {
                          setHasApplied(true);
                          setTimeout(() => {
                            document.querySelector('[role="dialog"]')?.remove();
                          }, 100);
                        }}
                      >
                        Submit Proposal (2 Credits)
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Separator />

                {/* Recommend Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-action hover:bg-action/90 h-14 text-base"
                        disabled={hasRecommended}
                      >
                        {hasRecommended ? (
                          <>
                            <Check className="h-5 w-5 mr-2" />
                            Recommended
                          </>
                        ) : (
                          'Recommend a Talent'
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        (You have 48/50 Recommendation Signals left this month)
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recommend from Your Roster</DialogTitle>
                      <DialogDescription>
                        Select a talent to recommend for this project
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=talent${i}`} />
                            <AvatarFallback>T{i}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">Talent Name {i}</p>
                            <p className="text-sm text-muted-foreground">Relevant specialist</p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setHasRecommended(true);
                              setTimeout(() => {
                                document.querySelector('[role="dialog"]')?.remove();
                              }, 100);
                            }}
                          >
                            Recommend
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <Separator />

                {/* Project Stats */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posted:</span>
                    <span className="font-medium">{job.posted_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applications:</span>
                    <span className="font-medium">{job.applications_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommendations:</span>
                    <span className="font-medium">{job.recommendations_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
