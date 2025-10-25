import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, Link2, FileText, Loader2, Clock, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWorkspaceContracts } from "@/hooks/useWorkspaceContracts";
import { ProposalReviewModal } from "@/components/ProposalReviewModal";
import { ProjectStatus } from "@/types/contracts";
import { MyJobPostings } from "@/components/MyJobPostings";
import { MyApplications } from "@/components/MyApplications";
import { MyRecommendations } from "@/components/MyRecommendations";

export default function Workspace() {
  const [activeTab, setActiveTab] = useState("contracts");
  const { 
    contracts, 
    loading, 
    error, 
    filter, 
    setFilter, 
    refetch,
    getUserRole,
    getOtherParty 
  } = useWorkspaceContracts();
  
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);

  const handleReviewProposal = (contract: any) => {
    setSelectedContract(contract);
    setProposalModalOpen(true);
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case ProjectStatus.Created:
        return { label: 'CREATED', className: 'bg-blue-500' };
      case ProjectStatus.Funded:
        return { label: 'ACTIVE', className: 'bg-primary' };
      case ProjectStatus.Completed:
        return { label: 'COMPLETED', className: 'bg-success' };
      case ProjectStatus.Disputed:
        return { label: 'IN DISPUTE', className: 'bg-destructive' };
      case ProjectStatus.PendingAcceptance:
        return { label: 'PENDING APPROVAL', className: 'bg-amber-500' };
      case ProjectStatus.Declined:
        return { label: 'DECLINED', className: 'bg-gray-500' };
      default:
        return { label: 'UNKNOWN', className: 'bg-gray-400' };
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div>
          <h1 className="text-4xl font-black mb-2">Workspace</h1>
          <p className="text-muted-foreground mb-8">
            Manage your projects and conversations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-8">
            <TabsTrigger value="job-postings">My Jobs</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* My Job Postings (Client View) */}
          <TabsContent value="job-postings" className="space-y-6">
            <MyJobPostings />
          </TabsContent>

          {/* My Applications (Talent View) */}
          <TabsContent value="applications" className="space-y-6">
            <MyApplications />
          </TabsContent>

          {/* My Recommendations (Scout View) */}
          <TabsContent value="recommendations" className="space-y-6">
            <MyRecommendations />
          </TabsContent>

          {/* Contracts View */}
          <TabsContent value="contracts" className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <Badge 
                variant={filter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                All
              </Badge>
              <Badge 
                variant={filter === 'active' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('active')}
              >
                Active
              </Badge>
              <Badge 
                variant={filter === 'pending' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('pending')}
              >
                Pending Approval
              </Badge>
              <Badge 
                variant={filter === 'completed' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Badge>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <p className="text-destructive">{error}</p>
                  <Button onClick={refetch} variant="outline">Retry</Button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && contracts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No contracts yet</h3>
                <p className="text-muted-foreground">
                  Your contracts will appear here once you start working on projects
                </p>
              </div>
            )}

            {/* Contract Cards */}
            {!loading && !error && contracts.length > 0 && (
              <div className="space-y-4">
                {contracts.map((contract) => {
                  const userRole = getUserRole(contract);
                  const otherParty = getOtherParty(contract);
                  const statusBadge = getStatusBadge(contract.status);
                  const isPendingApproval = contract.status === ProjectStatus.PendingAcceptance && userRole === 'talent';

                  return (
                    <Card key={contract.id} className="shadow-soft hover:shadow-elevated transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <h3 className="text-xl font-bold text-primary">
                                {contract.project_title || 'Untitled Project'}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {otherParty && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={otherParty.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParty.address}`} />
                                      <AvatarFallback>{otherParty.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>
                                      {otherParty.role === 'client' ? 'Client' : 'Talent'}: @{otherParty.username}
                                    </span>
                                  </div>
                                )}
                                <span>•</span>
                                <span>You: {userRole}</span>
                              </div>
                            </div>
                            
                            <Badge className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                          </div>

                          {/* Pending Approval Banner */}
                          {isPendingApproval && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                              <div className="flex items-start gap-2">
                                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-amber-800">
                                    Pending Your Approval
                                  </p>
                                  <p className="text-sm text-amber-700">
                                    Review this proposal and decide whether to accept or decline
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Financial Info */}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-success" />
                              <span className="text-muted-foreground">Amount:</span>
                              <span className="font-bold text-success">
                                {(contract.amount_micro_stx / 1000000).toFixed(2)} STX
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Project ID:</span>
                              <span className="font-mono text-sm">
                                #{contract.project_id}
                              </span>
                            </div>
                          </div>

                          {/* Scout Acknowledgment */}
                          {contract.scout_id && contract.scout_id !== contract.client_id && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Link2 className="h-4 w-4" />
                              <span>Connected by @{contract.scout?.username || 'Scout'}</span>
                              <Badge className="bg-success/10 text-success text-xs">
                                {contract.scout_fee_percent}% commission
                              </Badge>
                            </div>
                          )}

                          {/* Project Brief Preview */}
                          {contract.project_brief && (
                            <div className="text-sm text-muted-foreground">
                              <p className="line-clamp-2">{contract.project_brief}</p>
                            </div>
                          )}

                          {/* Action Button */}
                          {isPendingApproval ? (
                            <Button 
                              className="w-full bg-action hover:bg-action/90"
                              onClick={() => handleReviewProposal(contract)}
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Review Proposal
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full"
                              asChild
                            >
                              <Link to={`/workspace/${contract.project_id}`}>
                                View Contract Details →
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Messages View */}
          <TabsContent value="messages">
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">Messaging Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Direct messaging between clients and talents will be available in a future update. 
                  For now, use the contract system to manage your projects.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Proposal Review Modal */}
        {selectedContract && (
          <ProposalReviewModal
            open={proposalModalOpen}
            onClose={() => {
              setProposalModalOpen(false);
              setSelectedContract(null);
            }}
            project={{
              id: selectedContract.project_id,
              title: selectedContract.project_title || 'Project Proposal',
              description: selectedContract.project_brief || '',
              amount: selectedContract.amount_micro_stx / 1000000,
              scoutFeePercent: selectedContract.scout_fee_percent,
              platformFeePercent: selectedContract.platform_fee_percent,
              status: selectedContract.status,
              createdAt: selectedContract.created_at,
              client: {
                address: selectedContract.client_id,
                username: selectedContract.client?.username,
                avatar: selectedContract.client?.avatar_url,
              },
              scout: selectedContract.scout_id !== selectedContract.client_id ? {
                address: selectedContract.scout_id,
                username: selectedContract.scout?.username,
                avatar: selectedContract.scout?.avatar_url,
              } : undefined,
            }}
            onStatusChange={() => {
              refetch();
            }}
          />
        )}
      </div>
    </div>
    </AppLayout>
  );
}
