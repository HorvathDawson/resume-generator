import type { ResumeDocument } from '../model/types';
import { parseResumeJson } from '../model/io';
import type { Library } from './library';
import { INDEX_FILE, RESUMES_DIR, RESUME_EXT, isResumePath, parseIndex, serializeIndex, serializeResumeFile, fixDefault, sortedPaths } from './library';
import { agentsMarkdown, readmeMarkdown } from './guide';
import { resumeSchemaText } from './schema';

// Reading and writing a library folder through the File System Access API.
// Typed against the small part of the API used here, so tests can pass an
// in-memory folder and the browser's FileSystemDirectoryHandle fits as is.

export interface FileLike {
  text(): Promise<string>;
  readonly lastModified: number;
  readonly size: number;
}

export interface FileHandle {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<FileLike>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}

export interface DirHandle {
  readonly kind: 'directory';
  readonly name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>;
  removeEntry(name: string): Promise<void>;
  entries(): AsyncIterable<[string, DirHandle | FileHandle]>;
}

/** lastModified and size of each file; a file changed when its stamp did. */
export type Stamps = Record<string, string>;

const stampOf = (file: FileLike) => `${file.lastModified}:${file.size}`;

const SUPPORT_FILES = ['AGENTS.md', 'README.md', 'resume.schema.json'];
/** Folder entries that don't count as "something else is in here". */
const IGNORED = new Set(['.git', '.DS_Store', 'Thumbs.db', 'desktop.ini']);

async function dirOf(root: DirHandle, path: string, create: boolean): Promise<DirHandle> {
  let dir = root;
  for (const part of path.split('/').slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create });
  return dir;
}

async function fileOf(root: DirHandle, path: string): Promise<FileHandle | null> {
  try {
    return await (await dirOf(root, path, false)).getFileHandle(path.split('/').pop()!);
  } catch {
    return null;
  }
}

/** Every *.resume.json under resumes/, with its file handle. Skips hidden folders. */
async function walkResumes(root: DirHandle): Promise<Map<string, FileHandle>> {
  const found = new Map<string, FileHandle>();
  let resumes: DirHandle;
  try {
    resumes = await root.getDirectoryHandle(RESUMES_DIR);
  } catch {
    return found;
  }
  const walk = async (dir: DirHandle, prefix: string, depth: number) => {
    for await (const [name, handle] of dir.entries()) {
      if (name.startsWith('.')) continue;
      const path = `${prefix}/${name}`;
      if (handle.kind === 'directory') {
        if (depth < 8) await walk(handle, path, depth + 1);
      } else if (name.endsWith(RESUME_EXT) && isResumePath(path)) {
        found.set(path, handle);
      }
    }
  };
  await walk(resumes, RESUMES_DIR, 0);
  return found;
}

/** Cheap check of what's on disk: stamps of library.json and every resume file. */
export async function statFolder(root: DirHandle): Promise<Stamps> {
  const stamps: Stamps = {};
  const index = await fileOf(root, INDEX_FILE);
  if (index) stamps[INDEX_FILE] = stampOf(await index.getFile());
  for (const [path, handle] of await walkResumes(root)) stamps[path] = stampOf(await handle.getFile());
  return stamps;
}

/** Stamp of one file, or null if it doesn't exist. */
export async function stampOfPath(root: DirHandle, path: string): Promise<string | null> {
  const handle = await fileOf(root, path);
  return handle ? stampOf(await handle.getFile()) : null;
}

export interface FolderContents {
  /** null when the folder has no library.json. */
  index: { name: string; defaultPath: string } | null;
  files: Record<string, ResumeDocument>;
  stamps: Stamps;
  /** Resume files that couldn't be read, with the reason. */
  broken: { path: string; message: string }[];
}

export async function readResumeFile(root: DirHandle, path: string): Promise<{ doc: ResumeDocument; stamp: string }> {
  const handle = await fileOf(root, path);
  if (!handle) throw new Error('The file is gone.');
  const file = await handle.getFile();
  return { doc: parseResumeJson(await file.text()).doc, stamp: stampOf(file) };
}

