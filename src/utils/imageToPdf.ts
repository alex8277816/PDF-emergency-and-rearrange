import { PDFDocument, PageSizes } from 'pdf-lib';
import { ExportSettings } from '../types/index.ts';

/**
 * Convert an image file (JPG, PNG, WEBP, etc.) to PDF bytes using pdf-lib
 */
export async function convertImageToPdf(
  file: File,
  settings?: Partial<ExportSettings>
): Promise<{ pdfBytes: Uint8Array; pageCount: number; previewUrl: string }> {
  const pdfDoc = await PDFDocument.create();
  const buffer = await file.arrayBuffer();
  const fileType = file.type.toLowerCase();

  let imageEmbed;
  let imageWidth = 0;
  let imageHeight = 0;

  // If PNG
  if (fileType === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    try {
      imageEmbed = await pdfDoc.embedPng(buffer);
      imageWidth = imageEmbed.width;
      imageHeight = imageEmbed.height;
    } catch {
      // Fallback via canvas if PNG has uncommon metadata
      const converted = await imageFileToPngBuffer(file);
      imageEmbed = await pdfDoc.embedPng(converted.buffer);
      imageWidth = converted.width;
      imageHeight = converted.height;
    }
  } else if (fileType === 'image/jpeg' || fileType === 'image/jpg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
    try {
      imageEmbed = await pdfDoc.embedJpg(buffer);
      imageWidth = imageEmbed.width;
      imageHeight = imageEmbed.height;
    } catch {
      // Fallback via canvas
      const converted = await imageFileToPngBuffer(file);
      imageEmbed = await pdfDoc.embedPng(converted.buffer);
      imageWidth = converted.width;
      imageHeight = converted.height;
    }
  } else {
    // For WEBP, BMP, GIF, etc. -> Convert to PNG buffer first
    const converted = await imageFileToPngBuffer(file);
    imageEmbed = await pdfDoc.embedPng(converted.buffer);
    imageWidth = converted.width;
    imageHeight = converted.height;
  }

  // Determine Page Size & Orientation
  const pageSizeOption = settings?.pageSize || 'fit';
  const margin = settings?.margin ?? 20;

  let pageWidth: number;
  let pageHeight: number;

  if (pageSizeOption === 'a4') {
    pageWidth = PageSizes.A4[0]; // 595.28
    pageHeight = PageSizes.A4[1]; // 841.89
  } else if (pageSizeOption === 'letter') {
    pageWidth = PageSizes.Letter[0]; // 612
    pageHeight = PageSizes.Letter[1]; // 792
  } else {
    // 'fit' to original image size
    pageWidth = imageWidth + margin * 2;
    pageHeight = imageHeight + margin * 2;
  }

  // If orientation is landscape, ensure width > height
  if (settings?.orientation === 'landscape' && pageWidth < pageHeight) {
    const tmp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = tmp;
  } else if (settings?.orientation === 'portrait' && pageWidth > pageHeight) {
    const tmp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = tmp;
  }

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Compute drawn image bounds
  const availableWidth = Math.max(10, pageWidth - margin * 2);
  const availableHeight = Math.max(10, pageHeight - margin * 2);

  let drawWidth = imageWidth;
  let drawHeight = imageHeight;

  if (pageSizeOption !== 'fit') {
    const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
    drawWidth = imageWidth * scale;
    drawHeight = imageHeight * scale;
  }

  // Center on page
  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2;

  page.drawImage(imageEmbed, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  });

  const pdfBytes = await pdfDoc.save();
  const previewUrl = URL.createObjectURL(file);

  return {
    pdfBytes,
    pageCount: 1,
    previewUrl,
  };
}

/**
 * Helper to convert any browser-supported image file to a PNG arraybuffer via HTML Canvas
 */
async function imageFileToPngBuffer(file: File): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }
        blob.arrayBuffer().then(buffer => {
          resolve({
            buffer,
            width: canvas.width,
            height: canvas.height,
          });
        });
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}
