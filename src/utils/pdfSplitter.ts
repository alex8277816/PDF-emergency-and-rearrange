import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import {
  IndividualSplitMode,
  PageItem,
  PageOrientationOption,
  PageSizeOption,
  SplitGroup,
} from '../types/index.ts';
import { sanitizeFileName } from './fileTypes.ts';

export interface RangeParseResult {
  groups: number[][];
  labels: string[];
  error?: string;
}

/**
 * Parse a user-provided page range string into groups of 1-based page numbers.
 * Examples:
 * - "1-2, 3, 4-5" => [[1, 2], [3], [4, 5]]
 * - "1, 3-5" => [[1], [3, 4, 5]]
 */
export function parsePageRanges(rangeInput: string, totalPages: number): RangeParseResult {
  if (totalPages <= 0) {
    return { groups: [], labels: [], error: '目前沒有可供拆分的有效頁面' };
  }

  const normalized = rangeInput
    .replace(/[，、；;]/g, ',')
    .replace(/[–—~～]/g, '-')
    .trim();

  if (!normalized) {
    return {
      groups: [],
      labels: [],
      error: '請輸入要拆分的頁碼或區間（例如：1-2, 3, 4-5）',
    };
  }

  const tokens = normalized
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (tokens.length === 0) {
    return {
      groups: [],
      labels: [],
      error: '請輸入要拆分的頁碼或區間（例如：1-2, 3, 4-5）',
    };
  }

  const groups: number[][] = [];
  const labels: string[] = [];

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const pageNum = parseInt(token, 10);
      if (pageNum < 1 || pageNum > totalPages) {
        return {
          groups: [],
          labels: [],
          error: `頁碼「${pageNum}」超出範圍，目前有效頁數為 1 至 ${totalPages} 頁`,
        };
      }
      groups.push([pageNum]);
      labels.push(`${pageNum}`);
    } else if (/^\d+\s*-\s*\d+$/.test(token)) {
      const [startStr, endStr] = token.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (start < 1 || start > totalPages || end < 1 || end > totalPages) {
        return {
          groups: [],
          labels: [],
          error: `區間「${token}」超出範圍，目前有效頁數為 1 至 ${totalPages} 頁`,
        };
      }

      const rangePages: number[] = [];
      if (start <= end) {
        for (let p = start; p <= end; p++) rangePages.push(p);
      } else {
        for (let p = start; p >= end; p--) rangePages.push(p);
      }
      groups.push(rangePages);
      labels.push(`${start}-${end}`);
    } else {
      return {
        groups: [],
        labels: [],
        error: `區間格式「${token}」不正確，請使用如「1-2, 3, 4-5」的格式`,
      };
    }
  }

  return { groups, labels };
}

export interface BuildSplitGroupsOptions {
  splitMode: IndividualSplitMode;
  pagesPerSplit: number;
  customRanges: string;
  baseName: string;
}

export interface BuildSplitGroupsResult {
  groups: SplitGroup[];
  error?: string;
}

/**
 * Partition active (non-excluded) pages into distinct PDF groups according to splitMode.
 */
