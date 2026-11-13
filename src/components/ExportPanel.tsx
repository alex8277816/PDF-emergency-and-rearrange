import React from 'react';
import {
  FileCheck,
  Archive,
  Download,
  Settings2,
  Layers,
  FileStack,
  Loader2,
  Scissors,
  AlertCircle,
  FileText,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  ExportSettings,
  ConversionState,
  IndividualSplitMode,
  SplitGroup,
} from '../types/index.ts';

interface ExportPanelProps {
  settings: ExportSettings;
  onUpdateSettings: (updates: Partial<ExportSettings>) => void;
  conversionState: ConversionState;
  onExportMerged: () => void;
  onExportZip: () => void;
  onExportIndividualAll: () => void;
  onExportSingleSplitGroup: (group: SplitGroup) => void;
  splitGroups: SplitGroup[];
  splitError?: string;
  exportError?: string | null;
  onDismissExportError?: () => void;
  includedPageCount: number;
  totalFileCount: number;
  readyFileCount: number;
}

const SPLIT_MODE_OPTIONS: Array<{
  value: IndividualSplitMode;
  label: string;
  desc: string;
}> = [
  {
    value: 'per-page',
    label: '逐頁拆分（每頁 1 份）',
    desc: '將每一頁各自拆分為獨立的單頁 PDF 檔',
  },
  {
    value: 'fixed-chunk',
    label: '每 N 頁均分拆分',
    desc: '依固定頁數自動分割為多份 PDF',
  },
  {
    value: 'custom-ranges',
    label: '自訂頁碼區間拆分',
    desc: '輸入指定頁碼範圍（如 1-2, 3, 4-5）',
  },
  {
    value: 'per-file',
    label: '依原上傳檔案分組',
    desc: '維持各檔案各自獨立為一份 PDF（保留旋轉與刪頁）',
  },
];

