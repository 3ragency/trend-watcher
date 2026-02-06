import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUserId } from "@/lib/session";
import type { Platform } from "@prisma/client";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const userId = await getApiUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const offsetParam = searchParams.get("offset");
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  const platformParam = searchParams.get("platform") as Platform | null;
  const platform: Platform = platformParam && ["YOUTUBE", "INSTAGRAM", "TIKTOK"].includes(platformParam)
    ? platformParam
    : "YOUTUBE";

  const videos = await prisma.video.findMany({
    where: { userId, platform },
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
    publishedAt: v.publishedAt?.toISOString() ?? ""
  }));

  return NextResponse.json({ videos: data, nextOffset, hasMore });
}


export async function DELETE(req: Request) {
  const userId = await getApiUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const channelIds: string[] | undefined = json.channelIds;

  let deleted = 0;

  if (channelIds && channelIds.length > 0) {
    const result = await prisma.video.deleteMany({
      where: {
        userId,
        channelId: { in: channelIds }
      }
    });
    deleted = result.count;
  } else {
    const result = await prisma.video.deleteMany({
      where: { userId }
    });
    deleted = result.count;
  }

  return NextResponse.json({ ok: true, deleted });
}
