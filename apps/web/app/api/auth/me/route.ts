// apps/web/app/api/auth/me/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const baseUrl = process.env.OEN_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "OEN_API_BASE_URL is not set" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/auth/me`, {
      cache: "no-store",
      // 将来セッションCookie連携するならここが効いてくる（今は差は出ない）
      // credentials: "include",
      headers: {
        // JSONで返す前提（Express側がjsonなら意味が通る）
        accept: "application/json",
      },
    });

    // 401でも本文は読み切って返す（デバッグしやすい）
    const bodyText = await res.text();

    return new NextResponse(bodyText, {
      status: res.status,
      headers: {
        "content-type":
          res.headers.get("content-type") ?? "application/json; charset=utf-8",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
