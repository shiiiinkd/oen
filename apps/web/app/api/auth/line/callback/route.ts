import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLineRedirectUri } from "@/app/_lib/line/oauth";
import { requireEnv, isMissingEnvError } from "@/app/_lib/env";
import { createSession } from "@/app/_lib/auth/session-store";
import { upsertUserByLineSub } from "@/app/_lib/users/users-repo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  const stateParam = searchParams.get("state");
  const codeParam = searchParams.get("code");
  const errorParam = searchParams.get("error");

  const stateCookie = cookieStore.get("oen_oauth_state")?.value;
  const nonceCookie = cookieStore.get("oen_oauth_nonce")?.value;
  //sessionId
  const setSessionCookie = (res: NextResponse, sessionId: string) => {
    res.cookies.set("oen_session", sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  };
  const clearOAuthCookies = (res: NextResponse) => {
    res.cookies.set("oen_oauth_state", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    res.cookies.set("oen_oauth_nonce", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  };

  function redirectToLogin(error: string) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", error);
    const res = NextResponse.redirect(url);
    clearOAuthCookies(res);
    return res;
  }

  if (errorParam) {
    return redirectToLogin("line");
  }
  if (!stateCookie || stateParam !== stateCookie) {
    return redirectToLogin("state_mismatch");
  }
  if (!codeParam) {
    return redirectToLogin("code_missing");
  }
  if (!nonceCookie) {
    return redirectToLogin("nonce_missing");
  }

  try {
    const channelId = requireEnv("LINE_LOGIN_CHANNEL_ID");
    const channelSecret = requireEnv("LINE_LOGIN_CHANNEL_SECRET");
    const redirectUri = getLineRedirectUri();

    //token交換 codeを使ってtokenを取得
    const tokenUrl = `https://api.line.me/oauth2/v2.1/token`;
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: codeParam,
      client_id: channelId,
      client_secret: channelSecret,
      redirect_uri: redirectUri,
    });
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody.toString(),
    });
    if (!tokenResponse.ok) {
      return redirectToLogin("token_error");
    }

    const tokenJson = await tokenResponse.json();
    const idToken = tokenJson.id_token;
    if (!idToken) {
      return redirectToLogin("id_token_missing");
    }
    // verify: ID Token の検証
    const verifyUrl = `https://api.line.me/oauth2/v2.1/verify`;
    const verifyBody = new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
      nonce: nonceCookie,
    });
    const verifyResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: verifyBody.toString(),
    });
    if (!verifyResponse.ok) {
      return redirectToLogin("verify_error");
    }
    const verifyJson = await verifyResponse.json();
    const sub = verifyJson.sub;
    if (!sub) {
      return redirectToLogin("sub_missing");
    }
    // LINE APIから取得した時点でdisplayNameに変換（外部APIとの境界で変換）
    const displayName = verifyJson.name ?? null;
    const avatarUrl = verifyJson.picture ?? null;

    // usersテーブルに保存または更新
    const { userId, linkToken } = await upsertUserByLineSub({
      lineSub: sub,
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
    });

    // セッション作成（アプリ内部は統一命名）
    const sessionId = createSession({
      lineSub: sub,
      userId,
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      linkToken: linkToken ?? undefined,
    });

    const res = NextResponse.redirect(new URL("/dashboard", request.url));
    clearOAuthCookies(res);
    setSessionCookie(res, sessionId);
    return res;
  } catch (error) {
    if (isMissingEnvError(error)) {
      return redirectToLogin("env_missing");
    }
    console.error("LINE callback error:", error);
    return redirectToLogin("callback_exception");
  }
}
