// apps/web/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const oen_session = cookieStore.get("oen_session")?.value;
  if (!oen_session) {
    return NextResponse.json(
      { ok: false, error: "oen_session is not set" },
      { status: 401 }
    );
  }
  return NextResponse.json(
    { ok: true, id: oen_session, name: "admin-user" },
    { status: 200 }
  );
}
