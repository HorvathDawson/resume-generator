import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CircleHelp, Download, FileDown, FileCode, FileJson, FilePlus, FileText, FolderInput, FolderOpen, FolderPlus, FolderX, Library as LibraryIcon, Pencil, Printer, Redo2, Undo2 } from 'lucide-react';
import type { ResumeDocument } from './model/types';
import { blankDocument, itemCount } from './model/defaults';
import { findSection, joinParts, locatePlacement, sectionParts, splitPlacement } from './model/edit';
import { ImportError, clearSharedLink, downloadFile, fetchResume, fileStem, sharedLinkFromUrl } from './model/io';
import type { Library } from './library/library';
import { findById, parseAnyFile, serializeResumeFile, sortedPaths, fileNameOf } from './library/library';
import { bootLibrary, useLibrary } from './library/useLibrary';
import { canUseFolders, pickFolder } from './library/storage';
import { LibraryPanel } from './editor/LibraryPanel';
import { normalizeDocument } from './model/normalize';
import { TEMPLATES, applyTemplate, arrangeLayout } from './model/templates';
import { fitPages, measurePages } from './model/autofit';
import { TOUR_HEADLINE, TOUR_JOB, TOUR_MOVED_ID, TOUR_PROJECTS_ID, TOUR_SUMMARY, addFooter, addJob, addProjects, moveToOtherColumn, practiceResume, splitExperience, widenLeftColumn } from './model/tourDemo';
import { googleFontsUrl } from './model/variants';
import sample from './data/sample.json';
import { useHistory } from './hooks/useHistory';
import { usePageOverflow } from './hooks/usePageOverflow';
import { ResumeView } from './resume/ResumeView';
import { ContentPanel } from './editor/ContentPanel';
import { LayoutPanel } from './editor/LayoutPanel';
import { DesignPanel } from './editor/DesignPanel';
import { TemplatesPanel } from './editor/TemplatesPanel';
import { Preview } from './editor/Preview';
import { Menu, MenuItem, MenuSeparator } from './editor/Menu';
import { Dialog } from './editor/Dialog';
import { Tour } from './editor/Tour';
import type { TourStep } from './editor/Tour';
import './App.css';

type Tab = 'resumes' | 'content' | 'templates' | 'layout' | 'design';

const TAB_LABELS: Record<Tab, string> = { resumes: 'Resumes', content: 'Content', templates: 'Templates', layout: 'Layout', design: 'Design' };

const sampleDocument = () => normalizeDocument(sample);
const HOME_LABEL = __HOME_URL__.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** The tour's edits to its practice resume, in order (see model/tourDemo.ts). */
const TOUR_EDITS = [addJob, addProjects, moveToOtherColumn, widenLeftColumn, addFooter, splitExperience];

/** The resumes a tour run made, so it can switch between them and remove them at the end. */
interface TourRun {
  /** The resume open before the tour started. */
  original: string;
  practice: string | null;
  start: ResumeDocument | null;
  copy: string | null;
  tailored: boolean;
}

/** Finds the first element matching `selector` whose text includes `text`. */
const byText = (selector: string, text: string) => () => [...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.textContent?.includes(text));

const PRINT_TIP_KEY = 'resume-generator:hide-print-tip';
const TOUR_KEY = 'resume-generator:tour-seen';

function tourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === '1';
  } catch {
    // Storage blocked: don't show the tour on every visit.
    return true;
  }
}

type PendingOpen =
  | { kind: 'resume'; doc: ResumeDocument; migrated: boolean; fileName: string }
  | { kind: 'library'; lib: Library; skipped: string[]; fileName: string };

export interface ToastAction {
  label: string;
  run: () => void;
}

interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error';
  undoable: boolean;
  action?: ToastAction;
}

