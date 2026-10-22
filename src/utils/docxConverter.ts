import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';
import mammoth from 'mammoth';

export interface DocxSection {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li';
  text: string;
}

/**
 * Parse DOCX raw text and headings into structured sections
 */
export async function parseDocxContent(arrayBuffer: ArrayBuffer): Promise<DocxSection[]> {
  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const html = htmlResult.value;

    if (!html || html.trim().length === 0) {
      // Fallback to raw text extraction
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const rawLines = textResult.value.split('\n').filter(l => l.trim().length > 0);
      return rawLines.map(line => ({ type: 'p', text: line.trim() }));
    }

    // Parse simple HTML tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sections: DocxSection[] = [];

    const nodes = doc.body.childNodes;
    nodes.forEach(node => {
      const tag = node.nodeName.toLowerCase();
      const text = node.textContent?.trim() || '';
      if (!text) return;

      if (tag === 'h1') {
        sections.push({ type: 'h1', text });
      } else if (tag === 'h2') {
        sections.push({ type: 'h2', text });
      } else if (tag === 'h3') {
        sections.push({ type: 'h3', text });
      } else if (tag === 'ul' || tag === 'ol') {
        node.childNodes.forEach(liNode => {
          const liText = liNode.textContent?.trim();
          if (liText) sections.push({ type: 'li', text: liText });
        });
      } else {
        sections.push({ type: 'p', text });
      }
    });

    if (sections.length === 0) {
      sections.push({ type: 'p', text: 'Document content is empty or unreadable.' });
    }

    return sections;
  } catch (err) {
    console.warn('DOCX parsing warning, falling back to text extractor:', err);
    try {
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const lines = textResult.value.split('\n').filter(l => l.trim().length > 0);
      return lines.map(line => ({ type: 'p', text: line.trim() }));
    } catch {
      return [{ type: 'p', text: 'Unable to extract text from DOCX file.' }];
    }
  }
}

/**
 * Render structured docx sections into a multi-page PDF document using HTML Canvas
 * This provides 100% support for Traditional/Simplified Chinese, English, and all Unicode characters
 */
export async function convertDocxToPdf(file: File): Promise<{ pdfBytes: Uint8Array; pageCount: number; previewUrl: string }> {
  const buffer = await file.arrayBuffer();
  const sections = await parseDocxContent(buffer);

  const pdfDoc = await PDFDocument.create();

  // High resolution page dimensions for crisp print quality (A4 aspect ratio ~ 1.414)
  const canvasWidth = 1240;
  const canvasHeight = 1754;
  const margin = 100;
  const contentWidth = canvasWidth - margin * 2;

  const pageCanvases: HTMLCanvasElement[] = [];

  const createNewPageCanvas = (pageNum: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;

    // White page background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Decorative top header bar
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(margin, margin - 30, contentWidth, 4);

    return { canvas, ctx };
  };

  let pageIndex = 1;
  let { canvas: currentCanvas, ctx } = createNewPageCanvas(pageIndex);
  pageCanvases.push(currentCanvas);
  let currentY = margin + 40;

  // Header title on page 1
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Noto Sans TC", system-ui, sans-serif';
  ctx.fillText(cleanTitle, margin, currentY);
  currentY += 45;

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, currentY);
  ctx.lineTo(canvasWidth - margin, currentY);
  ctx.stroke();
  currentY += 45;

  for (const section of sections) {
    let fontStyle = 'normal 24px "Noto Sans TC", system-ui, sans-serif';
    let textColor = '#334155';
    let lineHeight = 38;
    let prefix = '';

    if (section.type === 'h1') {
      fontStyle = 'bold 34px "Noto Sans TC", system-ui, sans-serif';
      textColor = '#1e3a8a';
      lineHeight = 50;
      currentY += 20;
    } else if (section.type === 'h2') {
      fontStyle = 'bold 28px "Noto Sans TC", system-ui, sans-serif';
      textColor = '#1d4ed8';
      lineHeight = 42;
      currentY += 15;
    } else if (section.type === 'h3') {
      fontStyle = 'bold 24px "Noto Sans TC", system-ui, sans-serif';
      textColor = '#2563eb';
      lineHeight = 36;
      currentY += 10;
    } else if (section.type === 'li') {
      prefix = '• ';
      fontStyle = 'normal 22px "Noto Sans TC", system-ui, sans-serif';
      textColor = '#334155';
      lineHeight = 34;
    }

    ctx.font = fontStyle;
    ctx.fillStyle = textColor;

    const fullText = prefix + section.text;
    
    // Line wrapping algorithm supporting both CJK characters and space-separated languages
    let line = '';
    const chars = Array.from(fullText);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > contentWidth && line.length > 0) {
        // Check if page overflows
        if (currentY + lineHeight > canvasHeight - margin - 50) {
          pageIndex++;
          const next = createNewPageCanvas(pageIndex);
          currentCanvas = next.canvas;
          ctx = next.ctx;
          pageCanvases.push(currentCanvas);
          ctx.font = fontStyle;
          ctx.fillStyle = textColor;
          currentY = margin + 30;
        }

        ctx.fillText(line, margin, currentY);
        currentY += lineHeight;
        line = char;
      } else {
        line = testLine;
      }
    }

    if (line.length > 0) {
      if (currentY + lineHeight > canvasHeight - margin - 50) {
        pageIndex++;
        const next = createNewPageCanvas(pageIndex);
        currentCanvas = next.canvas;
        ctx = next.ctx;
        pageCanvases.push(currentCanvas);
        ctx.font = fontStyle;
        ctx.fillStyle = textColor;
        currentY = margin + 30;
      }
      ctx.fillText(line, margin, currentY);
      currentY += lineHeight + 8;
    }
  }

  // Draw footer page number on all page canvases
  const totalPages = pageCanvases.length;
  pageCanvases.forEach((pgCanvas, idx) => {
    const pgCtx = pgCanvas.getContext('2d')!;
    pgCtx.fillStyle = '#94a3b8';
    pgCtx.font = 'normal 18px "Noto Sans TC", system-ui, sans-serif';
    pgCtx.textAlign = 'center';
    pgCtx.fillText(`第 ${idx + 1} 頁 / 共 ${totalPages} 頁`, canvasWidth / 2, canvasHeight - margin + 30);
  });

  // Convert each canvas into a PDF page
  for (const pgCanvas of pageCanvases) {
    const dataUrl = pgCanvas.toDataURL('image/jpeg', 0.92);
    const imageEmbed = await pdfDoc.embedJpg(dataUrl);
    const pdfPage = pdfDoc.addPage([PageSizes.A4[0], PageSizes.A4[1]]);
    pdfPage.drawImage(imageEmbed, {
      x: 0,
      y: 0,
      width: PageSizes.A4[0],
      height: PageSizes.A4[1],
    });
  }

  const pdfBytes = await pdfDoc.save();
  const previewUrl = pageCanvases[0].toDataURL('image/jpeg', 0.85);

  return {
    pdfBytes,
    pageCount: totalPages,
    previewUrl,
  };
}
