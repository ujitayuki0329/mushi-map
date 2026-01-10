# Firebase Functions デプロイ手順（更新版）

## 1. Firebaseにログイン（手動）

ターミナルで以下を実行してください：

```bash
firebase login
```

ブラウザが開くので、Googleアカウントでログインしてください。

## 2. プロジェクトを選択

```bash
firebase use insect-collector-maps
```

## 3. Functionsをデプロイ

環境変数は`functions/.env`ファイルに設定済みです。直接デプロイできます：

```bash
firebase deploy --only functions
```

## 4. デプロイ後のWebhook URLを確認

デプロイが成功すると、以下のようなURLが表示されます：

```
Function URL (stripeWebhook): https://YOUR_REGION-insect-collector-maps.cloudfunctions.net/stripeWebhook
```

このURLをコピーして、Stripe DashboardのWebhook設定で使用してください。

## 5. Stripe Webhookの設定

1. Stripe Dashboard → 「開発者」→「Webhook」
2. エンドポイントURLに、上記の`stripeWebhook`のURLを入力
3. イベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. 「送信先を作成する」をクリック
5. 作成後、表示される「署名シークレット」をコピー（`whsec_...`で始まる）

## 6. Webhookシークレットを設定

`functions/.env`ファイルに以下を追加：

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 7. 再度デプロイ

```bash
firebase deploy --only functions
```

## 完了！

これで、Stripe決済機能が完全に動作します。

## 注意事項

- `functions/.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- 本番環境では、Firebase Consoleの環境変数設定を使用することを推奨します
