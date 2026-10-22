import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

/**
 * Generate a high quality sample PNG image File
 */
export async function createSampleImageFile(
  name: string = '2026年度銷售績效圖表.png',
  theme: 'blue' | 'purple' = 'blue'
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  if (theme === 'blue') {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
  } else {
    grad.addColorStop(0, '#311042');
    grad.addColorStop(1, '#1a102f');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  // Card background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.roundRect(60, 60, 1080, 680, 24);
  ctx.fill();
  ctx.stroke();

  // Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('財務與營運分析報告 (Financial & Operations)', 100, 130);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px sans-serif';
  ctx.fillText('第 1 季至第 4 季各業務線增長曲線與關鍵績效指標', 100, 170);

  // Mock Bar Chart
  const months = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5預估'];
  const values = [420, 580, 790, 920, 1080];
  const barWidth = 100;
  const startX = 140;
  const baseY = 620;

  months.forEach((m, i) => {
    const x = startX + i * 180;
    const height = (values[i] / 1200) * 360;
    const y = baseY - height;

    // Bar gradient
    const barGrad = ctx.createLinearGradient(x, y, x, baseY);
    if (theme === 'blue') {
      barGrad.addColorStop(0, '#38bdf8');
      barGrad.addColorStop(1, '#0284c7');
    } else {
      barGrad.addColorStop(0, '#c084fc');
      barGrad.addColorStop(1, '#7e22ce');
    }

    ctx.fillStyle = barGrad;
    ctx.roundRect(x, y, barWidth, height, 12);
    ctx.fill();

    // Value label
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${values[i]}K`, x + barWidth / 2, y - 12);

    // X-axis label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText(m, x + barWidth / 2, baseY + 30);
  });

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      const file = new File([blob!], name, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

/**
 * Generate a multi-page sample PDF File
 */
export async function createSamplePdfFile(
  name: string = '專案結案綜合說明書.pdf',
  pageCount: number = 2
): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const [pageW, pageH] = PageSizes.A4;

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([pageW, pageH]);

    // Top banner
    page.drawRectangle({
      x: 0,
      y: pageH - 90,
      width: pageW,
      height: 90,
      color: rgb(0.08, 0.16, 0.28),
    });

    page.drawText('PROJECT FINAL REPORT - OFFICIAL DOCUMENT', {
      x: 40,
      y: pageH - 50,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`SECTION ${i}: SYSTEM ARCHITECTURE & INTEGRATION`, {
      x: 40,
      y: pageH - 72,
      size: 10,
      font: fontRegular,
      color: rgb(0.6, 0.75, 0.95),
    });

    // Content
    page.drawText(`Page ${i} - High-Performance Client & Edge Workflows`, {
      x: 40,
      y: pageH - 140,
      size: 14,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.3),
    });

    const lines = [
      'This document outlines the multi-tier PDF conversion and page arrangement specifications.',
      '1. Client-Side Decoupling: Zero backend storage latency and zero data leaks.',
      '2. In-Memory Manipulation: Page reordering, arbitrary angle rotations, and seamless merging.',
      '3. High Concurrency: Scales linearly with user browser resources without server throttling.',
      '4. Unified Layout Engine: Perfectly synchronizes page dimensions, margins, and DPI.',
    ];

    lines.forEach((line, lineIdx) => {
      page.drawText(line, {
        x: 40,
        y: pageH - 180 - lineIdx * 25,
        size: 11,
        font: fontRegular,
        color: rgb(0.25, 0.3, 0.35),
      });
    });

    // Footer
    page.drawText(`Document Page ${i} of ${pageCount}`, {
      x: pageW / 2 - 40,
      y: 35,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const file = new File([pdfBytes as unknown as BlobPart], name, { type: 'application/pdf' });
  return file;
}

/**
 * Generate a simulated DOCX file (or text document) for testing
 */
export async function createSampleDocxFile(
  name: string = '合約條款初稿草案.docx'
): Promise<File> {
  // Create a minimal valid zip structure for DOCX or standard text-based docx container
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>PROJECT SERVICES AGREEMENT</w:t></w:r></w:p>
    <w:p><w:r><w:t>Clause 1: Scope of Work and Deliverables</w:t></w:r></w:p>
    <w:p><w:r><w:t>The vendor agrees to deliver modular conversion engines supporting Word, JPEG, PNG, and PDF files with real-time progress and drag-and-drop page sequencing.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Clause 2: Confidentiality and Local Edge Processing</w:t></w:r></w:p>
    <w:p><w:r><w:t>All files are strictly processed on the client environment ensuring zero server leaks and maximal speed.</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.folder('word')?.file('document.xml', docXml);

  const blob = await zip.generateAsync({ type: 'blob' });
  return new File([blob], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
