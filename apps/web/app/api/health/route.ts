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
    //Next(サーバー)　→　Express(API)を呼ぶ
    const res = await fetch(`${baseUrl}/health`, {
      cache: "no-store",
    });
    //ExpressがJSONをかえすとは限らないため一旦テキストで受け取る
    const bodytext = await res.text();

    //BFFとしてほぼ透過させる（ステータスも維持して返す）
    return new NextResponse(bodytext, {
      status: res.status,
      headers: {
        "content-type":
          res.headers.get("content-type") ?? "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
