# Google Cloud Function 権限設定修正ガイド

「WebHookで全てエラーとなっている」場合、Google Cloud Functionsの権限設定で、外部からのアクセス（Stripeからのアクセス）が許可されていない可能性があります。特に新しいデプロイでは、デフォルトで「認証が必要」になっていることがあります。

以下の手順で、関数への未認証アクセス（公開アクセス）を許可してください。

## 手順

1. **Google Cloud Consoleを開く**
   - [Google Cloud Console](https://console.cloud.google.com/functions/list) の Cloud Functions 一覧ページにアクセスします。
   - プロジェクト「insect-collector-maps」が選択されていることを確認してください。

2. **対象の関数を選択**
   - 一覧から `stripeWebhook` という名前の関数を探します。
   - 注: `createCheckoutSession` ではなく `stripeWebhook` です。

3. **権限設定を開く**
   - `stripeWebhook` の行のチェックボックスにチェックを入れます。
   - 画面上部の「権限 (PERMISSIONS)」をクリックします。
   - 右側に権限設定パネルが開きます。

4. **プリンシパルを追加**
   - 「プリンシパルを追加 (ADD PRINCIPAL)」ボタンをクリックします。

5. **allUsers に Cloud Functions 起動元 権限を付与**
   - **新しいプリンシパル**: `allUsers` と入力します（候補から選択）。
   - **ロールを選択**: 「Cloud Functions」 > 「Cloud Functions 起動元 (Cloud Functions Invoker)」を選択します。
     - 検索ボックスに `Invoker` や `起動元` と入力すると見つけやすいです。

6. **保存**
   - 「保存」をクリックします。
   - 「このリソースを一般公開しますか？」という警告が出ますが、「一般公開アクセスを許可 (ALLOW PUBLIC ACCESS)」をクリックします。

## 確認方法

設定完了後、Stripe Dashboardに戻り、失敗したWebhookイベントを「再送信」してください。
これでステータスが `200 OK` になれば、原因は権限設定でした。

もしこれでもエラー（400 Bad Requestなど）になる場合は、先ほど適用したコード修正（`req.rawBody`対応）を含めて、Functionsを再デプロイしてください。

```bash
firebase deploy --only functions
```
