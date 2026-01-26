// apps/web/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/app/_lib/auth/session-store";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();

  // oen_sessionという名前のCookieのvalue(=sessionId)を取得
  const sessionId = cookieStore.get("oen_session")?.value;
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "oen_session is not set" },
      { status: 401 }
    );
  }
  // sessionIdからSession(オブジェクト)を取得
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ ok: false, error: "session not found" }, { status: 401 });
  }
  return NextResponse.json({ id: sessionId, lineSub: session.lineSub, name: session.name ?? undefined }, { status: 200 });
}
 