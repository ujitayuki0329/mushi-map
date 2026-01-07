import React, { useState, useMemo } from 'react';
import { X, Search, Filter, Calendar, MapPin, Grid, List, ChevronRight, Bug, SortAsc, SortDesc, Snowflake, Sun, Leaf, Flower } from 'lucide-react';
import { InsectEntry } from '../types';
import type { EntryWithUserId } from '../services/dataService';
import { getPrefectureFromCoordinates, getSeasonFromTimestamp } from '../utils/locationUtils';

interface EntryListViewProps {
  entries: EntryWithUserId[];
  onClose: () => void;
  onEntryClick: (entry: InsectEntry) => void;
  currentUserId: string | null;
}

type ViewMode = 'list' | 'grid';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

const EntryListView: React.FC<EntryListViewProps> = ({ 
  entries, 
  onClose, 
  onEntryClick,
  currentUserId 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMyEntries, setFilterMyEntries] = useState<boolean | null>(null);
  const [filterSeason, setFilterSeason] = useState<string | null>(null);
  const [filterPrefecture, setFilterPrefecture] = useState<string | null>(null);

  // フィルタリングとソート
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = entries;

    // 検索クエリでフィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.name.toLowerCase().includes(query) ||
        entry.memo.toLowerCase().includes(query) ||
        (entry.aiInsights?.description?.toLowerCase().includes(query))
      );
    }

    // 自分の投稿のみフィルタリング
    if (filterMyEntries !== null && currentUserId) {
      if (filterMyEntries) {
        filtered = filtered.filter(entry => entry.userId === currentUserId);
      } else {
        filtered = filtered.filter(entry => entry.userId !== currentUserId);
      }
    }

    // 季節でフィルタリング
    if (filterSeason) {
      filtered = filtered.filter(entry => {
        const season = getSeasonFromTimestamp(entry.timestamp);
        return season === filterSeason;
      });
    }

    // 都道府県でフィルタリング
    if (filterPrefecture) {
      filtered = filtered.filter(entry => {
        const prefecture = getPrefectureFromCoordinates(entry.latitude, entry.longitude);
        return prefecture === filterPrefecture;
      });
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return b.timestamp - a.timestamp;
        case 'date-asc':
          return a.timestamp - b.timestamp;
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ja');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'ja');
        default:
          return 0;
      }
    });

    return sorted;
  }, [entries, searchQuery, sortOption, filterMyEntries, filterSeason, filterPrefecture, currentUserId]);

  const getSortIcon = () => {
    if (sortOption.includes('asc')) return <SortAsc className="w-4 h-4" />;
    return <SortDesc className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-white z-[110] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 z-10 shadow-sm">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900">採集記録一覧</h1>
                <p className="text-xs text-slate-400 mt-0.5">{filteredAndSortedEntries.length} 件</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center transition-all"
              >
                {viewMode === 'list' ? <Grid className="w-5 h-5 text-slate-600" /> : <List className="w-5 h-5 text-slate-600" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="昆虫名、メモ、説明で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                showFilters || filterMyEntries !== null || filterSeason !== null || filterPrefecture !== null
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              フィルター
            </button>
            
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setSortOption('date-desc')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  sortOption === 'date-desc'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                新しい順
              </button>
              <button
                onClick={() => setSortOption('date-asc')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  sortOption === 'date-asc'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                古い順
              </button>
              <button
                onClick={() => setSortOption('name-asc')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  sortOption === 'name-asc'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                {getSortIcon()}
                名前順
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-4">
                {currentUserId && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-2 block">投稿者</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilterMyEntries(null)}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                          filterMyEntries === null
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        すべて
                      </button>
                      <button
                        onClick={() => setFilterMyEntries(true)}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                          filterMyEntries === true
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        自分の投稿
                      </button>
                      <button
                        onClick={() => setFilterMyEntries(false)}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                          filterMyEntries === false
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        他人の投稿
                      </button>
                    </div>
                  </div>
                )}

                {/* 季節フィルター */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">季節</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => setFilterSeason(null)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                        filterSeason === null
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      すべて
                    </button>
                    <button
                      onClick={() => setFilterSeason('春')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                        filterSeason === '春'
                          ? 'bg-pink-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-pink-50'
                      }`}
                    >
                      <Flower className="w-3 h-3" />
                      春
                    </button>
                    <button
                      onClick={() => setFilterSeason('夏')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                        filterSeason === '夏'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-yellow-50'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      夏
                    </button>
                    <button
                      onClick={() => setFilterSeason('秋')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                        filterSeason === '秋'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-orange-50'
                      }`}
                    >
                      <Leaf className="w-3 h-3" />
                      秋
                    </button>
                    <button
                      onClick={() => setFilterSeason('冬')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                        filterSeason === '冬'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-slate-600 hover:bg-blue-50'
                      }`}
                    >
                      <Snowflake className="w-3 h-3" />
                      冬
                    </button>
                  </div>
                </div>

                {/* 都道府県フィルター */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">都道府県</label>
                  <select
                    value={filterPrefecture || ''}
                    onChange={(e) => setFilterPrefecture(e.target.value || null)}
                    className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-white border-2 border-slate-200 focus:border-emerald-500 focus:outline-none text-slate-700"
                  >
                    <option value="">すべて</option>
                    <option value="北海道">北海道</option>
                    <option value="青森県">青森県</option>
                    <option value="岩手県">岩手県</option>
                    <option value="宮城県">宮城県</option>
                    <option value="秋田県">秋田県</option>
                    <option value="山形県">山形県</option>
                    <option value="福島県">福島県</option>
                    <option value="茨城県">茨城県</option>
                    <option value="栃木県">栃木県</option>
                    <option value="群馬県">群馬県</option>
                    <option value="埼玉県">埼玉県</option>
                    <option value="千葉県">千葉県</option>
                    <option value="東京都">東京都</option>
                    <option value="神奈川県">神奈川県</option>
                    <option value="新潟県">新潟県</option>
                    <option value="富山県">富山県</option>
                    <option value="石川県">石川県</option>
                    <option value="福井県">福井県</option>
                    <option value="山梨県">山梨県</option>
                    <option value="長野県">長野県</option>
                    <option value="岐阜県">岐阜県</option>
                    <option value="静岡県">静岡県</option>
                    <option value="愛知県">愛知県</option>
                    <option value="三重県">三重県</option>
                    <option value="滋賀県">滋賀県</option>
                    <option value="京都府">京都府</option>
                    <option value="大阪府">大阪府</option>
                    <option value="兵庫県">兵庫県</option>
                    <option value="奈良県">奈良県</option>
                    <option value="和歌山県">和歌山県</option>
                    <option value="鳥取県">鳥取県</option>
                    <option value="島根県">島根県</option>
                    <option value="岡山県">岡山県</option>
                    <option value="広島県">広島県</option>
                    <option value="山口県">山口県</option>
                    <option value="徳島県">徳島県</option>
                    <option value="香川県">香川県</option>
                    <option value="愛媛県">愛媛県</option>
                    <option value="高知県">高知県</option>
                    <option value="福岡県">福岡県</option>
                    <option value="佐賀県">佐賀県</option>
                    <option value="長崎県">長崎県</option>
                    <option value="熊本県">熊本県</option>
                    <option value="大分県">大分県</option>
                    <option value="宮崎県">宮崎県</option>
                    <option value="鹿児島県">鹿児島県</option>
                    <option value="沖縄県">沖縄県</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {filteredAndSortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-4">
              <Search className="w-10 h-10" />
            </div>
            <p className="font-bold text-slate-400">該当する記録がありません</p>
            <p className="text-xs mt-2 text-slate-400">検索条件を変更してください</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredAndSortedEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  onEntryClick(entry);
                  onClose();
                }}
                className="group cursor-pointer p-4 rounded-3xl transition-all border-2 border-transparent hover:border-emerald-200 hover:bg-emerald-50/30 bg-white hover:scale-[1.01]"
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    {entry.imageUrl ? (
                      <img 
                        src={entry.imageUrl} 
                        alt={entry.name} 
                        className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-sm" 
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                        <Bug className="w-10 h-10" />
                      </div>
                    )}
                    {entry.userId === currentUserId && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">MY</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-black text-lg md:text-xl text-slate-900 truncate pr-2">
                        {entry.name}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {entry.memo || 'メモがありません'}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.timestamp).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                        <MapPin className="w-3 h-3" />
                        {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  onEntryClick(entry);
                  onClose();
                }}
                className="group cursor-pointer rounded-2xl overflow-hidden bg-white border-2 border-transparent hover:border-emerald-200 hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="relative aspect-square">
                  {entry.imageUrl ? (
                    <img 
                      src={entry.imageUrl} 
                      alt={entry.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                      <Bug className="w-12 h-12 text-slate-200" />
                    </div>
                  )}
                  {entry.userId === currentUserId && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[8px] font-black text-white">MY</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-black text-sm text-slate-900 truncate mb-1">
                    {entry.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {new Date(entry.timestamp).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntryListView;

