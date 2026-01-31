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

## 現状サマリ（実装到達点 / 2026-01-31）

### ✅ Slice 1完了：投稿作成 + 閲覧

#### 実装済み機能
- **LINE認証**
  - LINE callbackで `sub` 取得 → セッション作成 → `oen_session` cookie発行
  - `GET /api/auth/me`（ログイン確認・ユーザー情報取得）
  - `POST /api/auth/logout`（ログアウト）
  - `/dashboard`（ログインユーザー表示、未認証は `/login` へリダイレクト）

- **投稿機能**
  - `POST /api/posts`（投稿作成）
  - `/p/[shareToken]`（投稿閲覧・認証不要）
  - `posts` テーブル（Supabase）

### 🔄 Slice 2進行中：LINE通知機能

#### 実装方針
- **Webhook + DB管理**方式を採用
  - LINE公式アカウントのWebhookで `follow`/`unfollow` イベントを受信
  - `supporters` テーブルで友だち登録者を自動管理
  - 投稿作成時に、テーブル内の全員に通知を送信

#### 実装済み（2026-01-31）
- ✅ `supporters` テーブル作成（Supabase SQL）
  ```sql
  CREATE TABLE supporters (
    line_user_id TEXT PRIMARY KEY,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
- ✅ Express側 Supabase Client実装（`apps/api/src/lib/supabase.ts`）
- ✅ LINE Messaging API環境変数設定完了

#### 次にやること（優先順）
1. **LINE Messaging関数実装**（`apps/api/src/lib/line-messaging.ts`）
   - Client初期化（`@line/bot-sdk`）
   - `sendMessage(userId, text)` 関数作成
   
2. **Webhook受信エンドポイント**（`apps/api/src/routes/webhook-line.ts`）
   - `follow` イベント → `supporters` テーブルに追加（`is_blocked=false`）
   - `unfollow` イベント → `is_blocked=true` に更新
   - Webhook署名検証（`channelSecret` 使用）

3. **通知送信エンドポイント**（`apps/api/src/routes/notifications.ts`）
   - `POST /notifications/post-created`
   - `supporters` テーブルから `is_blocked=false` の全ユーザー取得
   - 全員に LINE メッセージ送信

4. **BFF側から通知呼び出し**（`apps/web/app/api/posts/route.ts` 修正）
   - 投稿作成後に Express API経由で通知送信

5. **ローカルテスト**
   - ngrok でExpress APIを外部公開
   - LINE Developers で Webhook URL設定
   - 友だち追加/ブロック/投稿作成をテスト

### 開発体験

- web+api同時起動が前提
  - repo直下で `npm run dev`（`dev:web` + `dev:api`）を実行する
  - `apps/web` だけで起動すると、`/login` が Express へ疎通 `fetch` して `fetch failed` が出る場合がある（片方だけ起動が原因）
- Prettier導入・format整備済み（`apps/web`）
  - `npm run format` / `npm run format:check`
- **TypeScript環境**（Express側）
  - `tsconfig.json` 設定済み（JS/TS混在可能）
  - 新規ファイルは `.ts` 推奨、既存 `.js` はそのまま

---

## 環境変数（整理）

### 必須（apps/web / LINE Login）

- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_REDIRECT_URI`（例: `https://<host>/api/auth/line/callback`）

### 必須（apps/web / BFF → Express）

- `OEN_API_BASE_URL`（例: `http://localhost:8080`）

### 必須（apps/web / Supabase）

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 必須（apps/api / LINE Messaging API）✅ 設定済み

- `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`（メッセージ送信用）
- `LINE_MESSAGING_CHANNEL_SECRET`（Webhook署名検証用）

### 必須（apps/api / Supabase）✅ 設定済み

- `SUPABASE_URL`（BFF側と同じプロジェクト）
- `SUPABASE_SERVICE_ROLE_KEY`（BFF側と同じキー）

### 廃止予定（apps/api）

- ~~`SUPPORTER_LINE_USER_IDS`~~ → Webhook + DB管理方式に移行

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

#### 実装アーキテクチャ

**Webhook + DB管理方式**を採用：
1. ユーザーがLINE公式アカウントを友だち追加
2. Webhookで `follow` イベント受信 → `supporters` テーブルに追加
3. 投稿作成時に、テーブル内の全ユーザーに通知送信
4. ユーザーがブロック → Webhookで `unfollow` イベント → `is_blocked=true` に更新

**メリット：**
- 手動管理不要（自動同期）
- 再登録にも対応
- 履歴管理（いつから支援者か分かる）

#### 実装の注意

- LINE Login の `sub` と Messaging API の `userId` は別物
  - Login: OIDC（認証用）
  - Messaging: 通知送信用
  - 同じLINEユーザーでも異なるID

#### テーブル設計

**`supporters` テーブル**：
- `line_user_id` (TEXT, PK): Messaging APIのユーザーID
- `is_blocked` (BOOLEAN): ブロック状態（false=通知対象）
- `created_at` (TIMESTAMPTZ): 初回友だち登録日時
- `updated_at` (TIMESTAMPTZ): 最終更新日時

※将来的に `display_name` などを追加可能（管理画面用）

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

### BFF（Next.js）
- `apps/web/app/_lib/env.ts`
- `apps/web/app/_lib/line/oauth.ts`
- `apps/web/app/_lib/supabase/server.ts`
- `apps/web/app/_lib/posts/posts-repo.ts`
- `apps/web/app/api/auth/line/route.ts`
- `apps/web/app/api/auth/line/callback/route.ts`
- `apps/web/app/api/auth/me/route.ts`
- `apps/web/app/api/auth/logout/route.ts`
- `apps/web/app/api/posts/route.ts`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/p/[shareToken]/page.tsx`

### API（Express）
- `apps/api/src/lib/supabase.ts` ✅
- `apps/api/src/lib/line-messaging.ts` 🔄次
- `apps/api/src/routes/webhook-line.ts` （未実装）
- `apps/api/src/routes/notifications.ts` （未実装）
