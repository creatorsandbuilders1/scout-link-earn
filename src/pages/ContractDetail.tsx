import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Users, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  MessageSquare,
  FileText,
  Flag,
  Send
} from 'lucide-react';
import { useApproveAndDistribute } from '@/hooks/useApproveAndDistribute';
import { useContractMessages } from '@/hooks/useMessages';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';
import { ProjectStatus } from '@/types/contracts';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function ContractDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { stacksAddress } = useWallet();
  const [isApproving, setIsApproving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Work submission state
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [workMessage, setWorkMessage] = useState('');
  const [deliverableUrls, setDeliverableUrls] = useState<string[]>([]);

  // Chat state
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading: messagesLoading, sending, sendMessage } = useContractMessages(
    projectId ? parseInt(projectId) : null
  );

  const { approveAndDistribute, isLoading: approveLoading } = useApproveAndDistribute();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch contract data from Supabase
  useEffect(() => {
    const fetchContract = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('on_chain_contracts')
          .select(`
            *,
            client:client_id (username, avatar_url),
            talent:talent_id (username, avatar_url),
            scout:scout_id (username, avatar_url)
          `)
          .eq('project_id', parseInt(projectId))
          .single();

        if (fetchError) throw fetchError;
        setProject(data);
      } catch (err) {
        console.error('[CONTRACT_DETAIL] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [projectId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading contract details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Contract Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'This contract does not exist or you do not have access to it.'}
            </p>
            <Button asChild>
              <Link to="/workspace">Back to Workspace</Link>
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const isClient = stacksAddress === project?.client_id;
  const isTalent = stacksAddress === project?.talent_id;
  const isActive = project?.status === ProjectStatus.Funded;
  const isCompleted = project?.status === ProjectStatus.Completed;
  const workSubmitted = project?.work_submitted === true;

  // Calculate payouts
  const calculatePayouts = () => {
    if (!project) return null;
    
    const totalAmount = project.amount_micro_stx;
    const scoutPayout = (totalAmount * project.scout_fee_percent) / 100;
    const platformPayout = (totalAmount * project.platform_fee_percent) / 100;
    const talentPayout = totalAmount - scoutPayout - platformPayout;

    return {
      talentPayout,
      scoutPayout,
      platformPayout,
      total: totalAmount
    };
  };

  const payouts = calculatePayouts();

  const getStatusBadge = () => {
    switch (project.status) {
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
      case ProjectStatus.PendingClientApproval:
        return { label: 'AWAITING CLIENT APPROVAL', className: 'bg-orange-500' };
      default:
        return { label: 'UNKNOWN', className: 'bg-gray-400' };
    }
  };

  // Override status badge if work is submitted but status is still Active
  const getDisplayStatusBadge = () => {
    if (isActive && workSubmitted) {
      return { label: 'AWAITING CLIENT APPROVAL', className: 'bg-orange-500' };
    }
    return getStatusBadge();
  };
  
  const statusBadge = getDisplayStatusBadge();

  const handleApproveProject = async () => {
    if (!isClient) {
      toast.error('Only the client can approve the project');
      return;
    }

    if (!workSubmitted) {
      toast.error('Work must be submitted before you can approve');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to approve and complete this project? This will distribute all funds and cannot be undone.'
    );

    if (!confirmed) return;

    setIsApproving(true);

    try {
      const result = await approveAndDistribute(parseInt(projectId || '0'));

      if (result.success) {
        toast.success('Project completed successfully!', {
          description: 'All funds have been distributed to the talent, scout, and platform.',
        });
        
        // Redirect to workspace after completion
        setTimeout(() => {
          navigate('/workspace');
        }, 2000);
      } else {
        toast.error('Failed to complete project', {
          description: result.error || 'Please try again',
        });
      }
    } catch (error) {
      console.error('[CONTRACT_DETAIL] Approve error:', error);
      toast.error('Failed to complete project', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!isTalent) {
      toast.error('Only the talent can submit work');
      return;
    }

    if (!isActive) {
      toast.error('Project must be in active status to submit work');
      return;
    }

    if (!workMessage.trim() || workMessage.trim().length < 10) {
      toast.error('Please provide a message (at least 10 characters)');
      return;
    }

    setIsSubmittingWork(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-work`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            projectId: parseInt(projectId || '0'),
            talentId: stacksAddress,
            message: workMessage.trim(),
            deliverableUrls: deliverableUrls,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Work submitted successfully!', {
          description: 'The client will review your work and approve payment.',
        });
        
        // Refetch project data to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Failed to submit work', {
          description: result.error || 'Please try again',
        });
      }
    } catch (error) {
      console.error('[CONTRACT_DETAIL] Submit work error:', error);
      toast.error('Failed to submit work', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmittingWork(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/workspace')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspace
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-black mb-2">
                  {project.project_title || 'Project Contract'}
                </h1>
                <p className="text-muted-foreground">
                  Project ID: #{projectId}
                </p>
              </div>
              <Badge className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
            </div>

            {/* Trinity of Participants */}
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-around">
                  {/* Client */}
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={project.client?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.client_id}`} />
                      <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-semibold">Client</p>
                    <p className="text-xs text-muted-foreground">
                      @{project.client?.username || 'Unknown'}
                    </p>
                    {isClient && (
                      <Badge variant="secondary" className="mt-1 text-xs">You</Badge>
                    )}
                  </div>

                  {/* Talent */}
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={project.talent?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.talent_id}`} />
                      <AvatarFallback>T</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-semibold">Talent</p>
                    <p className="text-xs text-muted-foreground">
                      @{project.talent?.username || 'Unknown'}
                    </p>
                    {isTalent && (
                      <Badge variant="secondary" className="mt-1 text-xs">You</Badge>
                    )}
                  </div>

                  {/* Scout */}
                  {project.scout_id && project.scout_id !== project.client_id && (
                    <div className="text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-2">
                        <AvatarImage src={project.scout?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.scout_id}`} />
                        <AvatarFallback>S</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-semibold">Scout</p>
                      <p className="text-xs text-muted-foreground">
                        @{project.scout?.username || 'Unknown'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two-Column Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Description */}
              {project.project_brief && (
                <Card className="shadow-soft">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Project Brief</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {project.project_brief}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Milestone Management */}
              <Card className="shadow-soft">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Project Milestones</h2>
                  
                  {isActive && (
                    <div className="space-y-4">
                      {/* Single Milestone (Final Completion) */}
                      <div className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-success" />
                          ) : (
                            <Clock className="h-6 w-6 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">Project Completion</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Complete all work and deliver final results
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-success" />
                            <span className="font-semibold text-success">
                              {(project.amount_micro_stx / 1_000_000).toFixed(2)} STX
                            </span>
                          </div>
                        </div>
                        <div>
                          {isCompleted ? (
                            <Badge className="bg-success">Completed</Badge>
                          ) : (
                            <Badge className="bg-amber-500">In Progress</Badge>
                          )}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {isClient && (
                            <>
                              <strong>Client Instructions:</strong> Once the talent has completed all work to your satisfaction, 
                              use the "Approve & Complete Project" button in the sidebar to release payment and complete the contract.
                            </>
                          )}
                          {isTalent && (
                            <>
                              <strong>Talent Instructions:</strong> Complete all work according to the project brief. 
                              The client will review and approve the project when satisfied, releasing payment automatically.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">Project Completed!</h3>
                      <p className="text-muted-foreground">
                        All funds have been distributed successfully.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Project Info Panel */}
              <Card className="shadow-soft">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Project Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-success">
                        {(project.amount_micro_stx / 1_000_000).toFixed(2)} STX
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Payment Distribution</p>
                      {payouts && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Talent Payment:</span>
                            <span className="font-semibold">
                              {(payouts.talentPayout / 1_000_000).toFixed(2)} STX
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Scout Commission:</span>
                            <span className="font-semibold">
                              {(payouts.scoutPayout / 1_000_000).toFixed(2)} STX ({project.scout_fee_percent}%)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform Fee:</span>
                            <span className="font-semibold">
                              {(payouts.platformPayout / 1_000_000).toFixed(2)} STX ({project.platform_fee_percent}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>Created</span>
                      </div>
                      <p className="text-sm">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <Badge className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Chat */}
              <Card className="shadow-soft">
                <CardContent className="p-0">
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h3 className="font-bold">Project Chat</h3>
                      {messages.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.sender_id === stacksAddress;
                        const sender = isOwnMessage 
                          ? null 
                          : (message.sender_id === project.client_id ? project.client : project.talent);
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!isOwnMessage && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage 
                                  src={sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`} 
                                />
                                <AvatarFallback>
                                  {sender?.username?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                              {!isOwnMessage && (
                                <span className="text-xs text-muted-foreground mb-1">
                                  @{sender?.username || 'Unknown'}
                                </span>
                              )}
                              <div
                                className={`rounded-lg p-3 ${
                                  isOwnMessage
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4 bg-background">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!messageInput.trim() || sending) return;

                        try {
                          await sendMessage(messageInput);
                          setMessageInput('');
                        } catch (error) {
                          console.error('[CONTRACT_DETAIL] Error sending message:', error);
                          toast.error('Failed to send message');
                        }
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={sending || !messageInput.trim()}>
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Work Section (Talent Only - Active Status, Work Not Submitted) */}
              {isTalent && isActive && !isCompleted && !workSubmitted && (
                <Card className="shadow-elevated border-2 border-action">
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-2">Submit Final Work</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Submit your completed work to request payment from the client.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Final Message to Client *
                        </label>
                        <textarea
                          className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-action"
                          placeholder="Describe what you've completed and any important notes for the client..."
                          value={workMessage}
                          onChange={(e) => setWorkMessage(e.target.value)}
                          disabled={isSubmittingWork}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum 10 characters
                        </p>
                      </div>

                      <Button
                        className="w-full bg-action hover:bg-action/90 text-white font-bold py-6 text-lg"
                        onClick={handleSubmitWork}
                        disabled={isSubmittingWork || workMessage.trim().length < 10}
                      >
                        {isSubmittingWork ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Submit Final Work & Request Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Client Approval Section (Client Only - Work Submitted) */}
              {isClient && workSubmitted && !isCompleted && (
                <Card className="shadow-elevated border-2 border-action">
                  <CardContent className="p-6">
                    {/* Notification Banner */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800">
                            Work Submitted!
                          </p>
                          <p className="text-sm text-orange-700">
                            @{project.talent?.username || 'Talent'} has submitted the final work and is requesting payment.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Talent's Message */}
                    {project.work_submission_message && (
                      <div className="mb-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-2">Talent's Message:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {project.work_submission_message}
                        </p>
                      </div>
                    )}

                    {/* Deliverables */}
                    {project.work_deliverable_urls && project.work_deliverable_urls.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">Deliverables:</p>
                        <div className="space-y-2">
                          {project.work_deliverable_urls.map((url: string, index: number) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-primary hover:underline"
                            >
                              📎 Deliverable {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {/* Approve Button */}
                      <Button
                        className="w-full bg-action hover:bg-action/90 text-white font-bold py-6 text-lg"
                        onClick={handleApproveProject}
                        disabled={isApproving || approveLoading}
                      >
                        {isApproving || approveLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Approve & Complete Project
                          </>
                        )}
                      </Button>

                      {/* Request Changes Button */}
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Request Changes
                        <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
