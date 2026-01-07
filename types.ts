
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
}
