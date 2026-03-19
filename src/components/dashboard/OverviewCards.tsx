import { Eye, MessageCircle, Share2, TrendingUp } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardMetrics } from "@/services/types";

export function OverviewCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Views"
        value={formatNumber(metrics.totalViews)}
        icon={Eye}
      />
      <MetricCard
        title="Total Comments"
        value={formatNumber(metrics.totalComments)}
        icon={MessageCircle}
      />
      <MetricCard
        title="Total Shares"
        value={formatNumber(metrics.totalShares)}
        icon={Share2}
      />
      <MetricCard
        title="Avg Engagement"
        value={formatPercent(metrics.avgEngagementRate)}
        icon={TrendingUp}
      />
    </div>
  );
}
