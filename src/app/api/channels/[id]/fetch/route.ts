import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { runApifyActor, readApifyDatasetItems, guessApifyVideo } from "@/lib/apify";
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
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getApiUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const channelId = params.id;
  const channel = await prisma.channel.findFirst({ where: { id: channelId, userId } });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const env = getEnv();
  const limit = env.FETCH_LIMIT_PER_CHANNEL;

  try {
    if (channel.platform === "YOUTUBE") {
      const { channel: ytChannel, videos } = await fetchYouTubeChannelWithVideos(
        channel.externalId,
        limit
      );

      const avatarUrl =
        ytChannel.snippet?.thumbnails?.high?.url ??
        ytChannel.snippet?.thumbnails?.medium?.url ??
        ytChannel.snippet?.thumbnails?.default?.url ??
        null;

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
          lastFetchedAt: new Date(),
          raw: ytChannel as any
        }
      });

      let itemsFetched = 0;
      for (const v of videos ?? []) {
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
      return NextResponse.json({ ok: true, itemsFetched });
    }

    // Apify for Instagram/TikTok
    const actorId =
      channel.platform === "INSTAGRAM"
        ? env.APIFY_INSTAGRAM_ACTOR_ID
        : env.APIFY_TIKTOK_ACTOR_ID;

    const profileUrl = channel.url ?? channel.handle ?? channel.externalId;

    const datasetId = await runApifyActor(actorId, {
      startUrls: [{ url: profileUrl }],
      resultsLimit: limit,
      maxItems: limit
    });

    const items = await readApifyDatasetItems(datasetId, limit);

    let itemsFetched = 0;

    for (const it of items) {
      const v = guessApifyVideo(it);
      if (!v.externalId || !v.url) continue;

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
        lastFetchedAt: new Date()
      }
    });

    return NextResponse.json({ ok: true, itemsFetched, datasetId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
