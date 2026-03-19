import { fetchJson } from "./api-client";
import type { Post, PlatformSummary, PostMetrics } from "./types";

const BASE = "https://www.googleapis.com/youtube/v3";

interface YTChannel {
  items: {
    id: string;
    snippet: { title: string; thumbnails: { default: { url: string } } };
    statistics: {
      viewCount: string;
      subscriberCount: string;
      videoCount: string;
    };
  }[];
}

interface YTSearchItem {
  id: { videoId: string };
}

interface YTVideo {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: { medium: { url: string } };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export async function fetchYouTubeData(
  apiKey: string,
  channelIdentifier: string
): Promise<{ posts: Post[]; summary: PlatformSummary }> {
  const clean = channelIdentifier.replace("@", "").trim();
  const isChannelId = clean.startsWith("UC") && clean.length === 24;

  let channel: YTChannel | null = null;

  if (isChannelId) {
    channel = await fetchJson<YTChannel>(
      `${BASE}/channels?id=${clean}&part=snippet,statistics&key=${apiKey}`
    );
  } else {
    // Try forHandle first, then forUsername as fallback
    channel = await fetchJson<YTChannel>(
      `${BASE}/channels?forHandle=${clean}&part=snippet,statistics&key=${apiKey}`
    );
    if (!channel.items?.length) {
      channel = await fetchJson<YTChannel>(
        `${BASE}/channels?forUsername=${clean}&part=snippet,statistics&key=${apiKey}`
      );
    }
  }

  if (!channel?.items?.length) throw new Error("YouTube channel not found. Try using the channel ID (starts with UC) instead.");

  const ch = channel.items[0]!;
  const channelId = ch.id;

  // Get recent videos
  const searchRes = await fetchJson<{ items: YTSearchItem[] }>(
    `${BASE}/search?channelId=${channelId}&order=date&type=video&maxResults=12&part=id&key=${apiKey}`
  );

  const videoIds = searchRes.items.map((i) => i.id.videoId).join(",");

  const videosRes = await fetchJson<{ items: YTVideo[] }>(
    `${BASE}/videos?id=${videoIds}&part=snippet,statistics&key=${apiKey}`
  );

  const posts: Post[] = videosRes.items.map((v) => {
    const views = parseInt(v.statistics.viewCount) || 0;
    const likes = parseInt(v.statistics.likeCount) || 0;
    const comments = parseInt(v.statistics.commentCount) || 0;
    const metrics: PostMetrics = {
      views,
      likes,
      comments,
      shares: 0,
      engagementRate: views > 0 ? ((likes + comments) / views) * 100 : 0,
    };
    return {
      id: v.id,
      platform: "youtube",
      title: v.snippet.title,
      url: `https://youtube.com/watch?v=${v.id}`,
      thumbnailUrl: v.snippet.thumbnails.medium.url,
      publishedAt: v.snippet.publishedAt,
      metrics,
    };
  });

  const totalViews = posts.reduce((s, p) => s + p.metrics.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.metrics.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.metrics.comments, 0);

  const summary: PlatformSummary = {
    platform: "youtube",
    followerCount: parseInt(ch.statistics.subscriberCount) || 0,
    totalViews,
    totalLikes,
    totalComments,
    totalShares: 0,
    avgEngagementRate:
      posts.length > 0
        ? posts.reduce((s, p) => s + p.metrics.engagementRate, 0) /
          posts.length
        : 0,
    postCount: posts.length,
  };

  return { posts, summary };
}

export async function testYouTubeConnection(apiKey: string): Promise<boolean> {
  try {
    // Use a simple public lookup to verify the key works
    await fetchJson(`${BASE}/channels?part=id&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${apiKey}`);
    return true;
  } catch {
    return false;
  }
}
