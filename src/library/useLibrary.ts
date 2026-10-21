import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ResumeDocument } from '../model/types';
import { downloadFile } from '../model/io';
import type { CopyOptions, Library } from './library';
import {
  INDEX_FILE,
  addResume,
  deleteResume,
  duplicateResume,
  findById,
  fixDefault,
  folderOf,
  libraryFromDocs,
  moveResume,
  renameResume,
  serializeBundle,
  serializeIndex,
  serializeResumeFile,
  slugify,
  sortedPaths,
} from './library';
import type { DirHandle, Stamps } from './folder';
import { diffStamps, inspectFolder, readFolder, readResumeFile, removeFile, stampOfPath, statFolder, writeLibrary, writeSupportFiles, writeText } from './folder';
import {
  forgetFolder,
  hasPermission,
  loadActivePath,
  loadBrowserLibrary,
  rememberFolder,
  rememberedFolder,
  requestPermission,
  saveActivePath,
  saveBrowserLibrary,
} from './storage';

/** How often to look for changes made to the folder by other programs. */
const POLL_MS = 2500;

export type SaveState = 'saved' | 'saving' | 'failed' | 'conflict';

export type Place = { kind: 'browser' } | { kind: 'folder'; name: string };

/** The open resume changed on disk while it also had unsaved edits here. */
export interface Conflict {
  path: string;
  /** The version on disk, or null if the file was deleted. */
  disk: ResumeDocument | null;
}

/** A folder the person picked that needs a decision before it's used. */
export interface FolderQuestion {
  handle: DirHandle;
  kind: 'other' | 'empty-open';
  entries: string[];
}

export interface Boot {
  lib: Library;
  active: string;
}

/** The library and resume to start with, before any folder reconnects. */
export function bootLibrary(fallback: () => ResumeDocument): Boot {
  const lib = fixDefault(loadBrowserLibrary(fallback));
  const remembered = loadActivePath();
  const active = remembered && lib.files[remembered] ? remembered : lib.defaultPath;
  return { lib, active };
}

interface Options {
  boot: Boot;
  /** The open resume (from the undo history). */
  doc: ResumeDocument;
  /** Show another resume, starting a fresh undo history. */
  resetDoc: (doc: ResumeDocument) => void;
  /** False while a shared resume is only being viewed. */
  enabled: boolean;
  notify: (message: string, undoable?: boolean, action?: { label: string; run: () => void }) => void;
  showError: (message: string) => void;
}