export default function App() {
  const [boot] = useState(() => bootLibrary(sampleDocument));
  const { doc, update, replace, reset, undo, redo, canUndo, canRedo } = useHistory(() => boot.lib.files[boot.active]);
  const [tab, setTabState] = useState<Tab>('content');
  /** A template being tried out: shown in the preview only, until applied. */
  const [trialState, setTrial] = useState<{ templateId: string; base: ResumeDocument; doc: ResumeDocument } | null>(null);
  const setTab = useCallback((next: Tab) => {
    if (next !== 'templates') setTrial(null);
    setTabState(next);
  }, []);
  // A trial only applies to the exact resume it was made from: opening another
  // resume, or a reload from the folder, quietly drops it.
  const trial = trialState && trialState.base === doc ? trialState : null;
  /** What the preview and print copy show: the trial if there is one, else the resume. */
  const shown = trial?.doc ?? doc;
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingOpen | null>(null);
  const [printTip, setPrintTip] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const printRoot = useRef<HTMLDivElement>(null);
  const overflow = usePageOverflow(printRoot, shown);
  // Rounds of "fix overflow" left to run; each round re-measures the result of the last.
  const [fitRounds, setFitRounds] = useState(0);
  // A resume opened from a link (?resume=...), and whether it is shown without the editor.
  const [shared] = useState(() => sharedLinkFromUrl(window.location.search));
  const [loadingShared, setLoadingShared] = useState(!!shared);
  const [viewOnly, setViewOnly] = useState(!!shared?.view);
  // The walkthrough runs on the first visit, and again from the help button.
  const [touring, setTouring] = useState(() => !shared?.view && !tourSeen());

  const notify = useCallback((message: string, undoable = false, action?: ToastAction) => {
    setToast({ id: Date.now(), message, undoable, action, tone: 'info' });
  }, []);
  const showError = useCallback((message: string) => {
    setToast({ id: Date.now(), message, undoable: false, tone: 'error' });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.tone === 'error' || toast.action ? 9000 : 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // The library of resumes, kept in this browser or in a folder. A resume opened
  // just to view isn't part of it until the visitor chooses to edit it.
  const library = useLibrary({ boot, doc, resetDoc: reset, enabled: !viewOnly && !loadingShared, notify, showError });
  const { addAndOpen, open: openResume } = library;

  /** Open a resume that's already in the library unchanged, or add it as a new one. */
  const openOrAdd = useCallback(
    (resume: ResumeDocument) => {
      const existing = findById(library.lib, resume.id);
      if (existing && serializeResumeFile(library.lib.files[existing]) === serializeResumeFile(resume)) openResume(existing);
      else addAndOpen(resume);
    },
    [library.lib, openResume, addAndOpen],
  );

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    fetchResume(shared.url)
      .then((parsed) => {
        if (cancelled) return;
        if (shared.view) {
          replace(parsed.doc);
          return;
        }
        clearSharedLink();
        openOrAdd(parsed.doc);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        clearSharedLink();
        setViewOnly(false);
        showError(err instanceof ImportError ? err.message : "Couldn't open the linked resume.");
      })
      .finally(() => !cancelled && setLoadingShared(false));
    return () => {
      cancelled = true;
    };
    // Runs once for the link the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared]);

  // Name the browser tab after the resume being viewed.
  useEffect(() => {
    if (!viewOnly || loadingShared) return;
    const previous = document.title;
    document.title = doc.profile.name ? `${doc.profile.name} – Resume` : doc.title;
    return () => {
      document.title = previous;
    };
  }, [viewOnly, loadingShared, doc.profile.name, doc.title]);

  /** Edit a resume opened from a link: it joins the library as its own resume. */
  const startEditing = () => {
    clearSharedLink();
    openOrAdd(doc);
    setViewOnly(false);
    if (!tourSeen()) setTouring(true);
  };

  // ---- The tour ----------------------------------------------------------------
  // It builds up a practice copy of the sample resume step by step, so it can
  // show each feature doing something real without touching the visitor's own
  // resumes. The steps read the latest library through a ref, so the list of
  // steps itself never changes while the tour is open.

  const libraryRef = useRef(library);
  useLayoutEffect(() => {
    libraryRef.current = library;
  });
  const tourRun = useRef<TourRun>({ original: '', practice: null, start: null, copy: null, tailored: false });

  /** Open the practice resume (making it the first time) with the first `edits` tour edits applied. */
  const showPractice = useCallback(
    (edits: number) => {
      const lib = libraryRef.current;
      const run = tourRun.current;
      if (!run.practice || !run.start) {
        run.original = lib.activePath;
        run.start = practiceResume(sampleDocument());
        run.practice = lib.addAndOpen(run.start);
      } else {
        lib.open(run.practice);
      }
      const d = structuredClone(run.start);
      TOUR_EDITS.slice(0, edits).forEach((edit) => edit(d));
      replace(d);
      return d;
    },
    [replace],
  );

  /** Close the tour; unless asked to keep them, remove the practice resumes and reopen the visitor's own. */
  const endTour = useCallback(
    (keep = false) => {
      setTouring(false);
      setTab('content');
      setOpenId(null);
      const run = tourRun.current;
      const lib = libraryRef.current;
      if (run.practice && !keep) {
        if (run.copy) lib.remove(run.copy);
        lib.remove(run.practice);
        if (run.original && run.original !== run.practice) lib.open(run.original);
        notify('Removed the practice resumes.');
      } else if (run.practice) {
        notify('Kept the practice resumes. Find them on the Resumes tab.');
      }
      tourRun.current = { original: '', practice: null, start: null, copy: null, tailored: false };
      try {
        localStorage.setItem(TOUR_KEY, '1');
      } catch {
        // Ignore: it just shows again next visit.
      }
    },
    [setTab, notify],
  );

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        title: 'Welcome to Resume Builder',
        body: (
          <>
            <p>Make a polished A4 resume, then download it as a PDF.</p>
            <p>
              This tour shows you how, by doing it: on a <strong>practice copy of the sample resume</strong>, a pointer clicks and types its way through each feature
              while you watch. Your own resumes aren’t touched, and the practice copy is removed at the end unless you keep it.
            </p>
          </>
        ),
      },
      {
        target: ['[data-section-card="experience"]', '.preview-scroll [data-section-id="experience"]'],
        title: 'Add to a section',
        body: (
          <p>
            Open a section and click <strong>Add entry</strong>, then type into its fields: the preview updates as you go. The arrows move an entry up or down. Click
            any part of the preview to jump to its fields.
          </p>
        ),
        before: () => {
          showPractice(0);
          setTab('content');
          setOpenId('experience');
        },
        demo: async (t) => {
          await t.point(byText('[data-section-card="experience"] .item-list > .btn', 'Add entry'));
          await t.click(true);
          const type = (field: 'title' | 'subtitle' | 'location' | 'dates') => (text: string) =>
            update((d) => {
              const s = d.sections.find((x) => x.id === 'experience');
              if (s?.type === 'experience') s.items[s.items.length - 1][field] = text;
            }, 'tour-type');
          await t.type(TOUR_JOB.title, type('title'));
          await t.type(TOUR_JOB.subtitle, type('subtitle'));
          await t.type(TOUR_JOB.dates, type('dates'));
          await t.type(TOUR_JOB.location, type('location'));
          update((d) => {
            const s = d.sections.find((x) => x.id === 'experience');
            if (s?.type === 'experience') s.items[s.items.length - 1].bullets = [...TOUR_JOB.bullets];
          });
          await t.wait(400);
          // It's the newest job, so it goes to the top.
          const moveUp = () =>
            [...document.querySelectorAll('[data-section-card="experience"] .item')]
              .find((el) => el.textContent?.includes(TOUR_JOB.title))
              ?.querySelector<HTMLElement>('[title="Move up"]:not(:disabled)');
          for (let i = 0; i < 3 && moveUp(); i++) {
            await t.point(moveUp);
            await t.click(true);
          }
          await t.flash('.preview-scroll [data-section-id="experience"]');
        },
      },
      {
        target: ['add-section', `.preview-scroll [data-section-id="${TOUR_PROJECTS_ID}"]`],
        title: 'Add a whole section',
        body: (
          <p>
            <strong>Add section</strong> offers jobs, education, skills, a list, a block of text and more. We picked <strong>Experience &amp; projects</strong> and named
            it Projects. A new section goes at the end of the last page; you can move it from there.
          </p>
        ),
        before: () => {
          showPractice(1);
          setTab('content');
          setOpenId(null);
        },
        demo: async (t) => {
          await t.point('add-section');
          await t.click(true);
          await t.point(byText('.type-option', 'Experience & projects'));
          await t.click();
          byText('.add-section .btn', 'Cancel')()?.click();
          update((d) => {
            addProjects(d);
            const s = d.sections.find((x) => x.id === TOUR_PROJECTS_ID);
            if (s) s.title = '';
          });
          setOpenId(TOUR_PROJECTS_ID);
          await t.wait(300);
          await t.type('Projects', (text) =>
            update((d) => {
              const s = d.sections.find((x) => x.id === TOUR_PROJECTS_ID);
              if (s) s.title = text;
            }, 'tour-type'),
          );
          await t.flash(`.preview-scroll [data-section-id="${TOUR_PROJECTS_ID}"]`);
        },
      },
      {
        target: [`[data-chip-section="${TOUR_MOVED_ID}"]`, `.preview-scroll [data-section-id="${TOUR_MOVED_ID}"]`],
        title: 'Move a section',
        body: (
          <p>
            The <strong>Layout</strong> tab shows each page as rows and columns. Drag a section anywhere, or click it for <strong>Up</strong>, <strong>Down</strong>,{' '}
            <strong>Other side</strong> and <strong>Move to</strong> another page. Here Languages moves from the sidebar to the main column.
          </p>
        ),
        before: () => {
          showPractice(2);
          setTab('layout');
        },
        demo: async (t) => {
          await t.point(`[data-chip-section="${TOUR_MOVED_ID}"] .chip-title`);
          await t.click(true);
          await t.point(byText('.popover .btn', 'Other side'));
          await t.click(true);
          await t.flash(`.preview-scroll [data-section-id="${TOUR_MOVED_ID}"]`);
        },
      },
      {
        target: ['[data-tour="layout-page-1"] .sheet-divider', '.preview-scroll .rg-page'],
        title: 'Change the columns',
        body: (
          <p>
            Drag the line between two columns to resize them: here the left one gets wider. Each row can have its own shape (one column, two equal, or a narrow one on
            either side); add rows with the buttons under each page.
          </p>
        ),
        before: () => {
          showPractice(3);
          setTab('layout');
        },
        demo: async (t) => {
          const divider = '[data-tour="layout-page-1"] .sheet-divider';
          await t.point(divider);
          const width = document.querySelector(divider)?.parentElement?.getBoundingClientRect().width ?? 300;
          await t.drag(width * 0.06, 0, (p) =>
            update((d) => {
              for (const row of d.pages[0]?.rows ?? []) if (row.columns.length === 2) row.split = Math.round(32 + 6 * p);
            }, 'tour-split'),
          );
          await t.flash('.preview-scroll .rg-page');
        },
      },
      {
        target: [byText('.template-card', 'Stone'), '.preview-scroll .rg-page'],
        title: 'Rearrange it all at once',
        body: (
          <p>
            A <strong>template</strong> lays out the whole resume in one go, with its own fonts and colors. Clicking one only previews it: nothing changes until you
            click <strong>Apply</strong>. <strong>Match another resume</strong> copies the design of one you’ve already made.
          </p>
        ),
        before: () => {
          showPractice(4);
          setTab('templates');
        },
        demo: async (t) => {
          await t.point(byText('.template-card', 'Stone'));
          await t.click(true);
          await t.flash('.preview-scroll .rg-page');
          await t.point(byText('.trial-bar .btn', 'Apply'));
          await t.wait(900);
        },
      },
      {
        target: ['footer-card', '.preview-scroll .rg-footer'],
        title: 'Add a footer',
        body: (
          <p>
            Pick a footer for every page here, or a different one per page on the Layout tab. You can also upload your own image, or write one in HTML or SVG. Here:
            mountains.
          </p>
        ),
        before: () => {
          showPractice(4);
          setTab('design');
        },
        demo: async (t) => {
          await t.point('[data-tour="footer-card"] select');
          await t.click();
          update(addFooter);
          await t.wait(300);
          await t.flash('.preview-scroll .rg-footer');
        },
      },
      {
        target: ['.preview-scroll .preview-page:first-child [data-section-id="experience"]', '.preview-page + .preview-page .rg-page'],
        title: 'Split a section across pages',
        body: (
          <>
            <p>
              Page 1 is too full now, so it’s outlined in red. Hover between two items of a section in the preview and click <strong>Continue on next page</strong>:
              the rest carries on at the top of the next page, headed “(continued)”.
            </p>
            <p>
              Hover that heading for <strong>Join back</strong> to undo it. On a full page, “Move it to the next page” on the Layout tab splits things for you.
            </p>
          </>
        ),
        before: () => {
          showPractice(5);
          setTab('content');
          setOpenId(null);
        },
        demo: async (t) => {
          const items = () => document.querySelectorAll('.preview-scroll .preview-page:first-child [data-section-id="experience"] [data-item]');
          // Between the second and third jobs.
          await t.hover(() => items()[2], 'top');
          await t.wait(500);
          await t.point('.split-tool--split button');
          await t.click(true);
          await t.wait(400);
          await t.flash('.preview-page + .preview-page [data-section-id="experience"]');
          await t.hover('.preview-page + .preview-page [data-section-id="experience"] .rg-heading');
          await t.point('.split-tool--join button');
          await t.wait(1400);
        },
      },
      {
        target: ['.library-actions .btn--primary', '.library-list'],
        title: 'Keep a version for each job',
        body: (
          <p>
            The <strong>Resumes</strong> tab is your library: every resume you make, together. <strong>Make a copy for a job</strong> copies the open resume, notes what
            it’s for, and remembers which one it came from.
          </p>
        ),
        before: () => {
          const run = tourRun.current;
          if (run.copy) libraryRef.current.remove(run.copy);
          run.copy = null;
          showPractice(6);
          setTab('resumes');
        },
        demo: async (t) => {
          await t.point('.library-actions .btn--primary');
          await t.click(true);
          await t.wait(300);
          await t.point('.dialog input[type="text"]');
          await t.typeInto('.dialog input[type="text"]', 'Practice – Acme Controls Engineer');
          const madeFor = () => document.querySelectorAll('.dialog input[type="text"]')[1];
          await t.point(madeFor);
          await t.typeInto(madeFor, 'Controls Engineer at Acme');
          await t.point(byText('.dialog .btn--primary', 'Make copy'));
          await t.click(true);
          await t.wait(400);
          const run = tourRun.current;
          const active = libraryRef.current.activePath;
          if (active !== run.practice) run.copy = active;
          await t.flash('.library-list');
        },
      },
      {
        target: ['[data-section-card="summary"]', '.preview-scroll [data-section-id="summary"]', '.preview-scroll [data-section-id="header"]'],
        title: 'Change the copy',
        body: (
          <p>
            Now tailor the copy to the job: here a sharper headline and summary. The practice resume it came from stays as it was; switch between them on the Resumes
            tab.
          </p>
        ),
        before: () => {
          const run = tourRun.current;
          const lib = libraryRef.current;
          if (!run.copy && run.practice) run.copy = lib.duplicate(run.practice, { title: 'Practice – Acme Controls Engineer', target: 'Controls Engineer at Acme', folder: '', notes: '' });
          else if (run.copy) lib.open(run.copy);
          // Start from the practice resume's wording, so the step can be watched again.
          const start = run.start;
          update((d) => {
            const summary = d.sections.find((s) => s.type === 'text');
            const original = start?.sections.find((s) => s.type === 'text');
            if (summary?.type === 'text' && original?.type === 'text') summary.body = original.body;
            if (start) d.profile.headline = start.profile.headline;
          });
          setTab('content');
          setOpenId('summary');
        },
        demo: async (t) => {
          await t.point('[data-section-card="summary"] textarea');
          await t.type(TOUR_SUMMARY, (text) =>
            update((d) => {
              const s = d.sections.find((x) => x.type === 'text');
              if (s?.type === 'text') s.body = text;
            }, 'tour-type'),
          );
          await t.point('.preview-scroll [data-section-id="header"]');
          await t.type(TOUR_HEADLINE, (text) => update((d) => void (d.profile.headline = text), 'tour-type'));
          await t.flash('.preview-scroll [data-section-id="header"]');
        },
      },
      {
        target: 'file',
        title: 'Save it on your computer',
        body: (
          <ul>
            <li>Everything saves in this browser as you type.</li>
            <li>
              <strong>File → Save this resume as a file</strong> downloads it as a <code>.resume.json</code> file to keep, back up or send. <strong>Download library</strong>{' '}
              saves every resume in one file.
            </li>
            <li>
              Later, on any computer: <strong>File → Open file</strong>, or drop the file onto this page, and carry on editing.
            </li>
          </ul>
        ),
        before: () => {
          setTab('content');
          setOpenId(null);
        },
        demo: async (t) => {
          await t.point('[data-tour="file"] > button');
          await t.click(true);
          await t.point(byText('.menu-item', 'Save this resume as a file'));
          await t.wait(900);
          await t.point(byText('.menu-item', 'Download library'));
          await t.wait(900);
          await t.point(byText('.menu-item', 'Open file'));
          await t.wait(900);
          await t.point('[data-tour="file"] > button');
          await t.click(true);
        },
      },
      {
        target: '.library-place',
        title: 'Or work from a folder',
        body: (
          <p>
            In Chrome or Edge, <strong>Set up a folder</strong> keeps every resume as a file in a folder on your computer, and edits save straight into it. Handy for
            backups, git, or letting an AI agent edit your resume: its changes show up here.
          </p>
        ),
        before: () => setTab('resumes'),
        demo: async (t) => {
          await t.point(byText('.library-place .btn', 'Set up a folder'));
          await t.wait(900);
        },
      },
      {
        target: 'download',
        title: 'Download your resume',
        body: <p>A PDF in one click. Print to PDF gives the sharpest text, and you can also export a web page for your site.</p>,
        before: () => setTab('content'),
        demo: async (t) => {
          await t.point('[data-tour="download"] > button');
          await t.click(true);
          await t.point(byText('.menu-item', 'PDF'));
          await t.wait(800);
          await t.point(byText('.menu-item', 'Print to PDF'));
          await t.wait(800);
          await t.point('[data-tour="download"] > button');
          await t.click(true);
        },
      },
      {
        target: 'help',
        title: 'That’s the tour',
        body: <p>See it again any time from this button. Keep the two practice resumes to play with, or remove them and go back to your own.</p>,
        choices: [
          { label: 'Remove them', primary: true, run: () => endTour(false) },
          { label: 'Keep them', run: () => endTour(true) },
        ],
      },
    ],
    [setTab, showPractice, update, endTour],
  );

  // Load the fonts the resume uses.
  const fontsUrl = googleFontsUrl([doc.theme.font, doc.theme.headingFont]);
  useEffect(() => {
    if (!fontsUrl) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    // Lets the PDF export read and embed the font files.
    link.crossOrigin = 'anonymous';
    link.href = fontsUrl;
    document.head.appendChild(link);
    return () => link.remove();
  }, [fontsUrl]);

  useEffect(() => {
    if (!fitRounds) return;
    const frame = requestAnimationFrame(() => {
      const root = printRoot.current;
      const draft = structuredClone(shown);
      const changed = !!root && fitPages(draft, measurePages(root));
      if (changed) {
        if (trial) setTrial({ ...trial, doc: draft });
        else update(() => draft, 'autofit');
      }
      setFitRounds(changed ? fitRounds - 1 : 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [fitRounds, shown, trial, update]);

  const autoFit = useCallback(() => setFitRounds(15), []);

  // ---- Trying templates ------------------------------------------------------

  const tryTemplate = (templateId: string, keepLayout: boolean) => {
    setTrial({ templateId, base: doc, doc: keepLayout ? applyTemplate(doc, templateId) : arrangeLayout(doc, templateId) });
    // A new arrangement may not fit the pages yet; fit the trial like a real change.
    if (!keepLayout) setFitRounds(15);
  };

  const applyTrial = () => {
    if (!trial) return;
    const applied = trial.doc;
    setTrial(null);
    update(() => applied);
    notify(`Applied the ${TEMPLATES.find((t) => t.id === trial.templateId)?.name ?? ''} template.`, true);
  };

  /** The other resumes, named by file too when titles repeat. */
  const otherResumes = sortedPaths(library.lib)
    .filter((p) => p !== library.activePath)
    .map((p) => {
      const title = library.lib.files[p].title;
      const repeated = Object.values(library.lib.files).filter((d) => d.title === title).length > 1;
      return { path: p, title: repeated ? `${title} (${fileNameOf(p)})` : title };
    });

  /** Give this resume another resume's look: its template's layout, theme and page footers. */
  const copyDesign = (path: string) => {
    const source = library.lib.files[path];
    if (!source) return;
    setTrial(null);
    update((d) => {
      // Lay the content out with the other resume's template, then take its exact look.
      const next = arrangeLayout(d, source.theme.template);
      next.theme = structuredClone(source.theme);
      next.pages.forEach((page, i) => {
        page.footer = source.pages[Math.min(i, source.pages.length - 1)]?.footer ?? page.footer;
      });
      return next;
    });
    setFitRounds(15);
    notify(`Matched the design of “${source.title}”.`, true);
  };

  // ---- Files ---------------------------------------------------------------

  const saveJson = useCallback(() => {
    downloadFile(`${fileStem(doc)}.resume.json`, serializeResumeFile(doc), 'application/json');
    notify('Saved this resume to your downloads. Open it later with File → Open file.');
  }, [doc, notify]);

  const readFile = (file: File) => {
    file
      .text()
      .then((text) => {
        const opened = parseAnyFile(text);
        setPending(opened.kind === 'resume' ? { ...opened, fileName: file.name } : { ...opened, fileName: file.name });
      })
      .catch((err: unknown) => {
        showError(err instanceof ImportError ? err.message : "That file couldn't be read.");
      });
  };

  const confirmOpen = () => {
    if (!pending) return;
    setPending(null);
    setOpenId(null);
    if (pending.kind === 'resume') {
      openOrAdd(pending.doc);
      notify(`Opened ${pending.fileName}.`);
    } else {
      const added = library.importLibrary(pending.lib);
      notify(added ? `Added ${added} ${added === 1 ? 'resume' : 'resumes'} from ${pending.fileName}.` : `You already have every resume in ${pending.fileName}.`);
    }
  };

  const startNew = (kind: 'blank' | 'sample') => {
    addAndOpen(kind === 'blank' ? blankDocument() : sampleDocument());
    setOpenId(kind === 'blank' ? 'profile' : null);
    setTab('content');
    notify(kind === 'blank' ? 'Added a blank resume.' : 'Added the sample resume.');
  };

  const chooseFolder = async (intent: 'open' | 'setup') => {
    try {
      const handle = await pickFolder();
      if (handle) await library.chooseFolder(handle, intent);
    } catch (err) {
      showError(`Couldn't open the folder: ${err instanceof Error ? err.message : 'unknown error'}.`);
    }
  };

  // ---- Output --------------------------------------------------------------

  const print = useCallback(() => {
    const previous = document.title;
    // Browsers use the page title as the default PDF file name.
    document.title = fileStem(doc);
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    const go = () => window.print();
    if (document.fonts?.ready) document.fonts.ready.then(go, go);
    else go();
  }, [doc]);

  const requestPdf = useCallback(() => {
    let hidden = false;
    try {
      hidden = localStorage.getItem(PRINT_TIP_KEY) === '1';
    } catch {
      // Storage blocked: always show the tip.
    }
    if (hidden && Object.keys(overflow).length === 0) print();
    else setPrintTip(true);
  }, [overflow, print]);

  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const savePdf = async () => {
    const root = printRoot.current;
    if (!root || pdfProgress) return;
    setPdfProgress('Preparing PDF…');
    try {
      const { buildPdf } = await import('./export/exportPdf');
      const blob = await buildPdf(root, doc.profile.name ? `${doc.profile.name} – Resume` : doc.title, (page, total) =>
        setPdfProgress(`Making PDF: page ${page} of ${total}…`),
      );
      downloadFile(`${fileStem(doc)}.pdf`, blob, 'application/pdf');
      notify(
        overflowPages.length
          ? `Downloaded the PDF. Page ${overflowPages.join(', ')} has content cut off; fix it on the Layout tab.`
          : 'Downloaded the PDF. For the sharpest text, use Download → Print to PDF.',
      );
    } catch {
      showError("Couldn't make the PDF here. Use Download → Print to PDF instead.");
    } finally {
      setPdfProgress(null);
    }
  };

  const saveHtml = async () => {
    // Loaded on demand: it pulls in React's server renderer.
    const { buildStandaloneHtml } = await import('./export/exportHtml');
    downloadFile(`${fileStem(doc)}.html`, buildStandaloneHtml(doc), 'text/html');
    notify('Downloaded a standalone HTML page. Open it in any browser or host it on your site.');
  };

  // ---- Keyboard shortcuts --------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (viewOnly) {
        if (key === 'p') {
          e.preventDefault();
          requestPdf();
        }
        return;
      }
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      } else if (key === 's') {
        e.preventDefault();
        if (library.place.kind === 'folder') library.saveNow();
        else saveJson();
      } else if (key === 'p') {
        e.preventDefault();
        requestPdf();
      } else if (key === 'o') {
        e.preventDefault();
        fileInput.current?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, saveJson, requestPdf, viewOnly, library]);

  // ---- Splitting sections across pages, from the preview --------------------

  /** Items from `at` on continue at the top of the next page. */
  const splitAt = (placementId: string, at: number) => {
    const loc = locatePlacement(doc, placementId);
    if (!loc) return;
    const section = findSection(doc, doc.pages[loc.page].rows[loc.row].columns[loc.col][loc.index].sectionId);
    update((d) => splitPlacement(d, placementId, at));
    notify(`${section?.title || 'The section'} now continues at the top of page ${loc.page + 2}.`, true);
  };

  /** Put a split section back together where its first part is. */
  const joinBack = (placementId: string) => {
    const loc = locatePlacement(doc, placementId);
    if (!loc) return;
    const section = findSection(doc, doc.pages[loc.page].rows[loc.row].columns[loc.col][loc.index].sectionId);
    if (!section) return;
    const first = sectionParts(doc, section.id, itemCount(section))[0];
    if (!first) return;
    update((d) => joinParts(d, first.placementId));
    notify(`${section.title || 'The section'} is back together on page ${first.page + 1}.`, true);
  };

  const editSection = (id: string) => {
    setTab('content');
    setOpenId(id);
  };

  const saved = library.saveState;
  const where = library.place.kind === 'folder' ? `“${library.place.name}”` : 'browser';
  const saveLabel =
    saved === 'failed' ? `Not saved in ${where}` : saved === 'conflict' ? 'Changed in the folder' : saved === 'saving' ? 'Saving…' : `Saved in ${where}`;
  const overflowPages = shown.pages.map((p, i) => (overflow[p.id] !== undefined ? i + 1 : 0)).filter(Boolean);

  return (
    <>
      <div
        className={`app${dragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) readFile(file);
        }}
      >
        <header className="topbar">
          <div className="brand">
            <FileText size={18} />
            <span>Resume Builder</span>
          </div>
          <a className="home-link" href={__HOME_URL__} title={`Back to ${HOME_LABEL}`}>
            {HOME_LABEL}
            <ArrowUpRight size={13} />
          </a>
          {viewOnly ? (
            <span className="view-title">{doc.profile.name || doc.title}</span>
          ) : (
            <>
              <input
                className="title-input"
                value={doc.title}
                aria-label="Resume name"
                onChange={(e) => update((d) => void (d.title = e.target.value), 'title')}
                onBlur={() => !doc.title.trim() && update((d) => void (d.title = 'My resume'))}
              />
              <div className="topbar-group" data-tour="undo">
                <button type="button" className="icon-btn" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!canUndo} onClick={undo}>
                  <Undo2 size={17} />
                </button>
                <button type="button" className="icon-btn" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={!canRedo} onClick={redo}>
                  <Redo2 size={17} />
                </button>
              </div>
              <span
                className={`save-status save-status--${saved === 'conflict' ? 'failed' : saved}`}
                title={library.place.kind === 'folder' ? 'Edits save straight into the folder.' : 'Your resumes are kept in this browser. Use File → Download library to keep a file.'}
              >
                {saveLabel}
              </span>
            </>
          )}
          <div className="topbar-group topbar-right">
            {!viewOnly && (
              <button type="button" className="icon-btn" title="Show the tour" aria-label="Show the tour" data-tour="help" onClick={() => setTouring(true)}>
                <CircleHelp size={18} />
              </button>
            )}
            {!viewOnly && (
              <Menu label="File" tour="file">
                <MenuItem icon={<FilePlus size={16} />} onClick={() => startNew('blank')}>New blank resume</MenuItem>
                <MenuItem icon={<FileText size={16} />} onClick={() => startNew('sample')}>Add the sample resume</MenuItem>
                <MenuItem icon={<FolderOpen size={16} />} hint="Ctrl+O" onClick={() => fileInput.current?.click()}>Open file…</MenuItem>
                <MenuItem icon={<FileJson size={16} />} hint={library.place.kind === 'folder' ? undefined : 'Ctrl+S'} onClick={saveJson}>Save this resume as a file</MenuItem>
                <MenuItem icon={<LibraryIcon size={16} />} onClick={library.downloadLibrary}>Download library (all resumes)</MenuItem>
                <MenuSeparator label="Folder" />
                {library.place.kind === 'folder' ? (
                  <MenuItem icon={<FolderX size={16} />} onClick={library.disconnect}>Close folder “{library.place.name}”</MenuItem>
                ) : canUseFolders() ? (
                  <>
                    <MenuItem icon={<FolderPlus size={16} />} onClick={() => chooseFolder('setup')}>Set up a resume folder…</MenuItem>
                    <MenuItem icon={<FolderInput size={16} />} onClick={() => chooseFolder('open')}>Open resume folder…</MenuItem>
                  </>
                ) : (
                  <MenuItem icon={<FolderPlus size={16} />} disabled onClick={() => undefined}>Folders need Chrome or Edge</MenuItem>
                )}
              </Menu>
            )}
            <Menu label="Download" primary={!viewOnly} tour="download" icon={<Download size={16} />}>
              <MenuItem icon={<FileDown size={16} />} onClick={savePdf}>PDF</MenuItem>
              <MenuItem icon={<Printer size={16} />} hint="Ctrl+P" onClick={requestPdf}>Print to PDF (sharpest text)</MenuItem>
              <MenuItem icon={<FileCode size={16} />} onClick={saveHtml}>HTML web page</MenuItem>
              <MenuItem icon={<FileJson size={16} />} onClick={saveJson}>Resume file (to edit later)</MenuItem>
            </Menu>
            {viewOnly && (
              <button type="button" className="btn btn--primary" onClick={() => startEditing()}>
                <Pencil size={15} /> Edit in the builder
              </button>
            )}
          </div>
        </header>

        {library.reconnect && !viewOnly && (
          <div className="reconnect-bar" role="status">
            <FolderOpen size={16} />
            <span>
              Your resumes are in the folder <strong>{library.reconnect}</strong>. The browser needs your OK to open it again.
            </span>
            <button type="button" className="btn btn--primary btn--sm" onClick={library.reconnectFolder}>Open folder</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={library.dismissReconnect}>Use this browser instead</button>
          </div>
        )}

        <main className={`workspace${viewOnly ? ' workspace--view' : ''}`}>
          {loadingShared && <div className="loading-cover">Opening resume…</div>}
          {!viewOnly && (
            <aside className="editor" data-tour="editor">
              <nav className="tabs" role="tablist">
                {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)} data-tour={t === 'resumes' ? 'resumes-tab' : undefined}>
                    {TAB_LABELS[t]}
                    {t === 'layout' && overflowPages.length > 0 && <span className="tab-dot" title="A page has content cut off" />}
                  </button>
                ))}
              </nav>
              <div className="editor-scroll">
                {tab === 'resumes' && <LibraryPanel library={library} doc={doc} update={update} onNew={() => startNew('blank')} onPickFolder={chooseFolder} />}
                {tab === 'content' && <ContentPanel doc={doc} update={update} openId={openId} setOpenId={setOpenId} notify={notify} />}
                {tab === 'layout' && <LayoutPanel doc={doc} update={update} overflow={overflow} onEditSection={editSection} onAutoFit={autoFit} notify={notify} />}
                {tab === 'templates' && (
                  <TemplatesPanel
                    doc={doc}
                    trialId={trial?.templateId ?? null}
                    onTry={tryTemplate}
                    onApplyTrial={applyTrial}
                    onCancelTrial={() => setTrial(null)}
                    others={otherResumes}
                    onCopyDesign={copyDesign}
                  />
                )}
                {tab === 'design' && <DesignPanel doc={doc} update={update} />}
              </div>
            </aside>
          )}
          <Preview
            doc={shown}
            overflow={viewOnly ? {} : overflow}
            selectedId={!viewOnly && tab === 'content' ? openId : null}
            onSelectSection={viewOnly ? undefined : editSection}
            onSplit={viewOnly || trial ? undefined : splitAt}
            onJoin={viewOnly || trial ? undefined : joinBack}
          />
        </main>

        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
            e.target.value = '';
          }}
        />

        {dragging && <div className="drop-overlay">Drop a resume or library file to add it</div>}

        {pending && (
          <Dialog
            title={pending.kind === 'resume' ? `Add “${pending.doc.title}”?` : `Add the resumes in ${pending.fileName}?`}
            onClose={() => setPending(null)}
            actions={
              <>
                <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>Cancel</button>
                <button type="button" className="btn btn--primary" onClick={confirmOpen} autoFocus>
                  {pending.kind === 'resume' ? 'Add and open' : `Add ${Object.keys(pending.lib.files).length}`}
                </button>
              </>
            }
          >
            {pending.kind === 'resume' ? (
              <p>
                <strong>{pending.fileName}</strong>
                {pending.doc.profile.name && <> ({pending.doc.profile.name})</>}: {pending.doc.sections.length} sections on {pending.doc.pages.length}{' '}
                {pending.doc.pages.length === 1 ? 'page' : 'pages'}. It's added to your resumes as a new one; nothing you have is replaced.
              </p>
            ) : (
              <p>
                <strong>{pending.lib.name}</strong> has {Object.keys(pending.lib.files).length} resumes. They're added to yours, in the same folders; nothing you have is
                replaced.
              </p>
            )}
            {pending.kind === 'resume' && pending.migrated && (
              <p className="hint">This file is from an older version of Resume Builder. It’s been converted; check the layout.</p>
            )}
            {pending.kind === 'library' && pending.skipped.length > 0 && (
              <p className="notice notice--warn">{pending.skipped.length} entries in the file couldn't be read and will be skipped: {pending.skipped.join(', ')}.</p>
            )}
          </Dialog>
        )}

        {touring && !viewOnly && !loadingShared && <Tour steps={tourSteps} onClose={endTour} />}

        {library.conflict && (
          <Dialog
            title={library.conflict.disk ? 'This resume changed in the folder' : 'This resume’s file was deleted'}
            onClose={() => undefined}
            actions={
              library.conflict.disk ? (
                <>
                  <button type="button" className="btn btn--ghost" onClick={() => library.resolveConflict('both')}>Keep both</button>
                  <button type="button" className="btn btn--ghost" onClick={() => library.resolveConflict('mine')}>Keep my edits</button>
                  <button type="button" className="btn btn--primary" autoFocus onClick={() => library.resolveConflict('disk')}>Use the folder’s version</button>
                </>
              ) : (
                <button type="button" className="btn btn--primary" autoFocus onClick={() => library.resolveConflict('mine')}>Save it again</button>
              )
            }
          >
            <p>
              <strong>{library.conflict.path}</strong> was changed by another program (an AI agent, an editor, git) while you also had unsaved edits here.
            </p>
            <p className="hint">“Keep both” saves your edits as a separate copy next to it, and loads the folder’s version.</p>
          </Dialog>
        )}

        {library.question && (
          <Dialog
            title={library.question.kind === 'other' ? 'Set up a resume library in this folder?' : 'No resume library in this folder yet'}
            onClose={() => library.answerQuestion(false)}
            actions={
              <>
                <button type="button" className="btn btn--ghost" onClick={() => library.answerQuestion(false)}>Cancel</button>
                <button type="button" className="btn btn--primary" autoFocus onClick={() => library.answerQuestion(true)}>Set it up</button>
              </>
            }
          >
            {library.question.kind === 'other' ? (
              <p>
                <strong>{library.question.handle.name}</strong> already has other files ({library.question.entries.slice(0, 4).join(', ')}
                {library.question.entries.length > 4 ? ', …' : ''}). The library adds <code>library.json</code>, <code>resumes/</code> and a few guide files, and doesn't
                touch anything else.
              </p>
            ) : (
              <p>
                <strong>{library.question.handle.name}</strong> is empty. Set it up with your current {Object.keys(library.lib.files).length} resumes?
              </p>
            )}
          </Dialog>
        )}

        {printTip && (
          <Dialog
            title="Save as PDF"
            onClose={() => setPrintTip(false)}
            actions={
              <>
                <button type="button" className="btn btn--ghost" onClick={() => setPrintTip(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn--primary"
                  autoFocus
                  onClick={() => {
                    setPrintTip(false);
                    // Let the dialog close before the print dialog takes over.
                    setTimeout(print, 50);
                  }}
                >
                  Open print dialog
                </button>
              </>
            }
          >
            {overflowPages.length > 0 && (
              <p className="notice notice--error">
                Page {overflowPages.join(', ')} has content cut off at the bottom, so it would be missing from the PDF.{' '}
                <button type="button" className="link-btn" onClick={autoFit}>
                  Move it to the next page
                </button>
              </p>
            )}
            <p>Your browser’s print dialog makes a sharp PDF with selectable text and working links. In the dialog:</p>
            <ol className="steps">
              <li>Set <strong>Destination</strong> to <strong>Save as PDF</strong>.</li>
              <li>Set <strong>Margins</strong> to <strong>None</strong> and paper size to <strong>A4</strong>.</li>
              <li>Turn on <strong>Background graphics</strong> so colors show.</li>
            </ol>
            <label className="checkbox">
              <input
                type="checkbox"
                onChange={(e) => {
                  try {
                    localStorage.setItem(PRINT_TIP_KEY, e.target.checked ? '1' : '0');
                  } catch {
                    // Ignore: the tip just shows again next time.
                  }
                }}
              />
              <span>Don’t show this again</span>
            </label>
          </Dialog>
        )}

        {pdfProgress && (
          <div className="toast" role="status">
            <span>{pdfProgress}</span>
          </div>
        )}

        {toast && !pdfProgress && (
          <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  toast.action?.run();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
            {toast.undoable && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  undo();
                  setToast(null);
                }}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unscaled copy used for printing and for measuring page overflow. */}
      <div id="print-root" ref={printRoot} aria-hidden="true">
        <ResumeView doc={shown} />
      </div>
    </>
  );
}
