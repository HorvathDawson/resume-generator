import type { Placement, ResumeDocument, Section } from './types';
import { newPage, newPlacement, newRow } from './defaults';

// Mutating helpers for use inside useHistory updaters (which get a draft copy).

export function move<T>(list: T[], index: number, delta: number): void {
  const to = index + delta;
  if (index < 0 || to < 0 || to >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(to, 0, item);
}

export function findSection(doc: ResumeDocument, id: string): Section | undefined {
  return doc.sections.find((s) => s.id === id);
}

/** Page numbers (1-based) on which a section appears. */
export function pagesShowing(doc: ResumeDocument, sectionId: string): number[] {
  const pages: number[] = [];
  doc.pages.forEach((page, i) => {
    if (page.rows.some((r) => r.columns.some((c) => c.some((p) => p.sectionId === sectionId)))) pages.push(i + 1);
  });
  return pages;
}

export function removeSection(doc: ResumeDocument, id: string): void {
  doc.sections = doc.sections.filter((s) => s.id !== id);
  for (const page of doc.pages) {
    for (const row of page.rows) row.columns = row.columns.map((c) => c.filter((p) => p.sectionId !== id));
  }
}

/** Place a section at the end of the last page, in the widest column. */
export function addToLayout(doc: ResumeDocument, sectionId: string): void {
  if (!doc.pages.length) doc.pages.push(newPage());
  const page = doc.pages[doc.pages.length - 1];
  if (!page.rows.length) page.rows.push(newRow(1));
  const row = page.rows[page.rows.length - 1];
  const col = row.columns.length === 2 && row.split <= 50 ? 1 : 0;
  row.columns[col].push(newPlacement(sectionId));
}

export interface PlacementLocation {
  page: number;
  row: number;
  col: number;
  index: number;
}

export function locatePlacement(doc: ResumeDocument, placementId: string): PlacementLocation | null {
  for (let page = 0; page < doc.pages.length; page++) {
    const rows = doc.pages[page].rows;
    for (let row = 0; row < rows.length; row++) {
      for (let col = 0; col < rows[row].columns.length; col++) {
        const index = rows[row].columns[col].findIndex((p) => p.id === placementId);
        if (index >= 0) return { page, row, col, index };
      }
    }
  }
  return null;
}

export function takePlacement(doc: ResumeDocument, placementId: string): Placement | null {
  const loc = locatePlacement(doc, placementId);
  if (!loc) return null;
  return doc.pages[loc.page].rows[loc.row].columns[loc.col].splice(loc.index, 1)[0];
}

/** Move a placement to the top of the same column position on another page. */
export function movePlacementToPage(doc: ResumeDocument, placementId: string, pageIndex: number): void {
  const loc = locatePlacement(doc, placementId);
  if (!loc) return;
  const p = takePlacement(doc, placementId);
  if (!p) return;
  while (doc.pages.length <= pageIndex) doc.pages.push(newPage());
  const target = doc.pages[pageIndex];
  if (!target.rows.length) target.rows.push(newRow(1));
  // Moving forward: start of the page. Moving back: end of the page.
  const forward = pageIndex > loc.page;
  const row = forward ? target.rows[0] : target.rows[target.rows.length - 1];
  const col = Math.min(loc.col, row.columns.length - 1);
  if (forward) row.columns[col].unshift(p);
  else row.columns[col].push(p);
}

/**
 * Split a section across pages: this placement keeps items before `at`, and a
 * new placement with the rest goes to the top of the next page.
 */
export function splitPlacement(doc: ResumeDocument, placementId: string, at: number): void {
  const loc = locatePlacement(doc, placementId);
  if (!loc) return;
  const p = doc.pages[loc.page].rows[loc.row].columns[loc.col][loc.index];
  const rest: Placement = { ...newPlacement(p.sectionId), from: at };
  if (p.to !== undefined) rest.to = p.to;
  p.to = at;
  if (doc.pages.length <= loc.page + 1) {
    const page = newPage();
    const source = doc.pages[loc.page];
    page.footer = source.footer;
    // Mirror the column structure so the continuation lands in the same column.
    const sourceRow = source.rows[loc.row];
    page.rows = [{ ...newRow(sourceRow.columns.length === 2 ? 2 : 1, sourceRow.split), shade: sourceRow.shade }];
    doc.pages.splice(loc.page + 1, 0, page);
  }
  const next = doc.pages[loc.page + 1];
  if (!next.rows.length) next.rows.push(newRow(1));
  const row = next.rows[0];
  row.columns[Math.min(loc.col, row.columns.length - 1)].unshift(rest);
}

/** What is being dragged in the Layout tab: a placement already on a page, or a section not on any page. */
export type DragItem = { placementId: string } | { sectionId: string };

/**
 * Put a dragged item into a column at `index`. With `rowId` null a new
 * one-column row is added to the end of the page to receive it.
 */
export function dropInto(doc: ResumeDocument, item: DragItem, pageId: string, rowId: string | null, col: number, index: number): void {
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) return;
  let row = rowId ? page.rows.find((r) => r.id === rowId) : undefined;
  if (rowId && !row) return;
  let p: Placement | null;
  if ('placementId' in item) {
    const loc = locatePlacement(doc, item.placementId);
    if (!loc) return;
    // Removing it first shifts later items in the same column up by one.
    if (row && doc.pages[loc.page].rows[loc.row] === row && loc.col === col && loc.index < index) index--;
    p = takePlacement(doc, item.placementId);
  } else {
    p = newPlacement(item.sectionId);
  }
  if (!p) return;
  if (!row) {
    row = newRow(1);
    page.rows.push(row);
  }
  const column = row.columns[Math.min(col, row.columns.length - 1)];
  column.splice(Math.max(0, Math.min(index, column.length)), 0, p);
}
