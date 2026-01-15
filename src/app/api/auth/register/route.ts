import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { setSessionCookie, signSessionToken } from "@/lib/session";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).optional()
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, displayName } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        displayName: displayName ?? null,
        passwordHash
      }
    });

    const token = await signSessionToken({ sub: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
