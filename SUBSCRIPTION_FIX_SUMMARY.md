# サブスクリプション解約機能の修正まとめ

## 実施した修正

### 1. `cancelSubscription`関数の改善

**問題**: 解約予約後、Firestoreの`endDate`がnullのままだった

**修正内容**:
- 解約予約後、即座にStripeからサブスクリプション情報を取得
- `current_period_end`を取得して`endDate`を設定（ミリ秒に変換）
- `cancelAtPeriodEnd`の状態を更新
- Webhookを待たずにFirestoreを更新

### 2. `checkout.session.completed`イベントの改善

**問題**: 新規登録時に`endDate`がnullのままだった

**修正内容**:
- サブスクリプション情報を取得して`current_period_end`を設定
- `cancelAtPeriodEnd`の状態も設定

### 3. `PremiumUpgrade`コンポーネントの改善

**問題**: 解約予約済みの状態が表示されなかった

**修正内容**:
- `cancelAtPeriodEnd`と`endDate`をpropsとして受け取る
- 解約予約済みの場合、有効期限と残り日数を表示
- 解約予約済みの場合は解約ボタンを非表示
- 視覚的に区別するため、アンバー色の背景を使用

### 4. 解約手続き完了時のメッセージ改善

**問題**: 「無料プランに戻りました」と表示され、実際には期間終了までプレミアムプランが使えることが分からなかった

**修正内容**:
- 解約予約が完了したことを明確に表示
- 有効期限を表示
- 残り日数を表示
- 期間終了までプレミアムプランが使えることを明示

### 5. 解約確認ダイアログの改善

**修正内容**:
- 解約後も期間終了までプレミアムプランが使えることを明示
- 期間終了後に無料プランに戻ることを明示

## 確認が必要な項目

### Stripe Webhookの設定

Stripe Dashboardで以下のイベントが設定されているか確認してください：

1. [Stripe Dashboard](https://dashboard.stripe.com/) → 「開発者」→「Webhook」
2. `mushi-map-webhook`をクリック
3. 「イベントを選択」または「イベント」タブで確認

**必要なイベント**:
- ✅ `checkout.session.completed` - 決済完了時
- ✅ `customer.subscription.updated` - サブスクリプション更新時（解約予約時など）
- ✅ `customer.subscription.deleted` - サブスクリプション削除時

`customer.subscription.updated`が設定されていない場合は、追加してください。

## 動作確認

### 1. 解約機能のテスト

1. プレミアムプランにアップグレード
2. 解約ボタンをクリック
3. 確認ダイアログで「OK」をクリック
4. 以下を確認：
   - 解約予約完了のメッセージが表示される
   - 有効期限と残り日数が表示される
   - `PremiumUpgrade`コンポーネントで「解約予約済み」と表示される
   - Firestoreで`endDate`が設定されている
   - Firestoreで`cancelAtPeriodEnd`が`true`になっている

### 2. Webhookの確認

1. Stripe Dashboardで`customer.subscription.updated`イベントが送信されているか確認
2. Firebase Functionsのログで以下を確認：
   - `Subscription updated for user: ...`
   - `cancelAtPeriodEnd: true`

## デプロイ手順

```bash
# Firebase Functionsを再デプロイ
firebase deploy --only functions
```

## 注意事項

- `customer.subscription.updated`イベントは、解約予約時だけでなく、サブスクリプションの状態が変更された時にも送信されます
- 解約予約をキャンセルした場合（再開した場合）も、このイベントが送信されます
- `endDate`は常に最新の`current_period_end`を反映します
