import { prisma } from "@/lib/db";
import { requirePageUserId } from "@/lib/session";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await requirePageUserId();

  // =====================
  // YOUTUBE DATA
  // =====================

  // Fetch YouTube channels with aggregated video stats
  const youtubeChannels = await prisma.channel.findMany({
    where: { userId, platform: "YOUTUBE" },
    orderBy: { createdAt: "desc" }
  });

  // Get video stats per YouTube channel
  const youtubeChannelVideoStats = await prisma.video.groupBy({
    by: ["channelId"],
    where: { userId, platform: "YOUTUBE" },
    _sum: {
      likesCount: true,
      commentsCount: true
    }
  });

  // Get Shorts count per YouTube channel
  const youtubeShortsPerChannel = await prisma.video.groupBy({
    by: ["channelId"],
    where: { userId, platform: "YOUTUBE", isShort: true },
    _count: true
  });

  const youtubeShortsMap = new Map(
    youtubeShortsPerChannel.map((s) => [
      s.channelId,
      typeof s._count === "number" ? s._count : 0
    ])
  );

  const youtubeStatsMap = new Map(
    youtubeChannelVideoStats.map((s) => [
      s.channelId,
      {
        likesCount: (s._sum.likesCount ?? 0n).toString(),
        commentsCount: (s._sum.commentsCount ?? 0n).toString()
      }
    ])
  );

  const youtubeChannelsData = youtubeChannels.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    avatarUrl: c.avatarUrl,
    subscribersCount: (c.subscribersCount ?? 0n).toString(),
    totalViewsCount: (c.totalViewsCount ?? 0n).toString(),
    videosCount: c.videosCount,
    shortsCount: youtubeShortsMap.get(c.id) ?? 0,
    likesCount: youtubeStatsMap.get(c.id)?.likesCount ?? "0",
    commentsCount: youtubeStatsMap.get(c.id)?.commentsCount ?? "0"
  }));

  // Aggregate metrics from YouTube channels
  const youtubeChannelAgg = await prisma.channel.aggregate({
    where: { userId, platform: "YOUTUBE" },
    _sum: {
      subscribersCount: true,
      totalViewsCount: true,
      videosCount: true
    }
  });

  // Get likes from fetched YouTube videos
  const youtubeVideoAgg = await prisma.video.aggregate({
    where: { userId, platform: "YOUTUBE" },
    _sum: {
      likesCount: true
    }
  });

  // YouTube Favorites
  const youtubeFavorites = await prisma.favorite.findMany({
    where: { userId, platform: "YOUTUBE" },
    orderBy: { createdAt: "desc" }
  });

  const youtubeFavoritesData = youtubeFavorites.map((f) => ({
    id: f.id,
    videoId: f.videoId,
    title: f.title ?? "",
    thumbnailUrl: f.thumbnailUrl ?? "",
    channelName: f.channelName ?? "",
    viewsCount: f.viewsCount ?? "0",
    likesCount: f.likesCount ?? "0",
    commentsCount: f.commentsCount ?? "0",
    addedAt: f.createdAt.toISOString(),
    durationSeconds: f.durationSeconds,
    transcript: f.transcript
  }));

  // Count actual YouTube videos in database (regular videos, not shorts)
  const actualYouTubeVideosCount = await prisma.video.count({
    where: { userId, platform: "YOUTUBE", isShort: false }
  });

  // Count YouTube Shorts in database
  const youtubeShortsCount = await prisma.video.count({
    where: { userId, platform: "YOUTUBE", isShort: true }
  });

  // Total videos on YouTube channels (from API metadata)
  const totalYouTubeVideosCount = Number(youtubeChannelAgg._sum.videosCount ?? 0);

  // =====================
  // INSTAGRAM DATA
  // =====================

  // Fetch Instagram accounts
  const instagramAccounts = await prisma.channel.findMany({
    where: { userId, platform: "INSTAGRAM" },
    orderBy: { createdAt: "desc" }
  });

  // Get video (reels) stats per Instagram account
  const instagramAccountVideoStats = await prisma.video.groupBy({
    by: ["channelId"],
    where: { userId, platform: "INSTAGRAM" },
    _sum: {
      viewsCount: true,
      likesCount: true,
      commentsCount: true
    },
    _count: {
      id: true
    }
  });

  const instagramStatsMap = new Map(
    instagramAccountVideoStats.map((s) => [
      s.channelId,
      {
        reelsViewsCount: (s._sum.viewsCount ?? 0n).toString(),
        likesCount: (s._sum.likesCount ?? 0n).toString(),
        commentsCount: (s._sum.commentsCount ?? 0n).toString(),
        postsCount: s._count.id
      }
    ])
  );

  const instagramAccountsData = instagramAccounts.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    handle: c.handle,
    avatarUrl: c.avatarUrl,
    subscribersCount: (c.subscribersCount ?? 0n).toString(),
    postsCount: instagramStatsMap.get(c.id)?.postsCount ?? 0,
    reelsViewsCount: instagramStatsMap.get(c.id)?.reelsViewsCount ?? "0",
    likesCount: instagramStatsMap.get(c.id)?.likesCount ?? "0",
    commentsCount: instagramStatsMap.get(c.id)?.commentsCount ?? "0",
    repostsCount: "0" // Instagram API doesn't provide reposts, placeholder for now
  }));

  // Aggregate metrics from Instagram accounts
  const instagramChannelAgg = await prisma.channel.aggregate({
    where: { userId, platform: "INSTAGRAM" },
    _sum: {
      subscribersCount: true
    }
  });

  // Get reels/videos stats from fetched Instagram content
  const instagramVideoAgg = await prisma.video.aggregate({
    where: { userId, platform: "INSTAGRAM" },
    _sum: {
      viewsCount: true,
      likesCount: true,
      commentsCount: true
    }
  });

  // Count Instagram reels/posts in database
  const instagramReelsCount = await prisma.video.count({
    where: { userId, platform: "INSTAGRAM" }
  });

  return (
    <DashboardClient
      youtubeData={{
        channelsCount: youtubeChannels.length,
        videosCount: actualYouTubeVideosCount,
        totalYouTubeVideosCount,
        shortsCount: youtubeShortsCount,
        subscribersCount: (youtubeChannelAgg._sum.subscribersCount ?? 0n).toString(),
        viewsCount: (youtubeChannelAgg._sum.totalViewsCount ?? 0n).toString(),
        likesCount: (youtubeVideoAgg._sum.likesCount ?? 0n).toString(),
        channels: youtubeChannelsData,
        favorites: youtubeFavoritesData,
        favoritesCount: youtubeFavorites.length
      }}
      instagramData={{
        accountsCount: instagramAccounts.length,
        totalSubscribersCount: (instagramChannelAgg._sum.subscribersCount ?? 0n).toString(),
        reelsCount: instagramReelsCount,
        reelsViewsCount: (instagramVideoAgg._sum.viewsCount ?? 0n).toString(),
        likesCount: (instagramVideoAgg._sum.likesCount ?? 0n).toString(),
        commentsCount: (instagramVideoAgg._sum.commentsCount ?? 0n).toString(),
        repostsCount: "0", // Not available from Instagram API
        accounts: instagramAccountsData
      }}
    />
  );
}
