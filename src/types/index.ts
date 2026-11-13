export type SupportedFileType = 'image' | 'word' | 'pdf' | 'unsupported';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: SupportedFileType;
  extension: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  progress: number;
  errorMessage?: string;
  pageCount: number;
  previewUrl?: string; // thumbnail for image or docx/pdf preview
  pdfBytes?: Uint8Array; // converted or original PDF bytes
}

export interface PageItem {
  id: string;
  fileId: string;
  sourceFileName: string;
  sourcePageIndex: number; // 0-based page index in the source file
  pageNumber: number; // 1-based display original page
  rotation: 0 | 90 | 180 | 270;
  thumbnailUrl?: string;
  isExcluded: boolean;
  width?: number;
  height?: number;
}

export type PageSizeOption = 'fit' | 'a4' | 'letter';
export type PageOrientationOption = 'auto' | 'portrait' | 'landscape';
export type ImageFitMode = 'contain' | 'cover' | 'stretch';
export type IndividualSplitMode = 'per-page' | 'fixed-chunk' | 'custom-ranges' | 'per-file';

export interface SplitGroup {
  index: number;
  title: string;
  fileName: string;
  pageLabel: string;
  pages: PageItem[];
}

export interface ExportSettings {
  outputMode: 'merge' | 'individual';
  splitMode: IndividualSplitMode;
  pagesPerSplit: number;
  customRanges: string;
  mergedFileName: string;
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  imageFit: ImageFitMode;
  margin: number; // in points
}

export interface ConversionState {
  isConverting: boolean;
  currentStepText: string;
  overallProgress: number;
}
