# Webhook トラブルシューティングガイド

## 問題: 決済完了後もプレミアムプランにならない

### 修正内容

以下の修正を実施しました：

1. **フロントエンドの修正**
   - 決済完了後にURLパラメータ（`session_id`）を監視
   - ページがフォーカスされた時にサブスクリプション状態を再読み込み
   - Webhookの処理完了を待つため、3秒の遅延を追加

2. **Webhook処理のログ強化**
   - 詳細なログを追加してデバッグしやすく改善
   - userIdの取得状況を確認
   - Firestoreへの書き込みを確認

### 確認手順

#### 1. Firebase Functionsのログを確認

```bash
firebase functions:log
```

または、[Firebase Console](https://console.firebase.google.com/) → Functions → ログ で確認

**確認すべきログ**:
- `Webhook: checkout.session.completed` - Webhookが受信された
- `Extracted userId: ...` - userIdが正しく取得できた
- `Writing subscription data to Firestore: ...` - Firestoreに書き込もうとしている
- `Subscription data confirmed in Firestore: ...` - Firestoreへの書き込みが成功した
- `Premium subscription activated for user: ...` - 処理が完了した

**エラーログ**:
- `ERROR: userId is missing` - userIdが取得できていない
- `ERROR: Subscription data was not written to Firestore!` - Firestoreへの書き込みが失敗

#### 2. Stripe DashboardでWebhookイベントを確認

1. [Stripe Dashboard](https://dashboard.stripe.com/) → 「開発者」→「Webhook」
2. 作成したWebhookエンドポイントをクリック
3. 「イベント」タブで以下を確認：
   - `checkout.session.completed`イベントが送信されているか
   - イベントのステータス（成功/失敗）
   - レスポンスコード（200が正常）

#### 3. Firestoreでデータを確認

1. [Firebase Console](https://console.firebase.google.com/) → Firestore Database
2. `userSubscriptions`コレクションを確認
3. ユーザーIDのドキュメントが存在するか確認
4. ドキュメントの内容を確認：
   ```json
   {
     "userId": "ユーザーID",
     "plan": "premium",
     "isActive": true,
     "startDate": タイムスタンプ,
     "stripeCustomerId": "cus_...",
     "stripeSubscriptionId": "sub_..."
   }
   ```

#### 4. ブラウザのコンソールを確認

決済完了後に戻ってきた時、以下のログが表示されるはずです：
- `Payment completed, session_id: ...`
- `Reloading subscription status after payment...`

### よくある問題と解決方法

#### 問題1: Webhookが受信されていない

**症状**: Stripe Dashboardでイベントが送信されていない、または失敗している

**解決方法**:
1. WebhookエンドポイントURLが正しいか確認
2. Firebase Functionsがデプロイされているか確認
3. Webhookシークレットが正しく設定されているか確認

#### 問題2: userIdが取得できない

**症状**: ログに `ERROR: userId is missing` が表示される

**原因**: 
- `createCheckoutSession`で`client_reference_id`が正しく設定されていない
- `metadata.userId`が正しく設定されていない

**解決方法**:
- `functions/src/index.ts`の`createCheckoutSession`関数を確認
- `client_reference_id`と`metadata.userId`の両方が設定されているか確認

#### 問題3: Firestoreへの書き込みが失敗

**症状**: ログに `ERROR: Subscription data was not written to Firestore!` が表示される

**原因**:
- Firestoreのセキュリティルールで書き込みが許可されていない
- 権限エラー

**解決方法**:
1. Firestoreのセキュリティルールを確認
2. `userSubscriptions`コレクションへの書き込み権限があるか確認
3. セキュリティルールを更新（READMEを参照）

#### 問題4: フロントエンドでサブスクリプション状態が更新されない

**症状**: Firestoreにはデータが書き込まれているが、アプリでプレミアムプランにならない

**解決方法**:
1. ブラウザのコンソールでエラーを確認
2. ページをリロードしてみる
3. ログアウトして再度ログインしてみる
4. ブラウザのキャッシュをクリアしてみる

### デバッグ用のコマンド

#### Firebase Functionsのログをリアルタイムで確認

```bash
firebase functions:log --only stripeWebhook
```

#### 特定の関数のログのみを確認

```bash
firebase functions:log --only createCheckoutSession
```

#### 最新のログのみを表示

```bash
firebase functions:log --limit 50
```

### テスト手順

1. **テスト決済を実行**
   - アプリでプレミアムプランへのアップグレードを試す
   - Stripeのテストカードを使用（`4242 4242 4242 4242`）

2. **ログを確認**
   - Firebase Functionsのログを確認
   - Stripe DashboardでWebhookイベントを確認

3. **データを確認**
   - Firestoreで`userSubscriptions`コレクションを確認
   - アプリでプレミアムプランになっているか確認

4. **再読み込みを確認**
   - 決済完了後にアプリに戻った時、自動的にプレミアムプランになっているか確認
   - ページをリロードして、プレミアムプランが維持されているか確認

### 修正後の再デプロイ

修正を反映するには、Firebase Functionsを再デプロイしてください：

```bash
firebase deploy --only functions
```

### 追加の確認事項

- [ ] Firebase Functionsが正常にデプロイされている
- [ ] WebhookエンドポイントURLが正しい
- [ ] Webhookシークレットが正しく設定されている
- [ ] Firestoreのセキュリティルールが正しく設定されている
- [ ] Stripe DashboardでWebhookイベントが送信されている
- [ ] Firebase Functionsのログでエラーがない
- [ ] Firestoreにデータが正しく書き込まれている
