import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/constants";
import type { PlatformSummary } from "@/services/types";

export function PlatformBreakdown({
  summaries,
}: {
  summaries: PlatformSummary[];
}) {
  if (summaries.length === 0) return null;

  const data = summaries.map((s) => ({
    name: PLATFORM_LABELS[s.platform],
    platform: s.platform,
    views: s.totalViews,
    engagement: s.avgEngagementRate,
    followers: s.followerCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(0 0% 50%)", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(0 0% 50%)", fontSize: 12 }}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 10%)",
                border: "1px solid hsl(0 0% 20%)",
                borderRadius: "8px",
                color: "white",
              }}
            />
            <Bar dataKey="views" name="Views" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.platform}
                  fill={PLATFORM_COLORS[entry.platform]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
