import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { CustomMarkerSettings } from '../types';

const DEFAULT_MARKER_COLOR = '#10b981'; // エメラルドグリーン

// ユーザーのカスタムマーカー設定を取得
export const getUserMarkerSettings = async (userId: string): Promise<CustomMarkerSettings | null> => {
  try {
    const markerRef = doc(db, 'userMarkerSettings', userId);
    const markerSnap = await getDoc(markerRef);
    
    if (markerSnap.exists()) {
      const data = markerSnap.data();
      return {
        userId,
        color: data.color || DEFAULT_MARKER_COLOR,
        iconType: data.iconType || 'default',
        updatedAt: data.updatedAt || Date.now()
      };
    }
    
    return null;
  } catch (error: any) {
    console.warn('Error fetching marker settings:', error);
    return null;
  }
};

// ユーザーのカスタムマーカー設定を保存
export const saveUserMarkerSettings = async (settings: Omit<CustomMarkerSettings, 'updatedAt'>): Promise<void> => {
  try {
    const markerRef = doc(db, 'userMarkerSettings', settings.userId);
    await setDoc(markerRef, {
      ...settings,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error: any) {
    console.error('Error saving marker settings:', error);
    if (error?.code === 'permission-denied') {
      throw new Error('Firebaseのセキュリティルールが正しく設定されていません。');
    }
    throw error;
  }
};

// デフォルトのマーカー設定を取得
export const getDefaultMarkerSettings = (userId: string): CustomMarkerSettings => {
  return {
    userId,
    color: DEFAULT_MARKER_COLOR,
    iconType: 'default',
    updatedAt: Date.now()
  };
};
