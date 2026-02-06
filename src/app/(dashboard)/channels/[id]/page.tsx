import { prisma } from "@/lib/db";
import { requirePageUserId } from "@/lib/session";
import { notFound } from "next/navigation";
import { ChannelDetail } from "@/components/youtube/channel-detail";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ChannelPage({ params }: Props) {
    const userId = await requirePageUserId();
    const { id } = await params;

    const channel = await prisma.channel.findFirst({
        where: { id, userId }
    });

    if (!channel) {
        notFound();
    }

    // Get videos for this channel (all fetched videos)
    const videos = await prisma.video.findMany({
        where: { channelId: id, userId },
        orderBy: { publishedAt: "desc" }
    });

    // Get video aggregates
    const videoAgg = await prisma.video.aggregate({
        where: { channelId: id, userId },
        _sum: {
            viewsCount: true,
            likesCount: true,
            commentsCount: true
        },
        _count: true
    });

    const channelData = {
        id: channel.id,
        platform: channel.platform,
        externalId: channel.externalId,
        displayName: channel.displayName,
        handle: channel.handle,
        avatarUrl: channel.avatarUrl,
        url: channel.url,
        subscribersCount: (channel.subscribersCount ?? 0n).toString(),
        totalViewsCount: (channel.totalViewsCount ?? 0n).toString(),
        videosCount: channel.videosCount ?? videoAgg._count,
        lastFetchedAt: channel.lastFetchedAt?.toISOString() ?? null
    };

    const videosData = videos.map((v) => ({
        id: v.id,
        externalId: v.externalId,
        title: v.title ?? "",
        thumbnailUrl: v.thumbnailUrl ?? "",
        url: v.url ?? "",
        viewsCount: (v.viewsCount ?? 0n).toString(),
        likesCount: (v.likesCount ?? 0n).toString(),
        commentsCount: (v.commentsCount ?? 0n).toString(),
        publishedAt: v.publishedAt?.toISOString() ?? null,
        durationSeconds: v.durationSeconds ?? null
    }));

    const aggregates = {
        totalViews: (videoAgg._sum.viewsCount ?? 0n).toString(),
        totalLikes: (videoAgg._sum.likesCount ?? 0n).toString(),
        totalComments: (videoAgg._sum.commentsCount ?? 0n).toString(),
        videoCount: videoAgg._count,
        totalVideosOnChannel: channel.videosCount ?? 0
    };

    return (
        <ChannelDetail
            channel={channelData}
            videos={videosData}
            aggregates={aggregates}
        />
    );
}
