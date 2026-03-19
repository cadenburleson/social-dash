import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAnalyticsStore } from "@/store";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

export function Header({ title }: { title: string }) {
  const { refresh, isLoading } = useAnalytics();
  const lastFetched = useAnalyticsStore((s) => s.lastFetched);

  return (
    <header className="flex items-center justify-between border-b border-border px-6 h-14">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {lastFetched && (
          <span className="text-xs text-muted-foreground">
            Updated {timeAgo(lastFetched)}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
