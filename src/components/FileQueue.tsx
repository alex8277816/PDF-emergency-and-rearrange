import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { FileItem } from '../types/index.ts';
import { formatBytes } from '../utils/fileTypes.ts';

interface FileQueueProps {
  files: FileItem[];
  onRemoveFile: (fileId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDownloadFile: (fileItem: FileItem) => void;
}

export const FileQueue: React.FC<FileQueueProps> = ({
  files,
  onRemoveFile,
  onMoveUp,
  onMoveDown,
  onDownloadFile,
}) => {
  if (files.length === 0) {
    return null;
  }

  const getFileBadge = (type: FileItem['type']) => {
    switch (type) {
      case 'word':
        return {
          icon: <FileSpreadsheet className="w-4 h-4 text-blue-600" />,
          label: 'Word',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'image':
        return {
          icon: <ImageIcon className="w-4 h-4 text-emerald-600" />,
          label: '圖片',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'pdf':
        return {
          icon: <FileText className="w-4 h-4 text-rose-600" />,
          label: 'PDF',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          icon: <FileText className="w-4 h-4 text-slate-600" />,
          label: '檔案',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span>已上傳檔案佇列</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700 font-bold">
            {files.length}
          </span>
        </h4>
        <span className="text-xs text-slate-400">
          可點擊上下箭頭調整檔案轉換順序
        </span>
      </div>

      <div className="space-y-2">
        {files.map((item, index) => {
          const badge = getFileBadge(item.type);
          const isFirst = index === 0;
          const isLast = index === files.length - 1;

          return (
            <div
              key={item.id}
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all"
            >
              {/* File Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Thumbnail or Icon */}
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    badge.icon
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-sm font-medium text-slate-900 truncate max-w-[240px] sm:max-w-[320px]">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatBytes(item.size)}</span>
                    <span>•</span>
                    <span>
                      {item.pageCount > 0 ? `${item.pageCount} 頁` : '解析中...'}
                    </span>
                    <span>•</span>
                    {/* Status pill */}
                    {item.status === 'ready' && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已轉檔完成
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        處理中 ({item.progress}%)
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        等候中
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {item.errorMessage || '轉檔失敗'}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {item.status === 'processing' && (
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                {/* Move up / down */}
                <button
                  type="button"
                  onClick={() => onMoveUp(index)}
                  disabled={isFirst}
                  title="將檔案往上排"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(index)}
                  disabled={isLast}
                  title="將檔案往下排"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Individual download */}
                {item.status === 'ready' && item.pdfBytes && (
                  <button
                    type="button"
                    onClick={() => onDownloadFile(item)}
                    title="單獨下載此檔案的 PDF"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載</span>
                  </button>
                )}

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onRemoveFile(item.id)}
                  title="移除此檔案"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
