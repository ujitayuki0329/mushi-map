<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/17U45jQlrT2TVJt9B2a685AxZ10LVXB8z

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. APIキーの設定:
   - プロジェクトのルートディレクトリに `.env` ファイルを作成してください
   - 以下の内容を記述してください:
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (Stripe公開可能キー)
     VITE_STRIPE_PRICE_ID=price_... (Stripe価格ID、オプション)
     VITE_STRIPE_CHECKOUT_LINK=https://buy.stripe.com/... (Stripe Checkoutリンク、オプション)
     ```
   - Gemini APIキーは [Google AI Studio](https://aistudio.google.com/apikey) で取得できます
   - Stripe APIキーは [Stripe Dashboard](https://dashboard.stripe.com/apikeys) で取得できます
   - **重要**: `.env` ファイルはGitにコミットしないでください（既に.gitignoreに含まれています）

3. アプリを起動:
   ```bash
   npm run dev
   ```

## トラブルシューティング

### 地図が表示されない場合
- ブラウザのコンソールでエラーを確認してください
- LeafletのCSSが正しく読み込まれているか確認してください

### AI判定機能が動作しない場合
- `.env` ファイルがプロジェクトのルートディレクトリに存在するか確認してください
- `VITE_GEMINI_API_KEY` が正しく設定されているか確認してください
- APIキーが有効か確認してください
- ブラウザのコンソールでエラーメッセージを確認してください

### Firebase権限エラーが発生する場合

**重要**: フリーミアムモデルを使用する場合、以下のセキュリティルールを必ず設定してください。

Firestoreのセキュリティルールを更新してください：

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクトを選択
3. 「Firestore Database」→「ルール」タブ
4. 以下のルールを設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /insectEntries/{entryId} {
      // 読み取り: 全員が可能（未ログインでもOK）
      allow read: if true;
      // 書き込み: ログイン必須、自分のデータのみ
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /userSubscriptions/{userId} {
      // 読み取り: 自分のサブスクリプション情報のみ
      allow read: if request.auth != null && request.auth.uid == userId;
      // 書き込み: 自分のサブスクリプション情報のみ
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /userMarkerSettings/{userId} {
      // 読み取り: 自分のマーカー設定のみ
      allow read: if request.auth != null && request.auth.uid == userId;
      // 書き込み: 自分のマーカー設定のみ
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. 「公開」ボタンをクリック

Storageのセキュリティルールも更新してください：

1. 「Storage」→「ルール」タブ
2. 以下のルールを設定：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /insects/{userId}/{allPaths=**} {
      // 読み取り: 全員が可能
      allow read: if true;
      // 書き込み: ログイン必須、自分のフォルダのみ
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. 「公開」ボタンをクリック

**注意**: セキュリティルールを更新しない場合、アプリはエラーなく動作しますが、サブスクリプション機能は無料プランとして動作します。プレミアム機能を使用するには、必ずセキュリティルールを更新してください。

### Stripe決済機能の設定

プレミアムプランの決済機能を使用するには、Stripeの設定が必要です。

#### 方法1: Stripe Checkoutのホスト型ページを使用（簡易版）

1. [Stripe Dashboard](https://dashboard.stripe.com/)にアクセス
2. 「商品」→「商品を追加」で商品を作成
   - 名前: プレミアムプラン
   - 価格: ¥480/月（定期課金）
3. 「決済リンク」→「リンクを作成」でCheckoutリンクを作成
4. `.env`ファイルに以下を追加:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_STRIPE_CHECKOUT_LINK=https://buy.stripe.com/...
   ```

#### 方法2: バックエンドAPI経由（推奨・実装済み）

1. Stripe Dashboardで価格IDを取得
   - 「商品」→「価格」から価格ID（`price_...`）をコピー
2. `.env`ファイルに以下を追加:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_STRIPE_PRICE_ID=price_...
   ```
3. Firebase Functionsの環境変数を設定:
   ```bash
   # Stripeシークレットキーを設定
   firebase functions:config:set stripe.secret_key="sk_test_..."
   
   # Webhookシークレットを設定（後で設定）
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```
4. Firebase Functionsをデプロイ:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```
5. Stripe Webhookの設定:
   - Stripe Dashboard → 「開発者」→「Webhook」
   - 「エンドポイントを追加」をクリック
   - エンドポイントURL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
   - イベントを選択: `checkout.session.completed`, `customer.subscription.deleted`
   - シークレットをコピーして、上記の`stripe.webhook_secret`に設定

#### テストカード

Stripeのテストモードでは、以下のテストカードが使用できます：
- 成功: `4242 4242 4242 4242`
- 3Dセキュア認証: `4000 0025 0000 3155`
- 有効期限: 任意の未来の日付
- CVC: 任意の3桁

詳細は [Stripeのテストカード](https://stripe.com/docs/testing) を参照してください。

## Vercelへのデプロイ

このアプリはVercelにデプロイできます。

### 前提条件

- Firebase Functionsがデプロイ済み（`createCheckoutSession`、`stripeWebhook`）
- Stripe Webhookが設定済み

### デプロイ手順

1. **Vercelプロジェクトの作成**
   - [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
   - 「Add New Project」をクリック
   - GitHubリポジトリを選択

2. **環境変数の設定**
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

3. **デプロイ**
   - Gitにプッシュすると自動デプロイされます
   - または、Vercel CLIを使用：
     ```bash
     npm i -g vercel
     vercel
     ```

### 詳細情報

詳細なデプロイ手順と本番環境への移行チェックリストは、[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)を参照してください。
