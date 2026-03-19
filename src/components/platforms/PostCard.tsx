import { Eye, Heart, MessageCircle, Share2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatPercent, timeAgo } from "@/lib/utils";
import type { Post } from "@/services/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="overflow-hidden hover:border-foreground/20 transition-colors">
      <div className="aspect-video bg-muted relative">
        {post.thumbnailUrl ? (
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No thumbnail
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm line-clamp-2 hover:underline flex items-start gap-1"
        >
          {post.title}
          <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
        </a>
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo(post.publishedAt)}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatNumber(post.metrics.views)}
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(post.metrics.likes)}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {formatNumber(post.metrics.comments)}
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            {formatNumber(post.metrics.shares)}
          </div>
        </div>
        <div className="mt-2 text-xs font-medium text-foreground">
          {formatPercent(post.metrics.engagementRate)} engagement
        </div>
      </CardContent>
    </Card>
  );
}
