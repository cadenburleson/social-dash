import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Platform,
  PlatformConfig,
  Post,
  PlatformSummary,
  DashboardMetrics,
  TimeSeriesPoint,
} from "@/services/types";

interface SettingsSlice {
  platforms: Record<Platform, PlatformConfig>;
  setPlatformConfig: (platform: Platform, config: Partial<PlatformConfig>) => void;
  clearPlatformConfig: (platform: Platform) => void;
  clearAll: () => void;
}

interface AnalyticsSlice {
  posts: Post[];
  platformSummaries: PlatformSummary[];
  timeSeries: TimeSeriesPoint[];
  lastFetched: string | null;
  isLoading: boolean;
  errors: { platform: Platform; message: string }[];
  setAnalyticsData: (data: {
    posts: Post[];
    platformSummaries: PlatformSummary[];
  }) => void;
  setLoading: (loading: boolean) => void;
  setErrors: (errors: { platform: Platform; message: string }[]) => void;
  getDashboardMetrics: () => DashboardMetrics;
}

interface UiSlice {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const defaultPlatformConfig = (platform: Platform): PlatformConfig => ({
  platform,
  apiKey: "",
  identifier: "",
  isConnected: false,
  lastSynced: null,
});

export const useSettingsStore = create<SettingsSlice>()(
  persist(
    (set) => ({
      platforms: {
        youtube: defaultPlatformConfig("youtube"),
        tiktok: defaultPlatformConfig("tiktok"),
        instagram: defaultPlatformConfig("instagram"),
      },
      setPlatformConfig: (platform, config) =>
        set((state) => ({
          platforms: {
            ...state.platforms,
            [platform]: { ...state.platforms[platform], ...config },
          },
        })),
      clearPlatformConfig: (platform) =>
        set((state) => ({
          platforms: {
            ...state.platforms,
            [platform]: defaultPlatformConfig(platform),
          },
        })),
      clearAll: () =>
        set({
          platforms: {
            youtube: defaultPlatformConfig("youtube"),
            tiktok: defaultPlatformConfig("tiktok"),
            instagram: defaultPlatformConfig("instagram"),
          },
        }),
    }),
    { name: "social-dash-settings" }
  )
);

export const useAnalyticsStore = create<AnalyticsSlice>()(
  persist(
    (set, get) => ({
      posts: [],
      platformSummaries: [],
      timeSeries: [],
      lastFetched: null,
      isLoading: false,
      errors: [],
      setAnalyticsData: ({ posts, platformSummaries }) =>
        set({
          posts,
          platformSummaries,
          lastFetched: new Date().toISOString(),
          timeSeries: buildTimeSeries(posts),
        }),
      setLoading: (isLoading) => set({ isLoading }),
      setErrors: (errors) => set({ errors }),
      getDashboardMetrics: () => {
        const { posts, platformSummaries, timeSeries } = get();
        const totalViews = platformSummaries.reduce(
          (s, p) => s + p.totalViews,
          0
        );
        const totalComments = platformSummaries.reduce(
          (s, p) => s + p.totalComments,
          0
        );
        const totalShares = platformSummaries.reduce(
          (s, p) => s + p.totalShares,
          0
        );
        const avgEngagementRate =
          platformSummaries.length > 0
            ? platformSummaries.reduce((s, p) => s + p.avgEngagementRate, 0) /
              platformSummaries.length
            : 0;
        const topPosts = [...posts]
          .sort((a, b) => b.metrics.views - a.metrics.views)
          .slice(0, 10);
        return {
          totalViews,
          totalComments,
          totalShares,
          avgEngagementRate,
          topPosts,
          timeSeries,
          platformSummaries,
        };
      },
    }),
    { name: "social-dash-analytics" }
  )
);

export const useUiStore = create<UiSlice>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

function buildTimeSeries(posts: Post[]): TimeSeriesPoint[] {
  const byDate = new Map<string, { youtube: number; tiktok: number; instagram: number }>();

  for (const post of posts) {
    const date = post.publishedAt.slice(0, 10);
    const existing = byDate.get(date) || { youtube: 0, tiktok: 0, instagram: 0 };
    existing[post.platform] += post.metrics.views;
    byDate.set(date, existing);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));
}
