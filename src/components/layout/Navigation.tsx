import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { PostProjectWizard } from "@/components/PostProjectWizard";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { stacksAddress, bitcoinAddress, disconnectWallet, isConnected } = useWallet();
  const [showPostProjectWizard, setShowPostProjectWizard] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  // Fetch total unread messages across all contracts
  useEffect(() => {
    if (!stacksAddress) {
      setUnreadMessagesCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_total_unread', { p_user_id: stacksAddress } as any);
        
        if (!error && data !== null) {
          setUnreadMessagesCount(data);
        }
      } catch (err) {
        console.error('[NAVIGATION] Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [stacksAddress]);
  
  const isActive = (path: string) => location.pathname === path;
  
  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors hover:text-primary ${
      isActive(path) ? "text-primary font-bold" : "text-muted-foreground"
    }`;

  const handleDisconnect = () => {
    disconnectWallet();
    toast.success("Wallet disconnected");
    navigate('/');
  };

  // Get wallet address and format it (prefer Stacks address for display)
  const walletAddress = stacksAddress || bitcoinAddress;
  const displayAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';
  const avatarInitials = walletAddress ? walletAddress.slice(0, 2).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Brand */}
        <Link to="/feed" className="flex items-center space-x-2">
          <img 
            src="https://odewvxxcqqqfpanvsaij.supabase.co/storage/v1/object/public/referydoplace/logoreferydo.png" 
            alt="REFERYDO!" 
            className="h-8 w-auto"
          />
        </Link>

        {/* Center: Navigation Hubs */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/feed" className={linkClass("/feed")}>
            Feed
          </Link>
          <Link to="/discover" className={linkClass("/discover")}>
            Discovery Hub
          </Link>
          <Link to="/jobs" className={linkClass("/jobs")}>
            Job Board
          </Link>
          <Link to="/workspace" className={linkClass("/workspace")}>
            Workspace
          </Link>
        </nav>

        {/* Right: Actions & Profile */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden sm:flex"
            onClick={() => setShowPostProjectWizard(true)}
          >
            + Post a Project
          </Button>
          
          {/* Notifications */}
          <NotificationBell />
          
          {/* Messages - Goes to Workspace */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => navigate('/workspace')}
            title="Workspace Messages"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadMessagesCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </Badge>
            )}
          </Button>

          {/* Profile Menu */}
          {isConnected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8 bg-primary/10">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium font-mono">
                    {displayAddress}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-mono text-muted-foreground">
                  {displayAddress}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">View Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallet">
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet / Earnings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
                  Disconnect Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Post Project Wizard */}
      <PostProjectWizard
        open={showPostProjectWizard}
        onClose={() => setShowPostProjectWizard(false)}
        onSuccess={(projectId) => {
          console.log('[NAVIGATION] Project posted:', projectId);
          navigate('/jobs');
        }}
      />
    </header>
  );
};
