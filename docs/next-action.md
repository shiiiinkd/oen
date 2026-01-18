# next-action.md

## Step 1 : LINE ログイン → ダッシュボード到達（MVP）

---

## 目的（Step 1）

LINE ログインで認証できるようにし、  
ログイン完了後に **Oh!EN のダッシュボード（仮）へ到達できる状態** を作る。

本ステップでは「LINE ログインが成立し、ログイン状態がアプリ内で継続する」ことだけに集中する。

---

## Done の定義（受け入れ条件）

- ブラウザで `/login` を開ける
- 「LINE でログイン」ボタンを押す
- LINE 認可画面が表示され、許可できる
- Oh!EN に戻ってきて **セッション Cookie（oen_session）が発行される**
- `/dashboard`（または `/me`）に遷移し、ログイン状態が維持される
- `GET /api/auth/me`
  - ログイン時 : `200`
  - 未ログイン時 : `401`
- `401` 時はログインガードが正しく機能する

---

## 前提（現状の資産）

### Next（apps/web）

- Cookie セッション（`oen_session`）の発行・判定・logout は実装済み
- 認証判定点は **`GET /api/auth/me` に統一**
- 本番は **Vercel にデプロイ済み**
  - 公開 URL: https://oen-seven.vercel.app

### Express（apps/api）

- 現状はスタブのみ
- LINE ログイン本体は未着手
- Heroku にデプロイ済み（裏方 API）

---

## 設計方針（固定）

- **ブラウザは Next のみを叩く**
- Express をブラウザから直接叩かない
- Next は **BFF（Backend For Frontend）**
- Express は **裏方 API**
- LINE ログインは「本物のログイン」に差し替えるが、既存の縦スライスは崩さない
- **Redirect URI は Next（Vercel）に固定する**

---

## 大まかな実装フロー（Step 1）

### 全体フロー（責務）

1. ブラウザ → Next `/login`
2. Next → LINE 認可画面へリダイレクト（Authorize URL）
3. LINE → Next（callback）へリダイレクト（`code`, `state`）
4. Next（callback）
   - `code/state` 検証
   - LINE Token API で交換
   - ID Token / ユーザー情報取得
5. Next が **`oen_session` Cookie を発行**
6. Next が `/dashboard` へリダイレクト
7. `/dashboard` は `GET /api/auth/me` でログイン確認

---

## 作業ステップ（順序付き）

### 0. 画面・ルートの最低限を確定

- `/dashboard` を新規作成（中身は白で OK）
- `/dashboard` で `GET /api/auth/me` を実行
  - `401` → `/login` にリダイレクト
  - `200` → 「ログイン中」表示
- 既存 `/me` を仮ダッシュボードとして使ってもよい
  - 最終的には `/dashboard` に統一

---

### 1. LINE チャネル準備（設定）

- LINE Developers で **LINE Login チャネル**を作成
- Redirect URI を以下に設定する

https://oen-seven.vercel.app/api/auth/line/callback

- スコープは最小構成から開始
  - `openid`
  - `profile`
- メールアドレス取得は必須にしない

---

### 2. LINE ログイン開始エンドポイントを追加

**目的**  
Authorize URL を生成し、LINE 認可画面へリダイレクトする。

- エンドポイント
  GET /api/auth/line

**やること**

- `state` を生成（CSRF 対策）
- `nonce` を生成（ID Token 検証用）
- 以下を **短命 Cookie** に保存（推奨）
  - `oen_oauth_state`
  - `oen_oauth_nonce`
- LINE Authorize URL へリダイレクト

**注意**

- ログイン画面の「LINE でログイン」ボタンは
  - この API を叩くだけ
  - state / nonce を画面側で生成しない

---

### 3. LINE コールバックエンドポイントを追加

**目的**  
認可結果を受け取り、Oh!EN のログインを成立させる。

- エンドポイント
  GET /api/auth/line/callback

**処理順（重要）**

1. クエリから `code` / `state` を取得
2. Cookie の `oen_oauth_state` と一致するか検証
   - 不一致ならエラー
3. LINE Token API に `code` を送ってトークン交換
4. ID Token / ユーザー情報から **LINE ユーザーを一意に特定**
   - Step 1 では `sub` 等が取れれば十分
5. `oen_session` Cookie を発行
   - 中身はランダムなセッション ID 推奨
6. `/dashboard` にリダイレクト
7. `oen_oauth_state` / `oen_oauth_nonce` Cookie を破棄

---

### 4. `GET /api/auth/me` を本物に寄せる

現状は「Cookie があればダミー user」。

Step 1 では以下どちらかで OK。

#### A 案（最短）

- Cookie があれば `200`
- user 情報を LINE 由来に差し替える
  - `id`, `name` など最低限

#### B 案（次につながる）

- Cookie はセッション ID
- Next 側で
  sessionId -> lineUser

を保持し、`/api/auth/me` はそこから user を返す

※ B 案はメモリ保持のため再起動で消えるが、Step 1 では許容

---

### 5. mock ログインの扱い

- Step 1 完了までは残して OK（デバッグ用）
- 完了後は
  - LINE ログインを主導線に
  - mock は env で非表示 or 削除

---

### 6. 動作確認

- 未ログインで `/dashboard` → `/login`
- `/login` → LINE 認可 → callback → `/dashboard`
- `/dashboard` で `/api/auth/me` が `200`
- logout → `/api/auth/me` が `401`
- state 不一致で弾かれる

---

## この Step で「やらないこと」（意図的な撤退）

- Express 側での本格セッション管理（DB）
- ユーザー永続化（users テーブル等）
- Messaging API 連携
- PayPay 導線（SupportIntent）
- 複数活動者対応

---

## 成果物一覧（Step 1）

- `/dashboard`（または `/me`）
- `GET /api/auth/line`
- `GET /api/auth/line/callback`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- LINE Developers 側設定（Redirect URI）

---
