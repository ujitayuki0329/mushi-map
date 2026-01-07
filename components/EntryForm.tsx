
import React, { useState, useRef } from 'react';
import { X, Camera, MapPin, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { analyzeInsectImage } from '../services/geminiService';

interface EntryFormProps {
  onSave: (data: { name: string; memo: string; image: string }) => void;
  onClose: () => void;
  isSaving: boolean;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSave, onClose, isSaving }) => {
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        // Reset analysis when new image picked
        setName('');
        setMemo('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const result = await analyzeInsectImage(image);
      if (result) {
        setName(result.name || '');
        setMemo(result.description || '');
      } else {
        setErrorMessage('AI判定に失敗しました。もう一度お試しください。');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setErrorMessage(error.message || 'AI判定中にエラーが発生しました。APIキーが正しく設定されているか確認してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, memo, image: image || '' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-none">新規採集の記録</h2>
              <p className="text-xs text-slate-400 mt-1">AIが種類を判別します</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Upload Area */}
          <div className="relative group">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-56 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                image ? 'border-transparent ring-4 ring-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}
            >
              {image ? (
                <>
                  <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-3xl" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  {/* AI Trigger Overlay */}
                  {!name && !isAnalyzing && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                      className="absolute bottom-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold hover:scale-105 transition-transform"
                    >
                      <Wand2 className="w-4 h-4" />
                      AIで判定
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">画像をアップロード</p>
                  <p className="text-xs text-slate-400 mt-1">タップして撮影または選択</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur rounded-3xl flex flex-col items-center justify-center z-10 animate-in fade-in">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-3" />
                <p className="text-sm font-bold text-emerald-600">AIが画像を分析中...</p>
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">昆虫の名前</label>
              <input
                type="text"
                required
                placeholder="例: ナナホシテントウ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-800 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">メモ・特徴</label>
              <textarea
                rows={3}
                placeholder="見つけた状況や特徴..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none text-slate-800 placeholder:text-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving || isAnalyzing || !name}
              className="flex-1 py-4 font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-[1.5rem] shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  保存しています...
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 text-emerald-400 group-hover:scale-125 transition-transform" />
                  この場所を記録する
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryForm;
