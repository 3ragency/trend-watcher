import type { Channel } from "@prisma/client";

export type ChannelDto = {
  id: string;
  platform: Channel["platform"];
  externalId: string;
  displayName: string | null;
  handle: string | null;
  url: string | null;
  avatarUrl: string | null;
  subscribersCount: string;
  totalViewsCount: string;
  videosCount: number | null;
  lastFetchedAt: string | null;
};

export function toChannelDto(c: Channel): ChannelDto {
  return {
    id: c.id,
    platform: c.platform,
    externalId: c.externalId,
    displayName: c.displayName,
    handle: c.handle,
    url: c.url,
    avatarUrl: c.avatarUrl,
    subscribersCount: (c.subscribersCount ?? 0n).toString(),
    totalViewsCount: (c.totalViewsCount ?? 0n).toString(),
    videosCount: c.videosCount,
    lastFetchedAt: c.lastFetchedAt ? c.lastFetchedAt.toISOString() : null
  };
}
