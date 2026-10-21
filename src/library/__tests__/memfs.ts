import type { DirHandle, FileHandle, FileLike } from '../folder';

// An in-memory folder with the same surface as the browser's
// FileSystemDirectoryHandle, for tests. `clock` advances on every write so
// lastModified changes the way it does on disk.

let clock = 1_000;

class MemFile implements FileHandle {
  readonly kind = 'file' as const;
  readonly name: string;
  content = '';
  modified = 0;
  constructor(name: string) {
    this.name = name;
  }
  async getFile(): Promise<FileLike> {
    const text = this.content;
    return { text: async () => text, lastModified: this.modified, size: new TextEncoder().encode(text).length };
  }
  async createWritable() {
    let buffer = '';
    return {
      write: async (data: string) => void (buffer += data),
      close: async () => {
        this.content = buffer;
        this.modified = ++clock;
      },
    };
  }
}

async function descend(start: DirHandle, parts: string[], create: boolean): Promise<DirHandle> {
  let dir = start;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create });
  return dir;
}

export class MemDir implements DirHandle {
  readonly kind = 'directory' as const;
  readonly name: string;
  children = new Map<string, MemDir | MemFile>();
  constructor(name = 'root') {
    this.name = name;
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirHandle> {
    const found = this.children.get(name);
    if (found instanceof MemDir) return found;
    if (found || !options?.create) throw new DOMException(`${name} not found`, 'NotFoundError');
    const dir = new MemDir(name);
    this.children.set(name, dir);
    return dir;
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle> {
    const found = this.children.get(name);
    if (found instanceof MemFile) return found;
    if (found || !options?.create) throw new DOMException(`${name} not found`, 'NotFoundError');
    const file = new MemFile(name);
    this.children.set(name, file);
    return file;
  }

  async removeEntry(name: string): Promise<void> {
    if (!this.children.delete(name)) throw new DOMException(`${name} not found`, 'NotFoundError');
  }

  async *entries(): AsyncIterable<[string, DirHandle | FileHandle]> {
    for (const entry of [...this.children]) yield entry;
  }

  /** Test helper: write a file the way another program would. */
  async put(path: string, text: string): Promise<void> {
    const parts = path.split('/');
    const dir = await descend(this, parts.slice(0, -1), true);
    const file = await dir.getFileHandle(parts[parts.length - 1], { create: true });
    const w = await file.createWritable();
    await w.write(text);
    await w.close();
  }

  /** Test helper: read a file's text, or null. */
  async read(path: string): Promise<string | null> {
    try {
      const parts = path.split('/');
      const dir = await descend(this, parts.slice(0, -1), false);
      return await (await (await dir.getFileHandle(parts[parts.length - 1])).getFile()).text();
    } catch {
      return null;
    }
  }

  /** Test helper: every file path under this folder. */
  async list(prefix = ''): Promise<string[]> {
    const out: string[] = [];
    for (const [name, child] of this.children) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (child instanceof MemDir) out.push(...(await child.list(path)));
      else out.push(path);
    }
    return out.sort();
  }
}
