import React from 'react';
import {
  FileCheck,
  Archive,
  Download,
  Settings2,
  Layers,
  FileStack,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ExportSettings, ConversionState } from '../types/index.ts';

interface ExportPanelProps {
  settings: ExportSettings;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
  conversionState: ConversionState;
  onExportMerged: () => void;
  onExportZip: () => void;
  includedPageCount: number;
  totalFileCount: number;
  readyFileCount: number;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  settings,
  onUpdateSettings,
  conversionState,
  onExportMerged,
  onExportZip,
  includedPageCount,
  totalFileCount,
  readyFileCount,
}) => {
  const isReady = readyFileCount > 0 && includedPageCount > 0;
  const isConverting = conversionState.isConverting;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-base">匯出與排版設定</h3>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          有效匯出頁數：<strong className="text-blue-600">{includedPageCount}</strong> 頁
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600 block">
          輸出格式模式 (Output Mode)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ outputMode: 'merge' })}
            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
              settings.outputMode === 'merge'
                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                settings.outputMode === 'merge' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-800">
                合併為單一 PDF (推薦)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                依據您在工作台自訂的頁面順序與旋轉角度，彙整成單一完整 PDF 檔案
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ outputMode: 'individual' })}
            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
              settings.outputMode === 'individual'
                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                settings.outputMode === 'individual' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <FileStack className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-800">
                個別輸出 / ZIP 打包下載
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                每個上傳檔案各自轉換為獨立 PDF，可一次性一鍵打包為 ZIP 壓縮檔下載
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Configuration Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
        {/* Output Filename */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            輸出檔案名稱
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={settings.mergedFileName}
              onChange={e => onUpdateSettings({ mergedFileName: e.target.value })}
              placeholder="PDFMaster_output"
              className="w-full px-3 py-1.5 text-xs rounded-l-lg border border-r-0 border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-r-lg text-slate-600">
              {settings.outputMode === 'merge' ? '.pdf' : '.zip'}
            </span>
          </div>
        </div>

        {/* Page Size */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            頁面紙張尺寸
          </label>
          <select
            value={settings.pageSize}
            onChange={e => onUpdateSettings({ pageSize: e.target.value as ExportSettings['pageSize'] })}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="fit">自適應 / 維持原始比例</option>
            <option value="a4">標準 A4 (210 × 297 mm)</option>
            <option value="letter">美規 Letter (8.5 × 11 in)</option>
          </select>
        </div>

        {/* Orientation */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            紙張方向
          </label>
          <select
            value={settings.orientation}
            onChange={e => onUpdateSettings({ orientation: e.target.value as ExportSettings['orientation'] })}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="auto">自動判斷 (Auto)</option>
            <option value="portrait">直向 (Portrait)</option>
            <option value="landscape">橫向 (Landscape)</option>
          </select>
        </div>
      </div>

      {/* Live Conversion Progress Bar */}
      {isConverting && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-blue-900 font-medium">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              {conversionState.currentStepText || '正在處理 PDF 轉換中...'}
            </span>
            <span className="font-bold font-mono">{conversionState.overallProgress}%</span>
          </div>
          <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${conversionState.overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500 text-center sm:text-left">
          {readyFileCount} 個檔案已就緒・{includedPageCount} 個頁面將依排版順序輸出
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* ZIP Download button */}
          <button
            type="button"
            onClick={onExportZip}
            disabled={!isReady || isConverting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 transition-all disabled:opacity-40 cursor-pointer"
            title="將所有獨立轉換好的 PDF 打包成 ZIP 壓縮檔下載"
          >
            <Archive className="w-4 h-4 text-amber-600" />
            <span>一鍵下載 ZIP 壓縮包</span>
          </button>

          {/* Merge PDF button */}
          <button
            type="button"
            onClick={settings.outputMode === 'merge' ? onExportMerged : onExportZip}
            disabled={!isReady || isConverting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-md shadow-blue-500/25 transition-all disabled:opacity-40 cursor-pointer"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>轉換處理中...</span>
              </>
            ) : settings.outputMode === 'merge' ? (
              <>
                <FileCheck className="w-4 h-4" />
                <span>立即合併並下載 PDF</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>下載 ZIP 壓縮檔</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
