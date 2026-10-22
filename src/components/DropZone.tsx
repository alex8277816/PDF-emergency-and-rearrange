import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileSpreadsheet, Image as ImageIcon, FileText, Plus, Sparkles } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSingleSample: (type: 'docx' | 'image' | 'pdf') => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onLoadSingleSample,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleClickUpload = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".docx,.doc,.jpg,.jpeg,.png,.webp,.gif,.pdf"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer text-center ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.008] shadow-lg shadow-blue-500/10'
            : 'border-slate-300 hover:border-blue-400 bg-white/70 hover:bg-slate-50/80 shadow-xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {/* Background decorative blob */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center max-w-xl mx-auto">
          {/* Animated Upload Icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 ${
              isDragOver
                ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30 ring-4 ring-blue-100'
                : 'bg-blue-50 text-blue-600 group-hover:scale-105 group-hover:bg-blue-100'
            }`}
          >
            <UploadCloud className="w-8 h-8 transition-transform group-hover:-translate-y-0.5" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-1">
            點擊選擇檔案 或 將檔案拖曳至此處
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            支援多檔案同時上傳・支援 Word (.docx)、JPG、PNG、WEBP 與 PDF 檔案
          </p>

          {/* Supported Format Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Word (DOCX)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ImageIcon className="w-3.5 h-3.5" />
              JPG / PNG / WEBP
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <FileText className="w-3.5 h-3.5" />
              現有 PDF
            </span>
          </div>

          {/* Quick sample buttons */}
          <div
            className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-200/80 w-full"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              快速體驗：
            </span>
            <button
              type="button"
              onClick={() => onLoadSingleSample('docx')}
              disabled={disabled}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer border border-slate-200"
            >
              + 範例 Word
            </button>
            <button
              type="button"
              onClick={() => onLoadSingleSample('image')}
              disabled={disabled}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors cursor-pointer border border-slate-200"
            >
              + 範例 PNG 圖表
            </button>
            <button
              type="button"
              onClick={() => onLoadSingleSample('pdf')}
              disabled={disabled}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition-colors cursor-pointer border border-slate-200"
            >
              + 範例 多頁 PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
