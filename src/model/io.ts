import type { ResumeDocument } from './types';
import { SCHEMA_ID, SCHEMA_VERSION } from './types';
import { normalizeDocument } from './normalize';
import { isLegacyResume, migrateLegacy } from './migrate';

export interface ParsedFile {
  doc: ResumeDocument;
  /** True when the file came from the previous version of the app. */
  migrated: boolean;
}

export class ImportError extends Error {}

/** Read the text of a saved resume file. Throws ImportError with a readable message. */
export function parseResumeJson(text: string): ParsedFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("This file isn't valid JSON, so it can't be opened.");
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new ImportError("This file doesn't contain a resume.");
  }
  const obj = data as Record<string, unknown>;
  if (obj.schema === SCHEMA_ID) {
    if (typeof obj.version === 'number' && obj.version > SCHEMA_VERSION) {
      throw new ImportError('This file was saved by a newer version of Resume Builder. Reload the page and try again.');
    }
    return { doc: normalizeDocument(obj), migrated: false };
  }
  if (isLegacyResume(obj)) {
    return { doc: normalizeDocument(migrateLegacy(obj)), migrated: true };
  }
  throw new ImportError("This file doesn't look like a resume saved by Resume Builder.");
}

export function serializeDocument(doc: ResumeDocument): string {
  return JSON.stringify({ ...doc, schema: SCHEMA_ID, version: SCHEMA_VERSION }, null, 2);
}

/** A safe file name stem like "jane-doe-resume". */
export function fileStem(doc: ResumeDocument): string {
  const base = doc.profile.name || doc.title || 'resume';
  const slug = base
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.includes('resume') ? slug : `${slug || 'my'}-resume`;
}

export function downloadFile(name: string, contents: string | Blob, type: string): void {
  const url = URL.createObjectURL(contents instanceof Blob ? contents : new Blob([contents], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Browser autosave -------------------------------------------------------

const STORAGE_KEY = 'resume-generator:document';

export function loadFromStorage(): ResumeDocument | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? parseResumeJson(text).doc : null;
  } catch {
    return null;
  }
}

/** Returns false when the browser refused to store the document. */
export function saveToStorage(doc: ResumeDocument): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    return true;
  } catch {
    return false;
  }
}

// ---- Shared links -------------------------------------------------------------

export interface SharedLink {
  url: string;
  /** Open in the read-only viewer instead of the editor. */
  view: boolean;
}

/**
 * Read a resume link from the page address:
 *   ?resume=jane          → ./resumes/jane.json, served with the app
 *   ?resume=https://…json → any URL that allows cross-origin requests
 * Add &mode=view to show the resume without the editor.
 */
export function sharedLinkFromUrl(search: string): SharedLink | null {
  const params = new URLSearchParams(search);
  const value = params.get('resume')?.trim();
  if (!value) return null;
  let url: string | null = null;
  if (/^https?:\/\//i.test(value)) url = value;
  else if (/^[\w-]+$/.test(value)) url = `./resumes/${value}.json`;
  if (!url) return null;
  return { url, view: params.get('mode') === 'view' };
}

/** Remove the resume link from the address bar so a reload doesn't fetch it again. */
export function clearSharedLink(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('resume');
  url.searchParams.delete('mode');
  window.history.replaceState(null, '', url);
}

export async function fetchResume(url: string): Promise<ParsedFile> {
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-cache' });
  } catch {
    throw new ImportError("Couldn't download the linked resume. Check the link, or that its site allows it to be loaded here.");
  }
  // Single-page hosts answer missing files with the app's own HTML page.
  const missing = response.status === 404 || response.headers.get('content-type')?.includes('text/html');
  if (missing) throw new ImportError("The linked resume wasn't found.");
  if (!response.ok) throw new ImportError(`Couldn't download the linked resume (error ${response.status}).`);
  return parseResumeJson(await response.text());
}
