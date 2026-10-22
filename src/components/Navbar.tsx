import React from 'react';
import { FileText, ShieldCheck, Sparkles, Trash2, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onLoadSamples: () => void;
  onClearAll: () => void;
  hasFiles: boolean;
  isProcessing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadSamples,
  onClearAll,
  hasFiles,
  isProcessing,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">PDFMaster</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                PRO Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Word • JPG • PNG • PDF 萬能轉檔與視覺化頁面自由編排
            </p>
          </div>
        </div>

        {/* Local privacy badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>100% 本地瀏覽器極速處理・檔案零洩漏風險</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSamples}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
            title="載入預設的 Word、圖表及多頁 PDF 示範檔案"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">載入範例檔案</span>
            <span className="sm:hidden">範例</span>
          </button>

          {hasFiles && (
            <button
              type="button"
              onClick={onClearAll}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-lg transition-all border border-rose-200 disabled:opacity-50 cursor-pointer"
              title="清空所有上傳檔案與頁面排版"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">清空全部</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
