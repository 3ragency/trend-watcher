import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { resolveYouTubeChannel } from "@/lib/youtube";
import { toChannelDto } from "@/lib/dto";
import { getApiUserId } from "@/lib/session";

const bodySchema = z.object({
  platform: z.enum(["YOUTUBE", "INSTAGRAM", "TIKTOK"]),
  identifier: z.string().min(2)
});

function normalizeProfileUrl(platform: "INSTAGRAM" | "TIKTOK", identifier: string) {
  const s = identifier.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (platform === "INSTAGRAM") return `https://www.instagram.com/${s.replace(/^@/, "")}/`;
  return `https://www.tiktok.com/@${s.replace(/^@/, "")}`;
}

function extractProfileExternalId(platform: "INSTAGRAM" | "TIKTOK", identifier: string) {
  const s = identifier.trim();
  if (!/^https?:\/\//i.test(s)) return s.replace(/^@/, "");

  try {
    const u = new URL(s);
    const parts = u.pathname.split("/").filter(Boolean);

    if (platform === "INSTAGRAM") {
      return (parts[0] ?? "").replace(/^@/, "");
    }

    // TikTok: /@username/...
    const first = parts[0] ?? "";
    if (first.startsWith("@")) return first.slice(1);
    return first.replace(/^@/, "");
  } catch {
    return s;
  }
}

export async function POST(req: Request) {
  const userId = await getApiUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { platform, identifier } = parsed.data;

  if (platform === "YOUTUBE") {
    const { channelId } = await resolveYouTubeChannel(identifier);

    const ch = await prisma.channel.upsert({
      where: {
        userId_platform_externalId: {
          userId,
          platform: "YOUTUBE",
          externalId: channelId
        }
      },
      update: {
        url: `https://www.youtube.com/channel/${channelId}`
      },
      create: {
        userId,
        platform: "YOUTUBE",
        externalId: channelId,
        url: `https://www.youtube.com/channel/${channelId}`
      }
    });

    return NextResponse.json({ id: ch.id });
  }

  const url = normalizeProfileUrl(platform, identifier);
  const externalId = extractProfileExternalId(platform, identifier);

  const ch = await prisma.channel.upsert({
    where: {
      userId_platform_externalId: {
        userId,
        platform,
        externalId
      }
    },
    update: {
      url,
      handle: externalId
    },
    create: {
      userId,
      platform,
      externalId,
      url,
      handle: externalId
    }
  });

  const env = getEnv();
  return NextResponse.json({ id: ch.id, limit: env.FETCH_LIMIT_PER_CHANNEL });
}

export async function GET() {
  const userId = await getApiUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const channels = await prisma.channel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(channels.map(toChannelDto));
}
