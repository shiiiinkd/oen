import "server-only";

declare global {
  var _oenSessionStore: Map<string, Session> | undefined;
}

if (!globalThis._oenSessionStore) {
  globalThis._oenSessionStore = new Map<string, Session>();
}
const store = globalThis._oenSessionStore;

interface Session {
  lineSub: string;
  name?: string | null;
  pictureUrl?: string | null;
  createdAt: number;
}

export function createSession({
  lineSub,
  name,
  pictureUrl,
}: {
  lineSub: string;
  name?: string | null;
  pictureUrl?: string | null;
}): string {
  const sessionId = crypto.randomUUID();
  store.set(sessionId, { lineSub, name, pictureUrl, createdAt: Date.now() });
  return sessionId;
}

// sessionIdからSessionを取得
export function getSession(sessionId: string): Session | null {
  return store.get(sessionId) ?? null;
}

// sessionIdからSessionを削除
export function deleteSession(sessionId: string): void {
  store.delete(sessionId);
}
