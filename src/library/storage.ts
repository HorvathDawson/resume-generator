import type { ResumeDocument } from '../model/types';
import type { Library } from './library';
import { libraryFromDocs, parseAnyFile, serializeBundle } from './library';
import type { DirHandle } from './folder';

// Where the library lives when no folder is connected: this browser's storage.
// Also remembers which folder was connected, so the next visit can reconnect.

const LIBRARY_KEY = 'resume-generator:library';
const ACTIVE_KEY = 'resume-generator:active';
/** Where the app kept its single resume before libraries existed. */
const OLD_DOCUMENT_KEY = 'resume-generator:document';

export function loadBrowserLibrary(fallback: () => ResumeDocument): Library {
  try {
    const text = localStorage.getItem(LIBRARY_KEY);
    if (text) {
      const opened = parseAnyFile(text);
      if (opened.kind === 'library' && Object.keys(opened.lib.files).length) return opened.lib;
    }
    const old = localStorage.getItem(OLD_DOCUMENT_KEY);
    if (old) {
      const opened = parseAnyFile(old);
      if (opened.kind === 'resume') return libraryFromDocs('My resumes', [opened.doc]);
    }
  } catch {
    // Unreadable or blocked storage: start fresh below.
  }
  return libraryFromDocs('My resumes', [fallback()]);
}

/** Returns false when the browser refused to store the library (full or blocked). */
export function saveBrowserLibrary(lib: Library): boolean {
  try {
    localStorage.setItem(LIBRARY_KEY, serializeBundle(lib));
    return true;
  } catch {
    return false;
  }
}

export function loadActivePath(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActivePath(path: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, path);
  } catch {
    // Not important: the default resume opens instead.
  }
}

// ---- Remembered folder (IndexedDB can store folder handles; localStorage can't) ----

const DB_NAME = 'resume-generator';
const STORE = 'handles';
const FOLDER_KEY = 'folder';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function rememberFolder(handle: DirHandle): Promise<void> {
  await withStore('readwrite', (s) => s.put(handle, FOLDER_KEY)).catch(() => undefined);
}

export async function forgetFolder(): Promise<void> {
  await withStore('readwrite', (s) => s.delete(FOLDER_KEY)).catch(() => undefined);
}

export async function rememberedFolder(): Promise<DirHandle | null> {
  try {
    return ((await withStore('readonly', (s) => s.get(FOLDER_KEY))) as DirHandle | undefined) ?? null;
  } catch {
    return null;
  }
}

// ---- Permissions on a real folder handle ----

type PermissionHandle = DirHandle & {
  queryPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>;
};

export async function hasPermission(handle: DirHandle): Promise<boolean> {
  const h = handle as PermissionHandle;
  return !h.queryPermission || (await h.queryPermission({ mode: 'readwrite' })) === 'granted';
}

/** Must run from a click: browsers only show the permission prompt on a user gesture. */
export async function requestPermission(handle: DirHandle): Promise<boolean> {
  const h = handle as PermissionHandle;
  if (!h.requestPermission) return true;
  return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
}

export const canUseFolders = (): boolean => typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/** Ask the person to choose a folder. Resolves null if they cancel. */
export async function pickFolder(): Promise<DirHandle | null> {
  const picker = (window as unknown as { showDirectoryPicker: (o: object) => Promise<DirHandle> }).showDirectoryPicker;
  try {
    return await picker({ id: 'resume-library', mode: 'readwrite' });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null;
    throw err;
  }
}