export const ExportPanel: React.FC<ExportPanelProps> = ({
  settings,
  onUpdateSettings,
  conversionState,
  onExportMerged,
  onExportZip,
  onExportIndividualAll,
  onExportSingleSplitGroup,
  splitGroups,
  splitError,
  exportError,
  onDismissExportError,
  includedPageCount,
  readyFileCount,
}) => {
  const isReady = readyFileCount > 0 && includedPageCount > 0;
  const isConverting = conversionState.isConverting;
  const hasSplitError = settings.outputMode === 'individual' && Boolean(splitError);
  const canExportIndividual = isReady && !hasSplitError && splitGroups.length > 0;

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
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-800">
                個別輸出 / 拆分 PDF
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                依每頁、每 N 頁、自訂區間或原檔案拆分為多份獨立 PDF，支援單檔下載或 ZIP 打包
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Individual Split Configuration Panel */}
      {settings.outputMode === 'individual' && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Scissors className="w-4 h-4 text-blue-600" />
              <span>PDF 拆分方式設定</span>
            </div>
            {!splitError && splitGroups.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                將拆分為 {splitGroups.length} 份 PDF
              </span>
            )}
          </div>

          {/* Split Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SPLIT_MODE_OPTIONS.map(opt => {
              const active = settings.splitMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSettings({ splitMode: opt.value })}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-white/70 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-slate-700'}`}>
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Conditional Inputs for Fixed Chunk or Custom Ranges */}
          {settings.splitMode === 'fixed-chunk' && (
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
              <label htmlFor="pages-per-split-input" className="text-xs font-semibold text-slate-700">
                每幾頁拆分為一份 PDF：
              </label>
              <input
                id="pages-per-split-input"
                type="number"
                min={1}
                max={Math.max(1, includedPageCount)}
                value={settings.pagesPerSplit}
                onChange={e =>
                  onUpdateSettings({
                    pagesPerSplit: Math.max(1, parseInt(e.target.value || '1', 10)),
                  })
                }
                className="w-20 px-2.5 py-1 text-xs font-bold text-center rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500">
                頁（目前共 {includedPageCount} 頁，將產出 {splitGroups.length} 份 PDF）
              </span>
            </div>
          )}

          {settings.splitMode === 'custom-ranges' && (
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
              <label htmlFor="custom-ranges-input" className="text-xs font-semibold text-slate-700 block">
                自訂拆分頁碼區間（以逗號分隔每份 PDF 的頁碼範圍，有效頁數 1～{includedPageCount}）：
              </label>
              <input
                id="custom-ranges-input"
                type="text"
                value={settings.customRanges}
                onChange={e => onUpdateSettings({ customRanges: e.target.value })}
                placeholder={`例如：1-${Math.max(1, Math.min(2, includedPageCount))}${
                  includedPageCount > 2 ? `, 3-${includedPageCount}` : ''
                }`}
                className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 ${
                  splitError
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/40'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {splitError && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{splitError}</span>
                </p>
              )}
            </div>
          )}

          {/* Split Result Preview List */}
          {!splitError && splitGroups.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-600 font-medium">
                <span>拆分輸出預覽清單（可直接單獨下載任一份，或下方一鍵打包下載）：</span>
                <span className="text-slate-400 shrink-0">共 {splitGroups.length} 份檔案</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {splitGroups.map(group => (
                  <div
                    key={`${group.index}-${group.fileName}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-200">
                        {group.index + 1}
                      </span>
                      <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {group.fileName}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {group.pages.length} 頁
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onExportSingleSplitGroup(group)}
                      disabled={isConverting}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                      title={`直接下載 ${group.fileName}`}
                    >
                      <Download className="w-3 h-3" />
                      <span>下載此份</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
        {/* Output Filename */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            {settings.outputMode === 'merge' ? '輸出檔案名稱' : '壓縮包 / 拆分檔名前綴'}
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

      {/* Inline Export Error Banner */}
      {exportError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs text-rose-700 font-medium animate-fadeIn"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{exportError}</span>
          </span>
          {onDismissExportError && (
            <button
              type="button"
              onClick={onDismissExportError}
              aria-label="關閉錯誤提示"
              className="p-1 rounded hover:bg-rose-100 text-rose-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Completion Banner */}
      {!isConverting && !exportError && !hasSplitError && conversionState.overallProgress === 100 && conversionState.currentStepText && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-700 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{conversionState.currentStepText}</span>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500 text-center sm:text-left">
          {settings.outputMode === 'merge'
            ? `${readyFileCount} 個檔案已就緒・${includedPageCount} 個頁面將合併為單一 PDF`
            : splitError
              ? '請先修正上方拆分區間設定'
              : `${includedPageCount} 個有效頁面・將拆分為 ${splitGroups.length} 份獨立 PDF`}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {settings.outputMode === 'merge' ? (
            <>
              <button
                type="button"
                onClick={onExportZip}
                disabled={!isReady || isConverting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 transition-all disabled:opacity-40 cursor-pointer"
                title="依個別輸出拆分設定將所有 PDF 打包成 ZIP 壓縮檔下載"
              >
                <Archive className="w-4 h-4 text-amber-600" />
                <span>一鍵下載 ZIP 壓縮包</span>
              </button>

              <button
                type="button"
                onClick={onExportMerged}
                disabled={!isReady || isConverting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-md shadow-blue-500/25 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>轉換處理中...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>立即合併並下載 PDF</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onExportIndividualAll}
                disabled={!canExportIndividual || isConverting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 transition-all disabled:opacity-40 cursor-pointer"
                title="不需壓縮，直接逐一下載每一份拆分後的獨立 PDF"
              >
                <FileStack className="w-4 h-4 text-blue-600" />
                <span>逐一下載獨立 PDF ({splitGroups.length} 檔)</span>
              </button>

              <button
                type="button"
                onClick={onExportZip}
                disabled={!canExportIndividual || isConverting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-md shadow-blue-500/25 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>拆分打包中...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>拆分並下載 ZIP ({splitGroups.length} 檔)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
