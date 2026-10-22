import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PageItem, FileItem, ExportSettings } from '../types/index.ts';

// Configure pdfjs worker safely
try {
  // Use Vite's worker URL resolver or inline worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  console.warn('PDF.js worker fallback will be handled in runtime', e);
}

/**
 * Generate thumbnail image for a specific page of a PDF Uint8Array
 */
export async function renderPdfPageThumbnail(
  pdfBytes: Uint8Array,
  pageNumber: number, // 1-based
  targetWidth: number = 240
): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes.slice(),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context not available');
    }

    // Render page
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };

    // @ts-expect-error pdfjs typing nuance
    await page.render(renderContext).promise;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn(`PDF.js thumbnail render failed for page ${pageNumber}, generating placeholder:`, err);
    return createFallbackPageThumbnail(pageNumber, targetWidth, Math.round(targetWidth * 1.414));
  }
}

/**
 * Create a crisp fallback thumbnail canvas with page number and layout lines
 */
export function createFallbackPageThumbnail(
  pageNumber: number,
  width: number = 200,
  height: number = 280
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Page paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Header bar
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(15, 20, width - 30, 16);

    // Mock content lines
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = '#f8fafc';
      const lineWidth = i % 2 === 0 ? width - 40 : width - 70;
      ctx.fillRect(20, 50 + i * 22, lineWidth, 10);
    }

    // Badge in center
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${pageNumber}`, width / 2, height / 2);

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(`PDF Page ${pageNumber}`, width / 2, height - 25);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Extract pages from an uploaded PDF file and return PageItems
 */
export async function extractPdfPages(
  fileItem: FileItem,
  pdfBytes: Uint8Array
): Promise<PageItem[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const count = pdfDoc.getPageCount();
  const pages: PageItem[] = [];

  for (let i = 0; i < count; i++) {
    const pageIndex = i;
    const pageNum = i + 1;
    const pdfPage = pdfDoc.getPage(pageIndex);
    const { width, height } = pdfPage.getSize();

    // Render thumbnail
    let thumbUrl = '';
    try {
      thumbUrl = await renderPdfPageThumbnail(pdfBytes, pageNum, 220);
    } catch {
      thumbUrl = createFallbackPageThumbnail(pageNum, 200, Math.round((height / width) * 200));
    }

    pages.push({
      id: `${fileItem.id}-p${pageNum}-${Math.random().toString(36).substring(2, 7)}`,
      fileId: fileItem.id,
      sourceFileName: fileItem.name,
      sourcePageIndex: pageIndex,
      pageNumber: pageNum,
      rotation: 0,
      thumbnailUrl: thumbUrl,
      isExcluded: false,
      width,
      height,
    });
  }

  return pages;
}

/**
 * Compile a merged PDF document based strictly on the user-arranged PageItem list!
 * Supports individual page rotations, page reordering across different documents, and skipping excluded pages.
 */
export async function compileMergedPdf(
  pagesToInclude: PageItem[],
  fileMap: Map<string, FileItem>,
  onProgress?: (progress: number, statusText: string) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const total = pagesToInclude.length;

  if (total === 0) {
    throw new Error('No pages selected for merging.');
  }

  // Cache loaded source PDFDocuments so we don't reload the same file multiple times
  const loadedPdfCache = new Map<string, PDFDocument>();

  for (let i = 0; i < total; i++) {
    const pageItem = pagesToInclude[i];
    const sourceFile = fileMap.get(pageItem.fileId);

    if (!sourceFile || !sourceFile.pdfBytes) {
      console.warn(`Source PDF bytes not found for file ${pageItem.fileId}`);
      continue;
    }

    if (onProgress) {
      const pct = Math.round(((i + 1) / total) * 100);
      onProgress(pct, `正在處理頁面 ${i + 1} / ${total}: 來自 ${sourceFile.name} (第 ${pageItem.pageNumber} 頁)`);
    }

    let sourcePdf = loadedPdfCache.get(pageItem.fileId);
    if (!sourcePdf) {
      sourcePdf = await PDFDocument.load(sourceFile.pdfBytes);
      loadedPdfCache.set(pageItem.fileId, sourcePdf);
    }

    // Check bounds
    const maxPages = sourcePdf.getPageCount();
    const sourceIdx = Math.min(Math.max(0, pageItem.sourcePageIndex), maxPages - 1);

    // Copy page into merged document
    const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [sourceIdx]);

    // Apply rotation
    if (pageItem.rotation !== 0) {
      const originalRot = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((originalRot + pageItem.rotation) % 360));
    }

    mergedPdf.addPage(copiedPage);
  }

  if (onProgress) {
    onProgress(100, '正在生成最終 PDF 檔案...');
  }

  const outputBytes = await mergedPdf.save();
  return outputBytes;
}
