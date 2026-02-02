# ngrok開発環境セットアップガイド

このファイルは、ngrokを使った開発環境でLINE通知機能をテストする際の設定手順をまとめたものです。

---

## 📋 事前準備

- [ ] ngrokインストール済み
- [ ] LINE Developersアカウント作成済み
- [ ] LINE Loginチャネル作成済み
- [ ] LINE Messaging APIチャネル作成済み

---

## 🚀 開発開始時の手順（ngrok起動ごとに実行）

### 1. ngrok起動

```bash
# 別ターミナルで実行
ngrok http 3000
```

**表示されるURLをコピー：**

```
Forwarding https://abc123-ngrok-free.app -> http://localhost:3000
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              このURLをコピー
```

---

### 2. .env.local更新

**ファイル：** `apps/web/.env.local`

**変更箇所：**

```env
# ngrokのURLに書き換え
OEN_WEB_BASE_URL=https://YOUR_NGROK_URL

# ngrokのURL + /api/auth/line/callback
LINE_REDIRECT_URI=https://YOUR_NGROK_URL/api/auth/line/callback
```

**例：**

```env
OEN_WEB_BASE_URL=https://abc123-ngrok-free.app
LINE_REDIRECT_URI=https://abc123-ngrok-free.app/api/auth/line/callback
```

---

### 3. LINE Developers設定更新（2箇所）

#### 3-1. LINE Login設定

**URL：** https://developers.line.biz/console/

**手順：**

1. プロバイダー選択 → チャネル選択
2. **「LINE Login」タブ**
3. 「コールバックURL」セクション
4. 編集ボタンをクリック

**設定する値：**

```
https://YOUR_NGROK_URL/api/auth/line/callback
```

**例：**

```
https://abc123-ngrok-free.app/api/auth/line/callback
```

**注意：**

- 末尾に `/` は付けない
- `https://` を必ず含める

---

#### 3-2. Messaging API設定

**場所：** 同じチャネル → **「Messaging API」タブ**

**手順：**

1. 下にスクロール
2. **「Webhook URL」セクション**
3. 編集ボタンをクリック

**設定する値：**

```
https://YOUR_NGROK_URL/webhook-line
```

**例：**

```
https://abc123-ngrok-free.app/webhook-line
```

**追加で確認：**

- [ ] **Webhookの利用：ON** にする
- [ ] **応答メッセージ：OFF** にする（推奨）

---

### 4. アプリケーション起動

```bash
# プロジェクトルートで実行
npm run dev
```

**確認：**

- Next.js: http://localhost:3000
- Express: http://localhost:8080
- ngrok: https://YOUR_NGROK_URL

---

### 5. Next.js再起動（環境変数反映）

.env.local を変更した場合、Next.jsを再起動する：

```bash
# Ctrl+C で停止 → 再度起動
npm run dev
```

---

## ✅ 動作確認チェックリスト

### ローカル環境

- [ ] ngrok が起動している（http://localhost:4040 でインスペクター確認可能）
- [ ] Next.js が起動している（http://localhost:3000）
- [ ] Express が起動している（http://localhost:8080）
- [ ] .env.local の `OEN_WEB_BASE_URL` が ngrok URL
- [ ] .env.local の `LINE_REDIRECT_URI` が ngrok URL + callback

### LINE Developers

- [ ] LINE Login の Callback URL が ngrok URL + callback
- [ ] Messaging API の Webhook URL が ngrok URL + webhook-line
- [ ] Webhook利用が ON
- [ ] 応答メッセージが OFF

### 機能テスト

- [ ] ngrok URL にブラウザでアクセスできる
- [ ] LINE Login ができる
- [ ] ダッシュボードにアクセスできる
- [ ] 投稿作成ができる
- [ ] LINE公式アカウントに通知が届く
- [ ] 投稿URLからアクセスできる

---

## 🔍 デバッグ方法

### ngrokインスペクター

```
http://localhost:4040
```

- Webhookのリクエスト内容を確認できる
- LINEから送られてきたデータを見れる
- エラーレスポンスを確認できる

### Expressのヘルスチェック

```
http://localhost:8080/health
```

正常に起動していれば：

```json
{ "msg": "Health check successful!" }
```

### Supabaseデータ確認

**supportersテーブル：**

```sql
SELECT * FROM supporters;
```

自分のLINE userIdが登録されているか確認

**postsテーブル：**

```sql
SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;
```

投稿が作成されているか確認

---

## ⚠️ よくあるトラブルと対処法

### 1. LINE Login時に「Redirect URI mismatch」エラー

**原因：**

- LINE Developers の Callback URL と .env.local の `LINE_REDIRECT_URI` が一致していない

**対処：**

1. 両方が完全に一致しているか確認（末尾の `/` の有無も含めて）
2. Next.js を再起動（環境変数を反映）
3. ブラウザのキャッシュをクリア

---

### 2. Webhookが届かない（友だち追加しても反応しない）

**確認手順：**

1. **ngrok インスペクターで確認**
   - http://localhost:4040 を開く
   - 友だち追加時にリクエストが来ているか？

2. **LINE Developers の Webhook URL が正しいか確認**
   - `https://YOUR_NGROK_URL/webhook-line` になっているか
   - Webhook利用が ON になっているか

3. **Express が起動しているか確認**
   - http://localhost:8080/health にアクセス
   - エラーが出ていないか、ターミナルログを確認

4. **署名検証エラーが出ていないか**
   - Express のターミナルログを確認
   - `LINE_MESSAGING_CHANNEL_SECRET` が正しいか確認

---

### 3. 通知が届かない（投稿作成しても通知が来ない）

**確認手順：**

1. **LINE公式アカウントを友だち追加しているか**
   - Messaging API の QRコード から追加

2. **ブロックしていないか**
   - LINEアプリで確認

3. **supportersテーブルに登録されているか**

   ```sql
   SELECT * FROM supporters WHERE is_blocked = false;
   ```

4. **通知送信のエラーログを確認**
   - Next.js のターミナルで「通知送信エラー」が出ていないか
   - Express のターミナルでエラーが出ていないか

---

### 4. 投稿URLにアクセスできない

**確認：**

- ngrok URL が正しいか
- ngrok が起動しているか
- shareToken が正しいか

---

## 📝 ngrok再起動時のチェックリスト

ngrokを再起動すると、**URLが変わる**ため、以下を更新：

- [ ] 1. .env.local の `OEN_WEB_BASE_URL`
- [ ] 2. .env.local の `LINE_REDIRECT_URI`
- [ ] 3. LINE Developers の Callback URL
- [ ] 4. LINE Developers の Webhook URL
- [ ] 5. Next.js を再起動

**所要時間：** 約2-3分

---

## 💡 開発のコツ

### ngrokを起動しっぱなしにする

- 無料版は2時間でセッションタイムアウト
- 開発中は起動しっぱなしにしておく
- タイムアウトしたら再起動 → 上記チェックリスト実行

### ngrokの固定ドメイン（有料プラン）

URLが固定されるため、設定変更が不要に：

```bash
ngrok http 3000 --domain=your-domain.ngrok-free.app
```

料金：$8/月〜

---

## 🚀 本番環境への移行時

本番デプロイ時は、別途以下の設定が必要：

1. Vercel環境変数の設定
2. Express APIのデプロイ（デプロイ先未定）
3. LINE Developers の本番URL設定

詳細は別途ドキュメント化予定。
