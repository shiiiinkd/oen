import { NextResponse } from "next/server";
import { getLineRedirectUri } from "@/app/_lib/line/oauth";
import { isMissingEnvError, requireEnv } from "@/app/_lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const channelId = requireEnv("LINE_CHANNEL_ID");
    const redirectUri = getLineRedirectUri();
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    const authorizeUrl = new URL(
      "https://access.line.me/oauth2/v2.1/authorize"
    );
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", channelId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("nonce", nonce);
    authorizeUrl.searchParams.set("scope", "openid profile");

    const res = NextResponse.redirect(authorizeUrl.toString());
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
    if (isMissingEnvError(error)) {
      return NextResponse.json(
        { ok: false, error: "env_missing" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unknown error" },
      { status: 500 }
    );
  }
}
