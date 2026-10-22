/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DropZone } from './components/DropZone.tsx';
import { FileQueue } from './components/FileQueue.tsx';
import { PageStudio } from './components/PageStudio.tsx';
import { ExportPanel } from './components/ExportPanel.tsx';
import { PagePreviewModal } from './components/PagePreviewModal.tsx';
import { FileItem, PageItem, ExportSettings, ConversionState } from './types/index.ts';
import { detectFileType, sanitizeFileName } from './utils/fileTypes.ts';
import { convertImageToPdf } from './utils/imageToPdf.ts';
import { convertDocxToPdf } from './utils/docxConverter.ts';
import { extractPdfPages, compileMergedPdf } from './utils/pdfEngine.ts';
import { createZipFromPdfFiles, triggerFileDownload } from './utils/zipEngine.ts';
import {
  reorderPages,
  rotatePage,
  togglePageExclude,
  deletePage,
  duplicatePage,
  reversePages,
  rotateAllPages,
} from './utils/pageOrganizer.ts';
import {
  createSampleImageFile,
  createSamplePdfFile,
  createSampleDocxFile,
} from './utils/sampleFiles.ts';
import {
  FileText,
  Layers,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [initialPagesSnapshot, setInitialPagesSnapshot] = useState<PageItem[]>([]);
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null);

  const [activeTab, setActiveTab] = useState<'both' | 'queue' | 'pages'>('both');

  const [settings, setSettings] = useState<ExportSettings>({
    outputMode: 'merge',
    mergedFileName: '彙整編排文件',
    pageSize: 'fit',
    orientation: 'auto',
    imageFit: 'contain',
    margin: 20,
  });

  const [conversionState, setConversionState] = useState<ConversionState>({
    isConverting: false,
    currentStepText: '',
    overallProgress: 0,
  });

  // Keep a map of file items by ID for fast lookup during compilation
  const fileMap = useMemo(() => {
    const map = new Map<string, FileItem>();
    files.forEach(f => map.set(f.id, f));
    return map;
  }, [files]);

  // Handle incoming files
  const processFiles = useCallback(async (newRawFiles: File[]) => {
    if (newRawFiles.length === 0) return;

    // Create pending file items
    const createdFileItems: FileItem[] = newRawFiles.map(file => {
      const type = detectFileType(file);
      const ext = file.name.split('.').pop() || '';
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type,
        extension: ext,
        status: 'pending',
        progress: 10,
        pageCount: 0,
      };
    });

    setFiles(prev => [...prev, ...createdFileItems]);

    // Process each file sequentially or in parallel
    for (const item of createdFileItems) {
      try {
        // Update status to processing
        setFiles(prev =>
          prev.map(f => (f.id === item.id ? { ...f, status: 'processing', progress: 30 } : f))
        );

        let pdfBytes: Uint8Array;
        let pageCount = 1;
        let previewUrl: string | undefined = undefined;
        let extractedPages: PageItem[] = [];

        if (item.type === 'image') {
          // Progress bump
          setFiles(prev =>
            prev.map(f => (f.id === item.id ? { ...f, progress: 60 } : f))
          );
          const res = await convertImageToPdf(item.file, settings);
          pdfBytes = res.pdfBytes;
          pageCount = res.pageCount;
          previewUrl = res.previewUrl;

          // Single page for image
          extractedPages.push({
            id: `page-${item.id}-0`,
            fileId: item.id,
            sourceFileName: item.name,
            sourcePageIndex: 0,
            pageNumber: 1,
            rotation: 0,
            thumbnailUrl: previewUrl,
            isExcluded: false,
          });
        } else if (item.type === 'word') {
          setFiles(prev =>
            prev.map(f => (f.id === item.id ? { ...f, progress: 50 } : f))
          );
          const res = await convertDocxToPdf(item.file);
          pdfBytes = res.pdfBytes;
          pageCount = res.pageCount;
          previewUrl = res.previewUrl;

          // Extract pages from generated PDF for preview
          const subPages = await extractPdfPages(item, pdfBytes);
          extractedPages = subPages.length > 0 ? subPages : [
            {
              id: `page-${item.id}-0`,
              fileId: item.id,
              sourceFileName: item.name,
              sourcePageIndex: 0,
              pageNumber: 1,
              rotation: 0,
              thumbnailUrl: previewUrl,
              isExcluded: false,
            },
          ];
        } else if (item.type === 'pdf') {
          setFiles(prev =>
            prev.map(f => (f.id === item.id ? { ...f, progress: 40 } : f))
          );
          const arrayBuffer = await item.file.arrayBuffer();
          pdfBytes = new Uint8Array(arrayBuffer);
          const subPages = await extractPdfPages(item, pdfBytes);
          extractedPages = subPages;
          pageCount = subPages.length;
          previewUrl = subPages[0]?.thumbnailUrl;
        } else {
          throw new Error('不支援的檔案格式，請上傳 Word、圖片或 PDF。');
        }

        // Mark file ready
        setFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'ready',
                  progress: 100,
                  pdfBytes,
                  pageCount,
                  previewUrl,
                }
              : f
          )
        );

        // Append to page list
        setPages(prev => [...prev, ...extractedPages]);
        setInitialPagesSnapshot(prev => [...prev, ...extractedPages]);
      } catch (err) {
        console.error('File conversion error:', err);
        setFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'error',
                  progress: 0,
                  errorMessage: err instanceof Error ? err.message : '轉檔失敗',
                }
              : f
          )
        );
      }
    }
  }, [settings]);

  // Load preset sample files
  const handleLoadSamples = async () => {
    try {
      const [imgFile, pdfFile, docFile] = await Promise.all([
        createSampleImageFile('銷售績效報表.png', 'blue'),
        createSamplePdfFile('系統架構指南.pdf', 2),
        createSampleDocxFile('專案合約條款.docx'),
      ]);
      await processFiles([imgFile, pdfFile, docFile]);
    } catch (err) {
      console.error('Load samples failed:', err);
    }
  };

  const handleLoadSingleSample = async (type: 'docx' | 'image' | 'pdf') => {
    try {
      if (type === 'image') {
        const file = await createSampleImageFile('行銷數據圖表.png', 'purple');
        await processFiles([file]);
      } else if (type === 'pdf') {
        const file = await createSamplePdfFile('合約附件說明.pdf', 2);
        await processFiles([file]);
      } else if (type === 'docx') {
        const file = await createSampleDocxFile('業務合作協議.docx');
        await processFiles([file]);
      }
    } catch (err) {
      console.error('Load single sample failed:', err);
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    setPages([]);
    setInitialPagesSnapshot([]);
    setPreviewPage(null);
  };

  // File queue actions
  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setPages(prev => prev.filter(p => p.fileId !== fileId));
    setInitialPagesSnapshot(prev => prev.filter(p => p.fileId !== fileId));
    if (previewPage && previewPage.fileId === fileId) {
      setPreviewPage(null);
    }
  };

  const handleMoveFileUp = (index: number) => {
    if (index <= 0) return;
    setFiles(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(index - 1, 0, item);
      return copy;
    });
  };

  const handleMoveFileDown = (index: number) => {
    if (index >= files.length - 1) return;
    setFiles(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(index + 1, 0, item);
      return copy;
    });
  };

  const handleDownloadSinglePdf = (fileItem: FileItem) => {
    if (fileItem.pdfBytes) {
      const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
      triggerFileDownload(fileItem.pdfBytes, `${baseName}.pdf`);
    }
  };

  // Page reordering and modifications
  const handleReorderPages = (sourceIndex: number, targetIndex: number) => {
    setPages(prev => reorderPages(prev, sourceIndex, targetIndex));
  };

  const handleRotatePage = (pageId: string) => {
    setPages(prev => prev.map(p => (p.id === pageId ? rotatePage(p, 90) : p)));
    if (previewPage && previewPage.id === pageId) {
      setPreviewPage(prev => (prev ? rotatePage(prev, 90) : null));
    }
  };

  const handleToggleExclude = (pageId: string) => {
    setPages(prev => togglePageExclude(prev, pageId));
    if (previewPage && previewPage.id === pageId) {
      setPreviewPage(prev => (prev ? { ...prev, isExcluded: !prev.isExcluded } : null));
    }
  };

  const handleDeletePage = (pageId: string) => {
    setPages(prev => deletePage(prev, pageId));
    if (previewPage && previewPage.id === pageId) {
      setPreviewPage(null);
    }
  };

  const handleDuplicatePage = (pageId: string) => {
    setPages(prev => duplicatePage(prev, pageId));
  };

  const handleRotateAll = () => {
    setPages(prev => rotateAllPages(prev, 90));
  };

  const handleReverseAll = () => {
    setPages(prev => reversePages(prev));
  };

  const handleResetOrder = () => {
    if (initialPagesSnapshot.length > 0) {
      setPages([...initialPagesSnapshot]);
    }
  };

  // Export merged PDF
  const handleExportMerged = async () => {
    const includedPages = pages.filter(p => !p.isExcluded);
    if (includedPages.length === 0) {
      alert('目前沒有已選擇匯出的頁面！請至少保留一頁以進行合併。');
      return;
    }

    try {
      setConversionState({
        isConverting: true,
        currentStepText: '正在準備匯出排版...',
        overallProgress: 10,
      });

      const finalPdfBytes = await compileMergedPdf(
        includedPages,
        fileMap,
        (progress, statusText) => {
          setConversionState({
            isConverting: true,
            currentStepText: statusText,
            overallProgress: progress,
          });
        }
      );

      const fileName = `${sanitizeFileName(settings.mergedFileName, 'PDFMaster_Output')}.pdf`;
      triggerFileDownload(finalPdfBytes, fileName);

      setConversionState({
        isConverting: false,
        currentStepText: '匯出完成！',
        overallProgress: 100,
      });
    } catch (err) {
      console.error('Failed to merge PDF:', err);
      alert('匯出 PDF 時發生錯誤: ' + (err instanceof Error ? err.message : String(err)));
      setConversionState({
        isConverting: false,
        currentStepText: '匯出失敗',
        overallProgress: 0,
      });
    }
  };

  // Export ZIP archive
  const handleExportZip = async () => {
    const readyFiles = files.filter(f => f.status === 'ready' && f.pdfBytes);
    if (readyFiles.length === 0) {
      alert('尚無已轉換完成的 PDF 檔案可供打包下載！');
      return;
    }

    try {
      setConversionState({
        isConverting: true,
        currentStepText: '正在封裝 ZIP 壓縮檔案...',
        overallProgress: 20,
      });

      const zipBlob = await createZipFromPdfFiles(readyFiles, progress => {
        setConversionState({
          isConverting: true,
          currentStepText: `壓縮進度: ${progress}%`,
          overallProgress: progress,
        });
      });

      const fileName = `${sanitizeFileName(settings.mergedFileName, 'PDFMaster_All')}.zip`;
      triggerFileDownload(zipBlob, fileName);

      setConversionState({
        isConverting: false,
        currentStepText: 'ZIP 打包下載完成！',
        overallProgress: 100,
      });
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('打包 ZIP 壓縮檔失敗: ' + (err instanceof Error ? err.message : String(err)));
      setConversionState({
        isConverting: false,
        currentStepText: '打包失敗',
        overallProgress: 0,
      });
    }
  };

  const includedPagesCount = pages.filter(p => !p.isExcluded).length;
  const readyFilesCount = files.filter(f => f.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100/80 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        onLoadSamples={handleLoadSamples}
        onClearAll={handleClearAll}
        hasFiles={files.length > 0}
        isProcessing={conversionState.isConverting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Banner / Value Prop */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <Zap className="w-3.5 h-3.5" />
            <span>輕量高併發 • 極速零延遲 • 自由頁面編排</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            檔案轉 PDF 與頁面自由編排神器
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            批次將 Word (.docx)、JPG、PNG 圖片與現有 PDF 檔案快速轉換。自由視覺化拖曳更換頁面順序、個別旋轉與增刪，最後匯出與您自訂排版完全相符的 PDF 檔。
          </p>
        </div>

        {/* DropZone Section */}
        <section aria-label="檔案上傳區域">
          <DropZone
            onFilesSelected={processFiles}
            onLoadSingleSample={handleLoadSingleSample}
            disabled={conversionState.isConverting}
          />
        </section>

        {/* Content Tabs if files exist */}
        {files.length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-200 pt-2 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('both')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'both'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                同時檢視全部 ({files.length} 檔案 / {pages.length} 頁)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pages')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'pages'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                頁面視覺化編排 ({pages.length} 頁)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                檔案佇列清單 ({files.length} 檔)
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Grid */}
        {files.length > 0 && (
          <div className="space-y-6">
            {/* File Queue Section */}
            {(activeTab === 'both' || activeTab === 'queue') && (
              <section aria-label="檔案佇列">
                <FileQueue
                  files={files}
                  onRemoveFile={handleRemoveFile}
                  onMoveUp={handleMoveFileUp}
                  onMoveDown={handleMoveFileDown}
                  onDownloadFile={handleDownloadSinglePdf}
                />
              </section>
            )}

            {/* Page Studio Section */}
            {(activeTab === 'both' || activeTab === 'pages') && (
              <section aria-label="頁面排版工作台">
                <PageStudio
                  pages={pages}
                  onReorderPages={handleReorderPages}
                  onRotatePage={handleRotatePage}
                  onToggleExclude={handleToggleExclude}
                  onDeletePage={handleDeletePage}
                  onDuplicatePage={handleDuplicatePage}
                  onRotateAll={handleRotateAll}
                  onReverseAll={handleReverseAll}
                  onResetOrder={handleResetOrder}
                  onPreviewPage={page => setPreviewPage(page)}
                />
              </section>
            )}

            {/* Export & Download Control Panel */}
            <section aria-label="匯出設定與下載">
              <ExportPanel
                settings={settings}
                onUpdateSettings={updates => setSettings(prev => ({ ...prev, ...updates }))}
                conversionState={conversionState}
                onExportMerged={handleExportMerged}
                onExportZip={handleExportZip}
                includedPageCount={includedPagesCount}
                totalFileCount={files.length}
                readyFileCount={readyFilesCount}
              />
            </section>
          </div>
        )}

        {/* Feature Highlights (when empty) */}
        {files.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                多格式拖放支援與批次上傳
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                同時拖曳 Word 文檔 (.docx)、高畫質 JPG/PNG 圖片及多頁 PDF 檔案。自動辨識內容並即時計算總頁數。
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                跨文件頁面自由拖曳與個別旋轉
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                轉檔後每一頁均能直接拖曳重排順序、個別 90° 順時針旋轉、複製頁面或略過不匯出，徹底突破傳統固定順序限制。
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                輕量無伺服器負載 & ZIP 一鍵下載
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                採用現代化 WebAssembly/Web Worker 本地計算架構，支援高併發且零伺服器儲存負擔。可匯出單一合併 PDF 或 ZIP 壓縮包。
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Page Zoom Preview Modal */}
      <PagePreviewModal
        page={previewPage}
        onClose={() => setPreviewPage(null)}
        onRotatePage={handleRotatePage}
        onToggleExclude={handleToggleExclude}
        allPages={pages}
        onSelectPage={page => setPreviewPage(page)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PDFMaster Studio © 2026 • 萬能轉檔與視覺化自由編排工作台</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            隱私承諾：所有檔案於瀏覽器記憶體運算，絕不上傳第三方伺服器
          </span>
        </div>
      </footer>
    </div>
  );
}
