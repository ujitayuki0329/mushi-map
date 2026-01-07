// 緯度・経度から都道府県を判定する簡易関数
export const getPrefectureFromCoordinates = (lat: number, lng: number): string => {
  // 主要な都道府県の範囲を定義（簡易版）
  // より正確な判定には逆ジオコーディングAPIを使用することを推奨
  
  // 北海道
  if (lat >= 41.0 && lat <= 45.5 && lng >= 139.0 && lng <= 146.0) {
    return '北海道';
  }
  
  // 青森県
  if (lat >= 40.0 && lat <= 41.5 && lng >= 139.5 && lng <= 141.5) {
    return '青森県';
  }
  
  // 岩手県
  if (lat >= 38.5 && lat <= 40.5 && lng >= 140.5 && lng <= 142.0) {
    return '岩手県';
  }
  
  // 宮城県
  if (lat >= 37.5 && lat <= 39.0 && lng >= 140.5 && lng <= 141.5) {
    return '宮城県';
  }
  
  // 秋田県
  if (lat >= 38.5 && lat <= 40.5 && lng >= 139.5 && lng <= 141.0) {
    return '秋田県';
  }
  
  // 山形県
  if (lat >= 37.5 && lat <= 39.0 && lng >= 139.5 && lng <= 140.5) {
    return '山形県';
  }
  
  // 福島県
  if (lat >= 36.5 && lat <= 38.0 && lng >= 139.5 && lng <= 141.0) {
    return '福島県';
  }
  
  // 東京都（より具体的な範囲を先に判定）
  if (lat >= 35.3 && lat <= 35.9 && lng >= 138.7 && lng <= 139.9) {
    return '東京都';
  }
  
  // 神奈川県
  if (lat >= 35.0 && lat <= 35.7 && lng >= 138.5 && lng <= 139.5) {
    return '神奈川県';
  }
  
  // 千葉県（より広い範囲で判定、東京都と重複する部分は東京都を優先）
  if (lat >= 35.0 && lat <= 36.0 && lng >= 139.5 && lng <= 140.9) {
    // 東京都の範囲と重複する場合は除外（既に東京都で判定済み）
    if (!(lat >= 35.3 && lat <= 35.9 && lng >= 138.7 && lng <= 139.9)) {
      return '千葉県';
    }
  }
  
  // 埼玉県
  if (lat >= 35.5 && lat <= 36.5 && lng >= 138.5 && lng <= 139.8) {
    return '埼玉県';
  }
  
  // 茨城県
  if (lat >= 35.5 && lat <= 36.8 && lng >= 139.5 && lng <= 140.8) {
    return '茨城県';
  }
  
  // 栃木県
  if (lat >= 36.0 && lat <= 37.0 && lng >= 139.0 && lng <= 140.0) {
    return '栃木県';
  }
  
  // 群馬県
  if (lat >= 36.0 && lat <= 36.8 && lng >= 138.5 && lng <= 139.5) {
    return '群馬県';
  }
  
  // 新潟県
  if (lat >= 36.5 && lat <= 38.5 && lng >= 137.5 && lng <= 139.5) {
    return '新潟県';
  }
  
  // 富山県
  if (lat >= 36.0 && lat <= 37.0 && lng >= 136.5 && lng <= 137.5) {
    return '富山県';
  }
  
  // 石川県
  if (lat >= 36.0 && lat <= 37.5 && lng >= 136.0 && lng <= 137.5) {
    return '石川県';
  }
  
  // 福井県
  if (lat >= 35.5 && lat <= 36.5 && lng >= 135.5 && lng <= 136.5) {
    return '福井県';
  }
  
  // 山梨県
  if (lat >= 35.0 && lat <= 36.0 && lng >= 138.0 && lng <= 139.0) {
    return '山梨県';
  }
  
  // 長野県
  if (lat >= 35.5 && lat <= 37.0 && lng >= 137.5 && lng <= 138.5) {
    return '長野県';
  }
  
  // 岐阜県
  if (lat >= 35.0 && lat <= 36.5 && lng >= 136.5 && lng <= 137.5) {
    return '岐阜県';
  }
  
  // 静岡県
  if (lat >= 34.5 && lat <= 35.5 && lng >= 137.5 && lng <= 139.0) {
    return '静岡県';
  }
  
  // 愛知県
  if (lat >= 34.5 && lat <= 35.5 && lng >= 136.5 && lng <= 137.5) {
    return '愛知県';
  }
  
  // 三重県
  if (lat >= 33.5 && lat <= 35.0 && lng >= 135.5 && lng <= 136.8) {
    return '三重県';
  }
  
  // 滋賀県
  if (lat >= 34.5 && lat <= 35.5 && lng >= 135.5 && lng <= 136.5) {
    return '滋賀県';
  }
  
  // 京都府
  if (lat >= 34.5 && lat <= 35.5 && lng >= 135.0 && lng <= 136.0) {
    return '京都府';
  }
  
  // 大阪府
  if (lat >= 34.3 && lat <= 34.9 && lng >= 135.2 && lng <= 135.8) {
    return '大阪府';
  }
  
  // 兵庫県
  if (lat >= 34.0 && lat <= 35.5 && lng >= 134.0 && lng <= 135.5) {
    return '兵庫県';
  }
  
  // 奈良県
  if (lat >= 34.0 && lat <= 34.8 && lng >= 135.5 && lng <= 136.0) {
    return '奈良県';
  }
  
  // 和歌山県
  if (lat >= 33.5 && lat <= 34.5 && lng >= 135.0 && lng <= 136.0) {
    return '和歌山県';
  }
  
  // 鳥取県
  if (lat >= 35.0 && lat <= 35.8 && lng >= 133.5 && lng <= 134.5) {
    return '鳥取県';
  }
  
  // 島根県
  if (lat >= 34.5 && lat <= 36.0 && lng >= 131.5 && lng <= 133.5) {
    return '島根県';
  }
  
  // 岡山県
  if (lat >= 34.5 && lat <= 35.5 && lng >= 133.5 && lng <= 134.5) {
    return '岡山県';
  }
  
  // 広島県
  if (lat >= 34.0 && lat <= 35.0 && lng >= 132.0 && lng <= 133.5) {
    return '広島県';
  }
  
  // 山口県
  if (lat >= 33.5 && lat <= 34.8 && lng >= 130.5 && lng <= 132.0) {
    return '山口県';
  }
  
  // 徳島県
  if (lat >= 33.5 && lat <= 34.5 && lng >= 133.5 && lng <= 134.5) {
    return '徳島県';
  }
  
  // 香川県
  if (lat >= 34.0 && lat <= 34.5 && lng >= 133.5 && lng <= 134.5) {
    return '香川県';
  }
  
  // 愛媛県
  if (lat >= 32.5 && lat <= 34.5 && lng >= 132.5 && lng <= 133.5) {
    return '愛媛県';
  }
  
  // 高知県
  if (lat >= 32.5 && lat <= 34.0 && lng >= 132.5 && lng <= 134.0) {
    return '高知県';
  }
  
  // 福岡県
  if (lat >= 33.0 && lat <= 34.0 && lng >= 130.0 && lng <= 131.0) {
    return '福岡県';
  }
  
  // 佐賀県
  if (lat >= 33.0 && lat <= 33.8 && lng >= 129.5 && lng <= 130.5) {
    return '佐賀県';
  }
  
  // 長崎県
  if (lat >= 32.5 && lat <= 34.5 && lng >= 128.5 && lng <= 130.0) {
    return '長崎県';
  }
  
  // 熊本県
  if (lat >= 32.0 && lat <= 33.5 && lng >= 130.0 && lng <= 131.5) {
    return '熊本県';
  }
  
  // 大分県
  if (lat >= 32.5 && lat <= 33.8 && lng >= 130.5 && lng <= 132.0) {
    return '大分県';
  }
  
  // 宮崎県
  if (lat >= 31.5 && lat <= 32.5 && lng >= 130.5 && lng <= 132.0) {
    return '宮崎県';
  }
  
  // 鹿児島県
  if (lat >= 30.5 && lat <= 32.0 && lng >= 129.5 && lng <= 131.0) {
    return '鹿児島県';
  }
  
  // 沖縄県
  if (lat >= 24.0 && lat <= 27.0 && lng >= 123.0 && lng <= 130.0) {
    return '沖縄県';
  }
  
  // 判定できない場合は「不明」
  return '不明';
};

// タイムスタンプから季節を取得
export const getSeasonFromTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1; // 0-11なので+1
  
  if (month >= 3 && month <= 5) {
    return '春';
  } else if (month >= 6 && month <= 8) {
    return '夏';
  } else if (month >= 9 && month <= 11) {
    return '秋';
  } else {
    return '冬';
  }
};

