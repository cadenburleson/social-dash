import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { TopPostsTable } from "@/components/dashboard/TopPostsTable";
import { PlatformBreakdown } from "@/components/dashboard/PlatformBreakdown";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingCards, LoadingChart, LoadingTable } from "@/components/shared/LoadingState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRefreshInterval } from "@/hooks/useRefreshInterval";
import { useAnalyticsStore, useSettingsStore } from "@/store";

export function DashboardPage() {
  const { refresh, isLoading } = useAnalytics();
  const getDashboardMetrics = useAnalyticsStore((s) => s.getDashboardMetrics);
  const errors = useAnalyticsStore((s) => s.errors);
  const lastFetched = useAnalyticsStore((s) => s.lastFetched);
  const platforms = useSettingsStore((s) => s.platforms);

  const hasAnyConfigured = Object.values(platforms).some(
    (p) => p.apiKey && p.identifier
  );

  useEffect(() => {
    if (hasAnyConfigured && !lastFetched) {
      refresh();
    }
  }, [hasAnyConfigured, lastFetched, refresh]);

  useRefreshInterval(refresh, undefined, hasAnyConfigured);

  if (!hasAnyConfigured) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="p-6">
          <EmptyState />
        </div>
      </>
    );
  }

  const metrics = getDashboardMetrics();

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((err) => (
              <ErrorState
                key={err.platform}
                message={`${err.platform}: ${err.message}`}
                onRetry={refresh}
              />
            ))}
          </div>
        )}

        {isLoading && !lastFetched ? (
          <>
            <LoadingCards />
            <LoadingChart />
            <LoadingTable />
          </>
        ) : (
          <>
            <OverviewCards metrics={metrics} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EngagementChart data={metrics.timeSeries} />
              <PlatformBreakdown summaries={metrics.platformSummaries} />
            </div>
            <TopPostsTable posts={metrics.topPosts} />
          </>
        )}
      </div>
    </>
  );
}
