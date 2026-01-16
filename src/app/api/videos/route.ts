import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUserId } from "@/lib/session";

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
