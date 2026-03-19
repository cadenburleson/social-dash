import { useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Trash2, ExternalLink, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useSettingsStore } from "@/store";
import { PLATFORM_LABELS } from "@/lib/constants";
import { testYouTubeConnection } from "@/services/youtube";
import { testTikTokConnection, DEFAULT_TIKTOK_HOST } from "@/services/tiktok";
import { testInstagramConnection, DEFAULT_INSTAGRAM_HOST } from "@/services/instagram";
import { fetchJson, rapidApiHeaders } from "@/services/api-client";
import type { Platform } from "@/services/types";

const identifierLabels: Record<Platform, string> = {
  youtube: "Channel name or ID (e.g. @MrBeast or UCX6OQ3...)",
  tiktok: "Username (e.g. @charlidamelio)",
  instagram: "Username (e.g. @instagram)",
};

const keyLabels: Record<Platform, string> = {
  youtube: "Google API Key",
  tiktok: "RapidAPI Key",
  instagram: "RapidAPI Key",
};

const defaultHosts: Record<Platform, string> = {
  youtube: "",
  tiktok: DEFAULT_TIKTOK_HOST,
  instagram: DEFAULT_INSTAGRAM_HOST,
};

const setupGuides: Record<Platform, { url: string; steps: string[] }> = {
  youtube: {
    url: "https://console.cloud.google.com/apis/credentials",
    steps: [
      "Go to Google Cloud Console \u2192 create or select a project",
      'Go to APIs & Services \u2192 Library \u2192 search "YouTube Data API v3" \u2192 click Enable',
      "Go to APIs & Services \u2192 Credentials \u2192 click \"+ CREATE CREDENTIALS\" \u2192 select \"API key\" (not OAuth)",
      "A popup will show your new key \u2014 copy it and paste it below",
    ],
  },
  tiktok: {
    url: "https://rapidapi.com/search/tiktok%20data",
    steps: [
      "Create a free RapidAPI account and search for a TikTok API (e.g. \"TikTok Scraper\", \"TikTok Data\")",
      "Subscribe to a plan (most have a free tier)",
      "On the API page, click any endpoint \u2192 look at the Code Snippets panel on the right",
      "Set Target: Shell, Client: cURL \u2014 copy the x-rapidapi-key value from the snippet",
      "Also copy the x-rapidapi-host value (e.g. tiktok-scraper7.p.rapidapi.com) and paste it in the Host field below",
    ],
  },
  instagram: {
    url: "https://rapidapi.com/search/instagram%20data",
    steps: [
      "Create a free RapidAPI account (or use your existing one \u2014 same key works across APIs)",
      "Search for an Instagram API (e.g. \"Instagram Data\") and subscribe to a plan",
      "On the API page, click any endpoint \u2192 look at the Code Snippets panel on the right",
      "Set Target: Shell, Client: cURL \u2014 copy the x-rapidapi-key value from the snippet",
      "Also copy the x-rapidapi-host value and paste it in the Host field below",
    ],
  },
};

