import type { ResumeDocument } from '../../model/types';
import { TEMPLATES, applyTemplate, arrangeLayout } from '../../model/templates';
import { FOOTERS, SECTION_VARIANTS } from '../../model/variants';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { normalizeDocument } from '../../model/normalize';
import { blankDocument } from '../../model/defaults';
import { parseResumeJson, serializeDocument } from '../../model/io';
import sample from '../../data/sample.json';
import {
  addResume,
  cleanFolder,
  deleteResume,
  duplicateResume,
  folderOf,
  foldersOf,
  libraryFromDocs,
  moveResume,
  parseAnyFile,
  renameResume,
  serializeBundle,
  serializeResumeFile,
  slugify,
} from '../library';
import type { Library } from '../library';
import { diffStamps, inspectFolder, readFolder, removeFile, statFolder, writeLibrary, writeText } from '../folder';
import { RESUME_SCHEMA } from '../schema';
import { agentsMarkdown } from '../guide';
import { MemDir } from './memfs';

const root = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const dawson = () => parseResumeJson(read('public/resumes/dawson.json')).doc;
const sampleDoc = () => normalizeDocument(sample);

function twoResumeLibrary(): Library {
  return libraryFromDocs('My resumes', [{ ...dawson(), title: 'Master' }, { ...sampleDoc(), title: 'Sample' }]);
}

describe('library paths', () => {
  it('slugifies names and folders', () => {
    expect(slugify('Acme – Robotics Engineer!')).toBe('acme-robotics-engineer');
    expect(slugify('Café résumé')).toBe('cafe-resume');
    expect(slugify('   ')).toBe('resume');
    expect(cleanFolder(' Robotics / Big Jobs/ ')).toBe('robotics/big-jobs');
    expect(cleanFolder('../../etc')).toBe('etc');
    expect(cleanFolder('Resume/Old')).toBe('resume/old');
  });

  it('gives every resume its own path and keeps a valid default', () => {
    const lib = libraryFromDocs('x', [blankDocument(), blankDocument()]);
    expect(Object.keys(lib.files)).toEqual(['resumes/my-resume.resume.json', 'resumes/my-resume-2.resume.json']);
    expect(lib.defaultPath).toBe('resumes/my-resume.resume.json');
  });
});

describe('changing a library', () => {
  it('copies a resume for a job and records where it came from', () => {
    const lib = twoResumeLibrary();
    const master = lib.files['resumes/master.resume.json'];
    const { lib: next, path } = duplicateResume(lib, 'resumes/master.resume.json', {
      title: 'Acme – Robotics',
      folder: 'Applications',
      target: 'Robotics Engineer at Acme',
      notes: 'Lead with controls work.',
    });
    expect(path).toBe('resumes/applications/acme-robotics.resume.json');
    const copy = next.files[path];
    expect(copy.id).not.toBe(master.id);
    expect(copy.meta).toEqual({ basedOn: master.id, target: 'Robotics Engineer at Acme', notes: 'Lead with controls work.' });
    expect(copy.sections).toEqual(master.sections);
    // The source is untouched.
    expect(next.files['resumes/master.resume.json']).toBe(master);
    expect(foldersOf(next)).toEqual(['', 'applications']);
  });

  it('renames and moves files, keeping the default pointing at the right one', () => {
    let lib = twoResumeLibrary();
    let r = renameResume(lib, 'resumes/master.resume.json', 'Main resume');
    expect(r.path).toBe('resumes/main-resume.resume.json');
    expect(r.lib.defaultPath).toBe(r.path);
    expect(r.lib.files[r.path].title).toBe('Main resume');
    lib = r.lib;
    r = moveResume(lib, r.path, 'archive');
    expect(r.path).toBe('resumes/archive/main-resume.resume.json');
    expect(folderOf(r.path)).toBe('archive');
    expect(r.lib.defaultPath).toBe(r.path);
  });

  it('never overwrites another resume when names collide', () => {
    const lib = twoResumeLibrary();
    const r = renameResume(lib, 'resumes/sample.resume.json', 'Master');
    expect(r.path).toBe('resumes/master-2.resume.json');
    expect(Object.keys(r.lib.files)).toHaveLength(2);
  });

  it('gives an added resume a new id if one already uses it', () => {
    const lib = twoResumeLibrary();
    const again = addResume(lib, lib.files['resumes/master.resume.json']);
    expect(again.lib.files[again.path].id).not.toBe(lib.files['resumes/master.resume.json'].id);
  });

  it('moves the default when its resume is deleted', () => {
    const lib = deleteResume(twoResumeLibrary(), 'resumes/master.resume.json');
    expect(lib.defaultPath).toBe('resumes/sample.resume.json');
    expect(deleteResume(lib, 'resumes/sample.resume.json').defaultPath).toBe('');
  });
});

