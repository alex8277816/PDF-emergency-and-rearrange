import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PageSizes } from 'pdf-lib';
import {
  parsePageRanges,
  buildSplitGroups,
  buildPdfFromPages,
  compileSplitGroups,
} from './pdfSplitter.ts';
import { PageItem } from '../types/index.ts';

async function createTestPdfBytes(pageCount: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage(PageSizes.A4);
    page.drawText(`Test Page ${i}`, { x: 50, y: 700, size: 24 });
  }
  return await doc.save();
}

const samplePages: PageItem[] = [
  {
    id: 'p1',
    fileId: 'f1',
    sourceFileName: 'report.pdf',
    sourcePageIndex: 0,
    pageNumber: 1,
    rotation: 0,
    isExcluded: false,
  },
  {
    id: 'p2',
    fileId: 'f1',
    sourceFileName: 'report.pdf',
    sourcePageIndex: 1,
    pageNumber: 2,
    rotation: 90,
    isExcluded: false,
  },
  {
    id: 'p3',
    fileId: 'f1',
    sourceFileName: 'report.pdf',
    sourcePageIndex: 2,
    pageNumber: 3,
    rotation: 0,
    isExcluded: true, // excluded!
  },
  {
    id: 'p4',
    fileId: 'f2',
    sourceFileName: 'appendix.pdf',
    sourcePageIndex: 0,
    pageNumber: 1,
    rotation: 180,
    isExcluded: false,
  },
];

test('parsePageRanges parses single pages, ranges, reverse ranges, and CJK delimiters', () => {
  const res = parsePageRanges('1-2, 3；4–5', 5);
  assert.equal(res.error, undefined);
  assert.deepEqual(res.groups, [[1, 2], [3], [4, 5]]);
  assert.deepEqual(res.labels, ['1-2', '3', '4-5']);

  const rev = parsePageRanges('3-1', 3);
  assert.equal(rev.error, undefined);
  assert.deepEqual(rev.groups, [[3, 2, 1]]);
});

test('parsePageRanges rejects empty, malformed, and out-of-range inputs', () => {
  assert.ok(parsePageRanges('', 5).error);
  assert.ok(parsePageRanges('1-6', 5).error);
  assert.ok(parsePageRanges('0, 2', 5).error);
  assert.ok(parsePageRanges('abc', 5).error);
  assert.ok(parsePageRanges('1-2-3', 5).error);
});

test('buildSplitGroups splits per-page while skipping excluded pages', () => {
  const { groups, error } = buildSplitGroups(samplePages, {
    splitMode: 'per-page',
    pagesPerSplit: 1,
    customRanges: '',
    baseName: 'output',
  });

  assert.equal(error, undefined);
  assert.equal(groups.length, 3); // p3 is excluded
  assert.equal(groups[0].fileName, '01_report_P1.pdf');
  assert.equal(groups[1].fileName, '02_report_P2.pdf');
  assert.equal(groups[2].fileName, '03_appendix_P1.pdf');
  assert.equal(groups[1].pages[0].rotation, 90);
});

test('buildSplitGroups splits fixed-chunk accurately', () => {
  const { groups, error } = buildSplitGroups(samplePages, {
    splitMode: 'fixed-chunk',
    pagesPerSplit: 2,
    customRanges: '',
    baseName: 'batch',
  });

  assert.equal(error, undefined);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].pages.length, 2);
  assert.equal(groups[1].pages.length, 1);
  assert.equal(groups[0].fileName, '01_batch_P1-2.pdf');
  assert.equal(groups[1].fileName, '02_batch_P3.pdf');
});

test('buildSplitGroups splits custom-ranges accurately', () => {
  const { groups, error } = buildSplitGroups(samplePages, {
    splitMode: 'custom-ranges',
    pagesPerSplit: 1,
    customRanges: '1-2, 3',
    baseName: 'split',
  });

  assert.equal(error, undefined);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].pages.map(p => p.id).join(','), 'p1,p2');
  assert.equal(groups[1].pages.map(p => p.id).join(','), 'p4');
});

test('buildSplitGroups groups per-file while preserving active pages and rotations', () => {
  const { groups, error } = buildSplitGroups(samplePages, {
    splitMode: 'per-file',
    pagesPerSplit: 1,
    customRanges: '',
    baseName: 'out',
  });

  assert.equal(error, undefined);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].fileName, '01_report.pdf');
  assert.equal(groups[0].pages.length, 2); // p1 & p2 (p3 excluded)
  assert.equal(groups[1].fileName, '02_appendix.pdf');
  assert.equal(groups[1].pages.length, 1);
});

test('compileSplitGroups produces real split single-page PDFs with rotations applied', async () => {
  const pdf1Bytes = await createTestPdfBytes(3);
  const pdf2Bytes = await createTestPdfBytes(1);

  const fileMap = new Map([
    ['f1', { name: 'report.pdf', pdfBytes: pdf1Bytes }],
    ['f2', { name: 'appendix.pdf', pdfBytes: pdf2Bytes }],
  ]);

  const { groups } = buildSplitGroups(samplePages, {
    splitMode: 'per-page',
    pagesPerSplit: 1,
    customRanges: '',
    baseName: 'split',
  });

  const compiled = await compileSplitGroups(groups, fileMap);
  assert.equal(compiled.length, 3);

  const doc0 = await PDFDocument.load(compiled[0].pdfBytes);
  const doc1 = await PDFDocument.load(compiled[1].pdfBytes);
  const doc2 = await PDFDocument.load(compiled[2].pdfBytes);

  assert.equal(doc0.getPageCount(), 1);
  assert.equal(doc1.getPageCount(), 1);
  assert.equal(doc2.getPageCount(), 1);

  assert.equal(doc0.getPage(0).getRotation().angle, 0);
  assert.equal(doc1.getPage(0).getRotation().angle, 90);
  assert.equal(doc2.getPage(0).getRotation().angle, 180);
});

test('buildPdfFromPages handles A4 target pageSize and landscape orientation', async () => {
  const pdf1Bytes = await createTestPdfBytes(2);
  const fileMap = new Map([['f1', { name: 'report.pdf', pdfBytes: pdf1Bytes }]]);

  const pagesToUse = samplePages.slice(0, 2);
  const outBytes = await buildPdfFromPages(pagesToUse, fileMap, {
    pageSize: 'a4',
    orientation: 'landscape',
  });

  const outDoc = await PDFDocument.load(outBytes);
  assert.equal(outDoc.getPageCount(), 2);
  const { width, height } = outDoc.getPage(0).getSize();
  assert.ok(width > height, 'Expected landscape width > height');
});
