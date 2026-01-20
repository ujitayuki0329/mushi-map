import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import { InsectEntry } from '../types';

// 全ユーザーのエントリを取得（userIdを含む）
export type EntryWithUserId = InsectEntry & { userId?: string };

export const saveEntry = async (entry: Omit<InsectEntry, 'id' | 'imageUrl'>, userId: string, imageBase64: string) => {
  try {
    // 画像のバリデーション
    if (!imageBase64 || imageBase64.trim() === '') {
      throw new Error('画像が指定されていません。画像をアップロードまたは撮影してください。');
    }

    // 画像をStorageにアップロード
    const imageRef = ref(storage, `insects/${userId}/${Date.now()}.jpg`);
    await uploadString(imageRef, imageBase64, 'data_url');
    const imageUrl = await getDownloadURL(imageRef);

    // Firestoreに保存
    const entryData = {
      ...entry,
      imageUrl,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'insectEntries'), entryData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
};

export const getUserEntries = async (userId: string): Promise<InsectEntry[]> => {
  try {
    // まずuserIdでフィルタリング
    const q = query(
      collection(db, 'insectEntries'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        memo: data.memo,
        imageUrl: data.imageUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp || data.createdAt?.toMillis() || Date.now(),
        aiInsights: data.aiInsights
      };
    }) as InsectEntry[];
    
    // クライアント側でソート（Firestoreのインデックスエラーを回避）
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }
};

export const getAllEntries = async (): Promise<EntryWithUserId[]> => {
  try {
    const q = query(collection(db, 'insectEntries'));
    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const entry: EntryWithUserId = {
        id: doc.id,
        name: data.name,
        memo: data.memo,
        imageUrl: data.imageUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp || data.createdAt?.toMillis() || Date.now(),
        aiInsights: data.aiInsights,
        userId: data.userId || undefined // ユーザーIDも含める（明示的にundefinedを設定）
      };
      return entry;
    });
    // クライアント側でソート
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching all entries:', error);
    throw error;
  }
};

export const deleteEntry = async (entryId: string) => {
  try {
    await deleteDoc(doc(db, 'insectEntries', entryId));
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

