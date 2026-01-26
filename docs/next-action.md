# next-action.md

## 現状サマリ（2026-01-19 時点）

### 実装済み（apps/web）

- **LINE ログイン（最小）**
  - `GET /api/auth/line`（ログイン開始）
  - `GET /api/auth/line/callback`（コールバック）
  - `LINE_REDIRECT_URI` が未設定の場合でも「LINE に飛べるが callback で死ぬ」問題を潰し、env 不足は `env_missing` に統一
- **セッション（Cookie）**
  - `oen_session` を発行（callback 側）
  - `GET /api/auth/me` は cookie があれば `200`（※user はまだダミー）
  - `POST /api/auth/logout` で cookie を破棄
- **画面**
  - `/login` にログインボタン（`/api/auth/line` に遷移）
  - `/dashboard` は `GET /api/auth/me` を呼び、`401` なら `/login` に誘導
- **env ユーティリティ**
  - `apps/web/app/_lib/env.ts`（`requireEnv`, `isMissingEnvError`）
  - `apps/web/app/_lib/line/oauth.ts`（`getLineRedirectUri`）

### 未解決（次のボトルネック）

- `oen_session` と **LINE ユーザー（sub / displayName 等）が紐づいていない**
- `GET /api/auth/me` が **ダミー user**（`name: "admin-user"`）のまま
- セッションストア（永続化 or メモリ Map）が未実装

---

## Step 1 : LINE ログイン → ダッシュボード到達（MVP）【完了】

### 目的（Step 1）

LINE ログインで認証できるようにし、ログイン完了後に **Oh!EN のダッシュボード（仮）へ到達**できる状態を作る。

### Done の定義（Step 1）

- `/login` を開ける
- 「LINE でログイン」ボタンで `GET /api/auth/line` に遷移できる
- LINE 認可後、`GET /api/auth/line/callback` に戻れる
- callback で **`oen_session` Cookie が発行**される
- `/dashboard` が表示され、`GET /api/auth/me` によりログイン確認できる
- 未ログイン時 `GET /api/auth/me` は `401`（ガードが効く）

---

## 設計方針（固定）

- **ブラウザは Next のみを叩く**（Express 直叩き禁止）
- Next は **BFF（Backend For Frontend）**
- Express は **裏方 API**（必要なら Next が叩く）
- Redirect URI は Next（Vercel）に固定
- env 不足は「開始だけ成功っぽく見える」事故を避けるため **fail-fast**（`env_missing`）に寄せる

---

## 環境変数（apps/web）

### 必須（LINE ログイン）

- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_REDIRECT_URI`（例: `https://oen-seven.vercel.app/api/auth/line/callback`）

### 必須（BFF → Express）

- `OEN_API_BASE_URL`（例: `http://localhost:8080`）

---

## 次にやること（Step 2）：セッションを“本物”にする（sub を保持して `me` を LINE 由来に）

### 目的（Step 2）

「ログインできた」だけでなく、`GET /api/auth/me` が **LINE ユーザー情報を返せる**状態にする。  
次の PayPay 連携・ユーザー体験改善は、この土台の上で進める。

### Done の定義（Step 2）

- callback で取得した `sub` が `oen_session` と紐づく
- `GET /api/auth/me`
  - ログイン時: `200` + `{ id: <sessionId>, lineSub: <sub>, name: <displayName?> }`
  - 未ログイン時: `401`
- `POST /api/auth/logout` で cookie 破棄 + （可能なら）セッションストアからも削除
- `/dashboard` に LINE ユーザー由来の情報（`sub`/`name`）が表示される

---

## Step 2 作業ステップ（細かく）

### 2-0. どこまで“永続化”するか決める（Step 2 はメモリでも OK）

- **まずは B 案（インメモリ Map）**で OK（再起動で消えるのは許容）
- 次の Step 3 で DB/Redis に移行できる形にする（インターフェースで隠蔽）

---

### 2-1. セッションストアを作る（Next サーバー専用）

- 新規: `apps/web/app/_lib/auth/session-store.ts`
- 提供する関数（例）
  - `createSession({ lineSub, name, pictureUrl? }) -> sessionId`
  - `getSession(sessionId) -> session | null`
  - `deleteSession(sessionId)`

---

### 2-2. callback で `sub` を保存して `oen_session` をそれに連動させる

- 対象: `apps/web/app/api/auth/line/callback/route.ts`
- 変更点
  - `verify` の結果から `sub` を取得（現状取得済み）
  - `createSession({ lineSub: sub, ... })` を呼ぶ
  - 返ってきた `sessionId` を `oen_session` cookie にセット
  - 可能なら `name` も取る（下記 2-3）

---

### 2-3. 表示名（name）を取る（どちらか選ぶ）

#### A) Profile API を使う（推奨になりがち）

- token 交換レスポンスから `access_token` を取得
- `GET https://api.line.me/v2/profile` を叩いて `displayName`, `pictureUrl` を取得
- セッションに保存

#### B) ID Token の claim を使う

- verify レスポンスに `name` / `picture` が含まれていればそれを使う
- 無い場合は A に切り替え

---

### 2-4. `GET /api/auth/me` をセッションストア参照に変更

- 対象: `apps/web/app/api/auth/me/route.ts`
- 変更点
  - cookie `oen_session` を読む
  - `getSession(oen_session)` を呼ぶ
  - 存在しない場合: `401`
  - 存在する場合: `200` で session 由来 user を返す（`lineSub`, `name` 等）

---

### 2-5. logout でセッションストアも削除（できれば）

- 対象: `apps/web/app/api/auth/logout/route.ts`
- 変更点
  - cookie から `oen_session` を取得
  - `deleteSession(sessionId)` を呼ぶ（存在しなくても OK）
  - cookie を破棄

---

### 2-6. `/dashboard` の表示を最小で整える

- 対象: `apps/web/app/dashboard/page.tsx`
- `me` のレスポンスを表示
  - `sub`
  - `name`
  - `picture`（あれば）

---

### 2-7. `/login` のエラー表示を最低限つける

- 対象: `apps/web/app/login/page.tsx`
- `?error=...` を表示（`env_missing`, `state_mismatch`, `token_error` 等）

---

## Step 3（その次）：セッション永続化 & 安全性（PKCE 含む）

- インメモリ Map → DB/Redis（再起動耐性）
- PKCE 対応（可能なら）
- Cookie 属性の共通化（`secure/sameSite/maxAge/path` をヘルパー化）
- ログ/監視（callback 失敗理由の可視化）

---

## PayPay 連携（後回しの理由と前提）

PayPay は「誰の支払いか」「状態遷移（作成 → 承認 → 確定/取消）」が重要なので、まず Step 2 の **ユーザー識別が安定**してから進める。

---

## 参考：主要ファイル

- `apps/web/app/_lib/env.ts`
- `apps/web/app/_lib/line/oauth.ts`
- `apps/web/app/api/auth/line/route.ts`
- `apps/web/app/api/auth/line/callback/route.ts`
- `apps/web/app/api/auth/me/route.ts`
- `apps/web/app/api/auth/logout/route.ts`
- `apps/web/app/dashboard/page.tsx`
