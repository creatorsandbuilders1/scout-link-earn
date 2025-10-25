import { useState } from 'react';
import { useFundEscrow } from '@/hooks/useFundEscrow';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  projectId: number;
  amount: number;
  onSuccess?: () => void;
}

export const FundEscrowButton: React.FC<Props> = ({ projectId, amount, onSuccess }) => {
  const { fundEscrow, status, isLoading } = useFundEscrow();

  const handleFund = async () => {
    const result = await fundEscrow(projectId, amount);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleFund}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Funding Escrow...' : `Fund Escrow (${amount} STX)`}
      </Button>

      {status.state !== 'idle' && (
        <Alert variant={status.state === 'failed' ? 'destructive' : 'default'}>
          <div className="flex items-start gap-2">
            {status.state === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
            {status.state === 'failed' && <XCircle className="h-4 w-4" />}
            {(status.state === 'signing' || status.state === 'broadcasting' || status.state === 'pending') && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <div className="flex-1">
              <AlertDescription>
                {status.state === 'signing' && 'Waiting for signature...'}
                {status.state === 'broadcasting' && 'Broadcasting transaction...'}
                {status.state === 'pending' && 'Confirming on blockchain...'}
                {status.state === 'success' && '✅ Escrow funded successfully!'}
                {status.state === 'failed' && `❌ Error: ${status.error}`}
              </AlertDescription>
              {status.txId && (
                <p className="text-xs text-muted-foreground mt-1">
                  TX: {status.txId.slice(0, 8)}...{status.txId.slice(-6)}
                </p>
              )}
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
};
