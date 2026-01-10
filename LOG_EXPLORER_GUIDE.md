# Google Cloud Console ログエクスプローラーの使い方

## ログエクスプローラーへのアクセス方法

### 方法1: 左メニューから

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト「insect-collector-maps」が選択されていることを確認
3. 左側のメニュー（ハンバーガーメニュー）を開く
4. **「ログ」** または **「Logging」** をクリック
5. **「ログエクスプローラー」** または **「Log Explorer」** をクリック

### 方法2: 検索バーから

1. Google Cloud Consoleの上部にある検索バー（「Google Cloud のリソース、ドキュメント、サポートを検索」）をクリック
2. 「ログエクスプローラー」または「Log Explorer」と入力
3. 検索結果から「ログエクスプローラー」を選択

### 方法3: 直接URL

以下のURLにアクセス：
```
https://console.cloud.google.com/logs/query?project=insect-collector-maps
```

## ログエクスプローラーの画面構成

ログエクスプローラーの画面には以下の要素があります：

### 1. クエリビルダー（上部）

- **リソースタイプ** のドロップダウン
- **時間範囲** の選択
- **クエリ** の入力欄

### 2. リソースタイプの場所

**リソースタイプ**は、ログエクスプローラーの**上部**にあります：

1. ログエクスプローラーの画面を開く
2. 画面上部の**「リソースタイプ」**または**「Resource type」**というドロップダウンを探す
3. クリックしてドロップダウンを開く
4. **「Cloud Function」**または**「Cloud Functions」**を選択

### 3. 関数名のフィルタ

リソースタイプで「Cloud Function」を選択した後：

1. **「関数名」**または**「Function name」**のフィルタが表示される
2. ドロップダウンから**「stripeWebhook」**を選択

### 4. 時間範囲の設定

1. 右上の**時間範囲**をクリック
2. **「過去1時間」**または**「過去24時間」**を選択
3. または、カスタムの時間範囲を設定

### 5. ログの実行

1. **「ログを実行」**または**「Run query」**ボタンをクリック
2. ログエントリが表示されます

## 確認すべきログ

以下のログを探してください：

### 成功している場合

- `Incoming request: POST /`
- `Webhook received`
- `Webhook signature verified successfully`
- `Event type: checkout.session.completed`
- `Premium subscription activated for user: ...`

### エラーの場合

- `STRIPE_WEBHOOK_SECRET is not set`
- `Webhook secret is not configured`
- `Stripe signature header is missing`
- `Webhook signature verification failed`
- `Error processing webhook`

## クエリの例

ログエクスプローラーで直接クエリを入力する場合：

```
resource.type="cloud_function"
resource.labels.function_name="stripeWebhook"
severity>=ERROR
```

または、より詳細なクエリ：

```
resource.type="cloud_function"
resource.labels.function_name="stripeWebhook"
jsonPayload.message=~"Webhook"
```

## トラブルシューティング

### ログが表示されない場合

1. **時間範囲を確認**
   - 過去1時間、過去24時間など、適切な時間範囲を選択

2. **リソースタイプを確認**
   - 「Cloud Function」が選択されているか確認

3. **関数名を確認**
   - 「stripeWebhook」が選択されているか確認

4. **権限を確認**
   - ログを表示する権限があるか確認

### ログエクスプローラーが見つからない場合

1. 左メニューの「ログ」セクションを展開
2. 「ログエクスプローラー」を探す
3. または、検索バーで「Log Explorer」と検索

## 注意事項

- **監査ログ**（現在表示されているページ）と**ログエクスプローラー**は別物です
- 監査ログは「何をログに記録するか」を設定するページ
- ログエクスプローラーは「実際のログを表示・検索する」ページ
