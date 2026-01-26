// apps/web/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/app/_lib/auth/session-store";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("oen_session")?.value;
  const res = NextResponse.json({ ok: true }, { status: 200 });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set({
    name: "oen_session",
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  if (!sessionId) {
    return res;
  }
  // sessionIdがあればサーバ側のセッションも削除
  deleteSession(sessionId);
  return res;
}
