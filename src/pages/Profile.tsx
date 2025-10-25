import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, Users, Briefcase, Link2, Check, ExternalLink,
  Github, Twitter, Globe, DollarSign, Calendar, Loader2, Plus, UserPlus
} from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProjectCreationModal } from "@/components/ProjectCreationModal";
import { ConnectionModal } from "@/components/ConnectionModal";
import { AppLayout } from "@/components/layout/AppLayout";
import { ScoutControlPanel } from "@/components/ScoutControlPanel";
import { PostFormModal } from "@/components/PostFormModal";

interface ProfileData {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  about: string | null;
  roles: string[];
  talent_availability: boolean;
  reputation: number;
  followers_count: number;
  following_count: number;
  scout_connections_count: number;
  projects_completed_count: number;
  universal_finder_fee: number;
}

interface Post {
  id: string;
  talent_id: string;
  type: 'portfolio' | 'gig';
  title: string;
  description: string | null;
  image_urls: string[];
  price: number | null;
  status: string;
  created_at: string;
}

export default function Profile() {
  const { username } = useParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("talent");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [connectionModal, setConnectionModal] = useState({
    open: false,
    isReconnect: false,
  });
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [rosterTalents, setRosterTalents] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { stacksAddress } = useWallet();
  
  // Fetch profile data from Supabase
  useEffect(() => {
    fetchProfile();
  }, [username, stacksAddress]);

  // Determine if viewing own profile
  const isOwnProfile = profileData?.id === stacksAddress;

  // Check relationships when viewing someone else's profile
  useEffect(() => {
    if (stacksAddress && profileData?.id && stacksAddress !== profileData.id) {
      checkRelationships();
    }
  }, [stacksAddress, profileData?.id]);

  // Fetch Scout's roster when viewing own profile
  useEffect(() => {
    if (isOwnProfile && activeTab === 'scout' && stacksAddress) {
      fetchRoster();
    }
  }, [isOwnProfile, activeTab, stacksAddress]);

  // Fetch posts when viewing talent tab
  useEffect(() => {
    if (profileData?.id && activeTab === 'talent') {
      fetchPosts();
    }
  }, [profileData?.id, activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('[PROFILE] Fetching profile:', username || stacksAddress);

      let query = supabase
        .from('profiles')
        .select('*');

      if (username) {
        // Viewing someone else's profile by username
        query = query.eq('username', username);
      } else if (stacksAddress) {
        // Viewing own profile by address
        query = query.eq('id', stacksAddress);
      } else {
        // No username or address - can't load profile
        setLoading(false);
        return;
      }

      const { data, error } = await query.single() as { data: ProfileData | null; error: any };

      if (error) {
        console.error('[PROFILE] Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          toast.error('Profile not found');
        } else {
          toast.error('Failed to load profile');
        }
        setLoading(false);
        return;
      }

      if (!data) {
        toast.error('Profile not found');
        setLoading(false);
        return;
      }

      console.log('[PROFILE] Profile loaded:', data);
      setProfileData(data);
      
      // Set active tab based on user's roles
      if (data.roles && data.roles.length > 0) {
        setActiveTab(data.roles[0]);
      }
    } catch (error) {
      console.error('[PROFILE] Unexpected error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * =====================================================
   * FETCH SCOUT'S ROSTER
   * =====================================================
   * Fetches all talents that the current Scout is connected with
   * =====================================================
   */
  const fetchRoster = async () => {
    if (!stacksAddress) return;

    try {
      setRosterLoading(true);
      console.log('[PROFILE] Fetching Scout roster for:', stacksAddress);

      // Query scout_connections to get all talents this Scout is connected with
      const { data: connections, error } = await supabase
        .from('scout_connections')
        .select(`
          id,
          talent_id,
          created_at,
          profiles:talent_id (
            id,
            username,
            full_name,
            avatar_url,
            headline
          )
        `)
        .eq('scout_id', stacksAddress)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PROFILE] Error fetching roster:', error);
        return;
      }

      console.log('[PROFILE] Roster loaded:', connections?.length || 0, 'talents');
      setRosterTalents(connections || []);
    } catch (error) {
      console.error('[PROFILE] Unexpected error fetching roster:', error);
    } finally {
      setRosterLoading(false);
    }
  };

  /**
   * =====================================================
   * FETCH POSTS (GALLERY)
   * =====================================================
   * Fetches all posts (portfolio + gigs) for the current profile
   * =====================================================
   */
  const fetchPosts = async () => {
    if (!profileData?.id) return;

    try {
      setPostsLoading(true);
      console.log('[PROFILE] Fetching posts for:', profileData.id);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('talent_id', profileData.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PROFILE] Error fetching posts:', error);
        return;
      }

      console.log('[PROFILE] Posts loaded:', data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error('[PROFILE] Unexpected error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };



  /**
   * =====================================================
   * POST MANAGEMENT
   * =====================================================
   */
  const handleCreatePost = () => {
    setSelectedPost(null);
    setPostModalOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setPostModalOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('[PROFILE] Error deleting post:', error);
        toast.error('Failed to delete post');
        return;
      }

      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      console.error('[PROFILE] Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  /**
   * =====================================================
   * COPY REFERRAL LINK
   * =====================================================
   * Copies the Scout's unique referral link for a specific talent
   * =====================================================
   */
  const copyReferralLink = (talentUsername: string) => {
    if (!stacksAddress) {
      toast.error('Wallet not connected');
      return;
    }

    const referralUrl = `${window.location.origin}/profile/${talentUsername}?scout=${stacksAddress}`;
    
    navigator.clipboard.writeText(referralUrl).then(() => {
      toast.success('Referral link copied!', {
        description: 'Share this link to earn commission when clients hire this talent.'
      });
    }).catch(() => {
      toast.error('Failed to copy link to clipboard');
    });
  };

  /**
   * =====================================================
   * CHECK RELATIONSHIPS (SOCIAL + ECONOMIC LAYERS)
   * =====================================================
   * Checks both Follow (social) and Connect (economic) status
   * These are INDEPENDENT states
   * =====================================================
   */
  const checkRelationships = async () => {
    if (!stacksAddress || !profileData?.id) return;

    try {
      // Check SOCIAL LAYER: Are we following this user?
      const { data: followData } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', stacksAddress)
        .eq('following_id', profileData.id)
        .maybeSingle();

      setIsFollowing(!!followData);

      // Check ECONOMIC LAYER: Are we connected as Scout?
      const { data: connectionData } = await supabase
        .from('scout_connections')
        .select('id')
        .eq('scout_id', stacksAddress)
        .eq('talent_id', profileData.id)
        .eq('status', 'active')
        .maybeSingle();

      setIsConnected(!!connectionData);
    } catch (error) {
      console.error('[PROFILE] Error checking relationships:', error);
    }
  };

  /**
   * =====================================================
   * HANDLE FOLLOW (SOCIAL LAYER)
   * =====================================================
   * Toggles the Follow relationship
   * NO economic implications - purely social
   * =====================================================
   */
  const handleFollow = async () => {
    if (!stacksAddress || !profileData?.id) {
      toast.error('Please connect your wallet');
      return;
    }

    setFollowLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toggle-follow`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            followerId: stacksAddress,
            followingId: profileData.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to toggle follow');
      }

      setIsFollowing(result.isFollowing);
      
      // Update local follower count
      setProfileData(prev => prev ? {
        ...prev,
        followers_count: result.followersCount || prev.followers_count
      } : null);

      toast.success(result.isFollowing ? 'Following!' : 'Unfollowed');
    } catch (error) {
      console.error('[PROFILE] Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  /**
   * =====================================================
   * HANDLE CONNECT (ECONOMIC LAYER)
   * =====================================================
   * Opens Connection Modal to establish Scout relationship
   * This is the ONLY way to earn commissions
   * =====================================================
   */
  const handleConnect = () => {
    if (!stacksAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setConnectionModal({
      open: true,
      isReconnect: isConnected,
    });
  };

  /**
   * =====================================================
   * HANDLE CONNECTION MODAL CLOSE
   * =====================================================
   * Modal closed - if this was a new connection attempt,
   * the user has seen the referral link and education
   * Now we create the database connection
   * =====================================================
   */
  const handleConnectionModalClose = async () => {
    const wasNewConnection = !isConnected;
    setConnectionModal({ open: false, isReconnect: false });

    // If this was a new connection (not a reconnect), create the database entry
    if (wasNewConnection && profileData?.id) {
      setConnectLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-scout-connection`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              scoutId: stacksAddress,
              talentId: profileData.id,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to create connection');
        }

        setIsConnected(true);
        
        // Update local scout connections count
        setProfileData(prev => prev ? {
          ...prev,
          scout_connections_count: prev.scout_connections_count + 1
        } : null);

        toast.success('Connected! You can now earn commissions by referring clients.');
      } catch (error) {
        console.error('[PROFILE] Error creating connection:', error);
        toast.error('Failed to create connection');
      } finally {
        setConnectLoading(false);
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if no profile data
  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {username 
              ? `No profile found for @${username}`
              : 'Please connect your wallet to view your profile'
            }
          </p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }



  const completedProjects = [
    {
      id: 1,
      title: 'Brand Redesign for DeFi Platform',
      client: { username: 'crypto_client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1' },
      scout: { username: 'network_scout', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scout1' },
      rating: 5,
      review: 'Absolutely phenomenal work! Exceeded all expectations and delivered ahead of schedule.',
      date: '2025-10-15'
    },
    {
      id: 2,
      title: 'NFT Collection Design',
      client: { username: 'nft_founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2' },
      rating: 5,
      review: 'Creative genius. The collection sold out in minutes!',
      date: '2025-09-28'
    },
  ];

  const scoutConnections = [
    {
      id: 1,
      talent: { username: 'sarah_designs', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
      client: { username: 'happy_client', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1' },
      project: 'Logo Design Package',
      commission: 180,
      date: '2025-10-20'
    },
    {
      id: 2,
      talent: { username: 'alex_dev', name: 'Alex Martinez', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
      client: { username: 'startup_ceo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2' },
      project: 'Smart Contract Development',
      commission: 450,
      date: '2025-10-12'
    },
  ];

  const clientProjects = [
    {
      id: 1,
      title: 'Brand Identity Overhaul',
      talent: { username: 'maya_creates', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya' },
      scout: { username: 'pro_scout', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=scout1' },
      completedDate: '2025-10-10',
      review: 'Professional and creative. Would hire again in a heartbeat!'
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Universal Header (Connection Card) */}
        <Card className="shadow-elevated mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar with Status Border */}
              <div className="relative">
                <Avatar 
                  className={`h-32 w-32 ring-4 ring-offset-4 ${
                    profileData.talent_availability 
                      ? 'ring-success' 
                      : 'ring-muted'
                  }`}
                >
                  <AvatarImage src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`} />
                  <AvatarFallback className="text-3xl">
                    {(profileData.full_name || profileData.username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Identity Block */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-black text-primary mb-1">
                    {profileData.full_name || profileData.username}
                  </h1>
                  <p className="text-muted-foreground">@{profileData.username}</p>
                  {profileData.headline && (
                    <p className="mt-2 text-lg">{profileData.headline}</p>
                  )}
                </div>

                {/* Metrics Block */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-action" />
                    <span className="font-semibold">Reputation: {profileData.reputation}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                    <span>{profileData.followers_count || 0} Followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>{profileData.following_count || 0} Following</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    <span>{profileData.scout_connections_count || 0} Scout Connections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span>{profileData.projects_completed_count || 0} Projects Completed</span>
                  </div>
                  {/* Finder's Fee - Only show if > 0 */}
                  {profileData.universal_finder_fee > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-success" />
                      <span className="font-semibold">
                        Finder's Fee: <span className="text-success">{profileData.universal_finder_fee}%</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Social Verifications */}
                <div className="flex gap-3">
                  <Button variant="outline" size="icon" className="h-9 w-9" title="Twitter">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="GitHub">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9" title="Website">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              {isOwnProfile ? (
                <div className="flex items-start">
                  <Button variant="outline" asChild>
                    <Link to="/settings">
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-3 flex-wrap">
                  {/* SOCIAL LAYER: Follow Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="gap-2"
                  >
                    {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>

                  {/* ECONOMIC LAYER: Connect Button */}
                  <Button
                    onClick={handleConnect}
                    disabled={connectLoading}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    {connectLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isConnected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {isConnected ? 'Connected' : 'Connect'}
                  </Button>

                  {/* Hire Button */}
                  <Button 
                    className="bg-success hover:bg-success/90 gap-2"
                    onClick={() => setShowProjectModal(true)}
                  >
                    <DollarSign className="h-4 w-4" />
                    Hire
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scout Control Panel - Shows when connected Scout views Talent profile */}
        {!isOwnProfile && isConnected && stacksAddress && profileData && (
          <div className="mb-8">
            <ScoutControlPanel
              talentUsername={profileData.username}
              talentId={profileData.id}
              scoutAddress={stacksAddress}
            />
          </div>
        )}

        {/* Role Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            {profileData.roles.includes('talent') && (
              <TabsTrigger value="talent">Talent</TabsTrigger>
            )}
            {profileData.roles.includes('scout') && (
              <TabsTrigger value="scout">Scout</TabsTrigger>
            )}
            {profileData.roles.includes('client') && (
              <TabsTrigger value="client">Client</TabsTrigger>
            )}
          </TabsList>

          {/* TALENT VIEW */}
          <TabsContent value="talent" className="space-y-6">
            <Tabs defaultValue="gallery">
              <TabsList>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="history">History & Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="mt-6">
                {/* Add to Gallery Button (Own Profile Only) */}
                {isOwnProfile && (
                  <div className="mb-6">
                    <Button
                      onClick={handleCreatePost}
                      className="bg-action hover:bg-action/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Gallery
                    </Button>
                  </div>
                )}

                {/* Posts Grid */}
                {postsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {isOwnProfile 
                        ? 'Start building your gallery by adding portfolio pieces or gigs'
                        : 'This talent hasn\'t added any content yet'
                      }
                    </p>
                    {isOwnProfile && (
                      <Button
                        onClick={handleCreatePost}
                        className="bg-action hover:bg-action/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Post
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <Link key={post.id} to={`/post/${post.id}`}>
                        <Card className="overflow-hidden shadow-soft hover:shadow-elevated transition-shadow group cursor-pointer">
                          <div className="aspect-square relative overflow-hidden">
                            {post.image_urls && post.image_urls.length > 0 ? (
                              <img
                                src={post.image_urls[0]}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Briefcase className="h-12 w-12 text-muted-foreground opacity-50" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                              <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                              {post.type === 'gig' && post.price && (
                                <>
                                  <p className="text-sm mb-2">{post.price} STX</p>
                                  <Badge className="bg-success text-success-foreground">
                                    Finder's Fee: {profileData?.universal_finder_fee || 10}%
                                  </Badge>
                                </>
                              )}
                              {post.type === 'portfolio' && (
                                <Badge variant="secondary">Portfolio</Badge>
                              )}
                            </div>
                            {isOwnProfile && (
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleEditPost(post);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDeletePost(post.id);
                                  }}
                                >
                                  Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </Link>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-6 space-y-4">
                {completedProjects.map((project) => (
                  <Card key={project.id} className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-primary mb-1">{project.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Completed: {project.date}</span>
                          </div>
                        </div>
                        <div className="flex">
                          {[...Array(project.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-action text-action" />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.client.avatar} />
                            <AvatarFallback>C</AvatarFallback>
                          </Avatar>
                          <Link to={`/profile/${project.client.username}`} className="text-primary hover:underline">
                            @{project.client.username}
                          </Link>
                        </div>
                        {project.scout && (
                          <>
                            <span className="text-muted-foreground">via</span>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={project.scout.avatar} />
                                <AvatarFallback>S</AvatarFallback>
                              </Avatar>
                              <Link to={`/profile/${project.scout.username}`} className="text-primary hover:underline">
                                @{project.scout.username}
                              </Link>
                            </div>
                          </>
                        )}
                      </div>

                      <p className="text-muted-foreground italic">"{project.review}"</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* SCOUT VIEW */}
          <TabsContent value="scout">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Connection History (Deal Flow) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Deal Flow</h2>
                  <Badge variant="outline" className="text-success border-success">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Total Earned: ${scoutConnections.reduce((sum, c) => sum + c.commission, 0)}
                  </Badge>
                </div>
                {scoutConnections.length === 0 ? (
                  <Card className="shadow-soft p-8 text-center">
                    <p className="text-muted-foreground">
                      Your completed deals will appear here
                    </p>
                  </Card>
                ) : (
                  scoutConnections.map((connection) => (
                    <Card key={connection.id} className="shadow-soft hover:shadow-elevated transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          {/* Client Avatar */}
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={connection.client.avatar} />
                            <AvatarFallback>{connection.client.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <p className="text-sm mb-2">
                              <span className="font-semibold">You</span> connected{' '}
                              <Link to={`/profile/${connection.client.username}`} className="text-primary font-semibold hover:underline">
                                @{connection.client.username}
                              </Link>{' '}
                              with{' '}
                              <Link to={`/profile/${connection.talent.username}`} className="text-primary font-semibold hover:underline">
                                @{connection.talent.username}
                              </Link>
                            </p>
                            <p className="text-sm font-medium text-muted-foreground">
                              "{connection.project}"
                            </p>
                          </div>

                          {/* Talent Avatar */}
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={connection.talent.avatar} />
                            <AvatarFallback>{connection.talent.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-sm text-muted-foreground">{connection.date}</span>
                          <div className="flex items-center gap-2 bg-success/10 px-3 py-1 rounded-full">
                            <DollarSign className="h-4 w-4 text-success" />
                            <span className="font-bold text-success">${connection.commission}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Right: The Roster */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">The Roster</h2>
                  <Badge variant="secondary">{rosterTalents.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Talents you're connected with</p>
                
                {rosterLoading ? (
                  <Card className="shadow-soft p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading roster...</p>
                  </Card>
                ) : rosterTalents.length === 0 ? (
                  <Card className="shadow-soft p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-2">No connections yet</p>
                    <p className="text-sm text-muted-foreground">
                      Connect with talents to build your roster
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {rosterTalents.map((connection: any) => {
                      const talent = connection.profiles;
                      if (!talent) return null;
                      
                      return (
                        <Card key={connection.id} className="shadow-soft hover:shadow-elevated transition-shadow">
                          <CardContent className="p-4">
                            {/* Talent Info */}
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.id}`} />
                                <AvatarFallback>{talent.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <Link to={`/profile/${talent.username}`} className="font-semibold hover:underline block truncate">
                                  {talent.full_name || talent.username}
                                </Link>
                                <p className="text-sm text-muted-foreground truncate">
                                  @{talent.username}
                                </p>
                                {talent.headline && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {talent.headline}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Finder's Fee Badge */}
                            <Badge className="bg-success text-success-foreground mb-3 w-full justify-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              15% Finder's Fee
                            </Badge>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-action hover:bg-action/90 text-white"
                                onClick={() => copyReferralLink(talent.username)}
                              >
                                <Link2 className="h-4 w-4 mr-1" />
                                Copy Link
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <Link to={`/profile/${talent.username}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* CLIENT VIEW */}
          <TabsContent value="client" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Past Projects</h2>
            {clientProjects.map((project) => (
              <Card key={project.id} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{project.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span>Completed: {project.completedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={project.talent.avatar} />
                          <AvatarFallback>T</AvatarFallback>
                        </Avatar>
                        <span>Hired:</span>
                        <Link to={`/profile/${project.talent.username}`} className="text-primary font-semibold hover:underline">
                          @{project.talent.username}
                        </Link>
                      </div>
                      {project.scout && (
                        <>
                          <span className="text-muted-foreground">via</span>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={project.scout.avatar} />
                              <AvatarFallback>S</AvatarFallback>
                            </Avatar>
                            <Link to={`/profile/${project.scout.username}`} className="text-primary font-semibold hover:underline">
                              @{project.scout.username}
                            </Link>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-2">Your Review:</p>
                      <p className="text-muted-foreground italic">"{project.review}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Project Creation Modal */}
      <ProjectCreationModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        talentAddress={profileData.id}
        talentUsername={profileData.username}
        talentAvatar={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`}
        scoutFeePercent={15} // TODO: Get from talent's profile settings
      />

      {/* Connection Modal - ECONOMIC LAYER */}
      {profileData && (
        <ConnectionModal
          open={connectionModal.open}
          onClose={handleConnectionModalClose}
          talentUsername={profileData.username}
          talentAvatar={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`}
          talentId={profileData.id}
          scoutAvatar={stacksAddress ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${stacksAddress}` : ''}
          finderFeePercent={profileData.universal_finder_fee || 10}
          isReconnect={connectionModal.isReconnect}
        />
      )}

      {/* Post Form Modal */}
      {profileData && isOwnProfile && (
        <PostFormModal
          open={postModalOpen}
          onClose={() => {
            setPostModalOpen(false);
            setSelectedPost(null);
          }}
          onSuccess={() => {
            fetchPosts();
          }}
          talentId={profileData.id}
          post={selectedPost}
        />
      )}

    </div>
    </AppLayout>
  );
}
