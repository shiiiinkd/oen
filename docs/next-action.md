# Oh!EN 認証（Cookie / セッション ID 方式）メモ（2026-01-14）

## 前提（プロジェクト構成と方針）

- プロジェクト「Oh!EN」は **Next.js（BFF） + Express（API）** の分離構成。
- ブラウザは **Next のみ**を叩く（Express 直叩き禁止）。
- 最終目標は **LINE Login** だが、MVP 優先・縦スライスで進め、UI は後回し。
- 自分でコードを書いて成長する（完成コードを丸ごと提示するより、設計・手順・落とし穴整理を重視）。

## 現状（動いているもの）

- ルートで `npm run dev` により `apps/web` と `apps/api` を同時起動。
- Express（API）
  - `GET /health` -> `{ msg: "Health check successful!" }`
  - `GET /auth/me` -> `{ msg: "auth router is working!" }`（スタブ）
  - `GET /login` -> `{ msg: "Login check successful!" }`（スタブ）
- Next（web）
  - ページ: `/`（テンプレ）, `/health`, `/login`
  - BFF API:
    - `/api/health` -> Express `/health`
    - `/api/auth/me` -> Express `/auth/me`
    - `/api/login` -> Express `/login`
- env（apps/web/.env.local）
  - `OEN_API_BASE_URL=http://localhost:8080`（Next→Express 用）
  - `OEN_NEXT_BASE_URL=http://localhost:3000`（現状設定済み）
- 疎通確認
  - `/health` で Next(BFF) → Express の疎通 OK（"Health check successful!" が表示される）。

## 今日決めたこと（設計の意思決定）

### 1) ログイン状態管理は「Cookie（セッション ID 方式）」でいく

- 方式: Cookie に **セッション ID**（例: `oen_session=...`）を保存し、サーバーが検証してユーザーを確定する。
- 理由:
  - BFF 構成と相性が良く、後で LINE ログインに差し替えやすい。
  - `/api/auth/me` を「唯一の真実」にでき、画面が単純になる。

### 2) “ログインのフロー” と “認証状態（セッション）” を分ける

- `/api/login/*` はログインフロー（開始・コールバック・模擬ログイン等）
- `/api/auth/*` は認証状態（me、logout 等）

### 3) 案 A で進める（Next(BFF)で Cookie を見て判定する）

- `GET /api/auth/me` は **Next 側で Cookie を読み、ログイン判定して返す**。
- Express は当面「内部 API」扱いにしてもよい（少なくともブラウザから叩かない）。
- 理由:
  - Next→Express へ Cookie を転送して…という設計（案 B）を先にやると複雑になる。
  - まずは「Next だけでログイン成立 →/me が 200」を作るのが最短。

### 4) URL（相対/絶対）の方針

- ブラウザ → Next(BFF): **相対 URL**で叩く（例: `fetch("/api/auth/me")`）
- Next(BFF) → Express(API): **`OEN_API_BASE_URL` の絶対 URL**で叩く
- `OEN_NEXT_BASE_URL` は将来の callback URL 生成などで必要になる可能性があるが、MVP は相対中心で OK。

## 重要な考え方（MVP の“縦スライス”の芯）

- `/api/auth/me` を「唯一の判定点（真実）」にする。
  - ログイン済み: **200 + user JSON**
  - 未ログイン: **401**
- UI は “結果を見るだけ” にする。
  - `/me` ページは `/api/auth/me` の結果で表示/誘導を分岐する。
  - `/login` は「ログイン開始（mock）」ボタンがあれば十分。

## 次回やること（小さく、確実に前へ進む順）

### Step 0: 目標の確認（このサイクルで達成したい状態）

- 未ログイン: `/me` → 401 → `/login`へ誘導（または「ログインしてください」表示）
- 模擬ログイン後: `/me` → 200 でユーザー情報表示
- ログアウト後: `/me` → 401 に戻る

### Step 1: Next 側に “模擬ログイン” を作る（Cookie 発行）

- `POST /api/login/mock`（BFF）を作り、成功時に `Set-Cookie` を返す。
- Cookie は `HttpOnly` / `SameSite=Lax` を基本に検討する。

### Step 2: Next 側で “me” を作る（Cookie 読取り・検証）

- `GET /api/auth/me` を Next で完結させる（案 A）。
  - Cookie が有効なら 200 で user
  - Cookie がなければ 401

### Step 3: `/me` ページを作る（401 ハンドリング）

- `/me` で `fetch("/api/auth/me")`
- 401 なら `/login` 誘導（サーバーリダイレクト or 画面表示はどちらでも可）

### Step 4: `POST /api/auth/logout` を作る（Cookie 破棄）

- `Set-Cookie`で期限切れにしてログアウトを成立させる。

## 注意点（落とし穴メモ）

- Cookie の「発行（Set-Cookie）」と「判定（Cookie 読取り）」は分ける（責務混在を避ける）。
- 認証 Cookie は基本 `HttpOnly`（JS から読めない）で扱う。
- `SameSite` と `Secure` は本番で必須要素（MVP でも意識しておく）。
- “ログインできたか” を返すだけだと縦に進まない。必ず「状態（セッション）を作る」こと。

## 参考（現在の主要ファイル）

- Next(BFF) me: `apps/web/app/api/auth/me/route.ts`
- Next(BFF) login: `apps/web/app/api/login/route.ts`
- Next page login: `apps/web/app/login/page.tsx`
- Express app: `apps/api/src/app.js`
- Express auth stub: `apps/api/src/routes/auth/index.js`
- Express login stub: `apps/api/src/routes/login.js`
