import type { Placement, ResumeDocument, Row } from './types';
import { newPage, newPlacement, newRow } from './defaults';

// "Fix overflow": moves or splits whatever runs past the bottom of a page
// onto the next one. Works from measurements of the rendered pages, so it is
// applied repeatedly (measure, fix, re-render) until everything fits.

export interface MeasuredPlacement {
  id: string;
  top: number;
  bottom: number;
  /** Bottom edge of each item (job, skill group, ...) as rendered, in order. */
  items: number[];
}

export interface MeasuredPage {
  id: string;
  /** Bottom edge of the usable page area. */
  limit: number;
  placements: MeasuredPlacement[];
}

const SLACK = 1; // px

/** Applies one round of fixes in place. Returns false when nothing could be changed. */
export function fitPages(doc: ResumeDocument, measured: MeasuredPage[]): boolean {
  let changed = false;
  // Go backwards so content pushed onto a page is handled in a later round.
  for (let pi = doc.pages.length - 1; pi >= 0; pi--) {
    const page = doc.pages[pi];
    const m = measured.find((x) => x.id === page.id);
    if (!m) continue;
    const byId = new Map(m.placements.map((p) => [p.id, p]));
    const carried: { source: Row; columns: Placement[][] }[] = [];

    page.rows.forEach((row, ri) => {
      const columns: Placement[][] = row.columns.map(() => []);
      row.columns.forEach((col, ci) => {
        const keep: Placement[] = [];
        col.forEach((p, idx) => {
          const box = byId.get(p.id);
          if (!box || box.bottom <= m.limit + SLACK) {
            keep.push(p);
            return;
          }
          if (box.top >= m.limit - SLACK) {
            columns[ci].push(p);
            return;
          }
          // Straddles the edge: split after the last item that fits. Short
          // items (skills, list lines) only split when two or more land on each side.
          const fits = box.items.filter((b) => b <= m.limit + SLACK).length;
          const section = doc.sections.find((s) => s.id === p.sectionId);
          const min = section && (section.type === 'experience' || section.type === 'education') ? 1 : 2;
          if (fits >= min && box.items.length - fits >= min) {
            const at = (p.from ?? 0) + fits;
            const rest: Placement = { ...newPlacement(p.sectionId), from: at };
            if (p.to !== undefined) rest.to = p.to;
            keep.push({ ...p, to: at });
            columns[ci].push(rest);
            return;
          }
          // Can't split. Move it, unless it already starts the page (it would never fit).
          if (ri === 0 && idx === 0) keep.push(p);
          else columns[ci].push(p);
        });
        row.columns[ci] = keep;
      });
      if (columns.some((c) => c.length)) carried.push({ source: row, columns });
    });

    if (!carried.length) continue;
    changed = true;
    if (pi + 1 >= doc.pages.length) {
      const fresh = newPage();
      fresh.rows = [];
      fresh.footer = page.footer;
      doc.pages.push(fresh);
    }
    const next = doc.pages[pi + 1];
    const rows: Row[] = carried.map(({ source, columns }, i) => {
      const first = next.rows[0];
      // The first carried row merges into a matching first row of the next page.
      if (i === 0 && first && first.columns.length === columns.length) {
        first.columns = first.columns.map((c, ci) => [...columns[ci], ...c]);
        return first;
      }
      return { ...newRow(columns.length === 2 ? 2 : 1, source.split), shade: source.shade, columns };
    });
    next.rows = [...rows, ...next.rows.filter((r) => !rows.includes(r))];
  }
  return changed;
}

/** Read placement and item positions from a rendered resume (see ResumeView's data attributes). */
export function measurePages(root: HTMLElement): MeasuredPage[] {
  return [...root.querySelectorAll<HTMLElement>('.rg-page')].map((page) => {
    const body = page.querySelector<HTMLElement>('.rg-page-body');
    const limit = body ? body.getBoundingClientRect().bottom : page.getBoundingClientRect().bottom;
    const placements = [...page.querySelectorAll<HTMLElement>('[data-placement-id]')].map((el) => {
      const r = el.getBoundingClientRect();
      const items = [...el.querySelectorAll<HTMLElement>('[data-item]')].map((i) => i.getBoundingClientRect().bottom);
      return { id: el.dataset.placementId ?? '', top: r.top, bottom: r.bottom, items };
    });
    return { id: page.dataset.pageId ?? '', limit, placements };
  });
}
