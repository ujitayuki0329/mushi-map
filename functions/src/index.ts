import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import * as express from 'express';
import * as bodyParser from 'body-parser';

admin.initializeApp();

// 環境変数から取得（Firebase Functions v2対応）
// 優先順位: functions.config() > process.env > 空文字
// 環境変数から取得（Firebase Functions v2対応）
// 優先順位: functions.config() > process.env > 空文字
let stripeSecretKey = '';
const functionsConfig = functions.config();

try {
  stripeSecretKey = functionsConfig.stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '';
} catch (e) {
  console.error('Error accessing config:', e);
  stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
}

if (!stripeSecretKey) {
  console.error('CRITICAL: STRIPE_SECRET_KEY is not set!');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Stripe Checkout Sessionを作成
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // 認証チェック
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です');
  }

  const userId = context.auth.uid;
  const { priceId, successUrl, cancelUrl } = data;

  if (!priceId) {
    throw new functions.https.HttpsError('invalid-argument', '価格IDが必要です');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${data.origin || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${data.origin || 'http://localhost:3000'}/cancel`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error('Stripe error:', error);
    throw new functions.https.HttpsError('internal', error.message || '決済セッションの作成に失敗しました');
  }
});

// Webhook: サブスクリプション成功時の処理
// Express.jsを使用して生のリクエストボディを取得
const webhookApp = express();

// 生のリクエストボディを取得するためのミドルウェア
// Stripeの署名検証には生のボディが必要
webhookApp.use(bodyParser.raw({ type: 'application/json' }));

// すべてのリクエストをログに記録（デバッグ用）
webhookApp.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path);
  next();
});

// GETリクエスト（ヘルスチェックなど）への対応
webhookApp.get('*', (req, res) => {
  console.log('GET request received');
  res.status(200).send('Webhook endpoint is active');
});

webhookApp.post('*', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  console.log('Webhook received');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Raw body type:', typeof req.body);
  console.log('Raw body length:', req.body?.length || 0);
  
  // 環境変数から取得（Firebase Functions v2対応）
  let webhookSecret = '';
  try {
    const functionsConfig = functions.config();
    webhookSecret = functionsConfig.stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || '';
  } catch {
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
    res.status(400).send('Webhook secret is not configured');
    return;
  }
  
  if (!sig) {
    console.error('Stripe signature header is missing');
    res.status(400).send('Stripe signature is missing');
    return;
  }

  // Firestore Functions (especially 2nd gen or certain configurations) 
  // might automatically parse JSON bodies.
  // In that case, we should use the rawBody property if available.
  const rawBody = (req as any).rawBody || req.body;

  let event: Stripe.Event;

  try {
    // 生のリクエストボディ（Buffer）を使用して署名を検証
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    );
    console.log('Webhook signature verified successfully');
    console.log('Event type:', event.type);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    console.error('Error details:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;

      console.log('Webhook: checkout.session.completed');
      console.log('Session ID:', session.id);
      console.log('Session metadata:', session.metadata);
      console.log('Client reference ID:', session.client_reference_id);
      console.log('Extracted userId:', userId);

      if (userId) {
        const db = admin.firestore();
        const subscriptionData = {
          userId,
          plan: 'premium',
          startDate: Date.now(),
          endDate: null, // サブスクリプションは自動更新
          isActive: true,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        };
        
        console.log('Writing subscription data to Firestore:', subscriptionData);
        
        await db.collection('userSubscriptions').doc(userId).set(subscriptionData, { merge: true });
        
        // 書き込み後の確認
        const docRef = db.collection('userSubscriptions').doc(userId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          console.log('Subscription data confirmed in Firestore:', docSnap.data());
        } else {
          console.error('ERROR: Subscription data was not written to Firestore!');
        }
        
        console.log(`Premium subscription activated for user: ${userId}`);
      } else {
        console.error('ERROR: userId is missing from session metadata and client_reference_id');
        console.error('Session object:', JSON.stringify(session, null, 2));
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // 顧客IDからユーザーIDを取得
      const db = admin.firestore();
      const subscriptionsSnapshot = await db.collection('userSubscriptions')
        .where('stripeCustomerId', '==', customerId)
        .get();
      
      if (!subscriptionsSnapshot.empty) {
        const subscriptionDoc = subscriptionsSnapshot.docs[0];
        const userId = subscriptionDoc.id;
        
        await db.collection('userSubscriptions').doc(userId).update({
          plan: 'free',
          isActive: false,
          endDate: Date.now(),
        });
        
        console.log(`Premium subscription cancelled for user: ${userId}`);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// ExpressアプリをFirebase Functionsでエクスポート
export const stripeWebhook = functions.https.onRequest(webhookApp);
