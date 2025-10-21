import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Check, Upload, FileText, Link2, 
  DollarSign, Calendar, AlertCircle
} from "lucide-react";
import { mockContracts, getUserById } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function ContractDetail() {
  const { id } = useParams();
  const [milestoneStatuses, setMilestoneStatuses] = useState<Record<string, string>>({});
  
  // Find contract or use first one as fallback
  const contract = mockContracts.find(c => c.id === id) || mockContracts[0];
  
  const client = getUserById(contract.client_id);
  const talent = getUserById(contract.talent_id);
  const scout = contract.scout_id ? getUserById(contract.scout_id) : null;

  const completedMilestones = contract.milestones.filter(m => 
    (milestoneStatuses[m.id] || m.status) === 'approved'
  ).length;
  const progressPercent = (completedMilestones / contract.milestones.length) * 100;

  const handleMilestoneAction = (milestoneId: string, action: 'submit' | 'approve') => {
    if (action === 'submit') {
      setMilestoneStatuses({ ...milestoneStatuses, [milestoneId]: 'submitted' });
    } else if (action === 'approve') {
      setMilestoneStatuses({ ...milestoneStatuses, [milestoneId]: 'approved' });
    }
  };

  const deliverables = [
    { id: 1, name: 'Initial_Concepts_v1.pdf', milestone: 'Initial Concepts', uploader: 'Talent', date: '2025-10-15' },
    { id: 2, name: 'Brand_Guidelines.pdf', milestone: 'Final Design System', uploader: 'Talent', date: '2025-10-18' },
    { id: 3, name: 'Logo_Files.zip', milestone: 'Final Design System', uploader: 'Talent', date: '2025-10-18' },
  ];

  const allCompleted = contract.milestones.every(m => 
    (milestoneStatuses[m.id] || m.status) === 'approved'
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/workspace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspace
          </Link>
        </Button>

        {/* Header Card */}
        <Card className="shadow-elevated mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-black text-primary mb-2">
                    {contract.project_title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={client?.avatar} />
                        <AvatarFallback>C</AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">Client:</span>
                      <Link to={`/profile/${client?.username}`} className="font-semibold text-primary hover:underline">
                        @{client?.username}
                      </Link>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={talent?.avatar} />
                        <AvatarFallback>T</AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">Talent:</span>
                      <Link to={`/profile/${talent?.username}`} className="font-semibold text-primary hover:underline">
                        @{talent?.username}
                      </Link>
                    </div>
                  </div>
                </div>
                <Badge className={
                  contract.status === 'active' ? 'bg-primary' :
                  contract.status === 'pending_funding' ? 'bg-action' :
                  contract.status === 'completed' ? 'bg-success' :
                  'bg-destructive'
                }>
                  {contract.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${contract.total_value.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">In Escrow</p>
                  <p className="text-2xl font-bold text-success">${contract.escrow_amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{completedMilestones}/{contract.milestones.length}</p>
                </div>
              </div>

              {scout && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                  <Link2 className="h-4 w-4" />
                  <span>Connected by</span>
                  <Link to={`/profile/${scout.username}`} className="font-semibold text-primary hover:underline">
                    @{scout.username}
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Final Approval Banner */}
        {allCompleted && (
          <Card className="shadow-elevated mb-6 border-l-4 border-l-action bg-action/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-action/20 rounded-full">
                    <Check className="h-6 w-6 text-action" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">All Milestones Completed!</h3>
                    <p className="text-sm text-muted-foreground">
                      Ready to finalize the project and leave a review
                    </p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-action hover:bg-action/90 h-12 px-8">
                      Complete Project & Leave Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Project</DialogTitle>
                      <DialogDescription>
                        Leave a review for @{talent?.username}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              className="text-3xl hover:scale-110 transition-transform"
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Review</label>
                        <textarea
                          className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                          placeholder="Share your experience working with this talent..."
                        />
                      </div>
                      <Button className="w-full bg-success hover:bg-success/90">
                        Submit Review & Complete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Milestone Management */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Milestone Management</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {completedMilestones} of {contract.milestones.length} completed
                  </span>
                </CardTitle>
                <Progress value={progressPercent} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.milestones.map((milestone) => {
                  const currentStatus = milestoneStatuses[milestone.id] || milestone.status;
                  
                  return (
                    <Card key={milestone.id} className={`
                      ${currentStatus === 'approved' ? 'border-success bg-success/5' : ''}
                      ${currentStatus === 'submitted' ? 'border-action bg-action/5' : ''}
                    `}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold">{milestone.title}</h4>
                              <Badge variant={
                                currentStatus === 'approved' ? 'default' :
                                currentStatus === 'submitted' ? 'secondary' :
                                'outline'
                              }>
                                {currentStatus === 'approved' && <Check className="h-3 w-3 mr-1" />}
                                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Value: <span className="font-bold text-success">${milestone.value.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {currentStatus === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Submit Work
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Milestone: {milestone.title}</DialogTitle>
                                <DialogDescription>
                                  Upload your deliverables for review
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    Click to upload files or drag and drop
                                  </p>
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={() => handleMilestoneAction(milestone.id, 'submit')}
                                >
                                  Submit for Review
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {currentStatus === 'submitted' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-action hover:bg-action/90 gap-2"
                              onClick={() => handleMilestoneAction(milestone.id, 'approve')}
                            >
                              <Check className="h-4 w-4" />
                              Review & Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              Request Changes
                            </Button>
                          </div>
                        )}

                        {currentStatus === 'approved' && (
                          <div className="flex items-center gap-2 text-success text-sm">
                            <Check className="h-4 w-4" />
                            <span className="font-medium">Funds released</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>

            {/* Deliverables */}
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Deliverables & Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deliverables.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.milestone} • Uploaded by {file.uploader} • {file.date}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{contract.status.replace('_', ' ')}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">Oct 15, 2025</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-medium">Nov 30, 2025</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/workspace?tab=messages">
                    View Messages
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  View Contract Terms
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
