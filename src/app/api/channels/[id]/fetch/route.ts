import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { runApifyActor, readApifyDatasetItems, guessApifyVideo, guessApifyProfile } from "@/lib/apify";
import { scrapeInstagramProfile, mapInstagramPost } from "@/lib/instagram";
import { getApiUserId } from "@/lib/session";
import {
  fetchYouTubeChannelWithVideos,
  parseIsoDurationSeconds
} from "@/lib/youtube";

function toBigInt(v: string | undefined) {
  if (!v) return undefined;
  try {
    return BigInt(v);
  } catch {
    return undefined;
  }
}

function parseMaybeDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const s = String(v);

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) {
      // guess seconds vs ms
      const ms = n < 10_000_000_000 ? n * 1000 : n;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  return undefined;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getApiUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: channelId } = await params;
  const channel = await prisma.channel.findFirst({ where: { id: channelId, userId } });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const env = getEnv();

  // Allow custom limit via query param
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const loadMore = url.searchParams.get("loadMore") === "true";
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || env.FETCH_LIMIT_PER_CHANNEL)) : env.FETCH_LIMIT_PER_CHANNEL;

  // Use stored pageToken for "load more" requests
  // If token is "__END__", there are no more videos to load
  if (loadMore && channel.nextPageToken === "__END__") {
    return NextResponse.json({
      itemsFetched: 0,
      message: "Все доступные видео уже загружены"
    });
  }
  const pageToken = loadMore ? (channel.nextPageToken ?? undefined) : undefined;

  try {
    if (channel.platform === "YOUTUBE") {
      console.log(
        `[fetch] youtube start userId=${userId} channelId=${channel.id} externalId=${channel.externalId} limit=${limit} loadMore=${loadMore} pageToken=${pageToken ?? "none"}`
      );
      const { channel: ytChannel, videos, nextPageToken } = await fetchYouTubeChannelWithVideos(
        channel.externalId,
        limit,
        pageToken
      );

      console.log(
        `[fetch] youtube done externalId=${channel.externalId} videos=${(videos ?? []).length} title=${ytChannel.snippet?.title ?? ""}`
      );

      const avatarUrl =
        ytChannel.snippet?.thumbnails?.high?.url ??
        ytChannel.snippet?.thumbnails?.medium?.url ??
        ytChannel.snippet?.thumbnails?.default?.url ??
        null;

      // For loadMore, only update nextPageToken
      // For full fetch, update all channel data
      // Use "__END__" marker when no more pages are available
      const tokenToSave = nextPageToken ?? "__END__";

      if (loadMore) {
        await prisma.channel.update({
          where: { id: channel.id },
          data: {
            nextPageToken: tokenToSave,
            lastFetchedAt: new Date()
          }
        });
      } else {
        await prisma.channel.update({
          where: { id: channel.id },
          data: {
            displayName: ytChannel.snippet?.title ?? null,
            handle: ytChannel.snippet?.customUrl ?? null,
            avatarUrl,
            subscribersCount: toBigInt(ytChannel.statistics?.subscriberCount) ?? null,
            totalViewsCount: toBigInt(ytChannel.statistics?.viewCount) ?? null,
            videosCount: ytChannel.statistics?.videoCount
              ? Number(ytChannel.statistics.videoCount)
              : null,
            nextPageToken: tokenToSave,
            lastFetchedAt: new Date(),
            raw: ytChannel as any
          }
        });
      }

      let itemsFetched = 0;
      for (const v of videos ?? []) {
        if (!v?.id) continue;
        const url = `https://www.youtube.com/watch?v=${v.id}`;
        const thumbnailUrl =
          v.snippet?.thumbnails?.high?.url ??
          v.snippet?.thumbnails?.medium?.url ??
          null;

        const publishedAt = parseMaybeDate(v.snippet?.publishedAt) ?? null;

        await prisma.video.upsert({
          where: {
            userId_platform_externalId: {
              userId,
              platform: "YOUTUBE",
              externalId: v.id
            }
          },
          update: {
            userId,
            url,
            title: v.snippet?.title ?? null,
            description: v.snippet?.description ?? null,
            thumbnailUrl,
            publishedAt,
            viewsCount: toBigInt(v.statistics?.viewCount) ?? null,
            likesCount: toBigInt(v.statistics?.likeCount) ?? null,
            commentsCount: toBigInt(v.statistics?.commentCount) ?? null,
            durationSeconds: parseIsoDurationSeconds(v.contentDetails?.duration) ?? null,
            raw: v as any,
            channelId: channel.id
          },
          create: {
            userId,
            platform: "YOUTUBE",
            externalId: v.id,
            url,
            title: v.snippet?.title ?? null,
            description: v.snippet?.description ?? null,
            thumbnailUrl,
            publishedAt,
            viewsCount: toBigInt(v.statistics?.viewCount) ?? null,
            likesCount: toBigInt(v.statistics?.likeCount) ?? null,
            commentsCount: toBigInt(v.statistics?.commentCount) ?? null,
            durationSeconds: parseIsoDurationSeconds(v.contentDetails?.duration) ?? null,
            raw: v as any,
            channelId: channel.id
          }
        });

        itemsFetched += 1;
      }
      console.log(
        `[fetch] youtube persisted userId=${userId} channelId=${channel.id} itemsFetched=${itemsFetched}`
      );
      return NextResponse.json({ ok: true, itemsFetched });
    }

    // Instagram via Instaloader (direct scraping)
    if (channel.platform === "INSTAGRAM") {
      // Extract username from URL or handle
      const rawProfile = channel.handle ?? channel.url ?? channel.externalId;
      let username = rawProfile.replace(/^@/, "");
      const igMatch = username.match(/instagram\.com\/([^\/\?]+)/i);
      if (igMatch) username = igMatch[1];

      console.log(
        `[fetch] instagram start userId=${userId} channelId=${channel.id} username=${username} limit=${limit}`
      );

      const result = await scrapeInstagramProfile(username, limit);

      if (!result.success) {
        const errorMsg = result.error || "Unknown error";
        console.error(
          `[fetch] instagram error userId=${userId} channelId=${channel.id} error=${errorMsg} errorCode=${result.error_code}`
        );
        throw new Error(`Ошибка парсинга Instagram: ${errorMsg}`);
      }

      // Extract profile data
      const profile = result.profile;
      if (profile) {
        await prisma.channel.update({
          where: { id: channel.id },
          data: {
            displayName: profile.full_name || profile.username,
            handle: profile.username,
            avatarUrl: profile.profile_pic_url,
            subscribersCount: BigInt(profile.followers),
            lastFetchedAt: new Date()
          }
        });
        console.log(
          `[fetch] instagram profile updated channelId=${channel.id} displayName=${profile.full_name} followers=${profile.followers}`
        );
      }

      // Process posts
      let itemsFetched = 0;
      const posts = result.posts || [];

      for (const post of posts) {
        const v = mapInstagramPost(post);
        if (!v.externalId || !v.url) continue;

        // Upsert video
        const toBigInt = (s: string | undefined) => (s ? BigInt(s) : null);
        const toDate = (s: string | undefined) => (s ? new Date(s) : new Date());

        await prisma.video.upsert({
          where: {
            userId_platform_externalId: {
              userId: userId,
              platform: channel.platform,
              externalId: v.externalId!
            }
          },
          update: {
            title: v.title ?? "",
            description: v.description,
            url: v.url!,
            thumbnailUrl: v.thumbnailUrl,
            viewsCount: toBigInt(v.viewsCount),
            likesCount: toBigInt(v.likesCount),
            commentsCount: toBigInt(v.commentsCount),
            publishedAt: toDate(v.publishedAt),
            raw: v.raw as any,
            channelId: channel.id
          },
          create: {
            channelId: channel.id,
            userId: userId,
            platform: channel.platform,
            externalId: v.externalId!,
            title: v.title ?? "",
            description: v.description,
            url: v.url!,
            thumbnailUrl: v.thumbnailUrl,
            viewsCount: toBigInt(v.viewsCount),
            likesCount: toBigInt(v.likesCount),
            commentsCount: toBigInt(v.commentsCount),
            publishedAt: toDate(v.publishedAt),
            raw: v.raw as any
          }
        });

        itemsFetched += 1;
      }

      console.log(
        `[fetch] instagram persisted userId=${userId} channelId=${channel.id} itemsFetched=${itemsFetched}`
      );

      return NextResponse.json({ ok: true, itemsFetched });
    }

    // Apify for TikTok only
    const actorId = env.APIFY_TIKTOK_ACTOR_ID;

    // Extract username from URL or handle
    const rawProfile = channel.handle ?? channel.url ?? channel.externalId;
    // Remove @ prefix and extract username from URL if needed
    let username = rawProfile.replace(/^@/, "");
    // Extract from TikTok URL: tiktok.com/@username
    const ttMatch = username.match(/tiktok\.com\/@?([^\/\?]+)/i);
    if (ttMatch) username = ttMatch[1];

    // Build input for TikTok
    const apifyInput = {
      profiles: [username],
      excludePinnedPosts: false,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadAvatars: false,
      shouldDownloadSlideshowImages: false,
      shouldDownloadSubtitles: false
    };

    console.log(
      `[fetch] apify start userId=${userId} channelId=${channel.id} platform=${channel.platform} actorId=${actorId} username=${username} limit=${limit}`
    );
    console.log(`[fetch] apify input channelId=${channel.id} ${JSON.stringify(apifyInput)}`);

    const datasetId = await runApifyActor(actorId, apifyInput);

    console.log(
      `[fetch] apify run created userId=${userId} channelId=${channel.id} datasetId=${datasetId}`
    );

    const items = await readApifyDatasetItems(datasetId, limit);

    console.log(
      `[fetch] apify dataset read userId=${userId} channelId=${channel.id} datasetId=${datasetId} items=${items.length}`
    );
    if (items.length > 0) {
      const it: any = items[0];
      const keys = it && typeof it === "object" ? Object.keys(it).slice(0, 40) : [];
      console.log(
        `[fetch] apify sample item channelId=${channel.id} datasetId=${datasetId} keys=${keys.join(",")}`
      );

      // Check if Apify returned an error instead of data
      if (it && (it.errorCode || it.error)) {
        const errorMsg = it.error || it.errorCode || "Unknown Apify error";
        console.error(
          `[fetch] apify error userId=${userId} channelId=${channel.id} datasetId=${datasetId} errorCode=${it.errorCode} error=${errorMsg}`
        );
        throw new Error(`Ошибка парсинга (Apify): ${errorMsg}`);
      }
    }

    // Extract profile data from the first item (if available)
    let profileData: any = {};
    if (items.length > 0) {
      const profile = guessApifyProfile(items[0]);
      if (profile) {
        console.log(
          `[fetch] apify profile extracted channelId=${channel.id} displayName=${profile.displayName} handle=${profile.handle} subscribers=${profile.subscribersCount}`
        );
        profileData = {
          displayName: profile.displayName ?? null,
          handle: profile.handle ?? null,
          avatarUrl: profile.avatarUrl ?? null,
          subscribersCount: profile.subscribersCount ? toBigInt(profile.subscribersCount) ?? null : null,
        };
      }
    }

    let itemsFetched = 0;
    let itemsSkipped = 0;

    for (const it of items) {
      const v = guessApifyVideo(it);
      if (!v.externalId || !v.url) {
        itemsSkipped += 1;
        continue;
      }

      await prisma.video.upsert({
        where: {
          userId_platform_externalId: {
            userId,
            platform: channel.platform,
            externalId: v.externalId
          }
        },
        update: {
          userId,
          url: v.url,
          title: v.title ?? null,
          description: v.description ?? null,
          thumbnailUrl: v.thumbnailUrl ?? null,
          publishedAt: parseMaybeDate(v.publishedAt) ?? null,
          viewsCount: v.viewsCount ? toBigInt(v.viewsCount) ?? null : null,
          likesCount: v.likesCount ? toBigInt(v.likesCount) ?? null : null,
          commentsCount: v.commentsCount ? toBigInt(v.commentsCount) ?? null : null,
          raw: v.raw as any,
          channelId: channel.id
        },
        create: {
          userId,
          platform: channel.platform,
          externalId: v.externalId,
          url: v.url,
          title: v.title ?? null,
          description: v.description ?? null,
          thumbnailUrl: v.thumbnailUrl ?? null,
          publishedAt: parseMaybeDate(v.publishedAt) ?? null,
          viewsCount: v.viewsCount ? toBigInt(v.viewsCount) ?? null : null,
          likesCount: v.likesCount ? toBigInt(v.likesCount) ?? null : null,
          commentsCount: v.commentsCount ? toBigInt(v.commentsCount) ?? null : null,
          raw: v.raw as any,
          channelId: channel.id
        }
      });

      itemsFetched += 1;
    }

    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        ...profileData,
        lastFetchedAt: new Date()
      }
    });

    console.log(
      `[fetch] apify persisted userId=${userId} channelId=${channel.id} datasetId=${datasetId} itemsFetched=${itemsFetched} itemsSkipped=${itemsSkipped}`
    );

    return NextResponse.json({
      ok: true,
      itemsFetched,
      itemsSkipped,
      itemsTotal: items.length,
      datasetId
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(
      `[fetch] failed userId=${userId} channelId=${channel.id} platform=${channel.platform} externalId=${channel.externalId} :: ${message}`
    );
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
