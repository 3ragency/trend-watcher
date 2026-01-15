import { prisma } from "@/lib/db";
import { ChannelsClient } from "@/components/channels-client";
import { toChannelDto } from "@/lib/dto";
import { requirePageUserId } from "@/lib/session";

export default async function ChannelsPage() {
  const userId = await requirePageUserId();
  const channels = await prisma.channel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  const dto = channels.map(toChannelDto);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Каналы</h1>
        <p className="text-sm text-muted-foreground">
          Добавьте канал/профиль и нажмите «Парсить 30 видео».
        </p>
      </div>

      <ChannelsClient initialChannels={dto} />
    </div>
  );
}
