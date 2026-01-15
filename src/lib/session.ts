import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/lib/env";

const COOKIE_NAME = "tw_session";

type SessionPayload = {
  sub: string;
  email: string;
};

function getJwtSecret() {
  const { AUTH_JWT_SECRET } = getEnv();
  return new TextEncoder().encode(AUTH_JWT_SECRET);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function signSessionToken(payload: SessionPayload) {
  const secret = getJwtSecret();
  return await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .setSubject(payload.sub)
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);

  const sub = payload.sub;
  const email = payload.email;

  if (!sub || typeof sub !== "string") return null;
  if (!email || typeof email !== "string") return null;

  return { userId: sub, email };
}

export async function getApiUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const s = await verifySessionToken(token);
    return s?.userId ?? null;
  } catch {
    return null;
  }
}

export async function requirePageUserId() {
  const userId = await getApiUserId();
  if (!userId) redirect("/login");
  return userId;
}

export const sessionCookieName = COOKIE_NAME;
