import { describe, expect, it } from 'vitest';
import sample from '../../data/sample.json';
import { normalizeDocument } from '../normalize';
import { serializeDocument } from '../io';
import type { EntriesSection, ResumeDocument } from '../types';
import {
  TOUR_PROJECTS_ID,
  addFooter,
  addJob,
  addProjects,
  practiceResume,
  TOUR_MOVED_ID,
  moveToOtherColumn,
  splitExperience,
  tailorForJob,
  widenLeftColumn,
} from '../tourDemo';

const STEPS = [addJob, addProjects, moveToOtherColumn, widenLeftColumn, addFooter, splitExperience];

function placements(d: ResumeDocument) {
  return d.pages.flatMap((page, pi) => page.rows.flatMap((row) => row.columns.flatMap((col, ci) => col.map((p) => ({ ...p, page: pi, col: ci, row })))));
}

describe('tour demo edits', () => {
  const start = practiceResume(normalizeDocument(sample));

  it('starts from the sample cut down to one page, with only that page’s sections', () => {
    expect(start.pages).toHaveLength(1);
    const placed = new Set(placements(start).map((p) => p.sectionId));
    expect(new Set(start.sections.map((s) => s.id))).toEqual(placed);
    expect(start.id).not.toBe(normalizeDocument(sample).id);
  });

  it('builds up the resume step by step', () => {
    const d = structuredClone(start);
    const jobs = (d.sections.find((s) => s.id === 'experience') as EntriesSection).items.length;

    addJob(d);
    expect((d.sections.find((s) => s.id === 'experience') as EntriesSection).items).toHaveLength(jobs + 1);

    addProjects(d);
    expect(placements(d).filter((p) => p.sectionId === TOUR_PROJECTS_ID)).toHaveLength(1);
    const before = placements(d).find((p) => p.sectionId === TOUR_MOVED_ID)!;

    moveToOtherColumn(d);
    const after = placements(d).find((p) => p.sectionId === TOUR_MOVED_ID)!;
    expect(after.col).toBe(1 - before.col);

    widenLeftColumn(d);
    expect(d.pages[0].rows.filter((r) => r.columns.length === 2).every((r) => r.split === 38)).toBe(true);

    addFooter(d);
    expect(d.pages.every((p) => p.footer === 'mountains')).toBe(true);

    splitExperience(d);
    expect(d.pages).toHaveLength(2);
    const parts = placements(d).filter((p) => p.sectionId === 'experience');
    expect(parts.map((p) => [p.page, p.from ?? 0, p.to])).toEqual([
      [0, 0, 2],
      [1, 2, undefined],
    ]);
    // The new page continues the first page's look.
    expect(d.pages[1].footer).toBe('mountains');
  });

  it('gives the same resume however many times the steps are replayed', () => {
    const run = () => {
      const d = structuredClone(start);
      STEPS.forEach((step) => step(d));
      return d;
    };
    // New entries, rows and placements get fresh ids each time; everything else matches.
    const strip = (d: ResumeDocument) => JSON.stringify(d, (k, v) => (k === 'id' ? '' : v));
    expect(strip(run())).toEqual(strip(run()));
  });

  it('leaves a valid resume after every step, and after tailoring a copy', () => {
    const d = structuredClone(start);
    for (const step of [...STEPS, tailorForJob]) {
      step(d);
      expect(normalizeDocument(JSON.parse(serializeDocument(d)))).toEqual(d);
    }
    expect(d.profile.headline).toMatch(/robotics/i);
  });
});
