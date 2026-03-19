import { Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ApiKeyForm } from "@/components/settings/ApiKeyForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSettingsStore, useAnalyticsStore } from "@/store";

export function SettingsPage() {
  const clearAll = useSettingsStore((s) => s.clearAll);
  const clearAnalytics = useAnalyticsStore((s) => s.setAnalyticsData);

  const handleClearAll = () => {
    clearAll();
    clearAnalytics({ posts: [], platformSummaries: [] });
  };

  return (
    <>
      <Header title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">API Configuration</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your API keys and usernames for each platform. Keys are stored
            locally in your browser.
          </p>
        </div>

        <ApiKeyForm platform="youtube" />
        <ApiKeyForm platform="tiktok" />
        <ApiKeyForm platform="instagram" />

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Clear all API keys and cached analytics data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleClearAll}>
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
