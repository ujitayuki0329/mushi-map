import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserSubscription, SubscriptionPlan } from '../types';

const FREE_PLAN_MONTHLY_LIMIT = 10; // 無料プランの月間投稿制限

// ユーザーのサブスクリプション情報を取得
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  try {
    const subscriptionRef = doc(db, 'userSubscriptions', userId);
    const subscriptionSnap = await getDoc(subscriptionRef);
    
    if (subscriptionSnap.exists()) {
      const data = subscriptionSnap.data();
      return {
        userId,
        plan: data.plan as SubscriptionPlan,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive ?? true
      };
    }
    
    // サブスクリプション情報が存在しない場合は無料プランとして作成
    // 権限エラーの場合は作成を試みない
    try {
      const defaultSubscription: UserSubscription = {
        userId,
        plan: 'free',
        startDate: Date.now(),
        isActive: true
      };
      await setDoc(subscriptionRef, defaultSubscription);
      return defaultSubscription;
    } catch (writeError: any) {
      // 書き込み権限がない場合は、メモリ上のみで無料プランを返す
      console.warn('Cannot create subscription document (permissions issue):', writeError);
      return {
        userId,
        plan: 'free',
        startDate: Date.now(),
        isActive: true
      };
    }
  } catch (error: any) {
    // 権限エラーやその他のエラー時は無料プランとして扱う
    // permission-deniedエラーは警告を出さない（正常な動作）
    if (error?.code !== 'permission-denied') {
      console.warn('Error fetching subscription (using free plan as fallback):', error?.code || error);
    }
    return {
      userId,
      plan: 'free',
      startDate: Date.now(),
      isActive: true
    };
  }
};

// プレミアムプランにアップグレード
export const upgradeToPremium = async (userId: string, months: number = 1): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'userSubscriptions', userId);
    const now = Date.now();
    const endDate = now + (months * 30 * 24 * 60 * 60 * 1000); // 月数分のミリ秒
    
    await setDoc(subscriptionRef, {
      userId,
      plan: 'premium' as SubscriptionPlan,
      startDate: now,
      endDate,
      isActive: true
    }, { merge: true });
  } catch (error: any) {
    console.error('Error upgrading to premium:', error);
    // 権限エラーの場合は詳細なメッセージを提供
    if (error?.code === 'permission-denied') {
      throw new Error('Firebaseのセキュリティルールが正しく設定されていません。READMEを参照してセキュリティルールを更新してください。');
    }
    throw error;
  }
};

// 今月の投稿数を取得
export const getMonthlyEntryCount = async (userId: string): Promise<number> => {
  try {
    const { getUserEntries } = await import('./dataService');
    const entries = await getUserEntries(userId);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    return entries.filter(entry => entry.timestamp >= startOfMonth).length;
  } catch (error) {
    console.error('Error counting monthly entries:', error);
    return 0;
  }
};

// 投稿可能かどうかをチェック
export const canPostEntry = async (userId: string): Promise<{ canPost: boolean; reason?: string; currentCount?: number; limit?: number }> => {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription || subscription.plan === 'free') {
      try {
        const monthlyCount = await getMonthlyEntryCount(userId);
        
        if (monthlyCount >= FREE_PLAN_MONTHLY_LIMIT) {
          return {
            canPost: false,
            reason: `無料プランでは月間${FREE_PLAN_MONTHLY_LIMIT}件まで投稿できます。今月の投稿数: ${monthlyCount}/${FREE_PLAN_MONTHLY_LIMIT}`,
            currentCount: monthlyCount,
            limit: FREE_PLAN_MONTHLY_LIMIT
          };
        }
        
        return {
          canPost: true,
          currentCount: monthlyCount,
          limit: FREE_PLAN_MONTHLY_LIMIT
        };
      } catch (countError) {
        // 投稿数取得に失敗した場合は投稿を許可（エラー時は制限しない）
        console.warn('Error getting monthly count, allowing post:', countError);
        return { canPost: true };
      }
    }
    
    // プレミアムプランの場合
    if (subscription.plan === 'premium') {
      // 有効期限をチェック
      if (subscription.endDate && subscription.endDate < Date.now()) {
        // 有効期限切れの場合は無料プランにダウングレード（権限がある場合のみ）
        try {
          await updateDoc(doc(db, 'userSubscriptions', userId), {
            plan: 'free',
            isActive: true
          });
        } catch (updateError) {
          // 更新に失敗した場合はそのまま続行
          console.warn('Cannot update subscription (permissions issue):', updateError);
        }
        
        try {
          const monthlyCount = await getMonthlyEntryCount(userId);
          if (monthlyCount >= FREE_PLAN_MONTHLY_LIMIT) {
            return {
              canPost: false,
              reason: `プレミアムプランの有効期限が切れました。無料プランでは月間${FREE_PLAN_MONTHLY_LIMIT}件まで投稿できます。`,
              currentCount: monthlyCount,
              limit: FREE_PLAN_MONTHLY_LIMIT
            };
          }
          
          return {
            canPost: true,
            currentCount: monthlyCount,
            limit: FREE_PLAN_MONTHLY_LIMIT
          };
        } catch (countError) {
          return { canPost: true };
        }
      }
      
      // プレミアムプランは無制限
      return {
        canPost: true
      };
    }
    
    return { canPost: true };
  } catch (error) {
    console.warn('Error checking post permission (allowing post as fallback):', error);
    return { canPost: true }; // エラー時は投稿を許可
  }
};

// プレミアム機能が有効かどうかをチェック
export const isPremiumActive = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId);
    if (!subscription || subscription.plan !== 'premium') {
      return false;
    }
    
    // 有効期限をチェック
    if (subscription.endDate && subscription.endDate < Date.now()) {
      return false;
    }
    
    return subscription.isActive;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

