import type { Channel, Video } from "@prisma/client";

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

export type VideoDto = {
  id: string;
  platform: string;
  externalId: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  viewsCount: string;
  likesCount: string;
  commentsCount: string;
  channelId: string;
  channelName: string | null;
  channelHandle: string | null;
};

type VideoWithChannel = Video & { channel: Channel };

export function toVideoDto(v: VideoWithChannel): VideoDto {
  return {
    id: v.id,
    platform: v.platform,
    externalId: v.externalId,
    url: v.url,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt ? v.publishedAt.toISOString() : null,
    viewsCount: (v.viewsCount ?? 0n).toString(),
    likesCount: (v.likesCount ?? 0n).toString(),
    commentsCount: (v.commentsCount ?? 0n).toString(),
    channelId: v.channelId,
    channelName: v.channel.displayName,
    channelHandle: v.channel.handle
  };
}