export function buildSplitGroups(
  pages: PageItem[],
  options: BuildSplitGroupsOptions
): BuildSplitGroupsResult {
  const includedPages = pages.filter(p => !p.isExcluded);

  if (includedPages.length === 0) {
    return { groups: [], error: '目前沒有已納入匯出的有效頁面' };
  }

  const cleanPrefix = sanitizeFileName(options.baseName || 'PDFMaster', 'PDFMaster');

  if (options.splitMode === 'per-page') {
    const padWidth = Math.max(2, String(includedPages.length).length);
    const groups: SplitGroup[] = includedPages.map((page, idx) => {
      const sourceBase = sanitizeFileName(page.sourceFileName.replace(/\.[^/.]+$/, ''), 'document');
      const padIdx = String(idx + 1).padStart(padWidth, '0');
      return {
        index: idx,
        title: `${page.sourceFileName} (原第 ${page.pageNumber} 頁)`,
        fileName: `${padIdx}_${sourceBase}_P${page.pageNumber}.pdf`,
        pageLabel: `第 ${idx + 1} 頁`,
        pages: [page],
      };
    });
    return { groups };
  }

  if (options.splitMode === 'fixed-chunk') {
    const chunkSize = Math.max(1, Math.floor(Number(options.pagesPerSplit) || 1));
    const totalChunks = Math.ceil(includedPages.length / chunkSize);
    const padWidth = Math.max(2, String(totalChunks).length);
    const groups: SplitGroup[] = [];

    for (let i = 0; i < includedPages.length; i += chunkSize) {
      const slice = includedPages.slice(i, i + chunkSize);
      const chunkIdx = groups.length;
      const startPage = i + 1;
      const endPage = i + slice.length;
      const pageRangeStr = startPage === endPage ? `${startPage}` : `${startPage}-${endPage}`;
      const padIdx = String(chunkIdx + 1).padStart(padWidth, '0');

      groups.push({
        index: chunkIdx,
        title: `分段 ${chunkIdx + 1} (第 ${pageRangeStr} 頁)`,
        fileName: `${padIdx}_${cleanPrefix}_P${pageRangeStr}.pdf`,
        pageLabel: `第 ${pageRangeStr} 頁 (${slice.length} 頁)`,
        pages: slice,
      });
    }
    return { groups };
  }

  if (options.splitMode === 'custom-ranges') {
    const parsed = parsePageRanges(options.customRanges, includedPages.length);
    if (parsed.error) {
      return { groups: [], error: parsed.error };
    }

    const padWidth = Math.max(2, String(parsed.groups.length).length);
    const groups: SplitGroup[] = parsed.groups.map((pageNums, idx) => {
      const slice = pageNums.map(n => includedPages[n - 1]);
      const label = parsed.labels[idx];
      const padIdx = String(idx + 1).padStart(padWidth, '0');

      return {
        index: idx,
        title: `自訂區間 ${idx + 1} (第 ${label} 頁)`,
        fileName: `${padIdx}_${cleanPrefix}_P${label}.pdf`,
        pageLabel: `第 ${label} 頁 (${slice.length} 頁)`,
        pages: slice,
      };
    });

    return { groups };
  }

  // 'per-file': Group pages by source fileId in order of first appearance
  const fileGroupOrder: string[] = [];
  const fileGroupMap = new Map<string, PageItem[]>();

  for (const page of includedPages) {
    if (!fileGroupMap.has(page.fileId)) {
      fileGroupOrder.push(page.fileId);
      fileGroupMap.set(page.fileId, []);
    }
    fileGroupMap.get(page.fileId)!.push(page);
  }

  const padWidth = Math.max(2, String(fileGroupOrder.length).length);
  const groups: SplitGroup[] = fileGroupOrder.map((fileId, idx) => {
    const groupPages = fileGroupMap.get(fileId)!;
    const sourceName = groupPages[0].sourceFileName;
    const sourceBase = sanitizeFileName(sourceName.replace(/\.[^/.]+$/, ''), 'document');
    const padIdx = String(idx + 1).padStart(padWidth, '0');

    return {
      index: idx,
      title: sourceName,
      fileName: `${padIdx}_${sourceBase}.pdf`,
      pageLabel: `${groupPages.length} 頁`,
      pages: groupPages,
    };
  });

  return { groups };
}

export interface PdfCompileOptions {
  pageSize?: PageSizeOption;
  orientation?: PageOrientationOption;
}

export interface SourceBytesEntry {
  name: string;
  pdfBytes?: Uint8Array;
}

/**
 * Compile an ordered list of PageItems into a single PDF Uint8Array.
 * Respects per-page rotation, page order, and optional target pageSize / orientation.
 */
