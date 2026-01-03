// apps/web/app/health/page.tsx

// これは Server Component（デフォルト）なので、サーバー側で動きます。
// ただし、呼び出す先は Express 直ではなく、BFFの /api/health に統一します。

type HealthResult =
  | { ok: true; status: number; body: string }
  | { ok: false; status?: number; error: string; body?: string };

async function fetchHealth(): Promise<HealthResult> {
  try {
    const res = await fetch("http://localhost:3000/api/health", {
      cache: "no-store",
    });
    const body = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: "BFF returned error",
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
