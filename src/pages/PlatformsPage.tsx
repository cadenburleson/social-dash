import { Header } from "@/components/layout/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlatformCard } from "@/components/platforms/PlatformCard";
import { PostGrid } from "@/components/platforms/PostGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useAnalyticsStore, useSettingsStore } from "@/store";
import { PLATFORM_LABELS } from "@/lib/constants";
import type { Platform } from "@/services/types";

const allPlatforms: Platform[] = ["youtube", "tiktok", "instagram"];

export function PlatformsPage() {
  const posts = useAnalyticsStore((s) => s.posts);
  const summaries = useAnalyticsStore((s) => s.platformSummaries);
  const platforms = useSettingsStore((s) => s.platforms);

  const configuredPlatforms = allPlatforms.filter(
    (p) => platforms[p].apiKey && platforms[p].identifier
  );

  if (configuredPlatforms.length === 0) {
    return (
      <>
        <Header title="Platforms" />
        <div className="p-6">
          <EmptyState
            title="No platforms connected"
            description="Add your API keys in Settings to view platform-specific analytics."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Platforms" />
      <div className="p-6">
        <Tabs defaultValue={configuredPlatforms[0]}>
          <TabsList>
            {configuredPlatforms.map((p) => (
              <TabsTrigger key={p} value={p} className="gap-2">
                <PlatformIcon platform={p} className="h-4 w-4" />
                {PLATFORM_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>

          {configuredPlatforms.map((p) => {
            const summary = summaries.find((s) => s.platform === p);
            const platformPosts = posts.filter((post) => post.platform === p);

            return (
              <TabsContent key={p} value={p} className="space-y-6">
                {summary && <PlatformCard summary={summary} />}
                {platformPosts.length > 0 ? (
                  <PostGrid posts={platformPosts} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No posts found. Try refreshing.
                  </p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </>
  );
}
