
import React, { useState, useEffect } from 'react';
import { Plus, Map as MapIcon, Info, ExternalLink, Bug, Search, Loader2, Calendar, ChevronRight, ChevronDown, ChevronUp, X, LogOut, Users, User as UserIcon, Menu, Crown, List, Navigation } from 'lucide-react';
import { User } from 'firebase/auth';
import MapComponent from './components/MapComponent';
import EntryForm from './components/EntryForm';
import AuthForm from './components/AuthForm';
import PremiumUpgrade from './components/PremiumUpgrade';
import EntryListView from './components/EntryListView';
import AffiliateBanner from './components/AffiliateBanner';
import { InsectEntry, Location } from './types';
import { getInsectDetails } from './services/geminiService';
import { onAuthChange, logout } from './services/authService';
import { getUserEntries, saveEntry, getAllEntries } from './services/dataService';
import { canPostEntry, getUserSubscription, isPremiumActive, cancelPremium } from './services/subscriptionService';
import type { EntryWithUserId } from './services/dataService';
import type { UserSubscription } from './types';

const DEFAULT_LOCATION: Location = { lat: 35.6895, lng: 139.6917 }; // Tokyo

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [allEntries, setAllEntries] = useState<EntryWithUserId[]>([]);
  const [showOnlyMyEntries, setShowOnlyMyEntries] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location>(DEFAULT_LOCATION);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<InsectEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState(false);
  const [postLimitInfo, setPostLimitInfo] = useState<{ currentCount?: number; limit?: number; reason?: string } | null>(null);
  const [showEntryListView, setShowEntryListView] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isUserSectionCollapsed, setIsUserSectionCollapsed] = useState(false);

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // 全エントリの読み込み（未ログイン時も含む）
  useEffect(() => {
    loadAllEntries();
  }, []);

  // エントリの再読み込み（投稿後など）
  useEffect(() => {
    if (user) {
      loadAllEntries();
      loadSubscription();
    } else {
      setSubscription(null);
      setIsPremium(false);
    }
  }, [user]);

  // サブスクリプション情報の読み込み
  const loadSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsPremium(false);
      return;
    }
    
    // デフォルト値を先に設定（エラー時でも確実に動作するように）
    const defaultSubscription: UserSubscription = {
      userId: user.uid,
      plan: 'free',
      startDate: Date.now(),
      isActive: true
    };
    
    try {
      const sub = await getUserSubscription(user.uid);
      if (sub) {
        setSubscription(sub);
        try {
          const premium = await isPremiumActive(user.uid);
          setIsPremium(premium);
          
          // 投稿数情報を取得
          if (!premium) {
            try {
              const { getMonthlyEntryCount } = await import('./services/subscriptionService');
              const count = await getMonthlyEntryCount(user.uid);
              setPostLimitInfo({
                currentCount: count,
                limit: 10
              });
            } catch (countError) {
              // 投稿数取得に失敗した場合はデフォルト値を設定
              console.warn('Error getting monthly count (using default):', countError);
              setPostLimitInfo({
                currentCount: 0,
                limit: 10
              });
            }
          } else {
            setPostLimitInfo(null);
          }
        } catch (premiumError) {
          // プレミアム状態の確認に失敗した場合は無料プランとして扱う
          console.warn('Error checking premium status (using free plan):', premiumError);
          setIsPremium(false);
          setPostLimitInfo({
            currentCount: 0,
            limit: 10
          });
        }
      } else {
        // サブスクリプション情報が取得できなかった場合
        setSubscription(defaultSubscription);
        setIsPremium(false);
        setPostLimitInfo({
          currentCount: 0,
          limit: 10
        });
      }
    } catch (error: any) {
      // サブスクリプション情報の取得に失敗した場合は無料プランとして扱う
      // permission-deniedエラーは無視して続行
      if (error?.code !== 'permission-denied') {
        console.warn('Error loading subscription (using free plan as fallback):', error);
      }
      setSubscription(defaultSubscription);
      setIsPremium(false);
      setPostLimitInfo({
        currentCount: 0,
        limit: 10
      });
    }
  };

  // 位置情報の取得
  useEffect(() => {
    // タイムアウトを設定して、一定時間経過後は強制的にローディングを解除
    const timeout = setTimeout(() => {
      setIsLocating(false);
    }, 5000); // 5秒でタイムアウト

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setUserLocation(location); // ユーザーの現在地を保存
          setIsLocating(false);
        },
        (error) => {
          clearTimeout(timeout);
          console.warn("Geolocation error (using default location):", error);
          setIsLocating(false);
        },
        { timeout: 3000, enableHighAccuracy: false } // タイムアウトを3秒に設定
      );
    } else {
      clearTimeout(timeout);
      setIsLocating(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  // 現在地に戻る関数
  const handleReturnToCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          
          // 常に新しいオブジェクトを作成して、確実に更新を検知させる
          // 小数点以下を6桁に統一して、微細な差を無視
          const location = {
            lat: parseFloat(newLat.toFixed(6)),
            lng: parseFloat(newLng.toFixed(6)),
          };
          
          // 強制的に更新
          setCurrentLocation(location);
          setUserLocation(location);
          
          setSelectedEntry(null); // 選択中のエントリをクリア
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // 以前の位置情報があればそれを使用
          if (userLocation) {
            // 強制的に更新（同じ位置でも新しいオブジェクトを作成）
            setCurrentLocation({ lat: userLocation.lat, lng: userLocation.lng });
            setSelectedEntry(null);
          }
          setIsLocating(false);
        },
        { timeout: 3000, enableHighAccuracy: true }
      );
    } else if (userLocation) {
      // 位置情報が取得できない場合は、保存されている位置情報を使用
      // 強制的に更新（同じ位置でも新しいオブジェクトを作成）
      setCurrentLocation({ lat: userLocation.lat, lng: userLocation.lng });
      setSelectedEntry(null);
    }
  };

  // 全エントリの読み込み
  const loadAllEntries = async () => {
    try {
      const loadedEntries = await getAllEntries();
      setAllEntries(loadedEntries);
    } catch (error) {
      console.error('Error loading all entries:', error);
    }
  };

  // 表示するエントリをフィルタリング
  const entries = React.useMemo(() => {
    if (showOnlyMyEntries && user) {
      return allEntries.filter(entry => entry.userId === user.uid);
    }
    return allEntries;
  }, [allEntries, showOnlyMyEntries, user]);

  // ログアウト機能
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveEntry = async (data: { name: string; memo: string; image: string }) => {
    if (!user) {
      setShowAuthForm(true);
      return;
    }

    // 投稿制限をチェック
    const postCheck = await canPostEntry(user.uid);
    if (!postCheck.canPost) {
      setPostLimitInfo({
        currentCount: postCheck.currentCount,
        limit: postCheck.limit,
        reason: postCheck.reason
      });
      setShowPremiumUpgrade(true);
      return;
    }

    setIsSaving(true);
    
    const finalizeSave = async (lat: number, lng: number) => {
      try {
        // AI background insight generation
        const aiInsights = await getInsectDetails(data.name, lat, lng);

        const newEntry = {
          name: data.name,
          memo: data.memo,
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
          aiInsights: aiInsights,
        };

        // Firebaseに保存
        await saveEntry(newEntry, user.uid, data.image);
        
        // データを再読み込み
        await loadAllEntries();
        
        // 最新のエントリを選択状態にする
        const updatedEntries = await getAllEntries();
        const myNewEntry = updatedEntries.find(e => e.userId === user.uid);
        if (myNewEntry) {
          setSelectedEntry(myNewEntry);
        setCurrentLocation({ lat, lng });
        }
      } catch (err) {
        console.error("Save error:", err);
      } finally {
        setIsSaving(false);
        setIsFormOpen(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => finalizeSave(position.coords.latitude, position.coords.longitude),
        () => finalizeSave(currentLocation.lat, currentLocation.lng),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      finalizeSave(currentLocation.lat, currentLocation.lng);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.memo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ローディング中
  if (isLoadingAuth) {
    return (
      <div className="w-full h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bug className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-slate-900 font-bold text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証時でもマップは表示（投稿時のみログインが必要）

  return (
    <div className="relative w-full h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
      {isLocating && (
        <div className="absolute inset-0 z-[200] bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4 animate-pulse">
            <Bug className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-slate-900 font-bold text-lg">現在地を探しています...</p>
          <p className="text-slate-400 text-sm mt-1">環境を整えています</p>
        </div>
      )}

      {/* Sidebar - Desktop & Mobile */}
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[90] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={`fixed md:relative bottom-0 md:bottom-auto left-0 md:left-auto right-0 md:right-auto top-auto md:top-auto w-full md:w-[26rem] h-[85vh] md:h-full max-h-[85vh] md:max-h-none flex flex-col bg-white shadow-2xl md:shadow-2xl z-[100] md:z-20 overflow-hidden border-r-0 md:border-r border-slate-100 rounded-t-[2.5rem] md:rounded-none transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
        <div className="p-3 md:p-4 pb-3 md:pb-4 space-y-2 md:space-y-3 flex-shrink-0 pt-4 md:pt-4">
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between md:hidden pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Bug className="w-3.5 h-3.5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">MUSHI MAP</h1>
                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Ecological Diary</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Bug className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">MUSHI MAP</h1>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Ecological Diary</p>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="記録を検索する..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-2.5 md:pr-3 py-2 md:py-2.5 bg-slate-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xs md:text-sm font-medium"
            />
          </div>
          
          {/* 表示フィルター（ログイン時のみ表示） */}
          {user && (
            <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 bg-slate-50 rounded-xl">
              <button
                onClick={() => setShowOnlyMyEntries(false)}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2 px-2 md:px-3 rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                  !showOnlyMyEntries
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
                全員
              </button>
              <button
                onClick={() => setShowOnlyMyEntries(true)}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2 px-2 md:px-3 rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                  showOnlyMyEntries
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                自分のみ
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 space-y-3 md:space-y-4 min-h-0">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-white pt-2 pb-1 z-10">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">最近の採集</h2>
            <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{entries.length} 件</span>
              <button
                onClick={() => {
                  setShowEntryListView(true);
                  setIsSidebarOpen(false);
                }}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <List className="w-3 h-3" />
                すべて表示
              </button>
            </div>
          </div>
          
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-center px-10">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-4">
                <MapIcon className="w-10 h-10" />
              </div>
              <p className="font-bold text-slate-400">記録がありません</p>
              <p className="text-xs mt-2 leading-relaxed">フィールドに出て、昆虫を見つけたら「＋」ボタンで記録しましょう。</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div 
                key={entry.id}
                onClick={() => {
                  setSelectedEntry(entry);
                  setCurrentLocation({ lat: entry.latitude, lng: entry.longitude });
                  setIsSidebarOpen(false); // モバイルでサイドバーを閉じる
                }}
                className={`group cursor-pointer p-4 rounded-3xl transition-all duration-300 relative border-2 ${
                  selectedEntry?.id === entry.id 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-50 shadow-lg' 
                    : 'border-transparent bg-white hover:bg-slate-50 hover:scale-[1.02]'
                }`}
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    {entry.imageUrl ? (
                      <img src={entry.imageUrl} alt={entry.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                        <Bug className="w-8 h-8" />
                      </div>
                    )}
                    {selectedEntry?.id === entry.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-slate-800 truncate leading-tight pr-2">{entry.name}</h3>
                      <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${selectedEntry?.id === entry.id ? 'translate-x-1 text-emerald-500' : ''}`} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-medium">{entry.memo}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100/50 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* ログアウトセクション（ログイン時のみ表示） */}
        {user ? (
          <div className="border-t border-slate-100 bg-white relative">
            {/* 折りたたみボタン（右上、シンプルなアイコンボタン） */}
            <button
              onClick={() => setIsUserSectionCollapsed(!isUserSectionCollapsed)}
              className="absolute top-3 right-3 w-7 h-7 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg flex items-center justify-center hover:bg-white hover:border-slate-300 hover:shadow-md transition-all z-10 group"
              title={isUserSectionCollapsed ? "開く" : "閉じる"}
            >
              {isUserSectionCollapsed ? (
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
              )}
            </button>
            
            {/* ユーザー情報表示 */}
            <div className="p-3 md:p-4">
              <div className="flex items-center gap-1.5 mb-0.5 pr-6">
                <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{user.email}</p>
                {isPremium && (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded flex items-center gap-0.5 flex-shrink-0">
                    <Crown className="w-2.5 h-2.5" />
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-slate-400">
                {isPremium ? 'プレミアムプラン' : subscription ? `無料プラン (${postLimitInfo?.currentCount || 0}/${postLimitInfo?.limit || 10}件)` : 'ログイン中'}
              </p>
            </div>
            
            {/* 折りたたみ可能なコンテンツ（アニメーション付き） */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isUserSectionCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
              }`}
            >
              <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2">
                {!isPremium && (
                  <button
                    onClick={() => {
                      setShowPremiumUpgrade(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full py-2 md:py-2.5 text-xs md:text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200"
                  >
                    <Crown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    プレミアムにアップグレード
                  </button>
                )}
                
                {isPremium && (
                  <button
                    onClick={() => {
                      setShowPremiumUpgrade(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full py-2 md:py-2.5 text-xs md:text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    プレミアムプランの詳細
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full py-2 md:py-2.5 text-xs md:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ログアウト
                </button>
                
                {/* アフィリエイトバナー */}
                <AffiliateBanner className="mt-2" variant="sidebar" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 md:p-4 border-t border-slate-100 bg-white space-y-2">
            <button
              onClick={() => {
                setShowAuthForm(true);
                setIsSidebarOpen(false);
              }}
              className="w-full py-2 md:py-2.5 text-xs md:text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              ログイン / 新規登録
            </button>
            
            {/* アフィリエイトバナー */}
            <AffiliateBanner />
          </div>
        )}
      </aside>

      {/* Main Map View */}
      <main className="flex-1 relative h-full">
        <MapComponent 
          entries={entries} 
          center={currentLocation} 
          onMarkerClick={setSelectedEntry} 
          currentUserId={user?.uid || null}
          selectedEntryId={selectedEntry?.id || null}
        />

        {/* Floating Header (Mobile) */}
        <div className={`absolute top-4 left-4 right-4 md:hidden ${isSidebarOpen ? 'z-[80] opacity-0 pointer-events-none' : 'z-[100] opacity-100'} transition-opacity duration-200 ease-out`}>
          <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-[2rem] p-3 flex items-center justify-between border border-white/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                <Bug className="w-4 h-4" />
              </div>
              <span className="font-black text-slate-900 tracking-tight text-sm">MUSHI MAP</span>
            </div>
            <div className="flex items-center gap-2">
              {!user ? (
                <button
                  onClick={() => setShowAuthForm(true)}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-600 transition-all"
                >
                  ログイン
                </button>
              ) : null}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg hover:bg-emerald-600 transition-all"
              >
                <Menu className="w-5 h-5" />
            </button>
            </div>
          </div>
        </div>

        {/* Button Container - Current Location & New Post */}
        <div className="absolute bottom-32 md:bottom-[8rem] right-6 md:right-10 z-30 flex flex-col items-center gap-3">
          {/* Current Location Button */}
          <button
            onClick={handleReturnToCurrentLocation}
            className="w-12 h-12 md:w-14 md:h-14 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-slate-200"
            title="現在地に戻る"
          >
            <Navigation className="w-5 h-5 md:w-6 md:h-6" />
          </button>

        {/* Floating Action Button */}
        <button
            onClick={() => {
              if (!user) {
                setShowAuthForm(true);
              } else {
                setIsFormOpen(true);
              }
            }}
            className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-emerald-200"
            title={!user ? "投稿するにはログインが必要です" : "新規投稿"}
          >
            <Plus className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-90 transition-transform duration-500" />
        </button>
        </div>

        {/* 地図上の広告枠 */}
        <div className="absolute bottom-[3.5rem] left-4 right-4 z-20">
          <AffiliateBanner variant="map" />
        </div>
        

        {/* Details Overlay */}
        {selectedEntry && (
          <div className="absolute inset-x-4 bottom-32 md:inset-auto md:top-8 md:right-8 md:w-[28rem] z-30 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden flex flex-col max-h-[75vh]">
              <div className="relative h-56 flex-shrink-0">
                <img 
                  src={selectedEntry.imageUrl || 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?q=80&w=400&auto=format&fit=crop'} 
                  alt={selectedEntry.name} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-2xl transition-all flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6">
                  <span className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase shadow-lg shadow-emerald-200">
                    DISCOVERY RECORD
                  </span>
                </div>
              </div>
              
              <div className="px-8 pb-8 pt-2 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedEntry.name}</h2>
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
                    {new Date(selectedEntry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-slate-600 text-sm mb-8 leading-relaxed font-medium">
                  {selectedEntry.memo || '観察記録がありません'}
                </p>

                {selectedEntry.aiInsights ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2.5 text-emerald-600 font-black text-[11px] uppercase tracking-widest">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                      AI Insights & Ecological Data
                    </div>
                    <div className="bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium italic">
                        "{selectedEntry.aiInsights.description}"
                      </p>
                      
                      {selectedEntry.aiInsights.links.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200/50 space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">関連スポット・資料</p>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedEntry.aiInsights.links.map((link, idx) => (
                              <a 
                                key={idx} 
                                href={link.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-white rounded-2xl text-xs font-bold text-slate-700 hover:text-emerald-600 shadow-sm hover:shadow-md transition-all group border border-slate-50"
                              >
                                <span className="truncate pr-4">{link.title}</span>
                                <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin mb-2" />
                    <p className="text-xs font-bold text-slate-400">生態データを分析中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {isFormOpen && (
        <EntryForm 
          onSave={handleSaveEntry} 
          onClose={() => setIsFormOpen(false)} 
          isSaving={isSaving}
        />
      )}
      
      {showAuthForm && (
        <AuthForm 
          onClose={() => setShowAuthForm(false)} 
          onSuccess={() => setShowAuthForm(false)}
        />
      )}
      
      {showPremiumUpgrade && (
        <PremiumUpgrade
          onClose={() => {
            setShowPremiumUpgrade(false);
            setPostLimitInfo(null);
          }}
          onUpgrade={async () => {
            // ここで実際の決済処理を実装
            // 現在はデモとして、直接プレミアムにアップグレード
            if (user) {
              try {
                const { upgradeToPremium } = await import('./services/subscriptionService');
                await upgradeToPremium(user.uid, 1);
                await loadSubscription();
                setShowPremiumUpgrade(false);
                setPostLimitInfo(null);
                alert('プレミアムプランにアップグレードしました！');
              } catch (error) {
                console.error('Upgrade error:', error);
                alert('アップグレードに失敗しました。もう一度お試しください。');
              }
            }
          }}
          onCancel={async () => {
            if (!user) return;
            
            // 確認ダイアログ
            const confirmed = window.confirm(
              'プレミアムプランを解約しますか？\n\n解約後は無料プランに戻り、月間10件の投稿制限が適用されます。'
            );
            
            if (!confirmed) return;
            
            setIsCanceling(true);
            try {
              await cancelPremium(user.uid);
              await loadSubscription();
              setShowPremiumUpgrade(false);
              setPostLimitInfo(null);
              alert('プレミアムプランを解約しました。無料プランに戻りました。');
            } catch (error: any) {
              console.error('Cancel error:', error);
              alert('解約に失敗しました: ' + (error.message || error));
            } finally {
              setIsCanceling(false);
            }
          }}
          currentCount={postLimitInfo?.currentCount}
          limit={postLimitInfo?.limit}
          reason={postLimitInfo?.reason}
          isPremium={isPremium}
        />
      )}

      {showEntryListView && (
        <EntryListView
          entries={allEntries}
          onClose={() => setShowEntryListView(false)}
          onEntryClick={(entry) => {
            setSelectedEntry(entry);
            setCurrentLocation({ lat: entry.latitude, lng: entry.longitude });
          }}
          currentUserId={user?.uid || null}
        />
      )}
    </div>
  );
};

export default App;
