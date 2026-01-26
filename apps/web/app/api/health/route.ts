import { NextResponse } from "next/server";
import { requireEnv, isMissingEnvError } from "@/app/_lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const baseUrl = requireEnv("OEN_API_BASE_URL");
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
    if (isMissingEnvError(error)) {
      return NextResponse.json(
        { ok: false, error: "env_missing" },
        { status: 500 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
