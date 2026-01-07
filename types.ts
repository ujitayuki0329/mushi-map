
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
