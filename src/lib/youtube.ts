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
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${await res.text()}`);
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

type YtSearch = {
  items?: Array<{ id?: { videoId?: string } }>;
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
    const data = await ytGet<YtChannels>("channels", {
      part: "snippet,statistics",
      forHandle: handle,
      maxResults: 1
    });
    const first = data.items?.[0];
    if (!first) throw new Error("YouTube channel not found for handle");
    return { channelId: first.id, channel: first };
  }
  return { channelId: identifier.trim() };
}

export async function fetchYouTubeChannelWithVideos(channelId: string, limit: number) {
  const channelData = await ytGet<YtChannels>("channels", {
    part: "snippet,statistics",
    id: channelId,
    maxResults: 1
  });
  const channel = channelData.items?.[0];
  if (!channel) throw new Error("YouTube channel not found");

  const searchData = await ytGet<YtSearch>("search", {
    part: "id",
    channelId,
    order: "date",
    type: "video",
    maxResults: limit
  });

  const ids = (searchData.items ?? [])
    .map((i) => i.id?.videoId)
    .filter((x): x is string => Boolean(x));

  if (ids.length === 0) {
    return { channel, videos: [] as YtVideos["items"] };
  }

  const videosData = await ytGet<YtVideos>("videos", {
    part: "snippet,statistics,contentDetails",
    id: ids.join(",")
  });

  return { channel, videos: videosData.items ?? [] };
}
