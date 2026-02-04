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

  // 投稿を作成
  const { shareToken } = await createPost(session.lineSub, content);

  // 投稿を作成したら通知を送る
  try {
    const apiBaseUrl = process.env.OEN_API_BASE_URL || "http://localhost:8080";
    const webBaseUrl = process.env.OEN_WEB_BASE_URL;

    if (!webBaseUrl) {
      console.warn("OEN_WEB_BASE_URL is not set. Skipping notification.");
    } else {
      const postUrl = `${webBaseUrl}/p/${shareToken}`;
      const response = await fetch(`${apiBaseUrl}/notification/post-created`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postUrl,
          message: `新しい投稿が作成されました!`,
        }),
      });
      if (!response.ok) {
        console.error(
          "Failed to send notification:",
          response.status,
          await response.text(),
        );
      }
    }
    //通知失敗した場合でも投稿は成功、エラーにはしない
  } catch (notificationError) {
    console.error("通知送信エラー:", notificationError);
  }

  return NextResponse.json({
    ok: true,
    shareToken,
    shareURL: `/p/${shareToken}`,
  });
}
