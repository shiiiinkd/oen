# next-action.md

## 決定事項まとめ（Cursor共有用 / 2026-01-27 更新）

### 1) 目的と最終体験（MVP）

- 投稿者（当面は自分）が **LINEログイン**して投稿を作成する
- 投稿が作成されたら **Oh!EN公式LINEアカウント**から支援者へ通知（投稿リンク）
- 支援者は通知から投稿を閲覧し、支援したければ Oh!EN内の支援ボタンから **PayPay に遷移**して送金する
- Oh!ENは **決済を扱わない**
  - 送金事実の検証もしない
  - 支援完了は **自己申告のみ**管理する（reported など）

### 2) PayPay導線（確定）

- 投稿作成時に投稿者が **PayPayリンク（URL）を設定**する
- 支援者は Oh!EN内でそのリンクをタップし、PayPayで送金する
- PayPayリンクは **PayPayアプリ側で生成**し、Oh!ENは **保存・表示するだけ**（生成/検証しない）
- 期限切れはMVPでは割り切り（技術的検知は後回し）。必要なら文言で案内

#### LINEトーク乱立対策（確定）

- LINE公式アカウントは **投稿通知（投稿URL）だけ送る**
- PayPayリンクは **LINEで送らず Oh!EN内にのみ表示**
  - トークが荒れない
  - 支援体験の中心をOh!ENに寄せる

---

## 設計方針（固定）

- **ブラウザは Next のみを叩く**（Express 直叩き禁止）
- Next.js は **BFF（Backend For Frontend）**
- Express は **裏方API**（業務処理・外部連携・DB操作）
- 認証は **セッションCookie方式**（JWTは使わない）
- DBは **Postgres + ORM**（Supabaseなど可）。SQL手書きしない前提
- Redirect URI は Next（Vercel）に固定
- env 不足は fail-fast（`env_missing`）に寄せる

---

## LINEの役割（確定）

- LINE Login（OAuth / OIDC）：**認証（個人アカウントでログイン）**
- LINE公式アカウント（Messaging API）：**通知送信の送信元**
  - Oh!EN公式アカウント1つ固定
  - 将来投稿者が増えても、通知送信元は基本 Oh!EN公式アカウント
  - 投稿者ごとに公式アカウントを持たせる案は、支援者の友だち追加問題で重くなるためMVPでは採用しない

---

## ユーザーID設計の注意点（共有）

- LINEの `sub` はチャネルに紐づく一意IDなので、**LINE Loginチャネルは固定運用が前提**
- `sub` は内部ID（owner識別）として扱う
- 表示名は別概念（公開名/ハンドル等は後で設計）。MVPでは `name?` は表示候補として保持する

---

## 現状サマリ（実装到達点 / 2026-01-27）

### 実装済み（認証 / Step2 Done）

- LINE callbackで `sub` 取得 → セッション作成 → `oen_session` cookie発行
- `GET /api/auth/me`
  - ログイン時 200: `{ id: <sessionId>, lineSub: <sub>, name?: <displayName?> }`
  - 未ログイン/不明セッション 401
- `POST /api/auth/logout`
  - cookie破棄 + セッション削除（存在しない場合でもOK）
- `/dashboard`
  - ログインユーザー表示（`lineSub`/`name?`）
  - 401なら `/login` へ

### 開発体験

- web+api同時起動が前提
  - repo直下で `npm run dev`（`dev:web` + `dev:api`）を実行する
  - `apps/web` だけで起動すると、`/login` が Express へ疎通 `fetch` して `fetch failed` が出る場合がある（片方だけ起動が原因）
- Prettier導入・format整備済み（`apps/web`）
  - `npm run format` / `npm run format:check`

---

## 環境変数（整理）

### 必須（apps/web / LINE Login）

- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_REDIRECT_URI`（例: `https://<host>/api/auth/line/callback`）

### 必須（apps/web / BFF → Express）

- `OEN_API_BASE_URL`（例: `http://localhost:8080`）

### 予定（LINE通知 / Messaging API）

MVPでは「支援者固定」なので、通知先は一旦 env 固定で回避する（支援者の userId を手で登録）。
（具体的な env 名は実装時に確定する）

---

## MVPの最短縦スライス（確定順）

### Slice 1：投稿作成 + shareToken閲覧（支援者ログイン不要）

#### 目的

- 投稿者（ログイン必須）が投稿を作成できる
- 支援者（ログイン不要）が shareToken（秘密URL）で投稿を閲覧できる

#### 最小データ（案）

- `Post`
  - `id`
  - `ownerLineSub`（投稿者の `lineSub`）
  - `content`（短文でOK）
  - `shareToken`（推測不能なランダム文字列）
  - `paypayLink?`（Slice 3 で使用）
  - `createdAt`
  - `reportedAt?`（Slice 3 の自己申告）

#### shareToken 方針（MVP）

- **期限なし**で開始（UX事故を避けて最短で通す）
- 漏洩が怖くなった段階で「手動無効化（revoked）」を追加する
- トークンは推測不能な長さを確保（ランダムUUID相当以上）

---

### Slice 2：投稿作成時のLINE通知（Oh!EN公式から投稿URL送信）

#### 目的

- 投稿が作成されたら、支援者（親2人 + 数人想定）のLINEに投稿URLが届く

#### 実装の注意

- LINE Login の `sub` と Messaging API の userId は別物になり得る
- MVPは「支援者固定」なので、通知先 userId を env 固定で回避して先に進む

---

### Slice 3：支援導線（PayPayリンク表示） + 自己申告

#### 目的

- 支援者は投稿ページ内の支援ボタンから **PayPayリンクへ遷移**できる
- 支援後に「支援しました」ボタンで **自己申告**できる（reported）

---

## Step 3（その次）：永続化 & 安全性

### 3-1. セッション永続化（必要になったら）

- インメモリ Map → DB/Redis（再起動耐性）
- Cookie属性の共通化（`secure/sameSite/maxAge/path` のヘルパー化）

### 3-2. OAuth安全性

- PKCE 対応（可能なら）
- ログ/監視（callback 失敗理由の可視化）

---

## 参考：主要ファイル

- `apps/web/app/_lib/env.ts`
- `apps/web/app/_lib/line/oauth.ts`
- `apps/web/app/api/auth/line/route.ts`
- `apps/web/app/api/auth/line/callback/route.ts`
- `apps/web/app/api/auth/me/route.ts`
- `apps/web/app/api/auth/logout/route.ts`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/login/page.tsx`
