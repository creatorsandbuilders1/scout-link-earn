import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link2, Circle, Loader2, Check, ExternalLink, Eye } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  image_urls: string[];
}

interface PortfolioImage {
  id: string;
  imageUrl: string;
}

interface TalentCardProps {
  talent: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    talent_availability: boolean;
    reputation: number;
    scout_connections_count: number;
    universal_finder_fee: number;
  };
  isConnected: boolean;
  isConnecting: boolean;
  isOwnProfile: boolean;
  onConnect: () => void;
  onGetReferralLink: () => void;
  isWalletConnected: boolean;
}

export function TalentCard({
  talent,
  isConnected,
  isConnecting,
  isOwnProfile,
  onConnect,
  onGetReferralLink,
  isWalletConnected,
}: TalentCardProps) {
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  useEffect(() => {
    fetchPortfolioImages();
  }, [talent.id]);

  const fetchPortfolioImages = async () => {
    try {
      setLoadingImages(true);

      // Fetch 3-5 most recent posts with images
      const { data, error } = await supabase
        .from('posts')
        .select('id, image_urls')
        .eq('talent_id', talent.id)
        .eq('status', 'published')
        .not('image_urls', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[TALENT_CARD] Error fetching portfolio:', error);
        return;
      }

      // Extract first image from each post with post ID
      const images: PortfolioImage[] = [];
      data?.forEach((post: Post) => {
        if (post.image_urls && post.image_urls.length > 0) {
          images.push({
            id: post.id,
            imageUrl: post.image_urls[0]
          });
        }
      });

      setPortfolioImages(images.slice(0, 5));
    } catch (error) {
      console.error('[TALENT_CARD] Error:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 group flex flex-col h-full">
      {/* Top Section - Condensed Profile */}
      <CardContent className="p-6 space-y-4 flex-shrink-0">
        {/* Avatar and Name */}
        <RouterLink to={`/profile/${talent.username}`}>
          <div className="flex items-start gap-3 cursor-pointer group/profile">
            <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-primary/20 group-hover/profile:ring-primary transition-all">
              <AvatarImage 
                src={talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.id}`} 
              />
              <AvatarFallback>
                {(talent.full_name || talent.username)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-primary text-lg truncate group-hover/profile:underline">
                {talent.full_name || talent.username}
              </h3>
              <p className="text-sm text-muted-foreground">
                @{talent.username}
              </p>
            </div>
          </div>
        </RouterLink>

        {/* Headline and Status */}
        <div className="space-y-2">
          {talent.headline && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {talent.headline}
            </p>
          )}
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            {talent.talent_availability && (
              <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                <Circle className="h-2 w-2 fill-current animate-pulse" />
                Available Now
              </div>
            )}
            
            {/* Finder's Fee - Subtle Pill */}
            <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20 font-semibold">
              Finder's Fee: {talent.universal_finder_fee}%
            </Badge>
          </div>
        </div>

        {/* Dual-Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {isOwnProfile ? (
            <Button 
              variant="outline" 
              size="sm" 
              disabled 
              className="col-span-2"
            >
              Your Profile
            </Button>
          ) : isConnected ? (
            <>
              <div className="relative group/connected">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2 border-primary text-primary hover:bg-primary/5"
                >
                  <Check className="h-4 w-4" />
                  Connected
                </Button>
                {/* Hover Dropdown */}
                <div className="hidden group-hover/connected:block absolute top-full mt-1 left-0 right-0 bg-background border-2 border-primary rounded-lg shadow-elevated p-2 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-primary hover:bg-primary/10"
                    onClick={onGetReferralLink}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Get Link
                  </Button>
                </div>
              </div>
              <Button 
                size="sm" 
                className="gap-2 bg-action hover:bg-action/90"
                asChild
              >
                <RouterLink to={`/profile/${talent.username}`}>
                  <Eye className="h-4 w-4" />
                  View
                </RouterLink>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-primary text-primary hover:bg-primary/5"
                onClick={onConnect}
                disabled={isConnecting || !isWalletConnected}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Connect
              </Button>
              <Button 
                size="sm" 
                className="gap-2 bg-action hover:bg-action/90"
                asChild
              >
                <RouterLink to={`/profile/${talent.username}`}>
                  <Eye className="h-4 w-4" />
                  View
                </RouterLink>
              </Button>
            </>
          )}
        </div>
      </CardContent>

      {/* Bottom Section - Portfolio Mini-Gallery */}
      <div className="flex-1 bg-muted/30 p-4">
        {loadingImages ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : portfolioImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {portfolioImages.slice(0, 3).map((post, index) => (
              <RouterLink 
                key={index}
                to={`/post/${post.id}`}
                className="aspect-square bg-background rounded-lg overflow-hidden group/image"
              >
                <img
                  src={post.imageUrl}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                  onError={(e) => {
                    // Fallback for broken images
                    e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${talent.id}-${index}`;
                  }}
                />
              </RouterLink>
            ))}
            {portfolioImages.length > 3 && (
              <div className="col-span-3 mt-1">
                <div className="flex gap-1">
                  {portfolioImages.slice(3, 5).map((post, index) => (
                    <RouterLink
                      key={index + 3}
                      to={`/post/${post.id}`}
                      className="flex-1 aspect-video bg-background rounded-lg overflow-hidden group/image"
                    >
                      <img
                        src={post.imageUrl}
                        alt={`Portfolio ${index + 4}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${talent.id}-${index + 3}`;
                        }}
                      />
                    </RouterLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm text-muted-foreground">
              No portfolio images yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Check their profile for more details
            </p>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="bg-muted/50 px-4 py-2 text-xs text-muted-foreground border-t flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span>⭐</span>
            <span>{talent.reputation}%</span>
          </span>
          <span className="flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            <span>{talent.scout_connections_count}</span>
          </span>
        </div>
        <span className="text-primary font-medium hover:underline cursor-pointer">
          View Gallery →
        </span>
      </div>
    </Card>
  );
}
