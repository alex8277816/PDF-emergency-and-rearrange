import { PageItem } from '../types/index.ts';

/**
 * Reorder pages array by moving an item from sourceIndex to targetIndex
 */
export function reorderPages(pages: PageItem[], sourceIndex: number, targetIndex: number): PageItem[] {
  if (
    sourceIndex < 0 ||
    sourceIndex >= pages.length ||
    targetIndex < 0 ||
    targetIndex >= pages.length ||
    sourceIndex === targetIndex
  ) {
    return [...pages];
  }

  const result = [...pages];
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(targetIndex, 0, removed);
  return result;
}

/**
 * Rotate a page clockwise by 90 degrees (0 -> 90 -> 180 -> 270 -> 0)
 */
export function rotatePage(page: PageItem, clockwiseDegrees: number = 90): PageItem {
  const current = page.rotation || 0;
  const newRotation = (((current + clockwiseDegrees) % 360 + 360) % 360) as 0 | 90 | 180 | 270;
  return {
    ...page,
    rotation: newRotation,
  };
}

/**
 * Toggle exclusion status for a page (excluded pages are not exported)
 */
export function togglePageExclude(pages: PageItem[], pageId: string): PageItem[] {
  return pages.map(p => (p.id === pageId ? { ...p, isExcluded: !p.isExcluded } : p));
}

/**
 * Delete a page entirely from the working list
 */
export function deletePage(pages: PageItem[], pageId: string): PageItem[] {
  return pages.filter(p => p.id !== pageId);
}

/**
 * Duplicate a page directly after itself
 */
export function duplicatePage(pages: PageItem[], pageId: string): PageItem[] {
  const index = pages.findIndex(p => p.id === pageId);
  if (index === -1) return pages;

  const target = pages[index];
  const newPage: PageItem = {
    ...target,
    id: `${target.id}-copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };

  const result = [...pages];
  result.splice(index + 1, 0, newPage);
  return result;
}

/**
 * Reverse the sequence of pages
 */
export function reversePages(pages: PageItem[]): PageItem[] {
  return [...pages].reverse();
}

/**
 * Rotate all active pages by given degrees
 */
export function rotateAllPages(pages: PageItem[], degrees: number = 90): PageItem[] {
  return pages.map(p => rotatePage(p, degrees));
}

/**
 * Filter pages to only included ones
 */
export function getIncludedPages(pages: PageItem[]): PageItem[] {
  return pages.filter(p => !p.isExcluded);
}

/**
 * Calculate count of active vs excluded pages
 */
export function getPageStats(pages: PageItem[]): { total: number; included: number; excluded: number } {
  const total = pages.length;
  const included = pages.filter(p => !p.isExcluded).length;
  return {
    total,
    included,
    excluded: total - included,
  };
}
