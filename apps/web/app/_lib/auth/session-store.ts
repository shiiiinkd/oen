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
  userId: number;
  displayName?: string | null;
  avatarUrl?: string | null;
  linkToken?: string | null;
  createdAt: number;
}

export function createSession({
  lineSub,
  userId,
  displayName,
  avatarUrl,
  linkToken,
}: {
  lineSub: string;
  userId: number;
  displayName?: string | null;
  avatarUrl?: string | null;
  linkToken?: string | null;
}): string {
  const sessionId = crypto.randomUUID();
  store.set(sessionId, {
    lineSub,
    userId,
    displayName,
    avatarUrl,
    linkToken,
    createdAt: Date.now(),
  });
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
