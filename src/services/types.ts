export type Platform = "youtube" | "tiktok" | "instagram";

export interface PlatformConfig {
  platform: Platform;
  apiKey: string;
  identifier: string; // @username or channel ID
  rapidApiHost?: string; // custom RapidAPI host for TikTok/Instagram
  isConnected: boolean;
  lastSynced: string | null;
}

export interface PostMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export interface Post {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  metrics: PostMetrics;
}

export interface PlatformSummary {
  platform: Platform;
  followerCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  postCount: number;
}

export interface TimeSeriesPoint {
  date: string;
  youtube: number;
  tiktok: number;
  instagram: number;
}

export interface DashboardMetrics {
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  topPosts: Post[];
  timeSeries: TimeSeriesPoint[];
  platformSummaries: PlatformSummary[];
}

export interface ApiError {
  platform: Platform;
  message: string;
  statusCode?: number;
}
