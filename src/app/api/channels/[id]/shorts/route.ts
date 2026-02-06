import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getApiUserId } from "@/lib/session";
import {
    fetchYouTubeChannelShorts,
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

    if (channel.platform !== "YOUTUBE") {
        return NextResponse.json({ error: "Shorts are only available for YouTube channels" }, { status: 400 });
    }

    const env = getEnv();

    // Allow custom limit via query param
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const loadMore = url.searchParams.get("loadMore") === "true";
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || env.FETCH_LIMIT_PER_CHANNEL)) : env.FETCH_LIMIT_PER_CHANNEL;

    // For Shorts, we use a separate token stored with a prefix to distinguish from regular videos
    // We'll use the channel's raw field to store shorts pagination token
    const rawData = channel.raw as Record<string, unknown> | null;
    const shortsPageToken = rawData?.shortsNextPageToken as string | undefined;

    // If token is "__END__", there are no more shorts to load
    if (loadMore && shortsPageToken === "__END__") {
        return NextResponse.json({
            itemsFetched: 0,
            message: "Все доступные Shorts уже загружены"
        });
    }
    const pageToken = loadMore ? shortsPageToken : undefined;

    try {
        console.log(
            `[fetch/shorts] start userId=${userId} channelId=${channel.id} externalId=${channel.externalId} limit=${limit} loadMore=${loadMore} pageToken=${pageToken ?? "none"}`
        );

        const { shorts, nextPageToken } = await fetchYouTubeChannelShorts(
            channel.externalId,
            limit,
            pageToken
        );

        console.log(
            `[fetch/shorts] done externalId=${channel.externalId} shorts=${(shorts ?? []).length}`
        );

        // Save shorts pagination token to channel's raw field
        const tokenToSave = nextPageToken ?? "__END__";
        const updatedRaw = {
            ...(rawData || {}),
            shortsNextPageToken: tokenToSave
        };

        await prisma.channel.update({
            where: { id: channel.id },
            data: {
                raw: updatedRaw as any,
                lastFetchedAt: new Date()
            }
        });

        let itemsFetched = 0;
        for (const v of shorts ?? []) {
            if (!v?.id) continue;
            const videoUrl = `https://www.youtube.com/shorts/${v.id}`;
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
                    url: videoUrl,
                    title: v.snippet?.title ?? null,
                    description: v.snippet?.description ?? null,
                    thumbnailUrl,
                    publishedAt,
                    viewsCount: toBigInt(v.statistics?.viewCount) ?? null,
                    likesCount: toBigInt(v.statistics?.likeCount) ?? null,
                    commentsCount: toBigInt(v.statistics?.commentCount) ?? null,
                    durationSeconds: parseIsoDurationSeconds(v.contentDetails?.duration) ?? null,
                    isShort: true,
                    raw: v as any,
                    channelId: channel.id
                },
                create: {
                    userId,
                    platform: "YOUTUBE",
                    externalId: v.id,
                    url: videoUrl,
                    title: v.snippet?.title ?? null,
                    description: v.snippet?.description ?? null,
                    thumbnailUrl,
                    publishedAt,
                    viewsCount: toBigInt(v.statistics?.viewCount) ?? null,
                    likesCount: toBigInt(v.statistics?.likeCount) ?? null,
                    commentsCount: toBigInt(v.statistics?.commentCount) ?? null,
                    durationSeconds: parseIsoDurationSeconds(v.contentDetails?.duration) ?? null,
                    isShort: true,
                    raw: v as any,
                    channelId: channel.id
                }
            });

            itemsFetched += 1;
        }
        console.log(
            `[fetch/shorts] persisted userId=${userId} channelId=${channel.id} itemsFetched=${itemsFetched}`
        );
        return NextResponse.json({ ok: true, itemsFetched });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(
            `[fetch/shorts] failed userId=${userId} channelId=${channel.id} externalId=${channel.externalId} :: ${message}`
        );
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
