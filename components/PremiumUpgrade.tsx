import React from 'react';
import { X, Crown, Check, Sparkles, Infinity, Zap, Shield } from 'lucide-react';

interface PremiumUpgradeProps {
  onClose: () => void;
  onUpgrade: () => void;
  currentCount?: number;
  limit?: number;
  reason?: string;
}

const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ 
  onClose, 
  onUpgrade, 
  currentCount, 
  limit,
  reason 
}) => {
  const features = [
    { icon: Infinity, text: '無制限の投稿' },
    { icon: Zap, text: '高精度AI判定' },
    { icon: Sparkles, text: '詳細な生態データ' },
    { icon: Shield, text: '広告非表示' },
    { icon: Sparkles, text: 'データエクスポート' },
    { icon: Crown, text: 'カスタムマーカー' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 md:p-8 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center mb-3 md:mb-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Crown className="w-7 h-7 md:w-8 md:h-8" />
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-center mb-2">プレミアムプラン</h2>
          <p className="text-center text-emerald-50 text-xs md:text-sm">すべての機能を無制限で利用</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Usage Info */}
          {currentCount !== undefined && limit !== undefined && (
            <div className="px-4 md:px-6 pt-4 md:pt-6">
              <div className="bg-slate-50 rounded-2xl p-3 md:p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm font-bold text-slate-600">今月の投稿数</span>
                  <span className="text-xs md:text-sm font-black text-emerald-600">
                    {currentCount} / {limit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
                  />
                </div>
                {reason && (
                  <p className="text-[10px] md:text-xs text-slate-500 mt-2 break-words">{reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="px-4 md:px-6 py-4 md:py-6">
            <h3 className="text-base md:text-lg font-black text-slate-900 mb-3 md:mb-4">プレミアム機能</h3>
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm md:text-base flex-1">{feature.text}</span>
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing - Fixed at bottom */}
        <div className="px-4 md:px-6 pb-4 md:pb-6 pt-4 flex-shrink-0 border-t border-slate-100 bg-white">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 md:p-6 border-2 border-emerald-200">
            <div className="text-center mb-3 md:mb-4">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-3xl md:text-4xl font-black text-emerald-600">¥980</span>
                <span className="text-slate-600 font-bold text-sm md:text-base">/月</span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 mt-1">初月無料トライアル</p>
            </div>
            
            <button
              onClick={onUpgrade}
              className="w-full py-3 md:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-base md:text-lg shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base">プレミアムにアップグレード</span>
            </button>
            
            <p className="text-[10px] md:text-xs text-center text-slate-500 mt-2 md:mt-3">
              いつでもキャンセル可能
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgrade;

