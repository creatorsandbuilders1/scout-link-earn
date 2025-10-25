import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Briefcase } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    type: 'portfolio' | 'gig';
    title: string;
    image_urls: string[];
    price: number | null;
    talent: {
      id: string;
      username: string;
      avatar_url: string | null;
      universal_finder_fee: number;
    };
  };
}

export function PostCard({ post }: PostCardProps) {
  const imageUrl = post.image_urls && post.image_urls.length > 0 
    ? post.image_urls[0] 
    : `https://api.dicebear.com/7.x/shapes/svg?seed=${post.id}`;

  return (
    <Link to={`/post/${post.id}`}>
      <Card className="overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300 group cursor-pointer">
        {/* Image */}
        <div className="relative overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={post.title}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${post.id}`;
            }}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Type badge */}
          <div className="absolute top-2 right-2">
            {post.type === 'gig' ? (
              <Badge className="bg-success text-success-foreground">
                <Briefcase className="h-3 w-3 mr-1" />
                Gig
              </Badge>
            ) : (
              <Badge variant="secondary">
                Portfolio
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3">
          {/* Title */}
          <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>

          {/* Price (for gigs) */}
          {post.type === 'gig' && post.price && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-success font-semibold text-sm">
                <DollarSign className="h-3 w-3" />
                <span>{post.price} STX</span>
              </div>
              <Badge variant="outline" className="text-xs mt-1">
                {post.talent.universal_finder_fee}% Finder's Fee
              </Badge>
            </div>
          )}

          {/* Author */}
          <Link 
            to={`/profile/${post.talent.username}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 mt-2 group/author"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={post.talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.talent.id}`} 
              />
              <AvatarFallback className="text-xs">
                {post.talent.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground group-hover/author:text-primary transition-colors">
              @{post.talent.username}
            </span>
          </Link>
        </CardContent>
      </Card>
    </Link>
  );
}
