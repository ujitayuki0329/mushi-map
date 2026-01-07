import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 環境変数の読み込み
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Firebase Admin SDKの初期化
if (getApps().length === 0) {
  // サービスアカウントキーを使用する場合
  // const serviceAccount = require('../path/to/serviceAccountKey.json');
  // initializeApp({ credential: cert(serviceAccount) });
  
  // または、環境変数から直接初期化（GOOGLE_APPLICATION_CREDENTIALSが設定されている場合）
  // initializeApp();
  
  // 簡易版: 環境変数から直接設定
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('FIREBASE_PROJECT_IDが設定されていません。');
    console.error('Firebase Admin SDKを使用するには、サービスアカウントキーが必要です。');
    console.error('または、Firestoreのセキュリティルールを一時的に変更してください。');
    process.exit(1);
  }
  
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
  });
}

const db = getFirestore();

// 都道府県の中心座標
const prefectureCoordinates: { [key: string]: { lat: number; lng: number } } = {
  '北海道': { lat: 43.0642, lng: 141.3469 },
  '青森県': { lat: 40.8244, lng: 140.7406 },
  '岩手県': { lat: 39.7036, lng: 141.1527 },
  '宮城県': { lat: 38.2688, lng: 140.8721 },
  '秋田県': { lat: 39.7186, lng: 140.1024 },
  '山形県': { lat: 38.2404, lng: 140.3633 },
  '福島県': { lat: 37.7503, lng: 140.4676 },
  '茨城県': { lat: 36.3414, lng: 140.4467 },
  '栃木県': { lat: 36.5658, lng: 139.8836 },
  '群馬県': { lat: 36.3911, lng: 139.0608 },
  '埼玉県': { lat: 35.8574, lng: 139.6489 },
  '千葉県': { lat: 35.6074, lng: 140.1065 },
  '東京都': { lat: 35.6762, lng: 139.6503 },
  '神奈川県': { lat: 35.4475, lng: 139.6425 },
  '新潟県': { lat: 37.9022, lng: 139.0234 },
  '富山県': { lat: 36.6953, lng: 137.2113 },
  '石川県': { lat: 36.5947, lng: 136.6256 },
  '福井県': { lat: 36.0652, lng: 136.2216 },
  '山梨県': { lat: 35.6636, lng: 138.5684 },
  '長野県': { lat: 36.6513, lng: 138.1810 },
  '岐阜県': { lat: 35.3912, lng: 136.7223 },
  '静岡県': { lat: 34.9769, lng: 138.3830 },
  '愛知県': { lat: 35.1802, lng: 136.9066 },
  '三重県': { lat: 34.7303, lng: 136.5086 },
  '滋賀県': { lat: 35.0045, lng: 135.8686 },
  '京都府': { lat: 35.0212, lng: 135.7556 },
  '大阪府': { lat: 34.6937, lng: 135.5023 },
  '兵庫県': { lat: 34.6913, lng: 135.1830 },
  '奈良県': { lat: 34.6851, lng: 135.8050 },
  '和歌山県': { lat: 34.2261, lng: 135.1675 },
  '鳥取県': { lat: 35.5039, lng: 134.2377 },
  '島根県': { lat: 35.4723, lng: 133.0505 },
  '岡山県': { lat: 34.6617, lng: 133.9350 },
  '広島県': { lat: 34.3960, lng: 132.4596 },
  '山口県': { lat: 34.1858, lng: 131.4705 },
  '徳島県': { lat: 34.0658, lng: 134.5593 },
  '香川県': { lat: 34.3401, lng: 134.0433 },
  '愛媛県': { lat: 33.8416, lng: 132.7657 },
  '高知県': { lat: 33.5597, lng: 133.5311 },
  '福岡県': { lat: 33.5904, lng: 130.4017 },
  '佐賀県': { lat: 33.2494, lng: 130.2988 },
  '長崎県': { lat: 32.7448, lng: 129.8737 },
  '熊本県': { lat: 32.7898, lng: 130.7416 },
  '大分県': { lat: 33.2381, lng: 131.6126 },
  '宮崎県': { lat: 31.9077, lng: 131.4202 },
  '鹿児島県': { lat: 31.5602, lng: 130.5581 },
  '沖縄県': { lat: 26.2124, lng: 127.6809 }
};

