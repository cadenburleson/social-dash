import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { formatNumber, formatPercent, timeAgo } from "@/lib/utils";
import type { Post } from "@/services/types";

export function TopPostsTable({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 px-2 font-medium">Post</th>
                <th className="text-right py-3 px-2 font-medium">Views</th>
                <th className="text-right py-3 px-2 font-medium">Likes</th>
                <th className="text-right py-3 px-2 font-medium">Comments</th>
                <th className="text-right py-3 px-2 font-medium">Engagement</th>
                <th className="text-right py-3 px-2 font-medium">Published</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2 max-w-xs">
                      <PlatformIcon platform={post.platform} className="h-4 w-4 shrink-0" />
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        {post.title}
                      </a>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </div>
                  </td>
                  <td className="text-right py-3 px-2">{formatNumber(post.metrics.views)}</td>
                  <td className="text-right py-3 px-2">{formatNumber(post.metrics.likes)}</td>
                  <td className="text-right py-3 px-2">{formatNumber(post.metrics.comments)}</td>
                  <td className="text-right py-3 px-2">
                    {formatPercent(post.metrics.engagementRate)}
                  </td>
                  <td className="text-right py-3 px-2 text-muted-foreground">
                    {timeAgo(post.publishedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
