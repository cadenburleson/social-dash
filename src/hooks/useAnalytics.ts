import { useCallback } from "react";
import { useSettingsStore, useAnalyticsStore } from "@/store";
import { fetchYouTubeData } from "@/services/youtube";
import { fetchTikTokData, DEFAULT_TIKTOK_HOST } from "@/services/tiktok";
import { fetchInstagramData, DEFAULT_INSTAGRAM_HOST } from "@/services/instagram";
import type { Platform, Post, PlatformSummary } from "@/services/types";

export function useAnalytics() {
  const platforms = useSettingsStore((s) => s.platforms);
  const { setAnalyticsData, setLoading, setErrors, isLoading } =
    useAnalyticsStore();

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    const fetchers: { platform: Platform; fn: () => Promise<{ posts: Post[]; summary: PlatformSummary }> }[] = [];

    if (platforms.youtube.apiKey && platforms.youtube.identifier) {
      fetchers.push({
        platform: "youtube",
        fn: () =>
          fetchYouTubeData(
            platforms.youtube.apiKey,
            platforms.youtube.identifier
          ),
      });
    }
    if (platforms.tiktok.apiKey && platforms.tiktok.identifier) {
      fetchers.push({
        platform: "tiktok",
        fn: () =>
          fetchTikTokData(
            platforms.tiktok.apiKey,
            platforms.tiktok.identifier,
            platforms.tiktok.rapidApiHost || DEFAULT_TIKTOK_HOST
          ),
      });
    }
    if (platforms.instagram.apiKey && platforms.instagram.identifier) {
      fetchers.push({
        platform: "instagram",
        fn: () =>
          fetchInstagramData(
            platforms.instagram.apiKey,
            platforms.instagram.identifier,
            platforms.instagram.rapidApiHost || DEFAULT_INSTAGRAM_HOST
          ),
      });
    }

    const results = await Promise.allSettled(
      fetchers.map((f) => f.fn())
    );

    const posts: Post[] = [];
    const summaries: PlatformSummary[] = [];
    const errors: { platform: Platform; message: string }[] = [];

    results.forEach((result, i) => {
      const fetcher = fetchers[i]!;
      if (result.status === "fulfilled") {
        posts.push(...result.value.posts);
        summaries.push(result.value.summary);
      } else {
        errors.push({
          platform: fetcher.platform,
          message: result.reason instanceof Error ? result.reason.message : "Unknown error",
        });
      }
    });

    setAnalyticsData({ posts, platformSummaries: summaries });
    setErrors(errors);
    setLoading(false);
  }, [platforms, setAnalyticsData, setLoading, setErrors]);

  return { refresh, isLoading };
}
