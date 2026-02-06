import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUserId } from "@/lib/session";

export async function GET() {
    const userId = await getApiUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
        favorites: favorites.map((f) => ({
            id: f.id,
            videoId: f.videoId,
            title: f.title,
            thumbnailUrl: f.thumbnailUrl,
            channelName: f.channelName,
            viewsCount: f.viewsCount,
            likesCount: f.likesCount,
            commentsCount: f.commentsCount,
            addedAt: f.createdAt.toISOString()
        }))
    });
}

export async function POST(req: NextRequest) {
    const userId = await getApiUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    let body: {
        videoId: string;
        title?: string;
        thumbnailUrl?: string;
        channelName?: string;
        viewsCount?: string;
        likesCount?: string;
        commentsCount?: string;
        durationSeconds?: number;
    };

    try {
        body = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    if (!body.videoId) {
        return new NextResponse("videoId is required", { status: 400 });
    }

    const favorite = await prisma.favorite.upsert({
        where: {
            userId_platform_videoId: {
                userId,
                platform: "YOUTUBE",
                videoId: body.videoId
            }
        },
        create: {
            userId,
            platform: "YOUTUBE",
            videoId: body.videoId,
            title: body.title,
            thumbnailUrl: body.thumbnailUrl,
            channelName: body.channelName,
            viewsCount: body.viewsCount,
            likesCount: body.likesCount,
            commentsCount: body.commentsCount,
            durationSeconds: body.durationSeconds
        },
        update: {
            title: body.title,
            thumbnailUrl: body.thumbnailUrl,
            channelName: body.channelName,
            viewsCount: body.viewsCount,
            likesCount: body.likesCount,
            commentsCount: body.commentsCount,
            durationSeconds: body.durationSeconds
        }
    });

    return NextResponse.json({ id: favorite.id });
}
