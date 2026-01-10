# デプロイメント状況とVercel移行ガイド

## 📋 現状まとめ

### ✅ 完了していること

1. **ローカル環境での動作確認**
   - 決済機能が正常に動作
   - Stripe管理画面で決済完了を確認済み
   - Firebase Functions（`createCheckoutSession`、`stripeWebhook`）がデプロイ済み

2. **Firebase Functionsのデプロイ状況**
   - 関数名: `createCheckoutSession`（HTTP Callable）
   - 関数名: `stripeWebhook`（HTTP Request）
   - リージョン: `us-central1`
   - デプロイ日時: 2026/01/09 11:11

3. **Stripe Webhook設定**
   - Webhookエンドポイント作成済み
   - イベント設定: `checkout.session.completed`、`customer.subscription.deleted`

### ⚠️ 確認が必要なこと

1. **Firebase Functionsの環境変数**
   - `STRIPE_SECRET_KEY`: 設定状況を確認
   - `STRIPE_WEBHOOK_SECRET`: 設定状況を確認
   - 現在はテストモード（`sk_test_...`、`whsec_...`）

2. **本番環境への移行準備**
   - Stripe本番キーへの切り替え
   - 本番用Webhookエンドポイントの設定

---

## 🏗️ アーキテクチャ概要

```
┌─────────────────┐
│  Vercel (Frontend) │
│  - React + Vite   │
│  - Static Assets  │
└────────┬──────────┘
         │
         ├─ Firebase Authentication
         ├─ Firestore Database
         ├─ Firebase Storage
         │
         └─ Firebase Functions
            ├─ createCheckoutSession
            └─ stripeWebhook
                 │
                 └─ Stripe API
```

---

## 🔧 環境変数の整理

### フロントエンド（Vercel用）

Vercelの環境変数設定で以下を設定してください：

| 変数名 | 説明 | 例 | 必須 |
|--------|------|-----|------|
| `VITE_GEMINI_API_KEY` | Google Gemini APIキー | `AIza...` | ✅ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe公開可能キー | `pk_test_...` または `pk_live_...` | ✅ |
| `VITE_STRIPE_PRICE_ID` | Stripe価格ID | `price_...` | ✅ |
| `VITE_FIREBASE_API_KEY` | Firebase APIキー | `AIza...` | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase認証ドメイン | `insect-collector-maps.firebaseapp.com` | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | FirebaseプロジェクトID | `insect-collector-maps` | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storageバケット | `insect-collector-maps.appspot.com` | ✅ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789:web:...` | ✅ |

**注意**: `VITE_`プレフィックスが付いた変数のみ、フロントエンドで使用可能です。

### バックエンド（Firebase Functions用）

Firebase Functionsの環境変数は、Google Cloud Consoleまたはgcloud CLIで設定：

| 変数名 | 説明 | 例 | 必須 |
|--------|------|-----|------|
| `STRIPE_SECRET_KEY` | Stripeシークレットキー | `sk_test_...` または `sk_live_...` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook署名シークレット | `whsec_...` | ✅ |

---

## 🚀 Vercelデプロイ手順

### 1. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択（またはGitリポジトリをインポート）

### 2. ビルド設定

Vercelは自動的にViteプロジェクトを検出しますが、以下を確認：

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. 環境変数の設定

Vercel Dashboard → プロジェクト → Settings → Environment Variables で以下を設定：

```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (テスト) または pk_live_... (本番)
VITE_STRIPE_PRICE_ID=price_...
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=insect-collector-maps.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=insect-collector-maps
VITE_FIREBASE_STORAGE_BUCKET=insect-collector-maps.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**重要**: 
- 環境ごと（Production、Preview、Development）に設定可能
- 本番環境では `pk_live_...` を使用

### 4. デプロイ

```bash
# Vercel CLIを使用する場合
npm i -g vercel
vercel

# または、Gitにプッシュすると自動デプロイ
git push origin main
```

---

## 🔄 本番環境への移行チェックリスト

### Stripe設定

- [ ] Stripe Dashboardで本番モードに切り替え
- [ ] 本番用公開可能キー（`pk_live_...`）を取得
- [ ] 本番用シークレットキー（`sk_live_...`）を取得
- [ ] 本番用価格ID（`price_...`）を作成・確認
- [ ] 本番用Webhookエンドポイントを作成
- [ ] 本番用Webhook署名シークレット（`whsec_...`）を取得

### Firebase Functions設定

- [ ] Google Cloud Consoleで環境変数を更新：
  - `STRIPE_SECRET_KEY` → 本番キー（`sk_live_...`）
  - `STRIPE_WEBHOOK_SECRET` → 本番Webhookシークレット（`whsec_...`）
- [ ] Functionsを再デプロイ：
  ```bash
  firebase deploy --only functions
  ```

### Vercel設定

- [ ] 環境変数を本番用に更新：
  - `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
  - `VITE_STRIPE_PRICE_ID` → 本番価格ID
- [ ] デプロイを実行して動作確認

### 動作確認

- [ ] 本番環境で決済フローをテスト
- [ ] Stripe Dashboardで本番決済を確認
- [ ] Firebase Functionsのログでエラーがないか確認
- [ ] Webhookが正常に動作するか確認

---

## 📝 重要な注意事項

### セキュリティ

1. **環境変数の管理**
   - `.env`ファイルはGitにコミットしない（`.gitignore`に含まれています）
   - VercelとFirebase Functionsの環境変数は別々に管理
   - 本番環境のキーは厳重に管理

2. **CORS設定**
   - Firebase Functionsは自動的にCORSを処理
   - VercelのドメインがFirebase Functionsから許可されているか確認

3. **Firebaseセキュリティルール**
   - FirestoreとStorageのセキュリティルールが適切に設定されているか確認
   - 本番環境では、認証済みユーザーのみがアクセスできるように設定

### パフォーマンス

1. **Firebase Functionsのコールドスタート**
   - 初回呼び出し時に遅延が発生する可能性
   - 必要に応じて最小インスタンス数を設定

2. **Vercelのエッジネットワーク**
   - 静的アセットは自動的にCDNで配信
   - 画像やアセットの最適化を検討

---

## 🐛 トラブルシューティング

### 決済が動作しない場合

1. **ブラウザコンソールでエラーを確認**
   - `VITE_STRIPE_PUBLISHABLE_KEY`が正しく設定されているか
   - Firebase Functionsへの接続エラーがないか

2. **Firebase Functionsのログを確認**
   ```bash
   firebase functions:log
   ```
   - `STRIPE_SECRET_KEY is not set` エラーが出ていないか
   - Stripe API呼び出しのエラーがないか

3. **Stripe Dashboardで確認**
   - Webhookイベントが受信されているか
   - エラーイベントがないか

### 環境変数が読み込まれない場合

1. **Vercelの環境変数設定を確認**
   - `VITE_`プレフィックスが付いているか
   - 正しい環境（Production/Preview）に設定されているか

2. **ビルドログを確認**
   - Vercelのデプロイログで環境変数が正しく読み込まれているか

3. **再デプロイ**
   - 環境変数を変更した後は、再デプロイが必要

---

## 📚 参考ドキュメント

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe Documentation](https://stripe.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## 📞 サポート

問題が発生した場合：
1. ブラウザのコンソールでエラーを確認
2. Firebase Functionsのログを確認
3. Stripe Dashboardでイベントを確認
4. 上記のトラブルシューティングセクションを参照
