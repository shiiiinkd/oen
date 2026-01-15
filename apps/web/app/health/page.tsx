// apps/web/app/health/page.tsx

// これは Server Component（デフォルト）なので、サーバー側で動きます。
// Node.js の fetch は相対URL "/api/..." を解決できず落ちることがあるため、
// Server Component からは Next の /api/* を叩かず、Express(API) を直に呼びます。

type HealthResult =
  | { ok: true; status: number; body: string }
  | { ok: false; status?: number; error: string; body?: string };

function mustGetApiBaseUrl(): string {
  const baseUrl = process.env.OEN_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("OEN_API_BASE_URL is not set");
  }
  return baseUrl;
}

async function fetchHealth(): Promise<HealthResult> {
  try {
    const baseUrl = mustGetApiBaseUrl();
    const url = new URL("/health", baseUrl);

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

export default async function HealthPage() {
  const result = await fetchHealth();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Oh!EN Health Check</h1>

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
