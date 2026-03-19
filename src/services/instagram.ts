import { fetchJson, rapidApiHeaders } from "./api-client";
import type { Post, PlatformSummary, PostMetrics } from "./types";

export const DEFAULT_INSTAGRAM_HOST = "instagram-looter2.p.rapidapi.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNum(obj: any, ...keys: string[]): number {
  if (!obj || typeof obj !== "object") return 0;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseInt(v) || 0;
  }
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePost(p: any, username: string): Post | null {
  if (!p || typeof p !== "object") return null;

  const id = String(p.id ?? p.pk ?? p.media_id ?? "");
  if (!id) return null;

  const views = extractNum(p, "play_count", "video_view_count", "view_count");
  const likes = extractNum(p, "like_count", "likes");
  const comments = extractNum(p, "comment_count", "comments");
  const shares = extractNum(p, "reshare_count", "share_count");
  const estimatedViews = views || likes * 10;

  const metrics: PostMetrics = {
    views: estimatedViews,
    likes,
    comments,
    shares,
    engagementRate: estimatedViews > 0 ? ((likes + comments + shares) / estimatedViews) * 100 : 0,
  };

  // Caption can be nested or a string
  const rawCaption = p.caption;
  let title = "Untitled";
  if (typeof rawCaption === "string") {
    title = rawCaption.slice(0, 80);
  } else if (rawCaption && typeof rawCaption === "object" && rawCaption.text) {
    title = String(rawCaption.text).slice(0, 80);
  }

  // Thumbnail from various locations
  const thumbnail =
    p.image_versions2?.candidates?.[0]?.url ||
    p.thumbnail_url ||
    p.display_url ||
    p.image_url ||
    p.thumbnail ||
    p.cover ||
    (p.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url) ||
    "";

  const code = p.code ?? p.shortcode ?? "";
  const url = code
    ? `https://instagram.com/p/${code}`
    : `https://instagram.com/${username}`;

  let publishedAt = "";
  const rawTime = p.taken_at ?? p.timestamp ?? p.created_at ?? 0;
  if (rawTime) {
    const ts = typeof rawTime === "string" ? parseInt(rawTime) : rawTime;
    publishedAt = new Date(ts < 1e12 ? ts * 1000 : ts).toISOString();
  }

  return {
    id,
    platform: "instagram",
    title: title || "Untitled",
    url,
    thumbnailUrl: thumbnail,
    publishedAt,
    metrics,
  };
}

export async function fetchInstagramData(
  apiKey: string,
  username: string,
  host: string = DEFAULT_INSTAGRAM_HOST
): Promise<{ posts: Post[]; summary: PlatformSummary }> {
  const cleanUsername = username.replace("@", "").trim();
  const headers = rapidApiHeaders(apiKey, host);

  // Step 1: Get user profile to find user ID + follower count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileRes = await fetchJson<any>(
    `https://${host}/profile?username=${cleanUsername}`,
    { headers }
  );

  console.log("[Social Dash] Instagram profile response:", JSON.stringify(profileRes, null, 2).slice(0, 3000));

  // Extract user ID and follower count — search common locations
  const userId =
    profileRes.pk ?? profileRes.id ?? profileRes.user_id ??
    profileRes.data?.pk ?? profileRes.data?.id ??
    profileRes.user?.pk ?? profileRes.user?.id ?? null;

  const followerCount =
    profileRes.follower_count ?? profileRes.followers ??
    profileRes.data?.follower_count ?? profileRes.data?.followers ??
    profileRes.user?.follower_count ?? profileRes.user?.followers ?? 0;

  if (!userId) {
    throw new Error(`Could not find Instagram user ID for "${cleanUsername}". Check the username.`);
  }

  // Step 2: Get user feed using their numeric ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feedRes = await fetchJson<any>(
    `https://${host}/user-feeds?id=${userId}&count=12`,
    { headers }
  );

  console.log("[Social Dash] Instagram feed response:", JSON.stringify(feedRes, null, 2).slice(0, 3000));

  // Find the array of posts in the response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawItems: any[] = [];
  if (Array.isArray(feedRes)) {
    rawItems = feedRes;
  } else if (Array.isArray(feedRes.items)) {
    rawItems = feedRes.items;
  } else if (Array.isArray(feedRes.data)) {
    rawItems = feedRes.data;
  } else if (Array.isArray(feedRes.feed?.items)) {
    rawItems = feedRes.feed.items;
  } else if (Array.isArray(feedRes.media)) {
    rawItems = feedRes.media;
  } else if (feedRes.data && typeof feedRes.data === "object") {
    for (const val of Object.values(feedRes.data)) {
      if (Array.isArray(val) && val.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawItems = val as any[];
        break;
      }
    }
  }

  console.log(`[Social Dash] Found ${rawItems.length} raw IG posts, first item keys:`, rawItems[0] ? Object.keys(rawItems[0]) : "none");

  const posts = rawItems
    .map((p) => normalizePost(p, cleanUsername))
    .filter((p): p is Post => p !== null);

  const totalViews = posts.reduce((s, p) => s + p.metrics.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.metrics.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.metrics.comments, 0);
  const totalShares = posts.reduce((s, p) => s + p.metrics.shares, 0);

  const summary: PlatformSummary = {
    platform: "instagram",
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

export async function testInstagramConnection(
  apiKey: string,
  host: string = DEFAULT_INSTAGRAM_HOST
): Promise<boolean> {
  try {
    const headers = rapidApiHeaders(apiKey, host);
    await fetchJson(`https://${host}/profile?username=instagram`, { headers });
    return true;
  } catch {
    return false;
  }
}
