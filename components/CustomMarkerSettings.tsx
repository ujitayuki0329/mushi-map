import React, { useState, useEffect } from 'react';
import { X, Palette, Check } from 'lucide-react';
import { getUserMarkerSettings, saveUserMarkerSettings, getDefaultMarkerSettings } from '../services/markerService';
import { CustomMarkerSettings } from '../types';

interface CustomMarkerSettingsProps {
  userId: string;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'エメラルドグリーン', value: '#10b981' },
  { name: 'ブルー', value: '#3b82f6' },
  { name: 'パープル', value: '#8b5cf6' },
  { name: 'ピンク', value: '#ec4899' },
  { name: 'オレンジ', value: '#f97316' },
  { name: 'イエロー', value: '#eab308' },
  { name: 'レッド', value: '#ef4444' },
  { name: 'シアン', value: '#06b6d4' },
  { name: 'ローズ', value: '#f43f5e' },
  { name: 'インディゴ', value: '#6366f1' },
];

const CustomMarkerSettingsComponent: React.FC<CustomMarkerSettingsProps> = ({ userId, onClose }) => {
  const [settings, setSettings] = useState<CustomMarkerSettings | null>(null);
  const [selectedColor, setSelectedColor] = useState('#10b981');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customColor, setCustomColor] = useState('#10b981');

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const userSettings = await getUserMarkerSettings(userId);
      if (userSettings) {
        setSettings(userSettings);
        setSelectedColor(userSettings.color);
        setCustomColor(userSettings.color);
      } else {
        const defaultSettings = getDefaultMarkerSettings(userId);
        setSettings(defaultSettings);
        setSelectedColor(defaultSettings.color);
        setCustomColor(defaultSettings.color);
      }
    } catch (error) {
      console.error('Error loading marker settings:', error);
      const defaultSettings = getDefaultMarkerSettings(userId);
      setSettings(defaultSettings);
      setSelectedColor(defaultSettings.color);
      setCustomColor(defaultSettings.color);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveUserMarkerSettings({
        userId,
        color: selectedColor,
        iconType: 'default'
      });
      alert('カスタムマーカーの設定を保存しました');
      onClose();
    } catch (error: any) {
      console.error('Error saving marker settings:', error);
      alert('設定の保存に失敗しました: ' + (error.message || error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor(color);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

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
              <Palette className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-center mb-1">カスタムマーカー設定</h2>
          <p className="text-center text-emerald-50 text-[10px] md:text-xs">自分の投稿のマーカー色を変更できます</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* カラープリセット */}
          <div className="mb-6">
            <h3 className="text-sm md:text-base font-black text-slate-900 mb-3">色を選択</h3>
            <div className="grid grid-cols-5 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleColorSelect(preset.value)}
                  className={`relative aspect-square rounded-xl transition-all hover:scale-110 active:scale-95 ${
                    selectedColor === preset.value ? 'ring-4 ring-emerald-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {selectedColor === preset.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* カスタムカラー */}
          <div className="mb-6">
            <h3 className="text-sm md:text-base font-black text-slate-900 mb-3">カスタムカラー</h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setSelectedColor(e.target.value);
                }}
                className="w-20 h-20 rounded-xl border-2 border-slate-200 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                      setCustomColor(value);
                      setSelectedColor(value);
                    } else if (value.startsWith('#') && value.length <= 7) {
                      setCustomColor(value);
                    }
                  }}
                  placeholder="#10b981"
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1">HEX形式で入力（例: #10b981）</p>
              </div>
            </div>
          </div>

          {/* プレビュー */}
          <div className="mb-6">
            <h3 className="text-sm md:text-base font-black text-slate-900 mb-3">プレビュー</h3>
            <div className="bg-slate-50 rounded-xl p-6 flex items-center justify-center">
              <div
                className="w-12 h-20 relative"
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                }}
              >
                <svg width="48" height="80" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill={selectedColor}
                    stroke="#fff"
                    strokeWidth="1.5"
                    d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.5 12.5 28.5 12.5 28.5S25 21 25 12.5C25 5.6 19.4 0 12.5 0z"
                  />
                  <circle fill="#fff" cx="12.5" cy="12.5" r="4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 pb-3 md:pb-4 pt-3 flex-shrink-0 border-t border-slate-100 bg-white">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2.5 md:py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm md:text-base shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm">{isSaving ? '保存中...' : '設定を保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomMarkerSettingsComponent;
