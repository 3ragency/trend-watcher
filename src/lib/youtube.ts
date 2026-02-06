import { getEnv } from "@/lib/env";

const BASE = "https://www.googleapis.com/youtube/v3";

function toQuery(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

async function ytGet<T>(path: string, params: Record<string, string | number | undefined>) {
  const env = getEnv();
  if (!env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not set");
  const url = `${BASE}/${path}?${toQuery({ ...params, key: env.YOUTUBE_API_KEY })}`;
  const safeUrl = url.replace(/([?&]key=)[^&]+/, "$1***");
  console.log(`[youtube] GET ${safeUrl}`);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[youtube] API error ${res.status} ${res.statusText}: ${safeUrl} :: ${text.slice(0, 2000)}`);
    throw new Error(`YouTube API error: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export function extractYouTubeChannelId(input: string): { channelId?: string; handle?: string } {
  const s = input.trim();
  const m1 = s.match(/(UC[0-9A-Za-z_-]{20,})/);
  if (m1?.[1]) return { channelId: m1[1] };

  const m2 = s.match(/youtube\.com\/@([^/?#]+)/i);
  if (m2?.[1]) return { handle: m2[1] };

  const m3 = s.match(/@([^\s/]+)/);
  if (m3?.[1]) return { handle: m3[1].replace(/^@/, "") };

  return {};
}

export function parseIsoDurationSeconds(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return undefined;
  const h = m[1] ? Number(m[1]) : 0;
  const min = m[2] ? Number(m[2]) : 0;
  const sec = m[3] ? Number(m[3]) : 0;
  return h * 3600 + min * 60 + sec;
}

type YtChannels = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      customUrl?: string;
      description?: string;
      thumbnails?: { default?: { url?: string }; medium?: { url?: string }; high?: { url?: string } };
    };
    statistics?: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
    };
  }>;
};

type YtPlaylistItems = {
  items?: Array<{
    snippet?: {
      resourceId?: { videoId?: string };
    };
  }>;
  nextPageToken?: string;
};

type YtVideos = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    contentDetails?: {
      duration?: string;
    };
  }>;
};

export async function resolveYouTubeChannel(identifier: string) {
  const { channelId, handle } = extractYouTubeChannelId(identifier);
  if (channelId) return { channelId };
  if (handle) {
    const forHandle = handle.startsWith("@") ? handle : `@${handle}`;
    const data = await ytGet<YtChannels>("channels", {
      part: "snippet,statistics",
      forHandle,
      maxResults: 1
    });
    const first = data.items?.[0];
    if (!first) throw new Error("YouTube channel not found for handle");
    return { channelId: first.id, channel: first };
  }
  return { channelId: identifier.trim() };
}

export async function fetchYouTubeChannelWithVideos(
  channelId: string,
  limit: number,
  pageToken?: string
) {
  console.log(`[youtube] fetchYouTubeChannelWithVideos channelId=${channelId} limit=${limit} pageToken=${pageToken ?? "none"}`);
  const channelData = await ytGet<YtChannels>("channels", {
    part: "snippet,statistics",
    id: channelId,
    maxResults: 1
  });
  const channel = channelData.items?.[0];
  if (!channel) throw new Error("YouTube channel not found");
  console.log(`[youtube] channel resolved id=${channel.id} title=${channel.snippet?.title ?? ""}`);

  // Convert channel ID to uploads playlist ID (replace UC with UU)
  const uploadsPlaylistId = channelId.replace(/^UC/, "UU");

  const playlistParams: Record<string, string | number | undefined> = {
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: limit
  };

  if (pageToken) {
    playlistParams.pageToken = pageToken;
  }

  const playlistData = await ytGet<YtPlaylistItems>("playlistItems", playlistParams);

  console.log(`[youtube] playlistItems returned ${(playlistData.items ?? []).length} items, nextPageToken=${playlistData.nextPageToken ?? "none"}`);

  const ids = (playlistData.items ?? [])
    .map((i) => i.snippet?.resourceId?.videoId)
    .filter((x): x is string => Boolean(x));

  if (ids.length === 0) {
    console.log("[youtube] playlistItems returned 0 video ids");
    return { channel, videos: [] as YtVideos["items"], nextPageToken: playlistData.nextPageToken };
  }

  console.log(`[youtube] loading videos count=${ids.length}`);

  const videosData = await ytGet<YtVideos>("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids.join(",")
  });

  console.log(`[youtube] videos loaded count=${(videosData.items ?? []).length}`);

  return { channel, videos: videosData.items ?? [], nextPageToken: playlistData.nextPageToken };
}

/**
 * Fetch YouTube Shorts for a channel using the unofficial UUSH playlist.
 * YouTube Shorts are stored in a hidden playlist accessible by replacing "UC" with "UUSH" in the channel ID.
 */
export async function fetchYouTubeChannelShorts(
  channelId: string,
  limit: number,
  pageToken?: string
) {
  console.log(`[youtube] fetchYouTubeChannelShorts channelId=${channelId} limit=${limit} pageToken=${pageToken ?? "none"}`);

  // Convert channel ID to Shorts playlist ID (replace UC with UUSH)
  const shortsPlaylistId = channelId.replace(/^UC/, "UUSH");

  const playlistParams: Record<string, string | number | undefined> = {
    part: "snippet",
    playlistId: shortsPlaylistId,
    maxResults: limit
  };

  if (pageToken) {
    playlistParams.pageToken = pageToken;
  }

  try {
    const playlistData = await ytGet<YtPlaylistItems>("playlistItems", playlistParams);

    console.log(`[youtube] shortsPlaylistItems returned ${(playlistData.items ?? []).length} items, nextPageToken=${playlistData.nextPageToken ?? "none"}`);

    const ids = (playlistData.items ?? [])
      .map((i) => i.snippet?.resourceId?.videoId)
      .filter((x): x is string => Boolean(x));

    if (ids.length === 0) {
      console.log("[youtube] shortsPlaylistItems returned 0 video ids");
      return { shorts: [] as YtVideos["items"], nextPageToken: playlistData.nextPageToken };
    }

    console.log(`[youtube] loading shorts count=${ids.length}`);

    const videosData = await ytGet<YtVideos>("videos", {
      part: "snippet,statistics,contentDetails",
      id: ids.join(",")
    });

    console.log(`[youtube] shorts loaded count=${(videosData.items ?? []).length}`);

    return { shorts: videosData.items ?? [], nextPageToken: playlistData.nextPageToken };
  } catch (err) {
    // If the UUSH playlist doesn't exist (404), return empty result
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("404") || message.includes("playlistNotFound")) {
      console.log(`[youtube] no Shorts playlist found for channel ${channelId}`);
      return { shorts: [], nextPageToken: undefined };
    }
    throw err;
  }
}