export function ApiKeyForm({ platform }: { platform: Platform }) {
  const config = useSettingsStore((s) => s.platforms[platform]);
  const setPlatformConfig = useSettingsStore((s) => s.setPlatformConfig);
  const clearPlatformConfig = useSettingsStore((s) => s.clearPlatformConfig);

  const [apiKey, setApiKey] = useState(config.apiKey);
  const [identifier, setIdentifier] = useState(config.identifier);
  const [rapidApiHost, setRapidApiHost] = useState(config.rapidApiHost || defaultHosts[platform]);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [debugJson, setDebugJson] = useState<string | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const showHostField = platform === "tiktok" || platform === "instagram";

  const handleSave = () => {
    setPlatformConfig(platform, {
      apiKey,
      identifier,
      ...(showHostField && { rapidApiHost }),
    });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      let ok = false;
      if (platform === "youtube") {
        ok = await testYouTubeConnection(apiKey);
      } else if (platform === "tiktok") {
        ok = await testTikTokConnection(apiKey, rapidApiHost || DEFAULT_TIKTOK_HOST);
      } else {
        ok = await testInstagramConnection(apiKey, rapidApiHost || DEFAULT_INSTAGRAM_HOST);
      }
      setPlatformConfig(platform, {
        apiKey,
        identifier,
        ...(showHostField && { rapidApiHost }),
        isConnected: ok,
        lastSynced: ok ? new Date().toISOString() : config.lastSynced,
      });
    } catch {
      setPlatformConfig(platform, { isConnected: false });
    }
    setTesting(false);
  };

  const handleDebugFetch = async () => {
    setDebugLoading(true);
    setDebugJson(null);
    try {
      const host = rapidApiHost || defaultHosts[platform];
      const cleanId = identifier.replace("@", "").trim();
      let url = "";

      if (platform === "youtube") {
        const isChannelId = cleanId.startsWith("UC") && cleanId.length === 24;
        const param = isChannelId ? `id=${cleanId}` : `forHandle=${cleanId}`;
        url = `https://www.googleapis.com/youtube/v3/channels?${param}&part=snippet,statistics&key=${apiKey}`;
        const res = await fetchJson(url);
        setDebugJson(JSON.stringify(res, null, 2));
      } else if (platform === "tiktok") {
        const headers = rapidApiHeaders(apiKey, host);
        const endpoints = [
          `https://${host}/user/info?unique_id=${cleanId}`,
          `https://${host}/user/info?username=${cleanId}`,
        ];
        let res = null;
        let usedUrl = "";
        for (const ep of endpoints) {
          try {
            res = await fetchJson(ep, { headers });
            usedUrl = ep;
            break;
          } catch { continue; }
        }

        const feedEndpoints = [
          `https://${host}/user/posts?unique_id=${cleanId}&count=2`,
          `https://${host}/user/posts?username=${cleanId}&count=2`,
        ];
        let feedRes = null;
        let feedUrl = "";
        for (const ep of feedEndpoints) {
          try {
            feedRes = await fetchJson(ep, { headers });
            feedUrl = ep;
            break;
          } catch { continue; }
        }

        setDebugJson(JSON.stringify({
          _userEndpoint: usedUrl,
          _feedEndpoint: feedUrl,
          userResponse: res,
          feedResponse: feedRes,
        }, null, 2));
      } else {
        // Instagram — use profile + user-feeds endpoints
        const headers = rapidApiHeaders(apiKey, host);
        const profileUrl = `https://${host}/profile?username=${cleanId}`;
        let profileRes = null;
        try {
          profileRes = await fetchJson(profileUrl, { headers });
        } catch (e) {
          setDebugJson(`Profile fetch failed: ${e instanceof Error ? e.message : String(e)}`);
          setDebugLoading(false);
          return;
        }

        // Extract user ID to fetch feed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pr = profileRes as any;
        const userId = pr?.pk ?? pr?.id ?? pr?.data?.pk ?? pr?.data?.id ?? pr?.user?.pk ?? pr?.user?.id ?? null;

        let feedRes = null;
        let feedUrl = "";
        if (userId) {
          feedUrl = `https://${host}/user-feeds?id=${userId}&count=2`;
          try {
            feedRes = await fetchJson(feedUrl, { headers });
          } catch { /* ignore */ }
        }

        setDebugJson(JSON.stringify({
          _profileEndpoint: profileUrl,
          _feedEndpoint: feedUrl,
          _extractedUserId: userId,
          profileResponse: profileRes,
          feedResponse: feedRes,
        }, null, 2));
      }
    } catch (err) {
      setDebugJson(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setDebugLoading(false);
  };

  const handleClear = () => {
    clearPlatformConfig(platform);
    setApiKey("");
    setIdentifier("");
    setRapidApiHost(defaultHosts[platform]);
    setDebugJson(null);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <PlatformIcon platform={platform} />
            {PLATFORM_LABELS[platform]}
          </span>
          {config.isConnected ? (
            <Badge variant="success">Connected</Badge>
          ) : config.apiKey ? (
            <Badge variant="destructive">Disconnected</Badge>
          ) : (
            <Badge variant="secondary">Not configured</Badge>
          )}
        </CardTitle>
        <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium mb-2">How to get your key:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            {setupGuides[platform].steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <a
            href={setupGuides[platform].url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-sidebar-primary hover:underline"
          >
            Open {platform === "youtube" ? "Google Cloud Console" : "RapidAPI"}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {keyLabels[platform]}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {showHostField && (
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              RapidAPI Host
              <span className="text-xs ml-1">(from x-rapidapi-host in the code snippet)</span>
            </label>
            <Input
              value={rapidApiHost}
              onChange={(e) => setRapidApiHost(e.target.value)}
              placeholder={defaultHosts[platform]}
            />
          </div>
        )}

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {identifierLabels[platform]}
          </label>
          <Input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter username or channel..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={!apiKey}>
            Save
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={!apiKey || testing}>
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : config.isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Test Connection
          </Button>
          <Button
            variant="outline"
            onClick={handleDebugFetch}
            disabled={!apiKey || !identifier || debugLoading}
          >
            {debugLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bug className="h-4 w-4" />
            )}
            Preview API Response
          </Button>
          {config.apiKey && (
            <Button variant="ghost" size="icon" onClick={handleClear}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>

        {debugJson && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Raw API Response</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugJson(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
            <pre className="bg-black/50 rounded-lg p-4 text-xs text-green-400 overflow-auto max-h-96 whitespace-pre-wrap break-all">
              {debugJson}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