// 昆虫名のリスト
const insectNames = [
  'カブトムシ', 'クワガタムシ', 'ナナホシテントウ', 'アゲハチョウ', 'モンシロチョウ',
  'トンボ', 'セミ', 'バッタ', 'コオロギ', 'カマキリ',
  'ハチ', 'アリ', 'カメムシ', 'テントウムシ', 'ホタル',
  'カミキリムシ', 'タマムシ', 'ハナムグリ', 'コガネムシ', 'オオスズメバチ',
  'ミツバチ', 'アオスジアゲハ', 'キアゲハ', 'モンキチョウ', 'ツマグロヒョウモン',
  'アカタテハ', 'ルリタテハ', 'キタテハ', 'イチモンジセセリ', 'クロアゲハ',
  'オオムラサキ', 'アサギマダラ', 'ギフチョウ', 'ミヤマカラスアゲハ', 'オオミドリシジミ',
  'ベニシジミ', 'ヤマトシジミ', 'ツバメシジミ', 'ルリシジミ', 'ムラサキシジミ',
  'オオゴマダラ', 'アカエリトリバネアゲハ', 'アオバセセリ', 'イチモンジセセリ',
  'キイロスズメバチ', 'クロスズメバチ', 'セグロアシナガバチ', 'フタモンアシナガバチ',
  'オオカマキリ', 'ハラビロカマキリ', 'チョウセンカマキリ', 'コカマキリ', 'ウスバカマキリ',
  'ショウリョウバッタ', 'オンブバッタ', 'クルマバッタ', 'トノサマバッタ', 'イナゴ',
  'エンマコオロギ', 'マツムシ', 'スズムシ', 'カネタタキ',
  'アブラゼミ', 'ミンミンゼミ', 'ツクツクボウシ', 'ヒグラシ', 'ニイニイゼミ',
  'オオシオカラトンボ', 'シオカラトンボ', 'アキアカネ', 'ナツアカネ', 'コノハムシ',
  'ナナフシ', 'ハナカマキリ'
];

// ランダムな値を生成する関数
const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ランダムな日付を生成（過去1年間）
const randomTimestamp = (): number => {
  const now = Date.now();
  const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
  return randomInt(oneYearAgo, now);
};

// テストデータを生成して追加
const generateTestData = async () => {
  const prefectures = Object.keys(prefectureCoordinates);
  const userIds = ['test-user-1', 'test-user-2', 'test-user-3', 'test-user-4', 'test-user-5'];
  
  console.log('テストデータの生成を開始します...');
  
  for (let i = 0; i < 100; i++) {
    try {
      // ランダムな都道府県を選択
      const prefecture = randomChoice(prefectures);
      const baseCoord = prefectureCoordinates[prefecture];
      
      // 都道府県内でランダムな位置を生成（±0.5度の範囲）
      const lat = baseCoord.lat + randomFloat(-0.5, 0.5);
      const lng = baseCoord.lng + randomFloat(-0.5, 0.5);
      
      // ランダムな昆虫名とメモ
      const insectName = randomChoice(insectNames);
      const memo = `テストデータ ${i + 1} - ${prefecture}で採集`;
      
      // ランダムなタイムスタンプ
      const timestamp = randomTimestamp();
      
      // ランダムなユーザーID
      const userId = randomChoice(userIds);
      
      // ダミー画像URL（テストデータ用）
      const imageUrl = `https://via.placeholder.com/400x300/4ade80/ffffff?text=${encodeURIComponent(insectName)}`;
      
      // Firestoreに保存
      const entryData = {
        name: insectName,
        memo: memo,
        imageUrl: imageUrl,
        latitude: lat,
        longitude: lng,
        timestamp: timestamp,
        userId: userId,
        aiInsights: {
          description: `${insectName}は${prefecture}でよく見られる昆虫です。`,
          links: []
        },
        createdAt: Timestamp.fromMillis(timestamp),
        updatedAt: Timestamp.now()
      };
      
      await db.collection('insectEntries').add(entryData);
      
      if ((i + 1) % 10 === 0) {
        console.log(`${i + 1}件のデータを追加しました...`);
      }
    } catch (error) {
      console.error(`データ ${i + 1} の追加に失敗:`, error);
    }
  }
  
  console.log('テストデータの生成が完了しました！');
  process.exit(0);
};

generateTestData().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});

