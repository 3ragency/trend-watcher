import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUserId } from "@/lib/session";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
    const userId = await getApiUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const channelId = searchParams.get("channelId");

    // Build where clause
    const whereClause: {
        userId: string;
        platform: "YOUTUBE";
        isShort: boolean;
        channelId?: string;
    } = {
        userId,
        platform: "YOUTUBE",
        isShort: true
    };

    // Filter by specific channel if provided
    if (channelId) {
        whereClause.channelId = channelId;
    }

    // Fetch only YouTube Shorts (isShort = true)
    const videos = await prisma.video.findMany({
        where: whereClause,
        orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
        take: PAGE_SIZE + 1, // +1 to check if there are more
        skip: offset,
        include: {
            channel: {
                select: {
                    displayName: true
                }
            }
        }
    });

    const hasMore = videos.length > PAGE_SIZE;
    const items = hasMore ? videos.slice(0, PAGE_SIZE) : videos;
    const nextOffset = hasMore ? offset + PAGE_SIZE : null;

    const data = items.map((v) => ({
        id: v.id,
        externalId: v.externalId,
        url: v.url,
        videoId: v.externalId,
        title: v.title ?? "",
        thumbnailUrl: v.thumbnailUrl ?? "",
        channelName: v.channel.displayName ?? "",
        viewsCount: (v.viewsCount ?? 0n).toString(),
        likesCount: (v.likesCount ?? 0n).toString(),
        commentsCount: (v.commentsCount ?? 0n).toString(),
        durationSeconds: v.durationSeconds,
        publishedAt: v.publishedAt?.toISOString() ?? ""
    }));

    return NextResponse.json({ shorts: data, nextOffset, hasMore });
}
