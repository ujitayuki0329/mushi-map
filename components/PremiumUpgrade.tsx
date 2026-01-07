import React from 'react';
import { X, Crown, Check, Sparkles, Infinity, Zap, Shield } from 'lucide-react';

interface PremiumUpgradeProps {
  onClose: () => void;
  onUpgrade: () => void;
  onCancel?: () => void;
  currentCount?: number;
  limit?: number;
  reason?: string;
  isPremium?: boolean;
}

const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({ 
  onClose, 
  onUpgrade, 
  onCancel,
  currentCount, 
  limit,
  reason,
  isPremium = false
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
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 md:p-5 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 md:w-9 md:h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-10"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-center mb-1">プレミアムプラン</h2>
          <p className="text-center text-emerald-50 text-[10px] md:text-xs">すべての機能を無制限で利用</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Usage Info */}
          {currentCount !== undefined && limit !== undefined && (
            <div className="px-4 md:px-6 pt-3 md:pt-4">
              <div className="bg-slate-50 rounded-xl p-2.5 md:p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-600">今月の投稿数</span>
                  <span className="text-xs font-black text-emerald-600">
                    {currentCount} / {limit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
                  />
                </div>
                {reason && (
                  <p className="text-[10px] text-slate-500 mt-1.5 break-words">{reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="px-4 md:px-6 py-3 md:py-4">
            <h3 className="text-sm md:text-base font-black text-slate-900 mb-2 md:mb-3">プレミアム機能</h3>
            <div className="grid grid-cols-1 gap-1.5 md:gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
                  </div>
                  <span className="font-bold text-slate-800 text-xs md:text-sm flex-1">{feature.text}</span>
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing / Cancel - Fixed at bottom */}
        <div className="px-4 md:px-6 pb-3 md:pb-4 pt-3 flex-shrink-0 border-t border-slate-100 bg-white">
          {isPremium && onCancel ? (
            // プレミアムユーザー向けの解約セクション
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 md:p-4 border-2 border-slate-200">
              <div className="text-center mb-2 md:mb-3">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Crown className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                  <span className="text-base md:text-lg font-black text-slate-900">プレミアムプラン利用中</span>
                </div>
                <p className="text-[10px] md:text-xs text-slate-600">現在、すべての機能をご利用いただけます</p>
              </div>
              
              <button
                onClick={onCancel}
                className="w-full py-2.5 md:py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm md:text-base transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">プレミアムプランを解約</span>
              </button>
              
              <p className="text-[9px] md:text-[10px] text-center text-slate-500 mt-1.5 md:mt-2">
                解約後は無料プランに戻ります
              </p>
            </div>
          ) : (
            // 無料ユーザー向けのアップグレードセクション
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 md:p-4 border-2 border-emerald-200">
              <div className="text-center mb-2 md:mb-3">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-2xl md:text-3xl font-black text-emerald-600">¥980</span>
                  <span className="text-slate-600 font-bold text-xs md:text-sm">/月</span>
                </div>
                <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5">初月無料トライアル</p>
              </div>
              
              <button
                onClick={onUpgrade}
                className="w-full py-2.5 md:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm md:text-base shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Crown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">プレミアムにアップグレード</span>
              </button>
              
              <p className="text-[9px] md:text-[10px] text-center text-slate-500 mt-1.5 md:mt-2">
                いつでもキャンセル可能
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgrade;

