import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/session";

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

export async function POST(req: Request) {
  await clearSessionCookie({ secure: isSecureRequest(req) });
  return NextResponse.json({ ok: true });
}
