import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";
  const channelId = process.env.LINE_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.json(
      { ok: false, error: "LINE_CHANNEL_ID is missing" },
      { status: 500 }
    );
  }
  const redirectUri =
    process.env.LINE_REDIRECT_URI ??
    "https://oen-seven.vercel.app/api/auth/line/callback";
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", channelId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);
  authorizeUrl.searchParams.set("scope", "openid profile");

  const res = NextResponse.redirect(authorizeUrl.toString());
  //return NextResponse.redirect(authorizeUrl.toString());
  try {
    res.cookies.set("oen_oauth_state", state, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    res.cookies.set("oen_oauth_nonce", nonce, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
