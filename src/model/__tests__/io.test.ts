import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ImportError, fileStem, parseResumeJson, serializeDocument, sharedLinkFromUrl } from '../io';
import { normalizeDocument } from '../normalize';
import { blankDocument, itemCount } from '../defaults';
import { splitPlacement, pagesShowing } from '../edit';
import { TEMPLATES, applyTemplate, arrangeLayout } from '../templates';
import sample from '../../data/sample.json';

const root = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const LEGACY_FILES = [
  'src/model/__tests__/legacy-export.json',
  'public/data/dawson-hybrid-new.json',
];

describe('parseResumeJson', () => {
  it('round-trips a saved document exactly', () => {
    const doc = normalizeDocument(sample);
    const again = parseResumeJson(serializeDocument(doc));
    expect(again.migrated).toBe(false);
    expect(again.doc).toEqual(doc);
  });

  it.each(LEGACY_FILES)('converts the old format: %s', (file) => {
    const { doc, migrated } = parseResumeJson(read(file));
    expect(migrated).toBe(true);
    expect(doc.profile.name).not.toBe('');
    expect(doc.sections.length).toBeGreaterThan(3);
    // Every visible section ends up on a page, every placement points at a real section.
    const ids = new Set(doc.sections.map((s) => s.id));
    for (const page of doc.pages)
      for (const row of page.rows) for (const col of row.columns) for (const p of col) expect(ids.has(p.sectionId)).toBe(true);
    const onPage = doc.sections.filter((s) => pagesShowing(doc, s.id).length > 0);
    expect(onPage.length).toBeGreaterThan(3);
    // And the result survives a save/open cycle unchanged.
    expect(parseResumeJson(serializeDocument(doc)).doc).toEqual(doc);
  });

  it('keeps skills, entries and contact details from the old format', () => {
    const { doc } = parseResumeJson(read('public/data/dawson-hybrid-new.json'));
    expect(doc.profile.email).toBe('horvath.dawson@gmail.com');
    const skills = doc.sections.find((s) => s.type === 'skills');
    expect(skills && itemCount(skills)).toBeGreaterThan(1);
    const work = doc.sections.find((s) => s.title === 'Work Experience' || s.type === 'experience');
    expect(work && work.type === 'experience' && work.items[0].bullets.length).toBeGreaterThan(0);
  });

  it('gives readable errors for files that are not resumes', () => {
    expect(() => parseResumeJson('not json')).toThrow(ImportError);
    expect(() => parseResumeJson('[1,2]')).toThrow(/doesn't contain a resume/);
    expect(() => parseResumeJson('{"hello":"world"}')).toThrow(/doesn't look like a resume/);
    expect(() => parseResumeJson('{"schema":"resume-generator","version":99}')).toThrow(/newer version/);
  });

  it('repairs damaged documents instead of crashing', () => {
    const { doc } = parseResumeJson(
      JSON.stringify({
        schema: 'resume-generator',
        version: 2,
        sections: [{ type: 'experience', id: 'a', items: [{ title: 5 }, null] }, { type: 'bogus' }, { type: 'text', id: 'a' }],
        pages: [{ rows: [{ columns: [[{ sectionId: 'a' }, { sectionId: 'missing' }]] }] }],
        theme: { accent: 'red', fontSize: 400 },
      }),
    );
    expect(doc.sections).toHaveLength(2);
    expect(new Set(doc.sections.map((s) => s.id)).size).toBe(2);
    expect(doc.pages[0].rows[0].columns[0]).toHaveLength(1);
    expect(doc.theme.accent).toMatch(/^#/);
    expect(doc.theme.fontSize).toBeLessThanOrEqual(16);
  });
});

describe('layout helpers', () => {
  it('splits a section across pages', () => {
    const doc = normalizeDocument(sample);
    const exp = doc.sections.find((s) => s.id === 'experience')!;
    const place = doc.pages[0].rows[1].columns[1].find((p) => p.sectionId === exp.id)!;
    splitPlacement(doc, place.id, 1);
    expect(place.to).toBe(1);
    const rest = doc.pages[1].rows[0].columns[1][0];
    expect(rest).toMatchObject({ sectionId: exp.id, from: 1 });
  });

  it.each(TEMPLATES.map((t) => t.id))('arranges every section with template %s', (id) => {
    const doc = arrangeLayout(normalizeDocument(sample), id);
    expect(doc.theme.template).toBe(id);
    for (const s of doc.sections) expect(pagesShowing(doc, s.id)).toEqual([1]);
    expect(applyTemplate(doc, id, false).pages).toEqual(doc.pages);
  });

  it('builds file names from the person’s name', () => {
    const doc = blankDocument();
    doc.profile.name = 'Zoë O’Brien';
    expect(fileStem(doc)).toBe('zoe-o-brien-resume');
  });
});

describe('sharedLinkFromUrl', () => {
  it('maps a name to a resume served with the app', () => {
    expect(sharedLinkFromUrl('?resume=dawson')).toEqual({ url: './resumes/dawson.json', view: false, embed: false });
    expect(sharedLinkFromUrl('?resume=dawson&mode=view')).toEqual({ url: './resumes/dawson.json', view: true, embed: false });
    expect(sharedLinkFromUrl('?resume=dawson&mode=embed')).toEqual({ url: './resumes/dawson.json', view: false, embed: true });
  });

  it('accepts a full URL and rejects anything else', () => {
    expect(sharedLinkFromUrl('?resume=https://example.com/me.json')?.url).toBe('https://example.com/me.json');
    expect(sharedLinkFromUrl('?resume=../secret')).toBeNull();
    expect(sharedLinkFromUrl('?resume=javascript:alert(1)')).toBeNull();
    expect(sharedLinkFromUrl('')).toBeNull();
  });

  it('opens the bundled resume file', () => {
    const text = read('public/resumes/dawson.json');
    const { doc, migrated } = parseResumeJson(text);
    expect(migrated).toBe(false);
    expect(doc.profile.name).toBe('Dawson Horvath');
  });
});
