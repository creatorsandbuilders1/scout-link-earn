/**
 * =====================================================
 * THE FEED - Mosaic of Opportunity
 * =====================================================
 * 
 * STRATEGIC PURPOSE:
 * A dynamic, Pinterest-style masonry grid showcasing the
 * real-time flow of creativity and commercial opportunities.
 * 
 * This is the primary discovery engine of REFERYDO!
 * 
 * TWO TABS:
 * 1. DISCOVER - All posts from the platform
 * 2. FOLLOWING - Posts from followed talents only
 * =====================================================
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Heart, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostCard } from "@/components/PostCard";
import Masonry from 'react-masonry-css';
import './Feed.css'; // We'll create this for masonry styles

interface Post {
  id: string;
  type: 'portfolio' | 'gig';
  title: string;
  description: string | null;
  image_urls: string[];
  price: number | null;
  status: string;
  created_at: string;
  talent: {
    id: string;
    username: string;
    avatar_url: string | null;
    universal_finder_fee: number;
  };
}

export default function Feed() {
  const { stacksAddress } = useWallet();
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');
  const [discoverPosts, setDiscoverPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscoverFeed();
    } else {
      fetchFollowingFeed();
    }
  }, [activeTab, stacksAddress]);

  /**
   * =====================================================
   * DISCOVER TAB: All Posts
   * =====================================================
   * Fetches all published posts with talent info
   * =====================================================
   */
  const fetchDiscoverFeed = async () => {
    try {
      setLoading(true);
      console.log('[FEED] Fetching Discover feed...');

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          type,
          title,
          description,
          image_urls,
          price,
          status,
          created_at,
          talent:talent_id (
            id,
            username,
            avatar_url,
            universal_finder_fee
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[FEED] Error fetching discover feed:', error);
        throw error;
      }

      // Transform data to match our interface
      const posts: Post[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        image_urls: item.image_urls || [],
        price: item.price,
        status: item.status,
        created_at: item.created_at,
        talent: {
          id: item.talent.id,
          username: item.talent.username,
          avatar_url: item.talent.avatar_url,
          universal_finder_fee: item.talent.universal_finder_fee || 10
        }
      }));

      setDiscoverPosts(posts);
      console.log('[FEED] Discover feed loaded:', posts.length, 'posts');
    } catch (error) {
      console.error('[FEED] Error:', error);
      toast.error('Failed to load feed');
      setDiscoverPosts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * =====================================================
   * FOLLOWING TAB: Posts from Followed Talents
   * =====================================================
   * 1. Get list of followed user IDs
   * 2. Fetch posts from those users
   * =====================================================
   */
  const fetchFollowingFeed = async () => {
    if (!stacksAddress) {
      setFollowingPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[FEED] Fetching Following feed for:', stacksAddress);

      // Step 1: Get list of users I'm following
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', stacksAddress);

      if (followingError) {
        console.error('[FEED] Error fetching following list:', followingError);
        throw followingError;
      }

      if (!followingData || followingData.length === 0) {
        console.log('[FEED] Not following anyone');
        setFollowingPosts([]);
        setLoading(false);
        return;
      }

      const followingIds = followingData.map((f: any) => f.following_id);
      console.log('[FEED] Following', followingIds.length, 'users');

      // Step 2: Get posts from followed users
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          type,
          title,
          description,
          image_urls,
          price,
          status,
          created_at,
          talent:talent_id (
            id,
            username,
            avatar_url,
            universal_finder_fee
          )
        `)
        .eq('status', 'published')
        .in('talent_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[FEED] Error fetching following posts:', error);
        throw error;
      }

      // Transform data
      const posts: Post[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        image_urls: item.image_urls || [],
        price: item.price,
        status: item.status,
        created_at: item.created_at,
        talent: {
          id: item.talent.id,
          username: item.talent.username,
          avatar_url: item.talent.avatar_url,
          universal_finder_fee: item.talent.universal_finder_fee || 10
        }
      }));

      setFollowingPosts(posts);
      console.log('[FEED] Following feed loaded:', posts.length, 'posts');
    } catch (error) {
      console.error('[FEED] Error:', error);
      toast.error('Failed to load following feed');
      setFollowingPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Masonry breakpoints
  const breakpointColumns = {
    default: 5,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };

  return (
    <AppLayout showScoutBanner={false}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-primary mb-2">The Feed</h1>
            <p className="text-muted-foreground">
              A mosaic of opportunity - discover talent and inspiration
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'discover' | 'following')}>
            <TabsList className="mb-6">
              <TabsTrigger value="discover" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="following" className="gap-2">
                <Heart className="h-4 w-4" />
                Following
              </TabsTrigger>
            </TabsList>

            {/* DISCOVER TAB */}
            <TabsContent value="discover">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : discoverPosts.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">No posts available yet</p>
                  <p className="text-sm text-muted-foreground">
                    Be the first to share your work!
                  </p>
                </Card>
              ) : (
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="masonry-grid"
                  columnClassName="masonry-grid-column"
                >
                  {discoverPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </Masonry>
              )}
            </TabsContent>

            {/* FOLLOWING TAB */}
            <TabsContent value="following">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !stacksAddress ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to see posts from talents you follow
                  </p>
                  <Button>Connect Wallet</Button>
                </Card>
              ) : followingPosts.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    You're not following anyone yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Discover talents and follow them to see their latest work here
                  </p>
                  <Button asChild>
                    <Link to="/discover">Discover Talents</Link>
                  </Button>
                </Card>
              ) : (
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="masonry-grid"
                  columnClassName="masonry-grid-column"
                >
                  {followingPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </Masonry>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
