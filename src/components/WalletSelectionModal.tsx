import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Wallet } from "lucide-react";

interface WalletSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => Promise<void>;
}

export const WalletSelectionModal = ({
  open,
  onOpenChange,
  onConnect,
}: WalletSelectionModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
      onOpenChange(false);
    } catch (error) {
      console.error('Connection failed:', error);
      // Error is handled by the wallet context
    } finally {
      setIsConnecting(false);
    }
  };

  const wallets = [
    {
      id: 'xverse',
      name: 'Xverse Wallet',
      description: 'Bitcoin & Stacks wallet with Ordinals support',
      logo: '🟠',
      downloadUrl: 'https://www.xverse.app/',
      features: ['Bitcoin', 'Stacks', 'Ordinals', 'BRC-20'],
      recommended: true,
    },
    {
      id: 'leather',
      name: 'Leather Wallet',
      description: 'Stacks-native wallet (formerly Hiro Wallet)',
      logo: '🔷',
      downloadUrl: 'https://leather.io/install-extension',
      features: ['Stacks', 'Bitcoin', 'STX Tokens'],
      recommended: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription className="text-base">
            Choose a wallet to connect to REFERYDO!. This is a <span className="font-bold text-primary">Stacks L2</span> project on <span className="font-bold text-warning">Testnet</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Wallet Information Cards */}
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="relative border-2 rounded-lg p-6 border-gray-200"
              >
                {wallet.recommended && (
                  <div className="absolute -top-3 left-4 bg-success text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="text-5xl">{wallet.logo}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{wallet.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {wallet.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {wallet.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Install Link */}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={wallet.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Install {wallet.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Single Connect Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-action hover:bg-action/90 text-white font-bold px-8 py-6 text-lg"
              size="lg"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Click "Connect Wallet" and choose your preferred wallet from the popup
          </p>
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-bold text-sm mb-2 text-blue-900">ℹ️ Important Information</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <span className="font-semibold">Network:</span> Mainnet (Real transactions)</li>
            <li>• <span className="font-semibold">Blockchain:</span> Stacks L2 on Bitcoin</li>
            <li>• <span className="font-semibold">Security:</span> Your keys, your crypto - we never store your private keys</li>
            <li>• <span className="font-semibold">New to Web3?</span> Install a wallet extension first, then click "Connect"</li>
          </ul>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          Don't have a wallet? Click "Install" to download one. It's free and takes 2 minutes! 🚀
        </p>
      </DialogContent>
    </Dialog>
  );
};
