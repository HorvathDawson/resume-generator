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

export function downloadFile(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
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
