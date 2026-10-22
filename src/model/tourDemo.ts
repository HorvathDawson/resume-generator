import type { EntriesSection, ResumeDocument } from './types';
import { newEntry, sectionBase, uid } from './defaults';
import { addToLayout, locatePlacement, splitPlacement, takePlacement } from './edit';

/**
 * The edits the guided tour makes, one per step, on a practice copy of the
 * sample resume. Each mutates a draft (like a useHistory updater), and each
 * step's resume is the practice resume with every edit up to it applied, so
 * going back and forth in the tour always shows the same result.
 */

/** Id of the section the tour adds, so later steps can find it. */
export const TOUR_PROJECTS_ID = 'tour-projects';

/** The sample resume cut down to its first page, as a practice copy for the tour. */
export function practiceResume(sample: ResumeDocument): ResumeDocument {
  const d = structuredClone(sample);
  d.id = uid('resume');
  d.title = 'Practice resume (tour)';
  const firstPage = d.pages[0];
  const onFirstPage = new Set(firstPage.rows.flatMap((r) => r.columns.flat().map((p) => p.sectionId)));
  d.sections = d.sections.filter((s) => onFirstPage.has(s.id));
  d.pages = [firstPage];
  return d;
}

function experience(d: ResumeDocument): EntriesSection | undefined {
  return d.sections.find((s): s is EntriesSection => s.type === 'experience' && s.id !== TOUR_PROJECTS_ID);
}

/** The job the tour adds. */
export const TOUR_JOB = {
  title: 'Senior Controls Engineer',
  subtitle: 'Northwind Robotics',
  location: 'Vancouver, BC',
  dates: '2025 – Present',
  bullets: ['Lead the motion-control team for a fleet of warehouse robots.', 'Cut commissioning time per robot from two days to four hours.'],
};

/** Content: a new job at the top of Experience. */
export function addJob(d: ResumeDocument): void {
  experience(d)?.items.unshift(newEntry({ ...TOUR_JOB, bullets: [...TOUR_JOB.bullets] }));
}

/** Content: a whole new section, placed at the end of the last page. */
export function addProjects(d: ResumeDocument): void {
  d.sections.push({
    ...sectionBase('experience', 'Projects'),
    id: TOUR_PROJECTS_ID,
    type: 'experience',
    items: [
      newEntry({ title: 'Trail-camera classifier', dates: '2024', description: 'Sorts wildlife photos on a Raspberry Pi.' }),
      newEntry({ title: 'Home weather station', dates: '2023', description: 'Logs to a web dashboard.' }),
    ],
  });
  addToLayout(d, TOUR_PROJECTS_ID);
}

/** The section the tour moves to the other column. */
export const TOUR_MOVED_ID = 'languages';

/** Layout: move a section from the sidebar to the main column. */
export function moveToOtherColumn(d: ResumeDocument): void {
  const placement = d.pages.flatMap((p) => p.rows.flatMap((r) => r.columns.flat())).find((p) => p.sectionId === TOUR_MOVED_ID);
  if (!placement) return;
  const loc = locatePlacement(d, placement.id);
  if (!loc || d.pages[loc.page].rows[loc.row].columns.length < 2) return;
  const taken = takePlacement(d, placement.id);
  if (taken) d.pages[loc.page].rows[loc.row].columns[1 - loc.col].push(taken);
}

/** Layout: make the left column of every two-column row wider. */
export function widenLeftColumn(d: ResumeDocument): void {
  for (const page of d.pages) for (const row of page.rows) if (row.columns.length === 2) row.split = 38;
}

/** Design: a footer on every page. */
export function addFooter(d: ResumeDocument): void {
  for (const page of d.pages) page.footer = 'mountains';
}

/** Pages: Experience keeps its first two jobs here, the rest continue at the top of the next page. */
export function splitExperience(d: ResumeDocument): void {
  const section = experience(d);
  if (!section || section.items.length < 3) return;
  const placement = d.pages[0]?.rows.flatMap((r) => r.columns.flat()).find((p) => p.sectionId === section.id && p.to === undefined);
  if (placement) splitPlacement(d, placement.id, 2);
}

/** What the copy made for one job changes: a sharper headline and summary. */
export const TOUR_HEADLINE = 'Controls Engineer, warehouse robotics';
export const TOUR_SUMMARY =
  'Controls engineer who gets robot fleets running fast: motion control, commissioning and the tools that make both repeatable. Looking to do the same for Acme’s new sorting line.';

export function tailorForJob(d: ResumeDocument): void {
  d.profile.headline = TOUR_HEADLINE;
  const summary = d.sections.find((s) => s.type === 'text');
  if (summary && summary.type === 'text') summary.body = TOUR_SUMMARY;
}
