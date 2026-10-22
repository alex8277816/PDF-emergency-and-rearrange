import React, { useState } from 'react';
import {
  RotateCw,
  Eye,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Check,
  Ban,
  ArrowLeftRight,
  RotateCcw,
  Maximize2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { PageItem } from '../types/index.ts';

interface PageStudioProps {
  pages: PageItem[];
  onReorderPages: (sourceIndex: number, targetIndex: number) => void;
  onRotatePage: (pageId: string) => void;
  onToggleExclude: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onRotateAll: () => void;
  onReverseAll: () => void;
  onResetOrder: () => void;
  onPreviewPage: (page: PageItem) => void;
}

export const PageStudio: React.FC<PageStudioProps> = ({
  pages,
  onReorderPages,
  onRotatePage,
  onToggleExclude,
  onDeletePage,
  onDuplicatePage,
  onRotateAll,
  onReverseAll,
  onResetOrder,
  onPreviewPage,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (pages.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-700 mb-1">
          尚無頁面可供編排
        </h4>
        <p className="text-xs text-slate-400">
          請先在上方上傳或載入範例檔案，系統將自動解析出所有頁面供您自由排序與旋轉。
        </p>
      </div>
    );
  }

  // Count active output pages
  const includedCount = pages.filter(p => !p.isExcluded).length;
  const excludedCount = pages.length - includedCount;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorderPages(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Studio Header & Batch Actions Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">
              PDF 頁面視覺化編排工作台
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              共 {pages.length} 頁
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            可自由拖曳調整頁面順序、左右移動、個別旋轉、增刪或略過頁面，最終匯出完整 PDF
          </p>
        </div>

        {/* Batch buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onRotateAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition-colors cursor-pointer"
            title="將所有頁面順時針旋轉 90 度"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>全向右轉 90°</span>
          </button>

          <button
            type="button"
            onClick={onReverseAll}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition-colors cursor-pointer"
            title="將目前的頁面清單首尾反轉"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
            <span>反轉順序</span>
          </button>

          <button
            type="button"
            onClick={onResetOrder}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition-colors cursor-pointer"
            title="恢復為最初上傳時的原始檔案與頁碼順序"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>重設原始順序</span>
          </button>
        </div>
      </div>

      {/* Page Stats Bar */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            匯出有效頁數：<strong className="text-slate-800">{includedCount} 頁</strong>
          </span>
          {excludedCount > 0 && (
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              已略過不匯出：{excludedCount} 頁
            </span>
          )}
        </div>
        <span className="hidden sm:inline text-slate-400">
          💡 提示：按住卡片可直接拖曳排序，或使用卡片上的 ◀ ▶ 按鈕微調
        </span>
      </div>

      {/* Page Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {pages.map((page, index) => {
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;
          const isFirst = index === 0;
          const isLast = index === pages.length - 1;

          // Calculate output sequence number for included pages
          let outputSequence = 0;
          if (!page.isExcluded) {
            for (let i = 0; i <= index; i++) {
              if (!pages[i].isExcluded) outputSequence++;
            }
          }

          return (
            <div
              key={page.id}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={e => handleDrop(e, index)}
              className={`group relative flex flex-col bg-white rounded-xl border-2 transition-all select-none overflow-hidden ${
                page.isExcluded
                  ? 'opacity-50 border-dashed border-slate-300 bg-slate-50/70'
                  : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
              } ${isDragging ? 'opacity-30 scale-95 border-blue-500' : ''} ${
                isOver ? 'border-blue-600 scale-105 shadow-lg ring-2 ring-blue-300' : ''
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between p-2 border-b border-slate-100 bg-slate-50/80 text-[11px]">
                <div className="flex items-center gap-1 font-bold">
                  {page.isExcluded ? (
                    <span className="text-slate-400 line-through">略過</span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-xs">
                      #{outputSequence}
                    </span>
                  )}
                </div>

                <span
                  className="truncate max-w-[90px] text-slate-500 font-medium"
                  title={`${page.sourceFileName} (原第 ${page.pageNumber} 頁)`}
                >
                  {page.sourceFileName}
                </span>
              </div>

              {/* Thumbnail Container */}
              <div
                className="relative aspect-[3/4] bg-slate-100 flex items-center justify-center p-2 overflow-hidden cursor-grab active:cursor-grabbing"
                onClick={() => onPreviewPage(page)}
              >
                {page.thumbnailUrl ? (
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-300"
                    style={{
                      transform: `rotate(${page.rotation}deg)`,
                    }}
                  >
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="max-w-full max-h-full object-contain shadow-xs rounded"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileText className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">載入中...</span>
                  </div>
                )}

                {/* Rotation Badge overlay if rotated */}
                {page.rotation !== 0 && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    {page.rotation}°
                  </div>
                )}

                {/* Excluded Overlay */}
                {page.isExcluded && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white font-bold text-xs">
                    <span className="px-2 py-1 rounded bg-black/60 flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      不匯出此頁
                    </span>
                  </div>
                )}

                {/* Zoom hover indicator */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-2 py-1 rounded-full bg-white/90 text-slate-800 text-xs font-medium flex items-center gap-1 shadow-sm">
                    <Maximize2 className="w-3 h-3" />
                    放大預覽
                  </span>
                </div>
              </div>

              {/* Page Footer Controls */}
              <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                {/* Move Left / Right */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      if (!isFirst) onReorderPages(index, index - 1);
                    }}
                    disabled={isFirst}
                    title="向左前移一位"
                    className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      if (!isLast) onReorderPages(index, index + 1);
                    }}
                    disabled={isLast}
                    title="向右後移一位"
                    className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rotate 90° button */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onRotatePage(page.id);
                  }}
                  title="向右順時針旋轉 90 度"
                  className="p-1 rounded text-blue-600 hover:bg-blue-50 active:scale-90 transition-transform cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDuplicatePage(page.id);
                  }}
                  title="複製此頁"
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Include / Exclude Toggle */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleExclude(page.id);
                  }}
                  title={page.isExcluded ? '恢復納入匯出' : '略過不匯出此頁'}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    page.isExcluded
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                  }`}
                >
                  {page.isExcluded ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDeletePage(page.id);
                  }}
                  title="自排版中移除此頁"
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
