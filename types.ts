
export interface InsectEntry {
  id: string;
  name: string;
  memo: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  aiInsights?: {
    description: string;
    links: Array<{ title: string; uri: string }>;
  };
}

export interface Location {
  lat: number;
  lng: number;
}
