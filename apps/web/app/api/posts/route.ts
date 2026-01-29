import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/app/_lib/auth/session-store";
import { createPost } from "@/app/_lib/posts/posts-repo";

export const runtime = "nodejs";

// 未ログインなら401エラー、ログイン済みならDBに投稿を保存しshareToken,shareURLを返す
export async function POST(request: Request) {
  const { content } = await request.json();
  if (typeof content !== "string") {
    return NextResponse.json(
      { ok: false, error: "content is not a string" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();

  // oen_sessionという名前のCookieのvalue(=sessionId)を取得
  const sessionId = cookieStore.get("oen_session")?.value;
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "oen_session is not set" },
      { status: 401 },
    );
  }
  // sessionIdからSession(オブジェクト)を取得
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "session not found" },
      { status: 401 },
    );
  }

  const { shareToken } = await createPost(session.lineSub, content);
  return NextResponse.json({
    ok: true,
    shareToken,
    shareURL: `/p/${shareToken}`,
  });
}
