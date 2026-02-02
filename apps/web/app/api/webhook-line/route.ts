import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * LINE Webhook → Next.js → Express へのプロキシ
 * ローカル開発環境でのみ使用
 * 本番環境では Railway を直接叩く
 */
export async function POST(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Webhook proxy is disabled in production" },
      { status: 404 },
    );
  }

  try {
    // リクエストボディを取得（生テキスト）
    const body = await request.text();

    // ヘッダーを準備
    const headers = new Headers();

    // LINE署名ヘッダーをコピー（重要！）
    const lineSignature = request.headers.get("x-line-signature");
    if (lineSignature) {
      headers.set("x-line-signature", lineSignature);
    }

    // Content-Type
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    // Expressへ転送
    const apiBaseUrl = process.env.OEN_API_BASE_URL || "http://localhost:8080";
    const response = await fetch(`${apiBaseUrl}/webhook-line`, {
      method: "POST",
      headers,
      body,
    });

    // Expressからのレスポンスをそのまま返す
    const responseData = await response.json();
    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error("Webhook proxy error:", error);
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 },
    );
  }
}
