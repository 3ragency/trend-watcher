import { prisma } from "@/lib/db";
import { VideosClient } from "@/components/videos-client";
import { requirePageUserId } from "@/lib/session";
import { toVideoDto, toChannelDto } from "@/lib/dto";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const userId = await requirePageUserId();
  
  const [videos, channels] = await Promise.all([
    prisma.video.findMany({
      where: { userId },
      include: { channel: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.channel.findMany({
      where: { userId },
      orderBy: { displayName: "asc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Видео</h1>
        <p className="text-sm text-muted-foreground">
          Все собранные видео с фильтрами и сортировкой.
        </p>
      </div>

      <VideosClient
        initialVideos={videos.map(toVideoDto)}
        channels={channels.map(toChannelDto)}
      />
    </div>
  );
}
