import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

// Stripeインスタンスを取得（シングルトンパターン）
export const getStripe = (): Promise<Stripe | null> => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set in .env file');
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Stripe Checkout Sessionを作成（Firebase Functions経由）
export const createCheckoutSession = async (
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string | null }> => {
  try {
    // Firebase Functionsを呼び出す
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const createCheckoutSessionFn = httpsCallable(functions, 'createCheckoutSession');

    const result = await createCheckoutSessionFn({
      priceId,
      successUrl,
      cancelUrl,
      origin: window.location.origin,
    });

    const data = result.data as { sessionId: string; url: string | null };
    return { sessionId: data.sessionId, url: data.url };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // エラーメッセージをより分かりやすく
    if (error.code === 'functions/not-found') {
      throw new Error('Firebase Functionsがデプロイされていません。functionsディレクトリを確認してください。');
    } else if (error.code === 'functions/unauthenticated') {
      throw new Error('ログインが必要です。');
    } else if (error.code === 'functions/invalid-argument') {
      throw new Error('価格IDが正しく設定されていません。');
    }
    
    throw error;
  }
};

// Stripe Checkoutにリダイレクト
export const redirectToCheckout = async (sessionId: string, url?: string | null): Promise<void> => {
  // URLがある場合は直接リダイレクト（推奨）
  if (url) {
    window.location.href = url;
    return;
  }

  throw new Error('決済用URLが取得できませんでした。');
};

// 簡易版: Stripe Checkoutのホスト型ページに直接リダイレクト
// この方法を使用する場合は、StripeダッシュボードでCheckoutリンクを事前に作成してください
export const redirectToCheckoutLink = (checkoutLink: string): void => {
  window.location.href = checkoutLink;
};
