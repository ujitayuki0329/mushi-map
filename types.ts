
export interface InsectEntry {
  id: string;
  name: string;
  memo: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  userId?: string; // 投稿者のユーザーID
  aiInsights?: {
    description: string;
    links: Array<{ title: string; uri: string }>;
  };
}

export interface Location {
  lat: number;
  lng: number;
}

export type SubscriptionPlan = 'free' | 'premium';

export interface UserSubscription {
  userId: string;
  plan: SubscriptionPlan;
  startDate: number;
  endDate?: number; // プレミアムの場合、有効期限
  isActive: boolean;
  stripeCustomerId?: string; // Stripe顧客ID
  stripeSubscriptionId?: string; // StripeサブスクリプションID
  cancelAtPeriodEnd?: boolean; // 次回更新時に解約予定かどうか
}

export interface CustomMarkerSettings {
  userId: string;
  color: string; // マーカーの色（HEX形式）
  iconType?: 'default' | 'star' | 'circle' | 'square'; // アイコンの種類
  updatedAt: number;
}
