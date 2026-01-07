
import React, { useState, useEffect } from 'react';
import { Plus, Map as MapIcon, Info, ExternalLink, Bug, Search, Loader2, Calendar, ChevronRight, X, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import MapComponent from './components/MapComponent';
import EntryForm from './components/EntryForm';
import AuthForm from './components/AuthForm';
import { InsectEntry, Location } from './types';
import { getInsectDetails } from './services/geminiService';
import { onAuthChange, logout } from './services/authService';
import { getUserEntries, saveEntry } from './services/dataService';

const DEFAULT_LOCATION: Location = { lat: 35.6895, lng: 139.6917 }; // Tokyo

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [entries, setEntries] = useState<InsectEntry[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location>(DEFAULT_LOCATION);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<InsectEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(true);

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setIsLoadingAuth(false);
      if (user) {
        loadEntries(user.uid);
      } else {
        setEntries([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 位置情報の取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  // データの読み込み
  const loadEntries = async (userId: string) => {
    try {
      const loadedEntries = await getUserEntries(userId);
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

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
        await loadEntries(user.uid);
        
        // 最新のエントリを選択状態にする
        const updatedEntries = await getUserEntries(user.uid);
        if (updatedEntries.length > 0) {
          setSelectedEntry(updatedEntries[0]);
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

  // 未認証時
  if (!user) {
    return (
      <div className="w-full h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bug className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">MUSHI MAP</h1>
          <p className="text-slate-600 mb-8">ログインしてコレクションを開始しましょう</p>
          <button
            onClick={() => setShowAuthForm(true)}
            className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl"
          >
            ログイン / 新規登録
          </button>
        </div>
        {showAuthForm && (
          <AuthForm 
            onClose={() => setShowAuthForm(false)} 
            onSuccess={() => setShowAuthForm(false)}
          />
        )}
      </div>
    );
  }

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

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[26rem] bg-white shadow-2xl z-20 overflow-hidden border-r border-slate-100">
        <div className="p-8 pb-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Bug className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">MUSHI MAP</h1>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Ecological Diary</p>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="記録を検索する..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">最近の採集</h2>
            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{entries.length} 件</span>
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
        
        {/* ログアウトセクション */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
              <p className="text-xs text-slate-400">ログイン中</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main Map View */}
      <main className="flex-1 relative h-full">
        <MapComponent 
          entries={entries} 
          center={currentLocation} 
          onMarkerClick={setSelectedEntry} 
        />

        {/* Floating Header (Mobile) */}
        <div className="absolute top-6 left-6 right-6 md:hidden z-10 animate-in slide-in-from-top duration-700">
          <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-[2rem] p-4 flex items-center justify-between border border-white/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                <Bug className="w-5 h-5" />
              </div>
              <span className="font-black text-slate-900 tracking-tight">MUSHI MAP</span>
            </div>
            <button className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Search className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsFormOpen(true)}
          className="absolute bottom-10 right-10 z-20 w-20 h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group shadow-emerald-200"
        >
          <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
        </button>

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
    </div>
  );
};

export default App;
