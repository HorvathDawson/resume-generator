import type { ResumeDocument } from '../model/types';
import { ImportError, parseResumeJson, serializeDocument } from '../model/io';
import { uid } from '../model/defaults';
import { AGENT_GUIDE } from './guide';

// A library is a set of resumes kept as separate files in folders:
//
//   library.json                      name, default resume, short agent guide
//   resumes/master.resume.json        one ResumeDocument per file
//   resumes/robotics/acme.resume.json
//
// On disk (a folder, often a git repo) the files are the source of truth.
// As a single download the same paths are bundled into one JSON file.

export const LIBRARY_SCHEMA = 'resume-library';
export const LIBRARY_VERSION = 1;
export const RESUME_EXT = '.resume.json';
export const RESUMES_DIR = 'resumes';
export const INDEX_FILE = 'library.json';

export interface Library {
  name: string;
  /** Path of the resume to open first. */
  defaultPath: string;
  /** Every resume, keyed by its path, e.g. "resumes/robotics/acme.resume.json". */
  files: Record<string, ResumeDocument>;
}

/** Contents of library.json in a folder. */
export interface LibraryIndex {
  schema: typeof LIBRARY_SCHEMA;
  version: number;
  name: string;
  defaultResume: string;
  agentGuide: string[];
}

/** A whole library in one file: the index plus every resume, keyed by path. */
export interface LibraryBundle extends LibraryIndex {
  files: Record<string, ResumeDocument>;
}

// ---- Paths ------------------------------------------------------------------

const slugPart = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export function slugify(text: string): string {
  return slugPart(text) || 'resume';
}

/** Clean a folder name typed by a user ("Robotics / Jobs") into "robotics/jobs". */
export function cleanFolder(folder: string): string {
  return folder
    .split('/')
    .map(slugPart)
    .filter(Boolean)
    .join('/');
}

export function isResumePath(path: string): boolean {
  return path.startsWith(`${RESUMES_DIR}/`) && path.endsWith(RESUME_EXT) && !path.split('/').some((p) => p === '..' || p === '');
}

/** "resumes/robotics/acme.resume.json" → "robotics" ("" at the top level). */
export function folderOf(path: string): string {
  return path.split('/').slice(1, -1).join('/');
}

/** "resumes/robotics/acme.resume.json" → "acme" */
export function fileNameOf(path: string): string {
  return (path.split('/').pop() ?? '').slice(0, -RESUME_EXT.length);
}

export function pathFor(folder: string, slug: string): string {
  const dir = cleanFolder(folder);
  return [RESUMES_DIR, dir, `${slug}${RESUME_EXT}`].filter(Boolean).join('/');
}

/** A path in `folder` for a resume called `name` that no other resume uses. */
export function uniquePath(lib: Library, folder: string, name: string, except?: string): string {
  const slug = slugify(name);
  let path = pathFor(folder, slug);
  for (let n = 2; lib.files[path] && path !== except; n++) path = pathFor(folder, `${slug}-${n}`);
  return path;
}

/** Folders that hold at least one resume, sorted, "" (top level) first. */
export function foldersOf(lib: Library): string[] {
  return [...new Set(Object.keys(lib.files).map(folderOf))].sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));
}

/** Paths sorted by folder, then by title. */
export function sortedPaths(lib: Library): string[] {
  return Object.keys(lib.files).sort((a, b) => {
    const fa = folderOf(a);
    const fb = folderOf(b);
    if (fa !== fb) return fa === '' ? -1 : fb === '' ? 1 : fa.localeCompare(fb);
    return lib.files[a].title.localeCompare(lib.files[b].title);
  });
}

// ---- Building and changing a library ----------------------------------------

export function libraryFromDocs(name: string, docs: ResumeDocument[]): Library {
  const lib: Library = { name, defaultPath: '', files: {} };
  for (const doc of docs) lib.files[uniquePath(lib, '', doc.title)] = doc;
  lib.defaultPath = Object.keys(lib.files)[0] ?? '';
  return lib;
}

/** Make sure the default points at a resume that exists. */
export function fixDefault(lib: Library): Library {
  if (lib.files[lib.defaultPath]) return lib;
  return { ...lib, defaultPath: sortedPaths(lib)[0] ?? '' };
}

export function findById(lib: Library, id: string): string | undefined {
  return Object.keys(lib.files).find((p) => lib.files[p].id === id);
}

/** Add a resume (an opened file, a new blank one) under a free path. */
export function addResume(lib: Library, doc: ResumeDocument, folder = ''): { lib: Library; path: string } {
  // Keep ids unique so "based on" links stay unambiguous.
  const copy = findById(lib, doc.id) ? { ...doc, id: uid('resume') } : doc;
  const path = uniquePath(lib, folder, copy.title);
  return { lib: fixDefault({ ...lib, files: { ...lib.files, [path]: copy } }), path };
}

