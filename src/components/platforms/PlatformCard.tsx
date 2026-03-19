import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { formatNumber, formatPercent } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/lib/constants";
import type { PlatformSummary } from "@/services/types";

export function PlatformCard({ summary }: { summary: PlatformSummary }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <PlatformIcon platform={summary.platform} />
          {PLATFORM_LABELS[summary.platform]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Followers
            </p>
            <p className="font-semibold text-lg">
              {formatNumber(summary.followerCount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Views</p>
            <p className="font-semibold text-lg">
              {formatNumber(summary.totalViews)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Engagement</p>
            <p className="font-semibold text-lg">
              {formatPercent(summary.avgEngagementRate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Posts</p>
            <p className="font-semibold text-lg">{summary.postCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
