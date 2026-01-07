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

export const saveEntry = async (entry: Omit<InsectEntry, 'id'>, userId: string, imageBase64: string) => {
  try {
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

export const deleteEntry = async (entryId: string) => {
  try {
    await deleteDoc(doc(db, 'insectEntries', entryId));
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

