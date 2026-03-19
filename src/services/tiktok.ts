import { fetchJson, rapidApiHeaders } from "./api-client";
import type { Post, PlatformSummary, PostMetrics } from "./types";

export const DEFAULT_TIKTOK_HOST = "tiktok-scraper7.p.rapidapi.com";

// Deep-search an object for a key, returns the first match
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepFind(obj: any, key: string): any {
  if (!obj || typeof obj !== "object") return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const found = deepFind(v, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

// Extract a number from various field names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNum(obj: any, ...keys: string[]): number {
  if (!obj || typeof obj !== "object") return 0;
  for (const k of keys) {
    if (k in obj) {
      const v = obj[k];
      if (typeof v === "number") return v;
      if (typeof v === "string") return parseInt(v) || 0;
    }
  }
  // Try nested stats/statistics objects
  for (const nested of ["stats", "statistics", "itemInfo"]) {
    if (obj[nested] && typeof obj[nested] === "object") {
      for (const k of keys) {
        if (k in obj[nested]) {
          const v = obj[nested][k];
          if (typeof v === "number") return v;
          if (typeof v === "string") return parseInt(v) || 0;
        }
      }
    }
  }
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractString(obj: any, ...keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    if (k in obj && typeof obj[k] === "string" && obj[k]) return obj[k];
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeVideo(v: any, username: string): Post | null {
  if (!v || typeof v !== "object") return null;

  const id = String(v.id ?? v.video_id ?? v.aweme_id ?? "");
  if (!id) return null;

  const views = extractNum(v, "playCount", "play_count", "viewCount", "view_count", "plays", "views");
  const likes = extractNum(v, "diggCount", "digg_count", "likeCount", "like_count", "likes", "heart");
  const comments = extractNum(v, "commentCount", "comment_count", "comments");
  const shares = extractNum(v, "shareCount", "share_count", "shares", "repost_count");

  const metrics: PostMetrics = {
    views,
    likes,
    comments,
    shares,
    engagementRate: views > 0 ? ((likes + comments + shares) / views) * 100 : 0,
  };

  const desc = extractString(v, "desc", "description", "title", "caption", "text");

  // Try to find thumbnail from multiple locations
  const cover =
    v.video?.cover ||
    v.video?.originCover ||
    v.video?.dynamicCover ||
    v.cover ||
    v.thumbnail ||
    v.image_url ||
    (v.image_post_info?.images?.[0]?.display_image?.url_list?.[0]) ||
    "";

  // Parse creation time
  let publishedAt = "";
  const rawTime = v.createTime ?? v.create_time ?? v.created_at ?? v.timestamp ?? 0;
  if (rawTime) {
    const ts = typeof rawTime === "string" ? parseInt(rawTime) : rawTime;
    // If timestamp is in seconds (< year 2100 in seconds), multiply by 1000
    publishedAt = new Date(ts < 1e12 ? ts * 1000 : ts).toISOString();
  }

  return {
    id,
    platform: "tiktok",
    title: desc || "Untitled",
    url: `https://tiktok.com/@${username}/video/${id}`,
    thumbnailUrl: cover,
    publishedAt,
    metrics,
  };
}

export async function fetchTikTokData(
  apiKey: string,
  username: string,
  host: string = DEFAULT_TIKTOK_HOST
): Promise<{ posts: Post[]; summary: PlatformSummary }> {
  const cleanUsername = username.replace("@", "").trim();
  const headers = rapidApiHeaders(apiKey, host);

  // Try to fetch user info — different APIs use different endpoints
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userRes: any;
  const userEndpoints = [
    `https://${host}/user/info?unique_id=${cleanUsername}`,
    `https://${host}/user/info?username=${cleanUsername}`,
  ];

  for (const url of userEndpoints) {
    try {
      userRes = await fetchJson(url, { headers });
      break;
    } catch {
      continue;
    }
  }

  // Try to fetch user posts — different APIs use different endpoints
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let feedRes: any;
  const feedEndpoints = [
    `https://${host}/user/posts?unique_id=${cleanUsername}&count=12`,
    `https://${host}/user/posts?username=${cleanUsername}&count=12`,
    `https://${host}/user/feed?username=${cleanUsername}&count=12`,
  ];

  for (const url of feedEndpoints) {
    try {
      feedRes = await fetchJson(url, { headers });
      break;
    } catch {
      continue;
    }
  }

  if (!feedRes) throw new Error("Could not fetch TikTok posts. Check your API key and host.");

  // Log raw responses for debugging
  console.log("[Social Dash] TikTok user response:", JSON.stringify(userRes, null, 2).slice(0, 2000));
  console.log("[Social Dash] TikTok feed response:", JSON.stringify(feedRes, null, 2).slice(0, 2000));

  // Extract follower count from wherever it might be in the response
  const followerCount = deepFind(userRes, "followerCount")
    ?? deepFind(userRes, "follower_count")
    ?? deepFind(userRes, "followers")
    ?? 0;

  // Find the array of videos in the response — could be nested various ways
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawVideos: any[] = [];
  if (Array.isArray(feedRes)) {
    rawVideos = feedRes;
  } else if (Array.isArray(feedRes.data?.videos)) {
    rawVideos = feedRes.data.videos;
  } else if (Array.isArray(feedRes.data)) {
    rawVideos = feedRes.data;
  } else if (Array.isArray(feedRes.videos)) {
    rawVideos = feedRes.videos;
  } else if (Array.isArray(feedRes.items)) {
    rawVideos = feedRes.items;
  } else if (Array.isArray(feedRes.itemList)) {
    rawVideos = feedRes.itemList;
  } else if (feedRes.data && typeof feedRes.data === "object") {
    // Last resort: look for any array in data
    for (const val of Object.values(feedRes.data)) {
      if (Array.isArray(val) && val.length > 0) {
        rawVideos = val;
        break;
      }
    }
  }

  console.log(`[Social Dash] Found ${rawVideos.length} raw videos, first item keys:`, rawVideos[0] ? Object.keys(rawVideos[0]) : "none");

  const posts = rawVideos
    .map((v) => normalizeVideo(v, cleanUsername))
    .filter((p): p is Post => p !== null);

  const totalViews = posts.reduce((s, p) => s + p.metrics.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.metrics.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.metrics.comments, 0);
  const totalShares = posts.reduce((s, p) => s + p.metrics.shares, 0);

  const summary: PlatformSummary = {
    platform: "tiktok",
    followerCount: typeof followerCount === "number" ? followerCount : parseInt(followerCount) || 0,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    avgEngagementRate:
      posts.length > 0
        ? posts.reduce((s, p) => s + p.metrics.engagementRate, 0) / posts.length
        : 0,
    postCount: posts.length,
  };

  return { posts, summary };
}

export async function testTikTokConnection(
  apiKey: string,
  host: string = DEFAULT_TIKTOK_HOST
): Promise<boolean> {
  const headers = rapidApiHeaders(apiKey, host);
  const endpoints = [
    `https://${host}/user/info?unique_id=tiktok`,
    `https://${host}/user/info?username=tiktok`,
  ];
  for (const url of endpoints) {
    try {
      await fetchJson(url, { headers });
      return true;
    } catch {
      continue;
    }
  }
  return false;
}
