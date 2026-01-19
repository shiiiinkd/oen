// apps/web/app/login/page.tsx

import LoginButton from "./LoginButton";
import { requireEnv } from "@/app/_lib/env";
// これは Server Component（デフォルト）なので、サーバー側で動きます。
// Node.js の fetch は相対URL "/api/..." を解決できず落ちることがあるため、
// Server Component からは Next の /api/* を叩かず、Express(API) を直に呼びます。

type LoginResult =
  | { ok: true; status: number; body: string }
  | { ok: false; status?: number; error: string; body?: string };

function mustGetApiBaseUrl(): string {
  const baseUrl = requireEnv("OEN_API_BASE_URL");
  return baseUrl;
}

async function fetchLogin(): Promise<LoginResult> {
  try {
    const baseUrl = mustGetApiBaseUrl();
    const url = new URL("/login", baseUrl);

    const res = await fetch(url, { cache: "no-store" });
    const body = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: "API returned error",
        body,
      };
    }

    return { ok: true, status: res.status, body };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { ok: false, error: message };
  }
}

export default async function LoginPage() {
  const result = await fetchLogin();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Oh!EN Login</h1>
      <LoginButton />

      {result.ok ? (
        <>
          <p>status: {result.status}</p>
          <pre
            style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
          >
            {result.body}
          </pre>
        </>
      ) : (
        <>
          <p style={{ color: "crimson" }}>error: {result.error}</p>
          {typeof result.status === "number" && <p>status: {result.status}</p>}
          {result.body && (
            <pre
              style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
            >
              {result.body}
            </pre>
          )}
        </>
      )}
    </main>
  );
}
