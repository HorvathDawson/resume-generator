import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CircleHelp, Download, FileDown, FileCode, FileJson, FilePlus, FileText, FolderOpen, Pencil, Printer, Redo2, Undo2 } from 'lucide-react';
import type { ResumeDocument } from './model/types';
import { blankDocument } from './model/defaults';
import { ImportError, clearSharedLink, downloadFile, fetchResume, fileStem, loadFromStorage, parseResumeJson, saveToStorage, serializeDocument, sharedLinkFromUrl } from './model/io';
import { normalizeDocument } from './model/normalize';
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
import { Menu, MenuItem } from './editor/Menu';
import { Dialog } from './editor/Dialog';
import { Tour } from './editor/Tour';
import type { TourStep } from './editor/Tour';
import './App.css';

type Tab = 'content' | 'layout' | 'design';

const sampleDocument = () => normalizeDocument(sample);
const HOME_LABEL = __HOME_URL__.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** A resume kept in this browser that the visitor would lose if it were replaced. */
function ownStoredResume(other: ResumeDocument): ResumeDocument | null {
  const local = loadFromStorage();
  if (!local) return null;
  const text = serializeDocument(local);
  return text === serializeDocument(other) || text === serializeDocument(sampleDocument()) ? null : local;
}
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

interface PendingOpen {
  doc: ResumeDocument;
  migrated: boolean;
  fileName: string;
}

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
  const { doc, update, replace, undo, redo, canUndo, canRedo } = useHistory(() => loadFromStorage() ?? sampleDocument());
  const [tab, setTab] = useState<Tab>('content');
  const [openId, setOpenId] = useState<string | null>(null);
  const [stored, setStored] = useState<{ doc: ResumeDocument | null; ok: boolean }>({ doc: null, ok: true });
  const [pending, setPending] = useState<PendingOpen | null>(null);
  const [printTip, setPrintTip] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const printRoot = useRef<HTMLDivElement>(null);
  const overflow = usePageOverflow(printRoot, doc);
  // Rounds of "fix overflow" left to run; each round re-measures the result of the last.
  const [fitRounds, setFitRounds] = useState(0);
  // A resume opened from a link (?resume=...), and whether it is shown without the editor.
  const [shared] = useState(() => sharedLinkFromUrl(window.location.search));
  const [loadingShared, setLoadingShared] = useState(!!shared);
  const [viewOnly, setViewOnly] = useState(!!shared?.view);
  const [confirmEdit, setConfirmEdit] = useState<ResumeDocument | null>(null);
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

  // Autosave to this browser shortly after each change. A resume opened just to
  // view isn't saved, so it can't replace the visitor's own.
  useEffect(() => {
    if (viewOnly || loadingShared) return;
    const timer = setTimeout(() => setStored({ doc, ok: saveToStorage(doc) }), 400);
    return () => clearTimeout(timer);
  }, [doc, viewOnly, loadingShared]);

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
        if (ownStoredResume(parsed.doc)) setPending({ ...parsed, fileName: 'the linked resume' });
        else replace(parsed.doc);
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
  }, [shared, replace, showError]);

  // Name the browser tab after the resume being viewed.
  useEffect(() => {
    if (!viewOnly || loadingShared) return;
    const previous = document.title;
    document.title = doc.profile.name ? `${doc.profile.name} – Resume` : doc.title;
    return () => {
      document.title = previous;
    };
  }, [viewOnly, loadingShared, doc.profile.name, doc.title]);

  const startEditing = (force = false) => {
    const own = ownStoredResume(doc);
    if (own && !force) return setConfirmEdit(own);
    setConfirmEdit(null);
    clearSharedLink();
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
  }, []);

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
        target: 'file',
        title: 'Keep a copy',
        body: <p>Your work saves in this browser automatically. Use Save as JSON to back it up or move it to another computer, then open it here again.</p>,
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
    [],
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
      const draft = structuredClone(doc);
      const changed = !!root && fitPages(draft, measurePages(root));
      if (changed) update(() => draft, 'autofit');
      setFitRounds(changed ? fitRounds - 1 : 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [fitRounds, doc, update]);

  const autoFit = useCallback(() => setFitRounds(15), []);

  // ---- Files ---------------------------------------------------------------

  const saveJson = useCallback(() => {
    downloadFile(`${fileStem(doc)}.json`, serializeDocument(doc), 'application/json');
    notify('Saved a JSON copy to your downloads. Open it later with File → Open.');
  }, [doc, notify]);

  const readFile = (file: File) => {
    file
      .text()
      .then((text) => {
        const parsed = parseResumeJson(text);
        setPending({ ...parsed, fileName: file.name });
      })
      .catch((err: unknown) => {
        showError(err instanceof ImportError ? err.message : "That file couldn't be read.");
      });
  };

  const confirmOpen = () => {
    if (!pending) return;
    replace(pending.doc);
    setOpenId(null);
    setPending(null);
    notify(`Opened ${pending.fileName}.`, true);
  };

  const startNew = (kind: 'blank' | 'sample') => {
    replace(kind === 'blank' ? blankDocument() : sampleDocument());
    setOpenId(kind === 'blank' ? 'profile' : null);
    setTab('content');
    notify(kind === 'blank' ? 'Started a blank resume.' : 'Loaded the sample resume.', true);
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
        saveJson();
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
  }, [undo, redo, saveJson, requestPdf, viewOnly]);

  const editSection = (id: string) => {
    setTab('content');
    setOpenId(id);
  };

  const saved = !stored.ok ? 'failed' : stored.doc === doc ? 'saved' : 'saving';
  const overflowPages = doc.pages.map((p, i) => (overflow[p.id] !== undefined ? i + 1 : 0)).filter(Boolean);

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
              <span className={`save-status save-status--${saved}`} title="Your work is kept in this browser. Use Save JSON to keep a file.">
                {saved === 'failed' ? 'Not saved in browser' : saved === 'saving' ? 'Saving…' : 'Saved in browser'}
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
                <MenuItem icon={<FileText size={16} />} onClick={() => startNew('sample')}>Load sample resume</MenuItem>
                <MenuItem icon={<FolderOpen size={16} />} hint="Ctrl+O" onClick={() => fileInput.current?.click()}>Open JSON file…</MenuItem>
                <MenuItem icon={<FileJson size={16} />} hint="Ctrl+S" onClick={saveJson}>Save as JSON</MenuItem>
              </Menu>
            )}
            <Menu label="Download" primary={!viewOnly} tour="download" icon={<Download size={16} />}>
              <MenuItem icon={<FileDown size={16} />} onClick={savePdf}>PDF</MenuItem>
              <MenuItem icon={<Printer size={16} />} hint="Ctrl+P" onClick={requestPdf}>Print to PDF (sharpest text)</MenuItem>
              <MenuItem icon={<FileCode size={16} />} onClick={saveHtml}>HTML web page</MenuItem>
              <MenuItem icon={<FileJson size={16} />} onClick={saveJson}>JSON (to edit later)</MenuItem>
            </Menu>
            {viewOnly && (
              <button type="button" className="btn btn--primary" onClick={() => startEditing()}>
                <Pencil size={15} /> Edit in the builder
              </button>
            )}
          </div>
        </header>

        <main className={`workspace${viewOnly ? ' workspace--view' : ''}`}>
          {loadingShared && <div className="loading-cover">Opening resume…</div>}
          {!viewOnly && (
            <aside className="editor" data-tour="editor">
              <nav className="tabs" role="tablist">
                {(['content', 'layout', 'design'] as Tab[]).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
                    {t === 'content' ? 'Content' : t === 'layout' ? 'Layout' : 'Design'}
                    {t === 'layout' && overflowPages.length > 0 && <span className="tab-dot" title="A page has content cut off" />}
                  </button>
                ))}
              </nav>
              <div className="editor-scroll">
                {tab === 'content' && <ContentPanel doc={doc} update={update} openId={openId} setOpenId={setOpenId} notify={notify} />}
                {tab === 'layout' && <LayoutPanel doc={doc} update={update} overflow={overflow} onEditSection={editSection} onAutoFit={autoFit} notify={notify} />}
                {tab === 'design' && <DesignPanel doc={doc} update={update} onAutoFit={autoFit} notify={notify} />}
              </div>
            </aside>
          )}
          <Preview
            doc={doc}
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

        {dragging && <div className="drop-overlay">Drop a resume JSON file to open it</div>}

        {pending && (
          <Dialog
            title={`Open “${pending.doc.title}”?`}
            onClose={() => setPending(null)}
            actions={
              <>
                <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>Cancel</button>
                <button type="button" className="btn btn--ghost" onClick={saveJson}>Save current first</button>
                <button type="button" className="btn btn--primary" onClick={confirmOpen} autoFocus>Open</button>
              </>
            }
          >
            <p>
              This replaces what’s in the editor with <strong>{pending.fileName}</strong>
              {pending.doc.profile.name && <> ({pending.doc.profile.name})</>}: {pending.doc.sections.length} sections on {pending.doc.pages.length}{' '}
              {pending.doc.pages.length === 1 ? 'page' : 'pages'}. You can get your current resume back with Undo.
            </p>
            {pending.migrated && (
              <p className="hint">This file is from an older version of Resume Builder. It’s been converted; check the layout and save a new copy.</p>
            )}
          </Dialog>
        )}

        {touring && !viewOnly && !loadingShared && <Tour steps={tourSteps} onClose={endTour} />}

        {confirmEdit && (
          <Dialog
            title="Replace the resume saved in this browser?"
            onClose={() => setConfirmEdit(null)}
            actions={
              <>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmEdit(null)}>Cancel</button>
                <button type="button" className="btn btn--ghost" onClick={() => downloadFile(`${fileStem(confirmEdit)}.json`, serializeDocument(confirmEdit), 'application/json')}>
                  Download mine first
                </button>
                <button type="button" className="btn btn--primary" autoFocus onClick={() => startEditing(true)}>Edit this one</button>
              </>
            }
          >
            <p>
              You already have a resume{confirmEdit.profile.name && <> for <strong>{confirmEdit.profile.name}</strong></>} saved in this browser. Editing this one replaces it.
              Download yours first if you want to keep it.
            </p>
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
        <ResumeView doc={doc} />
      </div>
    </>
  );
}
