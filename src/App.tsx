import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CircleHelp, Download, FileDown, FileCode, FileJson, FilePlus, FileText, FolderInput, FolderOpen, FolderPlus, FolderX, Library as LibraryIcon, Pencil, Printer, Redo2, Undo2 } from 'lucide-react';
import type { ResumeDocument } from './model/types';
import { blankDocument } from './model/defaults';
import { ImportError, clearSharedLink, downloadFile, fetchResume, fileStem, sharedLinkFromUrl } from './model/io';
import type { Library } from './library/library';
import { findById, parseAnyFile, serializeResumeFile, sortedPaths, fileNameOf } from './library/library';
import { bootLibrary, useLibrary } from './library/useLibrary';
import { canUseFolders, pickFolder } from './library/storage';
import { LibraryPanel } from './editor/LibraryPanel';
import { normalizeDocument } from './model/normalize';
import { TEMPLATES, applyTemplate, arrangeLayout } from './model/templates';
import { fitPages, measurePages } from './model/autofit';
import { googleFontsUrl } from './model/variants';
import sample from './data/sample.json';
import { useHistory } from './hooks/useHistory';
import { usePageOverflow } from './hooks/usePageOverflow';
import { ResumeView } from './resume/ResumeView';
import { ContentPanel } from './editor/ContentPanel';
import { LayoutPanel } from './editor/LayoutPanel';
import { DesignPanel } from './editor/DesignPanel';
import { Preview } from './editor/Preview';
import { Menu, MenuItem, MenuSeparator } from './editor/Menu';
import { Dialog } from './editor/Dialog';
import { Tour } from './editor/Tour';
import type { TourStep } from './editor/Tour';
import './App.css';

type Tab = 'resumes' | 'content' | 'layout' | 'design';

const TAB_LABELS: Record<Tab, string> = { resumes: 'Resumes', content: 'Content', layout: 'Layout', design: 'Design' };

const sampleDocument = () => normalizeDocument(sample);
const HOME_LABEL = __HOME_URL__.replace(/^https?:\/\//, '').replace(/\/$/, '');

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
    if (next !== 'design') setTrial(null);
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

  const endTour = useCallback(() => {
    setTouring(false);
    setTab('content');
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {
      // Ignore: it just shows again next visit.
    }
  }, [setTab]);

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        title: 'Welcome to Resume Builder',
        body: <p>Make a polished A4 resume, then download it as a PDF. This short tour shows you where everything is.</p>,
      },
      {
        target: 'editor',
        title: 'Write your content',
        body: <p>Fill in your details and add sections like experience, education and skills. Click any section in the preview to jump straight to it.</p>,
        before: () => setTab('content'),
      },
      {
        target: 'preview',
        title: 'See it as you go',
        body: <p>The preview shows exactly what you’ll download. A red outline means a page is too full.</p>,
      },
      {
        target: 'editor',
        title: 'Arrange the layout',
        body: (
          <p>
            Drag sections between rows, columns and pages. Click a section to move it, or to split a long one across two pages. Drag the line between columns to resize
            them.
          </p>
        ),
        before: () => setTab('layout'),
      },
      {
        target: 'editor',
        title: 'Choose a design',
        body: <p>Pick one of ten templates, then adjust fonts, colors, spacing and the page footer.</p>,
        before: () => setTab('design'),
      },
      {
        target: 'resumes-tab',
        title: 'Keep versions for each job',
        body: (
          <p>
            The Resumes tab holds all your resumes. Make a copy of your main one for a specific job, and it remembers where it came from. You can also keep them in a
            folder on your computer, for git or an AI agent.
          </p>
        ),
        before: () => setTab('resumes'),
      },
      {
        target: 'file',
        title: 'Keep a copy',
        body: <p>Everything saves in this browser automatically. Use the File menu to download your resumes as a file, open one, or set up a folder.</p>,
        before: () => setTab('content'),
      },
      {
        target: 'download',
        title: 'Download your resume',
        body: <p>Get a PDF in one click. Print to PDF gives the sharpest text, and you can also export a web page.</p>,
      },
      {
        target: 'help',
        title: 'Need a refresher?',
        body: <p>Click here to see this tour again any time.</p>,
      },
    ],
    [setTab],
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
                {tab === 'design' && (
                  <DesignPanel
                    doc={doc}
                    update={update}
                    trialId={trial?.templateId ?? null}
                    onTry={tryTemplate}
                    onApplyTrial={applyTrial}
                    onCancelTrial={() => setTrial(null)}
                    others={otherResumes}
                    onCopyDesign={copyDesign}
                  />
                )}
              </div>
            </aside>
          )}
          <Preview
            doc={shown}
            overflow={viewOnly ? {} : overflow}
            selectedId={!viewOnly && tab === 'content' ? openId : null}
            onSelectSection={viewOnly ? undefined : editSection}
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
