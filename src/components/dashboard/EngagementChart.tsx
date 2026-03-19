import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeSeriesPoint } from "@/services/types";
import { PLATFORM_COLORS } from "@/lib/constants";

export function EngagementChart({ data }: { data: TimeSeriesPoint[] }) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Views Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ytGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PLATFORM_COLORS.youtube} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PLATFORM_COLORS.youtube} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ttGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PLATFORM_COLORS.tiktok} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PLATFORM_COLORS.tiktok} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PLATFORM_COLORS.instagram} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PLATFORM_COLORS.instagram} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
            <XAxis
              dataKey="date"
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
            <Legend />
            <Area
              type="monotone"
              dataKey="youtube"
              name="YouTube"
              stroke={PLATFORM_COLORS.youtube}
              fill="url(#ytGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="tiktok"
              name="TikTok"
              stroke={PLATFORM_COLORS.tiktok}
              fill="url(#ttGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="instagram"
              name="Instagram"
              stroke={PLATFORM_COLORS.instagram}
              fill="url(#igGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
