import type { Platform } from "@/services/types";

export const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "var(--color-youtube)",
  tiktok: "var(--color-tiktok)",
  instagram: "var(--color-instagram)",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

export const PLATFORM_ACCENT_CLASSES: Record<Platform, string> = {
  youtube: "text-youtube",
  tiktok: "text-tiktok",
  instagram: "text-instagram",
};

export const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
