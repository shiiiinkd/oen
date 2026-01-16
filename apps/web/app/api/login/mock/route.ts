import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  try {
    cookieStore.set({
      name: "oen_session",
      value: "1234567890",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd, //本番はtrue, 開発はfalse
      path: "/",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
