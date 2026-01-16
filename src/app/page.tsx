import { prisma } from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { requirePageUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await requirePageUserId();
  const [channelsCount, videosCount] = await Promise.all([
    prisma.channel.count({ where: { userId } }),
    prisma.video.count({ where: { userId } })
  ]);

  const agg = await prisma.video.aggregate({
    where: { userId },
    _sum: {
      viewsCount: true,
      likesCount: true,
      commentsCount: true
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Обзор Дашборда</h1>
        <p className="text-sm text-muted-foreground">
          Добавляйте каналы и запускайте ручной сбор последних видео.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Каналы" value={channelsCount} />
        <StatCard title="Всего видео" value={videosCount} />
        <StatCard title="Всего просмотров" value={agg._sum.viewsCount ?? 0n} />
        <StatCard title="Всего лайков" value={agg._sum.likesCount ?? 0n} />
        <StatCard title="Всего комментариев" value={agg._sum.commentsCount ?? 0n} />
      </div>
    </div>
  );
}
