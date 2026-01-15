import { prisma } from "@/lib/db";
import { VideosTable } from "@/components/videos-table";
import { requirePageUserId } from "@/lib/session";

export default async function VideosPage() {
  const userId = await requirePageUserId();
  const videos = await prisma.video.findMany({
    where: { userId },
    include: { channel: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 300
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Видео</h1>
        <p className="text-sm text-muted-foreground">
          Последние собранные видео (лимит 300).
        </p>
      </div>

      <VideosTable videos={videos} />
    </div>
  );
}