export async function readFolder(root: DirHandle): Promise<FolderContents> {
  const contents: FolderContents = { index: null, files: {}, stamps: {}, broken: [] };
  const indexHandle = await fileOf(root, INDEX_FILE);
  if (indexHandle) {
    const file = await indexHandle.getFile();
    contents.stamps[INDEX_FILE] = stampOf(file);
    try {
      contents.index = parseIndex(await file.text());
    } catch (err) {
      contents.broken.push({ path: INDEX_FILE, message: err instanceof Error ? err.message : 'Unreadable' });
    }
  }
  for (const [path, handle] of await walkResumes(root)) {
    const file = await handle.getFile();
    contents.stamps[path] = stampOf(file);
    try {
      contents.files[path] = parseResumeJson(await file.text()).doc;
    } catch (err) {
      contents.broken.push({ path, message: err instanceof Error ? err.message : 'Unreadable' });
    }
  }
  return contents;
}

/** Write a text file (creating folders as needed) and return its new stamp. */
export async function writeText(root: DirHandle, path: string, text: string): Promise<string> {
  const dir = await dirOf(root, path, true);
  const handle = await dir.getFileHandle(path.split('/').pop()!, { create: true });
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return stampOf(await handle.getFile());
}

/** Delete a file, then any folders under resumes/ it leaves empty. */
export async function removeFile(root: DirHandle, path: string): Promise<void> {
  const parts = path.split('/');
  try {
    await (await dirOf(root, path, false)).removeEntry(parts[parts.length - 1]);
  } catch {
    return;
  }
  for (let depth = parts.length - 1; depth > 1; depth--) {
    const dirPath = parts.slice(0, depth).join('/');
    const dir = await dirOf(root, `${dirPath}/x`, false).catch(() => null);
    if (!dir) return;
    let empty = true;
    for await (const [name] of dir.entries()) {
      if (!IGNORED.has(name)) {
        empty = false;
        break;
      }
    }
    if (!empty) return;
    await (await dirOf(root, dirPath, false)).removeEntry(parts[depth - 1]).catch(() => undefined);
  }
}

export type FolderKind = 'empty' | 'library' | 'other';

/** What's in a folder the person picked: nothing, a library, or something else. */
export async function inspectFolder(root: DirHandle): Promise<{ kind: FolderKind; entries: string[] }> {
  const entries: string[] = [];
  for await (const [name] of root.entries()) if (!IGNORED.has(name)) entries.push(name);
  if (entries.includes(INDEX_FILE) || entries.includes(RESUMES_DIR)) return { kind: 'library', entries };
  return { kind: entries.length ? 'other' : 'empty', entries };
}

/** Write the guides and schema, but only where they're missing or out of date. */
export async function writeSupportFiles(root: DirHandle, name: string): Promise<void> {
  const wanted: Record<string, string> = {
    'AGENTS.md': agentsMarkdown(),
    'README.md': readmeMarkdown(name),
    'resume.schema.json': resumeSchemaText(),
  };
  for (const file of SUPPORT_FILES) {
    const handle = await fileOf(root, file);
    // README.md is the person's to edit once it exists.
    if (handle && (file === 'README.md' || (await (await handle.getFile()).text()) === wanted[file])) continue;
    await writeText(root, file, wanted[file]);
  }
}

/** Write a whole library into a folder: index, guides, schema and every resume. */
export async function writeLibrary(root: DirHandle, lib: Library): Promise<Stamps> {
  const fixed = fixDefault(lib);
  const stamps: Stamps = {};
  stamps[INDEX_FILE] = await writeText(root, INDEX_FILE, serializeIndex(fixed));
  await writeSupportFiles(root, fixed.name);
  for (const path of sortedPaths(fixed)) stamps[path] = await writeText(root, path, serializeResumeFile(fixed.files[path]));
  return stamps;
}

/** Paths whose stamp differs between two scans, split by what happened. */
export function diffStamps(before: Stamps, after: Stamps): { changed: string[]; added: string[]; removed: string[] } {
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  for (const path of Object.keys(after)) {
    if (!(path in before)) added.push(path);
    else if (before[path] !== after[path]) changed.push(path);
  }
  for (const path of Object.keys(before)) if (!(path in after)) removed.push(path);
  return { changed, added, removed };
}
