import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";
import { signSessionToken } from "@/lib/session";

function isSecureRequest(req: Request) {
  const xfProto = req.headers.get("x-forwarded-proto");
  if (xfProto) {
    return xfProto.split(",")[0]?.trim().toLowerCase() === "https";
  }

  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return false;
  }
}

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSessionToken({ sub: user.id, email: user.email });
  await setSessionCookie(token, { secure: isSecureRequest(req) });

  return NextResponse.json({ ok: true });
}
