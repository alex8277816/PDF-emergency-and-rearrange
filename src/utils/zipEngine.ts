import JSZip from 'jszip';
import { FileItem } from '../types/index.ts';
import { CompiledSplitFile } from './pdfSplitter.ts';

/**
 * Package compiled split PDF files into a single downloadable .zip file.
 * Handles deduplicating filenames if any collision occurs.
 */
export async function createZipFromSplitFiles(
  splitFiles: CompiledSplitFile[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  if (splitFiles.length === 0) {
    throw new Error('No split PDF files available to package into ZIP.');
  }

  const usedNames = new Set<string>();
  splitFiles.forEach(item => {
    let finalName = item.fileName;
    if (usedNames.has(finalName)) {
      const base = finalName.replace(/\.pdf$/i, '');
      let counter = 2;
      while (usedNames.has(`${base}_${counter}.pdf`)) {
        counter++;
      }
      finalName = `${base}_${counter}.pdf`;
    }
    usedNames.add(finalName);
    zip.file(finalName, item.pdfBytes);
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    metadata => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return zipBlob;
}

/**
 * Package multiple converted PDF files into a single downloadable .zip file
 */
export async function createZipFromPdfFiles(
  files: FileItem[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const validFiles = files.filter(f => f.status === 'ready' && f.pdfBytes);
  if (validFiles.length === 0) {
    throw new Error('No ready PDF files available to package into ZIP.');
  }

  const compiled: CompiledSplitFile[] = validFiles.map((fileItem, idx) => {
    const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
    const cleanFileName = `${String(idx + 1).padStart(2, '0')}_${baseName}.pdf`;
    return {
      fileName: cleanFileName,
      title: fileItem.name,
      pageCount: fileItem.pageCount,
      pdfBytes: fileItem.pdfBytes!,
    };
  });

  return createZipFromSplitFiles(compiled, onProgress);
}

/**
 * Trigger browser file download for a Blob or Uint8Array
 */
export function triggerFileDownload(data: Uint8Array | Blob, fileName: string): void {
  const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
