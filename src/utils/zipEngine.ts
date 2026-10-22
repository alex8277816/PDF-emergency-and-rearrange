import JSZip from 'jszip';
import { FileItem } from '../types/index.ts';

/**
 * Package multiple converted PDF files into a single downloadable .zip file
 */
export async function createZipFromPdfFiles(
  files: FileItem[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  const validFiles = files.filter(f => f.status === 'ready' && f.pdfBytes);
  if (validFiles.length === 0) {
    throw new Error('No ready PDF files available to package into ZIP.');
  }

  validFiles.forEach((fileItem, idx) => {
    // Generate clean .pdf file name
    const baseName = fileItem.name.replace(/\.[^/.]+$/, '');
    const cleanFileName = `${String(idx + 1).padStart(2, '0')}_${baseName}.pdf`;
    zip.file(cleanFileName, fileItem.pdfBytes!);
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
