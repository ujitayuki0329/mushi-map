# Webhook デバッグガイド

## 現在の状況

Stripe Dashboardで「合計 7 失敗 7」となっており、すべてのWebhookイベントが失敗しています。

## 確認手順

### 1. Google Cloud Consoleでログを確認（重要）

Firebase Functionsのログだけでは不十分な場合があります。Google Cloud Consoleで詳細なログを確認してください：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト「insect-collector-maps」を選択
3. 左メニューから「ログ」→「ログエクスプローラー」をクリック
4. リソースタイプで「Cloud Function」を選択
5. 関数名で「stripeWebhook」を選択
6. 時間範囲を「過去1時間」に設定
7. 「ログを実行」をクリック

**確認すべきログ**:
- `Incoming request:` - リクエストが到達しているか
- `Webhook received` - Webhookが受信されたか
- `STRIPE_WEBHOOK_SECRET is not set` - 環境変数が設定されていない
- `Webhook signature verification failed` - 署名検証が失敗している
- エラーメッセージ

### 2. 環境変数の確認

Firebase Functionsの環境変数が正しく設定されているか確認：

```bash
# Firebase Functionsの環境変数を確認（ただし、これは非推奨の方法）
firebase functions:config:get
```

または、Google Cloud Consoleで確認：
1. [Google Cloud Console](https://console.cloud.google.com/) → Cloud Functions
2. `stripeWebhook`関数をクリック
3. 「編集」タブ → 「環境変数、ネットワーク、タイムアウト」セクション
4. `STRIPE_WEBHOOK_SECRET`が設定されているか確認

### 3. Stripe Dashboardでイベントの詳細を確認

1. Stripe Dashboard → 「開発者」→「Webhook」
2. `mushi-map-webhook`をクリック
3. 「イベント」タブを開く
4. 失敗したイベントをクリック
5. 「リクエスト」と「レスポンス」を確認
   - リクエストのURLが正しいか
   - レスポンスコード（400, 500など）
   - エラーメッセージ

### 4. 手動でWebhookをテスト

Stripe Dashboardでテストイベントを送信：

1. Stripe Dashboard → 「開発者」→「Webhook」
2. `mushi-map-webhook`をクリック
3. 「テストイベントを送信する」をクリック
4. イベントタイプで`checkout.session.completed`を選択
5. 「送信」をクリック
6. Google Cloud Consoleのログで確認

## よくある問題と解決方法

### 問題1: 環境変数が設定されていない

**症状**: ログに`STRIPE_WEBHOOK_SECRET is not set`が表示される

**解決方法**:
1. Google Cloud Console → Cloud Functions → `stripeWebhook` → 編集
2. 「環境変数、ネットワーク、タイムアウト」セクションで環境変数を追加
3. 名前: `STRIPE_WEBHOOK_SECRET`
4. 値: Stripe Dashboardで取得したWebhookシークレット（`whsec_...`）
5. 「デプロイ」をクリック

### 問題2: 署名検証が失敗している

**症状**: ログに`Webhook signature verification failed`が表示される

**原因**:
- Webhookシークレットが間違っている
- 生のリクエストボディが正しく取得できていない

**解決方法**:
- Webhookシークレットが正しいか確認
- Express.jsとbody-parserが正しく設定されているか確認

### 問題3: リクエストが到達していない

**症状**: ログに`Incoming request:`が表示されない

**原因**:
- Firebase Functionsが正常にデプロイされていない
- URLが間違っている
- セキュリティ設定の問題

**解決方法**:
- Firebase Functionsが正常にデプロイされているか確認
- URLが正しいか確認（`https://us-central1-insect-collector-maps.cloudfunctions.net/stripeWebhook`）
- セキュリティレベルが`SECURE_ALWAYS`になっていないか確認

## 次のステップ

1. **再デプロイ**
   ```bash
   firebase deploy --only functions
   ```

2. **Google Cloud Consoleでログを確認**
   - 上記の手順に従ってログを確認

3. **Stripe Dashboardでテストイベントを送信**
   - 手動でテストイベントを送信して動作を確認

4. **実際の決済をテスト**
   - テスト決済を実行して、Webhookが正常に動作するか確認