export function useLibrary({ boot, doc, resetDoc, enabled, notify, showError }: Options) {
  const [lib, setLibState] = useState<Library>(boot.lib);
  const [activePath, setActivePath] = useState(boot.active);
  const [place, setPlace] = useState<Place>({ kind: 'browser' });
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [reconnect, setReconnect] = useState<DirHandle | null>(null);
  const [question, setQuestion] = useState<FolderQuestion | null>(null);

  // Mirrors for async code, which must see the latest values.
  const libRef = useRef(lib);
  const activeRef = useRef(activePath);
  const docRef = useRef(doc);
  useLayoutEffect(() => {
    docRef.current = doc;
  }, [doc]);
  const handleRef = useRef<DirHandle | null>(null);
  /** Stamp of every file as last read or written by the app. */
  const knownRef = useRef<Stamps>({});
  /** Text of each resume as last read or written, to tell local edits from disk ones. */
  const syncedRef = useRef<Record<string, string>>({});
  /** The browser library, kept aside while a folder is connected. */
  const browserLibRef = useRef(boot.lib);
  /** Broken files already reported, by path and stamp, so each is reported once. */
  const reportedRef = useRef<Record<string, string>>({});
  /** Folder operations run one at a time, so a save and a scan never interleave. */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const setLib = useCallback((next: Library) => {
    libRef.current = next;
    setLibState(next);
  }, []);

  const setActive = useCallback((path: string) => {
    activeRef.current = path;
    setActivePath(path);
    saveActivePath(path);
  }, []);

  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = queueRef.current.then(task, task);
    queueRef.current = run.catch(() => undefined);
    return run;
  }, []);

  const folderError = useCallback(
    (err: unknown) => {
      setSaveState('failed');
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        showError('Lost permission to the folder. Use “Reconnect” to allow access again.');
        if (handleRef.current) setReconnect(handleRef.current);
      } else {
        showError(`Couldn't update the folder: ${err instanceof Error ? err.message : 'unknown error'}.`);
      }
    },
    [showError],
  );

  // ---- Keep the library in step with the open resume ----------------------

  useEffect(() => {
    if (!enabled) return;
    const current = libRef.current;
    const path = activeRef.current;
    if (current.files[path] && current.files[path] !== doc) setLib({ ...current, files: { ...current.files, [path]: doc } });
  }, [doc, enabled, setLib]);

  // ---- Saving: browser --------------------------------------------------------

  useEffect(() => {
    if (place.kind !== 'browser' || !enabled) return;
    // Show "Saving…" for the length of the debounce.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveState('saving');
    const timer = setTimeout(() => {
      browserLibRef.current = lib;
      setSaveState(saveBrowserLibrary(lib) ? 'saved' : 'failed');
    }, 400);
    return () => clearTimeout(timer);
  }, [lib, place.kind, enabled]);

  // ---- Saving: folder ---------------------------------------------------------

  const writeResume = useCallback(async (root: DirHandle, path: string, resume: ResumeDocument) => {
    const text = serializeResumeFile(resume);
    knownRef.current[path] = await writeText(root, path, text);
    syncedRef.current[path] = text;
  }, []);

  const writeIndex = useCallback(async (root: DirHandle, next: Library) => {
    knownRef.current[INDEX_FILE] = await writeText(root, INDEX_FILE, serializeIndex(next));
  }, []);

  /** Save the open resume to its file, unless someone else changed the file first. */
  const saveActive = useCallback(async () => {
    const root = handleRef.current;
    const path = activeRef.current;
    if (!root || !libRef.current.files[path]) return;
    const text = serializeResumeFile(docRef.current);
    if (text === syncedRef.current[path]) return setSaveState('saved');
    const onDisk = await stampOfPath(root, path);
    if (onDisk !== null && path in knownRef.current && onDisk !== knownRef.current[path]) {
      const { doc: disk, stamp } = await readResumeFile(root, path);
      knownRef.current[path] = stamp;
      setConflict({ path, disk });
      return setSaveState('conflict');
    }
    await writeResume(root, path, docRef.current);
    setSaveState('saved');
  }, [writeResume]);

  useEffect(() => {
    if (place.kind !== 'folder' || !enabled || conflict) return;
    if (serializeResumeFile(doc) === syncedRef.current[activeRef.current]) return;
    setSaveState('saving');
    const timer = setTimeout(() => void enqueue(saveActive).catch(folderError), 600);
    return () => clearTimeout(timer);
  }, [doc, place.kind, enabled, conflict, enqueue, saveActive, folderError]);

  // ---- Seeing changes made outside the app -------------------------------------

  const poll = useCallback(async () => {
    const root = handleRef.current;
    if (!root || document.hidden) return;
    const stamps = await statFolder(root);
    const { changed, added, removed } = diffStamps(knownRef.current, stamps);
    if (!changed.length && !added.length && !removed.length) return;

    let next = libRef.current;
    let active = activeRef.current;
    let reloadedActive: ResumeDocument | null = null;
    const updated: string[] = [];

    for (const path of [...changed, ...added]) {
      if (path === INDEX_FILE) {
        const contents = await readFolder(root);
        if (contents.index) next = fixDefault({ ...next, name: contents.index.name, defaultPath: contents.index.defaultPath });
        knownRef.current[INDEX_FILE] = stamps[INDEX_FILE];
        continue;
      }
      try {
        const { doc: disk, stamp } = await readResumeFile(root, path);
        knownRef.current[path] = stamp;
        const diskText = serializeResumeFile(disk);
        if (path === active) {
          const local = serializeResumeFile(docRef.current);
          if (local === diskText) {
            syncedRef.current[path] = diskText;
            continue;
          }
          if (local !== syncedRef.current[path]) {
            // Edited here and there: let the person choose.
            setConflict({ path, disk });
            setSaveState('conflict');
            continue;
          }
          reloadedActive = disk;
        }
        syncedRef.current[path] = diskText;
        next = { ...next, files: { ...next.files, [path]: disk } };
        updated.push(path);
      } catch (err) {
        knownRef.current[path] = stamps[path];
        if (reportedRef.current[path] !== stamps[path]) {
          reportedRef.current[path] = stamps[path];
          showError(`Couldn't read ${path}: ${err instanceof Error ? err.message : 'unreadable file'} Fix the file and it will load.`);
        }
      }
    }

    let activeDeleted: ResumeDocument | null = null;
    for (const path of removed) {
      delete knownRef.current[path];
      delete syncedRef.current[path];
      if (path === INDEX_FILE || !next.files[path]) continue;
      if (path === active) activeDeleted = next.files[path];
      const files = { ...next.files };
      delete files[path];
      next = fixDefault({ ...next, files });
    }

    if (activeDeleted) {
      const lost = activeDeleted;
      const lostPath = active;
      if (!Object.keys(next.files).length) {
        // Never leave the editor without a resume: keep this one, rewritten.
        next = { ...next, files: { [lostPath]: lost }, defaultPath: lostPath };
        await writeResume(root, lostPath, lost);
      } else {
        active = next.defaultPath;
        setActive(active);
        resetDoc(next.files[active]);
        notify(`“${lost.title}” was deleted from the folder.`, false, {
          label: 'Restore it',
          run: () =>
            void enqueue(async () => {
              await writeResume(root, lostPath, lost);
              setLib({ ...libRef.current, files: { ...libRef.current.files, [lostPath]: lost } });
            }).catch(folderError),
        });
      }
    }

    setLib(next);
    if (reloadedActive) {
      resetDoc(reloadedActive);
      notify(`Updated “${reloadedActive.title}” from the folder.`);
    } else if (updated.length && !activeDeleted) {
      notify(updated.length === 1 ? `Loaded changes to ${updated[0].split('/').pop()} from the folder.` : `Loaded changes to ${updated.length} resumes from the folder.`);
    }
  }, [enqueue, folderError, notify, resetDoc, setActive, setLib, showError, writeResume]);

  useEffect(() => {
    if (place.kind !== 'folder' || !enabled) return;
    const check = () => void enqueue(poll).catch(folderError);
    const timer = setInterval(check, POLL_MS);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [place.kind, enabled, enqueue, poll, folderError]);

  // ---- Changing the library ------------------------------------------------------

  /** Apply a change: update state now, then write the affected files to the folder. */
  const apply = useCallback(
    (next: Library, { write = [], remove = [] }: { write?: string[]; remove?: string[] }) => {
      const before = libRef.current;
      setLib(next);
      const root = handleRef.current;
      if (!root) return;
      void enqueue(async () => {
        for (const path of write) await writeResume(root, path, next.files[path]);
        for (const path of remove) {
          await removeFile(root, path);
          delete knownRef.current[path];
          delete syncedRef.current[path];
        }
        if (next.name !== before.name || next.defaultPath !== before.defaultPath) await writeIndex(root, next);
      }).catch(folderError);
    },
    [enqueue, folderError, setLib, writeIndex, writeResume],
  );

  const open = useCallback(
    (path: string) => {
      const resume = libRef.current.files[path];
      if (!resume || path === activeRef.current) return;
      setActive(path);
      resetDoc(resume);
    },
    [resetDoc, setActive],
  );

  /** Add a resume (opened file, new blank, shared link) and open it. */
  const addAndOpen = useCallback(
    (resume: ResumeDocument, folder = '') => {
      const { lib: next, path } = addResume(libRef.current, resume, folder);
      apply(next, { write: [path] });
      setActive(path);
      resetDoc(next.files[path]);
      return path;
    },
    [apply, resetDoc, setActive],
  );

  const duplicate = useCallback(
    (from: string, opts: CopyOptions) => {
      const { lib: next, path } = duplicateResume(libRef.current, from, opts);
      apply(next, { write: [path] });
      setActive(path);
      resetDoc(next.files[path]);
      notify(`Made “${next.files[path].title}”, a copy of “${libRef.current.files[from]?.title ?? next.files[from].title}”.`);
    },
    [apply, notify, resetDoc, setActive],
  );

  const relocate = useCallback(
    (path: string, result: { lib: Library; path: string }) => {
      if (result.path === path && result.lib.files[path] === libRef.current.files[path]) return;
      apply(result.lib, { write: [result.path], remove: result.path === path ? [] : [path] });
      if (activeRef.current === path) {
        setActive(result.path);
        resetDoc(result.lib.files[result.path]);
      }
    },
    [apply, resetDoc, setActive],
  );

  const rename = useCallback((path: string, title: string) => relocate(path, renameResume(libRef.current, path, title)), [relocate]);
  const move = useCallback((path: string, folder: string) => relocate(path, moveResume(libRef.current, path, folder)), [relocate]);

  const remove = useCallback(
    (path: string) => {
      const before = libRef.current;
      const resume = before.files[path];
      if (!resume || Object.keys(before.files).length < 2) return;
      const next = deleteResume(before, path);
      apply(next, { remove: [path] });
      if (activeRef.current === path) {
        setActive(next.defaultPath);
        resetDoc(next.files[next.defaultPath]);
      }
      notify(`Deleted “${resume.title}”.`, false, {
        label: 'Undo',
        run: () => {
          const restored = { ...libRef.current, files: { ...libRef.current.files, [path]: resume } };
          apply(before.defaultPath === path ? { ...restored, defaultPath: path } : restored, { write: [path] });
        },
      });
    },
    [apply, notify, resetDoc, setActive],
  );

  const setDefault = useCallback((path: string) => apply({ ...libRef.current, defaultPath: path }, {}), [apply]);
  const setName = useCallback((name: string) => apply({ ...libRef.current, name: name.trim() || 'My resumes' }, {}), [apply]);

  /** Add every resume from an opened library file, keeping their folders. */
  const importLibrary = useCallback(
    (other: Library) => {
      let next = libRef.current;
      const written: string[] = [];
      for (const path of sortedPaths(other)) {
        // Skip resumes that are already here, unchanged.
        const same = findById(next, other.files[path].id);
        if (same && serializeResumeFile(next.files[same]) === serializeResumeFile(other.files[path])) continue;
        const result = addResume(next, other.files[path], folderOf(path));
        next = result.lib;
        written.push(result.path);
      }
      apply(next, { write: written });
      if (written[0]) {
        setActive(written[0]);
        resetDoc(next.files[written[0]]);
      }
      return written.length;
    },
    [apply, resetDoc, setActive],
  );

  // ---- Folders -----------------------------------------------------------------

  /** Start using a folder: read its library, or write the current one into it. */
  const connectFolder = useCallback(
    (handle: DirHandle, mode: 'open' | 'setup') =>
      enqueue(async () => {
        if (mode === 'setup') await writeLibrary(handle, libRef.current);
        const contents = await readFolder(handle);
        let next: Library = fixDefault({
          name: contents.index?.name ?? libRef.current.name,
          defaultPath: contents.index?.defaultPath ?? '',
          files: contents.files,
        });
        if (!Object.keys(next.files).length) {
          // A folder with library.json but no resumes yet: start with the open one.
          next = libraryFromDocs(next.name, [docRef.current]);
          await writeLibrary(handle, next);
          Object.assign(contents.stamps, await statFolder(handle));
        } else {
          if (!contents.index) await writeText(handle, INDEX_FILE, serializeIndex(next));
          await writeSupportFiles(handle, next.name);
        }
        knownRef.current = await statFolder(handle);
        syncedRef.current = Object.fromEntries(Object.entries(next.files).map(([p, d]) => [p, serializeResumeFile(d)]));
        reportedRef.current = {};
        for (const broken of contents.broken) {
          reportedRef.current[broken.path] = knownRef.current[broken.path];
          showError(`Couldn't read ${broken.path}: ${broken.message}`);
        }
        if (handleRef.current === null) browserLibRef.current = libRef.current;
        handleRef.current = handle;
        await rememberFolder(handle);
        setLib(next);
        setPlace({ kind: 'folder', name: handle.name });
        setReconnect(null);
        setConflict(null);
        setSaveState('saved');
        const remembered = loadActivePath();
        const active = remembered && next.files[remembered] ? remembered : next.defaultPath;
        activeRef.current = '';
        setActive(active);
        resetDoc(next.files[active]);
        const count = Object.keys(next.files).length;
        notify(
          mode === 'setup'
            ? `Set up “${handle.name}”: ${count} ${count === 1 ? 'resume' : 'resumes'} saved there. Edits now save to the folder.`
            : `Opened “${handle.name}” (${count} ${count === 1 ? 'resume' : 'resumes'}). Edits save to the folder.`,
        );
      }).catch((err) => {
        showError(`Couldn't use that folder: ${err instanceof Error ? err.message : 'unknown error'}.`);
      }),
    [enqueue, notify, resetDoc, setActive, setLib, showError],
  );

  /** A folder was picked from the File menu. */
  const chooseFolder = useCallback(
    async (handle: DirHandle, intent: 'open' | 'setup') => {
      const { kind, entries } = await inspectFolder(handle);
      if (kind === 'library') return connectFolder(handle, 'open');
      if (kind === 'empty' && intent === 'setup') return connectFolder(handle, 'setup');
      setQuestion({ handle, kind: kind === 'empty' ? 'empty-open' : 'other', entries });
    },
    [connectFolder],
  );

  const disconnect = useCallback(() => {
    void enqueue(async () => {
      if (handleRef.current && place.kind === 'folder') await saveActive().catch(() => undefined);
    }).finally(() => {
      handleRef.current = null;
      void forgetFolder();
      knownRef.current = {};
      syncedRef.current = {};
      const browser = browserLibRef.current;
      setLib(browser);
      setPlace({ kind: 'browser' });
      setConflict(null);
      setReconnect(null);
      const active = browser.files[activeRef.current] ? activeRef.current : browser.defaultPath;
      activeRef.current = '';
      setActive(active);
      resetDoc(browser.files[active]);
      notify('Closed the folder. Now editing the resumes saved in this browser.');
    });
  }, [enqueue, notify, place.kind, resetDoc, saveActive, setActive, setLib]);

  /** Try the folder from last time; if the browser wants a click first, offer a button. */
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const handle = await rememberedFolder();
      if (!handle || cancelled) return;
      if (await hasPermission(handle)) {
        if (!cancelled) void connectFolder(handle, 'open');
      } else if (!cancelled) setReconnect(handle);
    })();
    return () => {
      cancelled = true;
    };
    // Only on start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reconnectFolder = useCallback(async () => {
    const handle = reconnect;
    if (!handle) return;
    if (await requestPermission(handle)) void connectFolder(handle, 'open');
    else showError('The browser didn’t allow access to the folder.');
  }, [reconnect, showError, connectFolder]);

  const dismissReconnect = useCallback(() => {
    setReconnect(null);
    void forgetFolder();
  }, []);

  // ---- Conflicts -----------------------------------------------------------------

  const resolveConflict = useCallback(
    (choice: 'disk' | 'mine' | 'both') => {
      const c = conflict;
      const root = handleRef.current;
      if (!c || !root) return;
      setConflict(null);
      void enqueue(async () => {
        const mine = docRef.current;
        if (choice === 'mine' || !c.disk) {
          await writeResume(root, c.path, mine);
        } else {
          let next = { ...libRef.current, files: { ...libRef.current.files, [c.path]: c.disk } };
          if (choice === 'both') {
            const copy = addResume(next, { ...mine, title: `${mine.title} (my edits)` }, folderOf(c.path));
            next = copy.lib;
            await writeResume(root, copy.path, next.files[copy.path]);
          }
          syncedRef.current[c.path] = serializeResumeFile(c.disk);
          setLib(next);
          resetDoc(c.disk);
        }
        setSaveState('saved');
      }).catch(folderError);
    },
    [conflict, enqueue, folderError, resetDoc, setLib, writeResume],
  );

  /** Save now (Ctrl+S in a folder). */
  const saveNow = useCallback(() => {
    if (handleRef.current) void enqueue(saveActive).catch(folderError);
  }, [enqueue, folderError, saveActive]);

  const downloadLibrary = useCallback(() => {
    const current = libRef.current;
    downloadFile(`${slugify(current.name)}.library.json`, serializeBundle(current), 'application/json');
  }, []);

  return {
    lib,
    activePath,
    place,
    saveState,
    conflict,
    reconnect: reconnect ? reconnect.name : null,
    question,
    open,
    addAndOpen,
    duplicate,
    rename,
    move,
    remove,
    setDefault,
    setName,
    importLibrary,
    chooseFolder,
    answerQuestion: (yes: boolean) => {
      const q = question;
      setQuestion(null);
      if (q && yes) void connectFolder(q.handle, 'setup');
    },
    disconnect,
    reconnectFolder,
    dismissReconnect,
    resolveConflict,
    saveNow,
    downloadLibrary,
  };
}

export type LibraryApi = ReturnType<typeof useLibrary>;
