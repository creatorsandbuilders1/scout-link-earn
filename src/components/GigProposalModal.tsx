import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, FileText, Info, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';
import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { useCreateProject } from '@/hooks/useCreateProject';
import { useFundEscrow } from '@/hooks/useFundEscrow';
import { CONTRACTS } from '@/config/contracts';

// Transaction step tracking
enum ProposalStep {
  Form = 'form',
  CreatingProject = 'creating',
  WaitingConfirmation = 'waiting',
  FundingEscrow = 'funding',
  Complete = 'complete',
}

interface GigProposalModalProps {
  open: boolean;
  onClose: () => void;
  talentAddress: string;
  talentUsername: string;
  talentAvatar: string;
  gigTitle: string;
  gigPrice: number;
  scoutFeePercent: number;
}

export function GigProposalModal({
  open,
  onClose,
  talentAddress,
  talentUsername,
  talentAvatar,
  gigTitle,
  gigPrice,
  scoutFeePercent,
}: GigProposalModalProps) {
  const { stacksAddress } = useWallet();
  const { hasActiveScoutSession, scoutAddress } = useScoutTracking();
  const [projectBrief, setProjectBrief] = useState('');
  const [currentStep, setCurrentStep] = useState<ProposalStep>(ProposalStep.Form);
  const [createTxId, setCreateTxId] = useState<string>('');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const { createProject } = useCreateProject();
  const { fundEscrow } = useFundEscrow();

  // Calculate fees
  const scoutFee = Math.round((gigPrice * scoutFeePercent) / 100);
  const platformFee = Math.round(gigPrice * 0.05); // 5% platform fee
  const totalAmount = gigPrice;

  const isProcessing = currentStep !== ProposalStep.Form && currentStep !== ProposalStep.Complete;

  /**
   * Helper: Poll transaction status until confirmed
   */
  const waitForTransactionConfirmation = async (txId: string): Promise<any> => {
    const network = CONTRACTS.testnet.network;
    const apiUrl = network.chainId === 1
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';

    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
        const data = await response.json();

        console.log(`[GIG_PROPOSAL] Transaction status (attempt ${attempts + 1}):`, data.tx_status);

        if (data.tx_status === 'success') {
          return data;
        } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
          throw new Error(`Transaction failed: ${data.tx_status}`);
        }

        // Still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Transaction failed')) {
          throw error;
        }
        // Network error, retry
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    throw new Error('Transaction confirmation timeout after 5 minutes');
  };

  /**
   * Helper: Extract project ID from transaction result
   */
  const extractProjectIdFromTx = async (txId: string): Promise<number> => {
    const network = CONTRACTS.testnet.network;
    const apiUrl = network.chainId === 1
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';

    const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
    const data = await response.json();

    console.log('[GIG_PROPOSAL] Transaction data:', data);

    // The result is in tx_result.repr format: "(ok u1)" for project ID 1
    if (data.tx_result?.repr) {
      const match = data.tx_result.repr.match(/\(ok u(\d+)\)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    throw new Error('Could not extract project ID from transaction result');
  };

  /**
   * Main handler: Sequential two-step transaction flow
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!projectBrief.trim()) {
      toast.error('Project brief is required');
      return;
    }

    if (projectBrief.trim().length < 50) {
      toast.error('Project brief must be at least 50 characters');
      return;
    }

    if (!stacksAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      // ============================================================
      // STEP 1: Create Project & Get Transaction ID
      // ============================================================
      setCurrentStep(ProposalStep.CreatingProject);
      setStatusMessage('Creating project on blockchain...');
      console.log('[GIG_PROPOSAL] Step 1: Creating project...');

      const result = await createProject({
        talentAddress,
        amountSTX: totalAmount,
        scoutFeePercent,
        platformFeePercent: 5,
      });

      if (!result || !result.txId) {
        throw new Error('Failed to create project - no transaction ID returned');
      }

      setCreateTxId(result.txId);
      console.log('[GIG_PROPOSAL] Project creation transaction submitted:', result.txId);

      // ============================================================
      // STEP 2: Wait for Confirmation & Extract Project ID
      // ============================================================
      setCurrentStep(ProposalStep.WaitingConfirmation);
      setStatusMessage('Waiting for blockchain confirmation... This may take a few minutes.');
      console.log('[GIG_PROPOSAL] Step 2: Waiting for confirmation...');

      await waitForTransactionConfirmation(result.txId);
      
      const extractedProjectId = await extractProjectIdFromTx(result.txId);
      setProjectId(extractedProjectId);
      
      console.log('[GIG_PROPOSAL] Project created successfully with ID:', extractedProjectId);
      setStatusMessage(`Project created successfully (ID: ${extractedProjectId})! Now funding escrow...`);

      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ============================================================
      // STEP 3: Fund the Escrow
      // ============================================================
      setCurrentStep(ProposalStep.FundingEscrow);
      setStatusMessage('Transferring funds to secure escrow... Please confirm in your wallet.');
      console.log('[GIG_PROPOSAL] Step 3: Funding escrow for project', extractedProjectId);

      const fundResult = await fundEscrow(extractedProjectId, totalAmount);
      
      if (!fundResult.success || !fundResult.txId) {
        throw new Error('Failed to fund escrow');
      }

      console.log('[GIG_PROPOSAL] Escrow funded successfully, txId:', fundResult.txId);

      // ============================================================
      // STEP 4: Store Project Brief in Database
      // ============================================================
      setStatusMessage('Finalizing proposal...');
      console.log('[GIG_PROPOSAL] Step 4: Storing project brief...');

      try {
        const syncResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-on-chain-contract`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              // Full sync data for initial creation
              projectId: extractedProjectId,
              clientId: stacksAddress,
              talentId: talentAddress,
              scoutId: hasActiveScoutSession ? scoutAddress : stacksAddress,
              amountMicroStx: totalAmount * 1_000_000,
              scoutFeePercent,
              platformFeePercent: 5,
              status: 4, // Pending_Acceptance
              createTxId: result.txId,
              fundTxId: fundResult.txId, // ✅ Add fund transaction ID
              projectTitle: gigTitle,
              projectBrief: projectBrief.trim(),
            }),
          }
        );

        if (!syncResponse.ok) {
          const errorData = await syncResponse.json();
          console.error('[GIG_PROPOSAL] Sync error:', errorData);
        } else {
          console.log('[GIG_PROPOSAL] Sync successful');
        }
      } catch (syncError) {
        console.error('[GIG_PROPOSAL] Sync error:', syncError);
        // Don't fail the whole operation for sync issues
      }

      // ============================================================
      // SUCCESS!
      // ============================================================
      setCurrentStep(ProposalStep.Complete);
      console.log('[GIG_PROPOSAL] Proposal sent successfully!');

      toast.success('Proposal sent successfully!', {
        description: `Your proposal has been sent to ${talentUsername}. They will review and respond soon.`,
      });

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        // Reset state for next use
        setCurrentStep(ProposalStep.Form);
        setCreateTxId('');
        setProjectId(null);
        setStatusMessage('');
        setProjectBrief('');
      }, 2000);

    } catch (error) {
      console.error('[GIG_PROPOSAL] Error:', error);
      
      // Reset to form state
      setCurrentStep(ProposalStep.Form);
      setStatusMessage('');
      
      toast.error('Failed to send proposal', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Send Gig Proposal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Talent Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={talentAvatar} />
              <AvatarFallback>
                {talentUsername[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{talentUsername}</h3>
              <p className="text-muted-foreground">Talent</p>
            </div>
            <Badge className="bg-success/10 text-success">
              Finder's Fee: {scoutFeePercent}%
            </Badge>
          </div>

          {/* Gig Details */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Gig Details</Label>
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold">{gigTitle}</h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {gigPrice} STX
                </span>
              </div>
            </div>
          </div>

          {/* Project Brief - MANDATORY */}
          <div className="space-y-3">
            <Label htmlFor="projectBrief" className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Project Brief *
            </Label>
            <Textarea
              id="projectBrief"
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              placeholder="Describe your project requirements, timeline, deliverables, and any specific instructions for the talent..."
              className="min-h-[120px]"
              required
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Minimum 50 characters required
              </span>
              <span className={`${projectBrief.length < 50 ? 'text-destructive' : 'text-success'}`}>
                {projectBrief.length}/50
              </span>
            </div>
          </div>

          {/* Scout Commission Banner */}
          {hasActiveScoutSession && scoutAddress && (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-primary">
                    Scout Referral Active
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You were referred by a Scout. If this project is completed, they will earn a{' '}
                    <span className="font-semibold text-success">{scoutFeePercent}%</span>{' '}
                    commission, guaranteed by REFERYDO!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Cost Breakdown</Label>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Gig Price</span>
                <span>{gigPrice} STX</span>
              </div>
              {hasActiveScoutSession && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Scout Fee ({scoutFeePercent}%)</span>
                  <span>{scoutFee} STX</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Platform Fee (5%)</span>
                <span>{platformFee} STX</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Deposit</span>
                <span>{totalAmount} STX</span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Important Notice</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Your funds will be held in secure escrow</li>
              <li>• The talent must accept your proposal before work begins</li>
              <li>• If declined, you'll receive an automatic full refund</li>
              <li>• Payment is only released when you approve completed work</li>
            </ul>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="space-y-4">
                {/* Step 1: Creating Project */}
                <div className="flex items-start gap-3">
                  {currentStep === ProposalStep.CreatingProject ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                  ) : currentStep === ProposalStep.WaitingConfirmation || 
                     currentStep === ProposalStep.FundingEscrow || 
                     currentStep === ProposalStep.Complete ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Step 1: Create Project</p>
                    <p className="text-xs text-muted-foreground">
                      {currentStep === ProposalStep.CreatingProject 
                        ? 'Submitting transaction to blockchain...'
                        : 'Project creation transaction submitted'}
                    </p>
                    {createTxId && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        TX: {createTxId.slice(0, 8)}...{createTxId.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 2: Waiting for Confirmation */}
                {(currentStep === ProposalStep.WaitingConfirmation || 
                  currentStep === ProposalStep.FundingEscrow || 
                  currentStep === ProposalStep.Complete) && (
                  <div className="flex items-start gap-3">
                    {currentStep === ProposalStep.WaitingConfirmation ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Step 2: Confirm Transaction</p>
                      <p className="text-xs text-muted-foreground">
                        {currentStep === ProposalStep.WaitingConfirmation
                          ? 'Waiting for blockchain confirmation... (this may take 2-5 minutes)'
                          : projectId 
                            ? `Project confirmed with ID: ${projectId}`
                            : 'Transaction confirmed'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Funding Escrow */}
                {(currentStep === ProposalStep.FundingEscrow || currentStep === ProposalStep.Complete) && (
                  <div className="flex items-start gap-3">
                    {currentStep === ProposalStep.FundingEscrow ? (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Step 3: Fund Escrow</p>
                      <p className="text-xs text-muted-foreground">
                        {currentStep === ProposalStep.FundingEscrow
                          ? 'Transferring funds to secure escrow... Please confirm in your wallet.'
                          : 'Funds successfully transferred to escrow'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Status Message */}
                {statusMessage && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium text-blue-800">{statusMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !projectBrief.trim() || projectBrief.length < 50}
              className="flex-1 bg-action hover:bg-action/90 text-lg font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-5 w-5 mr-2" />
                  Send Proposal & Deposit {totalAmount} STX
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
