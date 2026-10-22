import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Ban,
  Check,
} from 'lucide-react';
import { PageItem } from '../types/index.ts';

interface PagePreviewModalProps {
  page: PageItem | null;
  onClose: () => void;
  onRotatePage: (pageId: string) => void;
  onToggleExclude: (pageId: string) => void;
  allPages: PageItem[];
  onSelectPage: (page: PageItem) => void;
}

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  page,
  onClose,
  onRotatePage,
  onToggleExclude,
  allPages,
  onSelectPage,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!page) return null;

  const currentIndex = allPages.findIndex(p => p.id === page.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPages.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setZoomLevel(1);
      onSelectPage(allPages[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setZoomLevel(1);
      onSelectPage(allPages[currentIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-sm">
                頁面細部檢視 ({currentIndex + 1} / {allPages.length})
              </h4>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                {page.sourceFileName}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              原始第 {page.pageNumber} 頁 • 旋轉角度: {page.rotation}°
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
              title="縮小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-slate-600 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
              title="重設大小"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-1" />

            {/* Rotate */}
            <button
              type="button"
              onClick={() => onRotatePage(page.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>旋轉 90°</span>
            </button>

            {/* Toggle Exclude */}
            <button
              type="button"
              onClick={() => onToggleExclude(page.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                page.isExcluded
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {page.isExcluded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>恢復納入</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  <span>略過此頁</span>
                </>
              )}
            </button>

            <div className="h-5 w-px bg-slate-300 mx-1" />

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="relative flex-1 bg-slate-900/10 p-6 flex items-center justify-center overflow-auto min-h-[400px]">
          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={!hasPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md transition-all disabled:opacity-20 cursor-pointer z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md transition-all disabled:opacity-20 cursor-pointer z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Page Image */}
          <div
            className="transition-transform duration-300 flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel}) rotate(${page.rotation}deg)`,
            }}
          >
            {page.thumbnailUrl ? (
              <img
                src={page.thumbnailUrl}
                alt={`Preview page ${page.pageNumber}`}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-xl bg-white"
              />
            ) : (
              <div className="w-64 h-96 bg-white rounded-lg shadow-md flex items-center justify-center text-slate-400">
                載入預覽中...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