describe('library files', () => {
  it('round-trips a whole library through one bundle file', () => {
    const lib = duplicateResume(twoResumeLibrary(), 'resumes/master.resume.json', { title: 'Acme', folder: 'jobs', target: 't', notes: '' }).lib;
    const opened = parseAnyFile(serializeBundle(lib));
    expect(opened.kind).toBe('library');
    if (opened.kind !== 'library') return;
    expect(opened.skipped).toEqual([]);
    expect(opened.lib).toEqual(lib);
  });

  it('opens single resumes and old-format files as resumes', () => {
    const single = parseAnyFile(serializeDocument(dawson()));
    expect(single.kind).toBe('resume');
    const legacy = parseAnyFile(read('public/data/dawson-hybrid-new.json'));
    expect(legacy.kind === 'resume' && legacy.migrated).toBe(true);
  });

  it('skips bad entries in a bundle instead of failing the whole file', () => {
    const bundle = JSON.parse(serializeBundle(twoResumeLibrary()));
    bundle.files['../escape.resume.json'] = bundle.files['resumes/master.resume.json'];
    bundle.files['resumes/broken.resume.json'] = { hello: 'world' };
    const opened = parseAnyFile(JSON.stringify(bundle));
    expect(opened.kind === 'library' && opened.skipped.sort()).toEqual(['../escape.resume.json', 'resumes/broken.resume.json']);
  });

  it('refuses a bare library.json with a helpful message', () => {
    const index = JSON.parse(serializeBundle(twoResumeLibrary()));
    delete index.files;
    expect(() => parseAnyFile(JSON.stringify(index))).toThrow(/Open its folder/);
  });
});

describe('library folders', () => {
  it('sets up a folder with the index, guides, schema and every resume', async () => {
    const dir = new MemDir();
    expect((await inspectFolder(dir)).kind).toBe('empty');
    await writeLibrary(dir, twoResumeLibrary());
    expect(await dir.list()).toEqual([
      'AGENTS.md',
      'README.md',
      'library.json',
      'resume.schema.json',
      'resumes/master.resume.json',
      'resumes/sample.resume.json',
    ]);
    expect((await inspectFolder(dir)).kind).toBe('library');
    const read = await readFolder(dir);
    expect(read.broken).toEqual([]);
    expect(read.index).toEqual({ name: 'My resumes', defaultPath: 'resumes/master.resume.json' });
    expect(read.files).toEqual(twoResumeLibrary().files);
  });

  it('finds resumes another program added, and reports unreadable ones', async () => {
    const dir = new MemDir();
    await writeLibrary(dir, twoResumeLibrary());
    const before = await statFolder(dir);
    const tailored = { ...dawson(), id: 'resume-acme', title: 'Acme' };
    await dir.put('resumes/jobs/acme.resume.json', serializeResumeFile(tailored));
    await dir.put('resumes/jobs/notes.txt', 'not a resume');
    await dir.put('resumes/oops.resume.json', '{ nope');
    const after = await statFolder(dir);
    expect(diffStamps(before, after)).toEqual({ changed: [], added: ['resumes/jobs/acme.resume.json', 'resumes/oops.resume.json'], removed: [] });
    const contents = await readFolder(dir);
    expect(contents.files['resumes/jobs/acme.resume.json'].title).toBe('Acme');
    expect(contents.broken.map((b) => b.path)).toEqual(['resumes/oops.resume.json']);
  });

  it('notices edits and deletions made outside the app', async () => {
    const dir = new MemDir();
    await writeLibrary(dir, twoResumeLibrary());
    const before = await statFolder(dir);
    const master = JSON.parse((await dir.read('resumes/master.resume.json'))!);
    master.title = 'Edited by an agent';
    await dir.put('resumes/master.resume.json', JSON.stringify(master));
    await removeFile(dir, 'resumes/sample.resume.json');
    const diff = diffStamps(before, await statFolder(dir));
    expect(diff).toEqual({ changed: ['resumes/master.resume.json'], added: [], removed: ['resumes/sample.resume.json'] });
  });

  it('removes folders that a delete leaves empty, but not resumes/ itself', async () => {
    const dir = new MemDir();
    await writeText(dir, 'resumes/a/b/x.resume.json', '{}');
    await writeText(dir, 'resumes/keep.resume.json', '{}');
    await removeFile(dir, 'resumes/a/b/x.resume.json');
    expect(await dir.list()).toEqual(['resumes/keep.resume.json']);
    await removeFile(dir, 'resumes/keep.resume.json');
    expect([...dir.children.keys()]).toEqual(['resumes']);
  });

  it("doesn't overwrite a README the person edited, but keeps the agent guide current", async () => {
    const dir = new MemDir();
    await writeLibrary(dir, twoResumeLibrary());
    await dir.put('README.md', 'my notes');
    await dir.put('AGENTS.md', 'old guide');
    await writeLibrary(dir, twoResumeLibrary());
    expect(await dir.read('README.md')).toBe('my notes');
    expect(await dir.read('AGENTS.md')).toBe(agentsMarkdown());
  });
});

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function withCustomFooter(doc: ResumeDocument): ResumeDocument {
  return { ...doc, theme: { ...doc.theme, customFooter: { image: PIXEL, html: '', height: 2, align: 'center' } }, pages: doc.pages.map((p) => ({ ...p, footer: 'custom' })) };
}

