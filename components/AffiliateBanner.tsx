import React from 'react';
import { ExternalLink } from 'lucide-react';

interface AffiliateBannerProps {
  className?: string;
  variant?: 'sidebar' | 'map';
}

const AffiliateBanner: React.FC<AffiliateBannerProps> = ({ className = '', variant = 'sidebar' }) => {
  // アフィリエイトリンク（実際のリンクに置き換えてください）
  const affiliateUrl = 'https://example.com/affiliate';
  
  if (variant === 'map') {
    // 地図上に表示するバナー（横長）
    return (
      <div className={`${className}`}>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <div className="bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-xl p-2.5 hover:border-emerald-300 transition-all group shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                <span className="text-[8px] font-black text-slate-500 group-hover:text-emerald-600">
                  広告
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded uppercase tracking-wider">
                    おすすめ
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </div>
                <p className="text-[9px] font-bold text-slate-700 line-clamp-1 leading-tight">
                  昆虫採集に便利なアイテム
                </p>
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }
  
  // サイドバーに表示するバナー（縦長）
  return (
    <div className={`${className}`}>
      <a
        href={affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-3 hover:border-emerald-300 transition-all group">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  おすすめ
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
              </div>
              <p className="text-[10px] font-bold text-slate-700 line-clamp-2 leading-tight">
                昆虫採集に便利なアイテム
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
              <span className="text-[8px] font-black text-slate-500 group-hover:text-emerald-600">
                広告
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default AffiliateBanner;

