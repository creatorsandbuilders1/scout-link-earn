import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, ExternalLink, MessageSquare, DollarSign, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useScoutTracking } from '@/contexts/ScoutTrackingContext';
import { useWallet } from '@/contexts/WalletContext';
import { GigProposalModal } from '@/components/GigProposalModal';

interface PostData {
  id: string;
  type: 'portfolio' | 'gig';
  title: string;
  description: string | null;
  image_urls: string[];
  price: number | null;
  status: string;
  talent_id: string;
  created_at: string;
  talent: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    universal_finder_fee: number;
  };
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { stacksAddress } = useWallet();
  const { hasActiveScoutSession, scoutAddress } = useScoutTracking();
  
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);

      // Fetch post with talent profile data
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          talent:profiles!talent_id (
            id,
            username,
            full_name,
            avatar_url,
            headline,
            universal_finder_fee
          )
        `)
        .eq('id', postId)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('[POST_DETAIL] Error fetching post:', error);
        toast.error('Failed to load post');
        navigate('/discover');
        return;
      }

      if (!data) {
        toast.error('Post not found');
        navigate('/discover');
        return;
      }

      setPost(data as PostData);
    } catch (error) {
      console.error('[POST_DETAIL] Error:', error);
      toast.error('Failed to load post');
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProject = () => {
    if (!stacksAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!post) return;

    setProjectModalOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This post may have been removed or doesn't exist.
            </p>
            <Button onClick={() => navigate('/discover')}>
              Back to Discovery
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const selectedImage = post.image_urls[selectedImageIndex];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Two-Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <Card className="overflow-hidden shadow-elevated">
                <div className="aspect-video bg-muted">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image available
                    </div>
                  )}
                </div>
              </Card>

              {/* Thumbnail Gallery */}
              {post.image_urls.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {post.image_urls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-muted-foreground/20'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`${post.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Information & Actions */}
            <div className="space-y-6">
              {/* Author Block */}
              <Link to={`/profile/${post.talent.username}`}>
                <Card className="p-4 hover:shadow-soft transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={post.talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.talent.id}`}
                      />
                      <AvatarFallback>
                        {(post.talent.full_name || post.talent.username)[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-primary truncate">
                        {post.talent.full_name || post.talent.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{post.talent.username}
                      </p>
                      {post.talent.headline && (
                        <p className="text-sm text-muted-foreground truncate">
                          {post.talent.headline}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>

              {/* Post Title & Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={post.type === 'gig' ? 'default' : 'secondary'}>
                    {post.type === 'gig' ? 'Gig' : 'Portfolio'}
                  </Badge>
                </div>
                <h1 className="text-4xl font-black">{post.title}</h1>
              </div>

              {/* Description */}
              {post.description && (
                <Card className="p-6">
                  <h3 className="font-bold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {post.description}
                  </p>
                </Card>
              )}

              {/* Smart Action Block */}
              <Card className="p-6 space-y-4 border-2">
                {post.type === 'portfolio' ? (
                  /* Portfolio Actions */
                  <>
                    <h3 className="font-bold text-lg">Interested in working together?</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="gap-2"
                        asChild
                      >
                        <Link to={`/profile/${post.talent.username}`}>
                          <ExternalLink className="h-4 w-4" />
                          View Full Profile
                        </Link>
                      </Button>
                      <Button
                        className="gap-2 bg-action hover:bg-action/90"
                        onClick={() => toast.info('Chat feature coming soon!')}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Send Inquiry
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Gig Actions */
                  <>
                    {/* Price Display */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-primary">
                        {post.price} STX
                      </span>
                      <span className="text-muted-foreground">per project</span>
                    </div>

                    {/* Scout Commission Banner */}
                    {hasActiveScoutSession && scoutAddress && (
                      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-primary">
                              Scout Referral Active
                            </p>
                            <p className="text-sm text-muted-foreground">
                              You were referred by a Scout.
                              If you proceed, they will earn a{' '}
                              <span className="font-semibold text-success">{post.talent.universal_finder_fee}%</span>{' '}
                              commission on this project, guaranteed by REFERYDO!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Start Project Button */}
                    <Button
                      size="lg"
                      className="w-full gap-2 bg-action hover:bg-action/90 text-lg font-bold"
                      onClick={handleStartProject}
                    >
                      <DollarSign className="h-5 w-5" />
                      Start Project for {post.price} STX
                    </Button>

                    {/* Additional Info */}
                    <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Secure escrow payment</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Milestone-based delivery</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Smart contract protection</span>
                      </p>
                    </div>
                  </>
                )}
              </Card>

              {/* Metadata */}
              <div className="text-sm text-muted-foreground">
                <p>Posted {new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gig Proposal Modal */}
      {post.type === 'gig' && (
        <GigProposalModal
          open={projectModalOpen}
          onClose={() => setProjectModalOpen(false)}
          talentAddress={post.talent_id}
          talentUsername={post.talent.username}
          talentAvatar={post.talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.talent.id}`}
          gigTitle={post.title}
          gigPrice={post.price || 0}
          scoutFeePercent={post.talent.universal_finder_fee}
        />
      )}
    </AppLayout>
  );
}
