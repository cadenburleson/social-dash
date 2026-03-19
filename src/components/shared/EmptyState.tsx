import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export function EmptyState({
  title = "No data yet",
  description = "Connect your social media accounts in Settings to start tracking analytics.",
}: {
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description}
      </p>
      <Button onClick={() => navigate("/settings")}>Go to Settings</Button>
    </div>
  );
}