export interface CopyOptions {
  title: string;
  folder: string;
  target: string;
  notes: string;
}

/** Copy a resume to tailor it, recording which one it came from. */
export function duplicateResume(lib: Library, from: string, opts: CopyOptions): { lib: Library; path: string } {
  const source = lib.files[from];
  const doc: ResumeDocument = {
    ...structuredClone(source),
    id: uid('resume'),
    title: opts.title.trim() || `${source.title} copy`,
    updatedAt: new Date().toISOString(),
    meta: { basedOn: source.id, target: opts.target.trim(), notes: opts.notes.trim() },
  };
  return addResume(lib, doc, opts.folder);
}

/** Rename a resume; its file is renamed to match. */
export function renameResume(lib: Library, path: string, title: string): { lib: Library; path: string } {
  const doc = { ...lib.files[path], title: title.trim() || lib.files[path].title };
  return moveTo(lib, path, uniquePath(lib, folderOf(path), doc.title, path), doc);
}

export function moveResume(lib: Library, path: string, folder: string): { lib: Library; path: string } {
  const doc = lib.files[path];
  return moveTo(lib, path, uniquePath(lib, folder, fileNameOf(path), path), doc);
}

function moveTo(lib: Library, from: string, to: string, doc: ResumeDocument): { lib: Library; path: string } {
  const files = { ...lib.files };
  delete files[from];
  files[to] = doc;
  return { lib: { ...lib, files, defaultPath: lib.defaultPath === from ? to : lib.defaultPath }, path: to };
}

export function deleteResume(lib: Library, path: string): Library {
  const files = { ...lib.files };
  delete files[path];
  return fixDefault({ ...lib, files });
}

// ---- Files ------------------------------------------------------------------

export function libraryIndex(lib: Library): LibraryIndex {
  return { schema: LIBRARY_SCHEMA, version: LIBRARY_VERSION, name: lib.name, defaultResume: lib.defaultPath, agentGuide: AGENT_GUIDE };
}

export function serializeIndex(lib: Library): string {
  return `${JSON.stringify(libraryIndex(lib), null, 2)}\n`;
}

/** One resume file's text: what's written to disk and compared for changes. */
export function serializeResumeFile(doc: ResumeDocument): string {
  return `${serializeDocument(doc)}\n`;
}

export function serializeBundle(lib: Library): string {
  const files: Record<string, ResumeDocument> = {};
  for (const path of sortedPaths(lib)) files[path] = JSON.parse(serializeDocument(lib.files[path]));
  const bundle: LibraryBundle = { ...libraryIndex(lib), files };
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Read library.json (folder form). Unknown fields are ignored; bad ones get defaults. */
export function parseIndex(text: string): { name: string; defaultPath: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("library.json isn't valid JSON.");
  }
  if (!isObj(data) || data.schema !== LIBRARY_SCHEMA) throw new ImportError("library.json isn't a resume library index.");
  if (typeof data.version === 'number' && data.version > LIBRARY_VERSION) {
    throw new ImportError('This library was saved by a newer version of Resume Builder. Reload the page and try again.');
  }
  return {
    name: typeof data.name === 'string' && data.name.trim() ? data.name : 'My resumes',
    defaultPath: typeof data.defaultResume === 'string' ? data.defaultResume : '',
  };
}

export type OpenedFile =
  | { kind: 'library'; lib: Library; skipped: string[] }
  | { kind: 'resume'; doc: ResumeDocument; migrated: boolean };

/** Read any file the app can open: a library bundle, a single resume, or an old-format resume. */
export function parseAnyFile(text: string): OpenedFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("This file isn't valid JSON, so it can't be opened.");
  }
  if (isObj(data) && data.schema === LIBRARY_SCHEMA) {
    const { name, defaultPath } = parseIndex(text);
    if (!isObj(data.files)) throw new ImportError('This is a library index (library.json). Open its folder instead, or a library file saved from Resume Builder.');
    const files: Record<string, ResumeDocument> = {};
    const skipped: string[] = [];
    for (const [path, value] of Object.entries(data.files)) {
      try {
        if (!isResumePath(path)) throw new ImportError('bad path');
        files[path] = parseResumeJson(JSON.stringify(value)).doc;
      } catch {
        skipped.push(path);
      }
    }
    return { kind: 'library', lib: fixDefault({ name, defaultPath, files }), skipped };
  }
  return { kind: 'resume', ...parseResumeJson(text) };
}

