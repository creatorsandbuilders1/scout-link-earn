import { TransactionState, TransactionStatus as TxStatus } from '@/types/contracts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  status: TxStatus;
  networkType: 'testnet' | 'mainnet';
}

export const TransactionStatus: React.FC<Props> = ({ status, networkType }) => {
  const explorerUrl = networkType === 'testnet' 
    ? 'https://explorer.hiro.so/txid'
    : 'https://explorer.stacks.co/txid';

  const getStatusDisplay = () => {
    switch (status.state) {
      case TransactionState.Signing:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Waiting for signature',
          description: 'Please sign the transaction in your wallet',
          variant: 'default' as const
        };
      
      case TransactionState.Broadcasting:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Broadcasting transaction',
          description: 'Sending transaction to the network...',
          variant: 'default' as const
        };
      
      case TransactionState.Pending:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Transaction pending',
          description: 'Waiting for confirmation on the blockchain...',
          variant: 'default' as const
        };
      
      case TransactionState.Success:
        return {
          icon: <CheckCircle className="h-4 w-4 text-success" />,
          title: 'Transaction successful',
          description: 'Your transaction has been confirmed',
          variant: 'default' as const
        };
      
      case TransactionState.Failed:
        return {
          icon: <XCircle className="h-4 w-4 text-destructive" />,
          title: 'Transaction failed',
          description: status.error || 'An error occurred',
          variant: 'destructive' as const
        };
      
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  return (
    <Alert variant={display.variant}>
      <div className="flex items-start gap-3">
        {display.icon}
        <div className="flex-1">
          <AlertDescription className="font-semibold">
            {display.title}
          </AlertDescription>
          <AlertDescription className="text-sm mt-1">
            {display.description}
          </AlertDescription>
          {status.txId && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 p-0 h-auto"
              asChild
            >
              <a
                href={`${explorerUrl}/${status.txId}?chain=${networkType}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