describe('custom footer', () => {
  it('survives saving and opening, and keeps through a template change', () => {
    const doc = withCustomFooter(dawson());
    const again = parseResumeJson(serializeResumeFile(doc)).doc;
    expect(again.theme.customFooter).toEqual({ image: PIXEL, html: '', height: 2, align: 'center' });
    expect(again.pages.every((p) => p.footer === 'custom')).toBe(true);
    const classic = applyTemplate(again, 'classic');
    expect(classic.theme.customFooter).toEqual(again.theme.customFooter);
    expect(classic.pages.every((p) => p.footer === 'custom')).toBe(true);
  });

  it('drops anything that is not an image data URL', () => {
    for (const image of ['https://example.com/a.png', 'data:text/html;base64,PHNjcmlwdD4=', 'javascript:alert(1)']) {
      const doc = normalizeDocument({ ...dawson(), theme: { ...dawson().theme, customFooter: { image, height: 2, align: 'left' } } });
      expect(doc.theme.customFooter).toBeNull();
    }
  });
});

describe('resume.schema.json', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(RESUME_SCHEMA);

  it.each([
    ['the sample', () => sampleDoc()],
    ['a blank resume', () => normalizeDocument(blankDocument())],
    ["Dawson's resume", () => dawson()],
    ['an imported old-format file', () => parseResumeJson(read('public/data/dawson-hybrid-new.json')).doc],
    ['a resume with its own footer image', () => withCustomFooter(dawson())],
  ])('accepts %s as the app writes it', (_, make) => {
    const ok = validate(JSON.parse(serializeResumeFile(make())));
    expect(validate.errors ?? []).toEqual([]);
    expect(ok).toBe(true);
  });

  it('accepts every template, footer and section style', () => {
    const check = (doc: ResumeDocument) => {
      const ok = validate(JSON.parse(serializeResumeFile(doc)));
      expect(validate.errors ?? []).toEqual([]);
      expect(ok).toBe(true);
    };
    const base = sampleDoc();
    for (const t of TEMPLATES) check(arrangeLayout(base, t.id));
    for (const f of FOOTERS) check(withCustomFooter({ ...base, pages: base.pages.map((p) => ({ ...p, footer: f.id })) }));
    for (const s of base.sections)
      for (const v of SECTION_VARIANTS[s.type]) check({ ...base, sections: base.sections.map((x) => (x.id === s.id ? { ...x, variant: v.id } : x)) });
  });

  it('rejects common agent mistakes', () => {
    const doc = JSON.parse(serializeResumeFile(dawson()));
    doc.sections[0].variant = 'fancy';
    expect(validate(doc)).toBe(false);
    const doc2 = JSON.parse(serializeResumeFile(dawson()));
    doc2.theme.accent = 'blue';
    expect(validate(doc2)).toBe(false);
    const doc3 = JSON.parse(serializeResumeFile(dawson()));
    doc3.pages[0].rows[0].columns = [[], [], []];
    expect(validate(doc3)).toBe(false);
  });
});