export async function buildPdfFromPages(
  pagesToInclude: PageItem[],
  fileMap: Map<string, SourceBytesEntry>,
  options?: PdfCompileOptions,
  onProgress?: (progress: number, statusText: string) => void
): Promise<Uint8Array> {
  if (pagesToInclude.length === 0) {
    throw new Error('No pages selected for PDF generation.');
  }

  const outPdf = await PDFDocument.create();
  const total = pagesToInclude.length;
  const loadedPdfCache = new Map<string, PDFDocument>();

  const targetPageSize = options?.pageSize || 'fit';
  const targetOrientation = options?.orientation || 'auto';

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

    const maxPages = sourcePdf.getPageCount();
    const sourceIdx = Math.min(Math.max(0, pageItem.sourcePageIndex), maxPages - 1);

    if (targetPageSize === 'fit') {
      const [copiedPage] = await outPdf.copyPages(sourcePdf, [sourceIdx]);
      const originalRot = copiedPage.getRotation().angle;
      let totalRotation = (originalRot + pageItem.rotation) % 360;

      if (targetOrientation !== 'auto') {
        const { width, height } = copiedPage.getSize();
        const isRotatedSideways = totalRotation === 90 || totalRotation === 270;
        const effWidth = isRotatedSideways ? height : width;
        const effHeight = isRotatedSideways ? width : height;

        if (targetOrientation === 'landscape' && effWidth < effHeight) {
          totalRotation = (totalRotation + 90) % 360;
        } else if (targetOrientation === 'portrait' && effWidth > effHeight) {
          totalRotation = (totalRotation + 90) % 360;
        }
      }

      if (totalRotation !== originalRot) {
        copiedPage.setRotation(degrees(totalRotation));
      }
      outPdf.addPage(copiedPage);
    } else {
      // Target A4 or Letter page size: embed source page and center-fit onto target paper
      const sourcePage = sourcePdf.getPage(sourceIdx);
      const originalRot = sourcePage.getRotation().angle;
      const totalRotation = (((originalRot + pageItem.rotation) % 360) + 360) % 360;
      const embeddedPage = await outPdf.embedPage(sourcePage);

      const rawW = embeddedPage.width;
      const rawH = embeddedPage.height;
      const isSideways = totalRotation === 90 || totalRotation === 270;
      const effW = isSideways ? rawH : rawW;
      const effH = isSideways ? rawW : rawH;

      let [pageW, pageH] = targetPageSize === 'a4' ? [...PageSizes.A4] : [...PageSizes.Letter];

      if (targetOrientation === 'landscape' || (targetOrientation === 'auto' && effW > effH)) {
        if (pageW < pageH) [pageW, pageH] = [pageH, pageW];
      } else if (targetOrientation === 'portrait') {
        if (pageW > pageH) [pageW, pageH] = [pageH, pageW];
      }

      const margin = 16;
      const availW = Math.max(10, pageW - margin * 2);
      const availH = Math.max(10, pageH - margin * 2);
      const scale = Math.min(availW / effW, availH / effH);
      const drawW = rawW * scale;
      const drawH = rawH * scale;

      const mediaW = isSideways ? pageH : pageW;
      const mediaH = isSideways ? pageW : pageH;

      const outPage = outPdf.addPage([mediaW, mediaH]);
      outPage.drawPage(embeddedPage, {
        x: (mediaW - drawW) / 2,
        y: (mediaH - drawH) / 2,
        width: drawW,
        height: drawH,
      });

      if (totalRotation !== 0) {
        outPage.setRotation(degrees(totalRotation));
      }
    }
  }

  if (onProgress) {
    onProgress(100, '正在生成 PDF 檔案...');
  }

  return await outPdf.save();
}

export interface CompiledSplitFile {
  fileName: string;
  title: string;
  pageCount: number;
  pdfBytes: Uint8Array;
}

/**
 * Compile every SplitGroup into its own separate PDF file.
 */
export async function compileSplitGroups(
  groups: SplitGroup[],
  fileMap: Map<string, SourceBytesEntry>,
  options?: PdfCompileOptions,
  onProgress?: (progress: number, statusText: string) => void
): Promise<CompiledSplitFile[]> {
  if (groups.length === 0) {
    throw new Error('沒有可供拆分的頁面群組。');
  }

  const results: CompiledSplitFile[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (onProgress) {
      const pct = Math.round(((i + 0.5) / groups.length) * 100);
      onProgress(pct, `正在拆分產生 (${i + 1}/${groups.length}): ${group.fileName}`);
    }

    const pdfBytes = await buildPdfFromPages(group.pages, fileMap, options);
    results.push({
      fileName: group.fileName,
      title: group.title,
      pageCount: group.pages.length,
      pdfBytes,
    });
  }

  if (onProgress) {
    onProgress(100, `已完成拆分 ${results.length} 份獨立 PDF 檔案`);
  }

  return results;
}
