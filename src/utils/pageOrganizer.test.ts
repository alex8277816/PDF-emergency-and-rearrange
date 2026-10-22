import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reorderPages,
  rotatePage,
  togglePageExclude,
  deletePage,
  duplicatePage,
  reversePages,
  rotateAllPages,
  getPageStats,
} from './pageOrganizer.ts';
import { detectFileType, formatBytes, sanitizeFileName } from './fileTypes.ts';
import { PageItem } from '../types/index.ts';

const mockPages: PageItem[] = [
  {
    id: 'p1',
    fileId: 'f1',
    sourceFileName: 'report.docx',
    sourcePageIndex: 0,
    pageNumber: 1,
    rotation: 0,
    isExcluded: false,
  },
  {
    id: 'p2',
    fileId: 'f1',
    sourceFileName: 'report.docx',
    sourcePageIndex: 1,
    pageNumber: 2,
    rotation: 0,
    isExcluded: false,
  },
  {
    id: 'p3',
    fileId: 'f2',
    sourceFileName: 'chart.png',
    sourcePageIndex: 0,
    pageNumber: 1,
    rotation: 0,
    isExcluded: false,
  },
];

test('reorderPages moves page from sourceIndex to targetIndex correctly', () => {
  // Move p3 to the very front
  const reordered = reorderPages(mockPages, 2, 0);
  assert.equal(reordered.length, 3);
  assert.equal(reordered[0].id, 'p3');
  assert.equal(reordered[1].id, 'p1');
  assert.equal(reordered[2].id, 'p2');
});

test('reorderPages handles invalid indices gracefully without mutation', () => {
  const result = reorderPages(mockPages, -1, 5);
  assert.deepEqual(result, mockPages);
});

test('rotatePage cycles through 90, 180, 270, and back to 0', () => {
  let p = mockPages[0];
  p = rotatePage(p, 90);
  assert.equal(p.rotation, 90);
  p = rotatePage(p, 90);
  assert.equal(p.rotation, 180);
  p = rotatePage(p, 90);
  assert.equal(p.rotation, 270);
  p = rotatePage(p, 90);
  assert.equal(p.rotation, 0);
});

test('togglePageExclude switches isExcluded state', () => {
  const toggled = togglePageExclude(mockPages, 'p2');
  assert.equal(toggled.find(p => p.id === 'p2')?.isExcluded, true);
  const reverted = togglePageExclude(toggled, 'p2');
  assert.equal(reverted.find(p => p.id === 'p2')?.isExcluded, false);
});

test('deletePage removes specified page', () => {
  const remaining = deletePage(mockPages, 'p1');
  assert.equal(remaining.length, 2);
  assert.equal(remaining.some(p => p.id === 'p1'), false);
});

test('duplicatePage clones target page and inserts immediately after it', () => {
  const duplicated = duplicatePage(mockPages, 'p1');
  assert.equal(duplicated.length, 4);
  assert.equal(duplicated[0].id, 'p1');
  assert.match(duplicated[1].id, /^p1-copy-/);
  assert.equal(duplicated[1].sourcePageIndex, 0);
});

test('reversePages flips order correctly', () => {
  const reversed = reversePages(mockPages);
  assert.equal(reversed[0].id, 'p3');
  assert.equal(reversed[2].id, 'p1');
});

test('getPageStats calculates counts correctly', () => {
  const toggled = togglePageExclude(mockPages, 'p1');
  const stats = getPageStats(toggled);
  assert.equal(stats.total, 3);
  assert.equal(stats.included, 2);
  assert.equal(stats.excluded, 1);
});

test('detectFileType correctly detects word, image, pdf and unsupported', () => {
  assert.equal(detectFileType({ name: 'contract.docx' }), 'word');
  assert.equal(detectFileType({ name: 'PHOTO.JPG' }), 'image');
  assert.equal(detectFileType({ name: 'scan.png' }), 'image');
  assert.equal(detectFileType({ name: 'whitepaper.pdf' }), 'pdf');
  assert.equal(detectFileType({ name: 'archive.zip' }), 'unsupported');
});

test('formatBytes formats file sizes readably', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576 * 2.5), '2.5 MB');
});

test('sanitizeFileName removes invalid characters', () => {
  assert.equal(sanitizeFileName('my/report:test?.pdf'), 'my_report_test_.pdf');
});
