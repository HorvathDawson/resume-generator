import type {
  Entry,
  FooterType,
  HeadingStyle,
  Page,
  Placement,
  Profile,
  Reference,
  ResumeDocument,
  ResumeMeta,
  Row,
  Section,
  SectionType,
  Shade,
  SkillGroup,
  Theme,
} from './types';
import { SCHEMA_ID, SCHEMA_VERSION } from './types';
import { DEFAULT_THEME, emptyProfile, newEntry, newReference, newRow, newSkillGroup, uid } from './defaults';
import { FOOTERS, HEADING_STYLES, SECTION_VARIANTS, defaultVariant, isValidVariant } from './variants';

// Defensive conversion of untrusted data (a saved file, browser storage) into
// a well-formed ResumeDocument. Anything missing gets a default and anything
// malformed is dropped, so the renderer never has to guard against bad data.

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;
const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strings = (v: unknown): string[] => arr(v).map((x) => str(x)).filter((x) => x !== '');
const color = (v: unknown, fallback: string): string =>
  typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : fallback;
const id = (v: unknown, prefix: string): string => (typeof v === 'string' && v.trim() ? v : uid(prefix));

const SECTION_TYPES: SectionType[] = Object.keys(SECTION_VARIANTS) as SectionType[];

export function normalizeProfile(v: unknown): Profile {
  const o = isObj(v) ? v : {};
  const p = emptyProfile();
  for (const key of Object.keys(p) as (keyof Profile)[]) p[key] = str(o[key]);
  return p;
}

function normalizeEntry(v: unknown): Entry {
  const o = isObj(v) ? v : {};
  return newEntry({
    id: id(o.id, 'item'),
    title: str(o.title),
    subtitle: str(o.subtitle),
    location: str(o.location),
    dates: str(o.dates),
    note: str(o.note),
    description: str(o.description),
    bullets: arr(o.bullets).map((b) => str(b)),
    tags: strings(o.tags),
    url: str(o.url),
  });
}

function normalizeGroup(v: unknown): SkillGroup {
  const o = isObj(v) ? v : {};
  return newSkillGroup({ id: id(o.id, 'group'), name: str(o.name), skills: strings(o.skills) });
}

function normalizeReference(v: unknown): Reference {
  const o = isObj(v) ? v : {};
  return newReference({
    id: id(o.id, 'ref'),
    name: str(o.name),
    role: str(o.role),
    organization: str(o.organization),
    email: str(o.email),
    phone: str(o.phone),
    note: str(o.note),
  });
}

export function normalizeSection(v: unknown): Section | null {
  if (!isObj(v)) return null;
  const type = v.type as SectionType;
  if (!SECTION_TYPES.includes(type)) return null;
  const base = {
    id: id(v.id, type),
    title: str(v.title),
    variant: isValidVariant(type, v.variant) ? (v.variant as string) : defaultVariant(type),
    showTitle: typeof v.showTitle === 'boolean' ? v.showTitle : type !== 'header' && type !== 'spacer',
  };
  switch (type) {
    case 'header':
    case 'contact':
      return { ...base, type };
    case 'text':
      return { ...base, type, body: str(v.body) };
    case 'experience':
    case 'education':
      return { ...base, type, items: arr(v.items).map(normalizeEntry) };
    case 'skills':
      return { ...base, type, groups: arr(v.groups).map(normalizeGroup) };
    case 'list':
      return { ...base, type, items: arr(v.items).map((x) => str(x)) };
    case 'references':
      return { ...base, type, items: arr(v.items).map(normalizeReference), emptyText: str(v.emptyText) };
    case 'spacer':
      return { ...base, type, height: num(v.height, 0.5, 0, 20) };
  }
}

function normalizePlacement(v: unknown, sectionIds: Set<string>): Placement | null {
  const o = isObj(v) ? v : typeof v === 'string' ? { sectionId: v } : null;
  if (!o) return null;
  const sectionId = str(o.sectionId);
  if (!sectionIds.has(sectionId)) return null;
  const p: Placement = { id: id(o.id, 'place'), sectionId };
  if (o.from !== undefined) p.from = Math.round(num(o.from, 0, 0));
  if (o.to !== undefined) p.to = Math.round(num(o.to, 0, 0));
  return p;
}

function normalizeRow(v: unknown, sectionIds: Set<string>): Row {
  const o = isObj(v) ? v : {};
  const columns = arr(o.columns)
    .slice(0, 2)
    .map((col) =>
      arr(col)
        .map((p) => normalizePlacement(p, sectionIds))
        .filter((p): p is Placement => p !== null),
    );
  const row = newRow(columns.length === 2 ? 2 : 1, num(o.split, 32, 15, 85));
  row.id = id(o.id, 'row');
  if (columns.length) row.columns = columns;
  const shade = o.shade as Shade;
  row.shade = row.columns.length === 2 && (shade === 'left' || shade === 'right') ? shade : 'none';
  return row;
}

function normalizePage(v: unknown, sectionIds: Set<string>): Page {
  const o = isObj(v) ? v : {};
  const rows = arr(o.rows).map((r) => normalizeRow(r, sectionIds));
  const footer = FOOTERS.some((f) => f.id === o.footer) ? (o.footer as FooterType) : 'none';
  return { id: id(o.id, 'page'), rows: rows.length ? rows : [newRow(1)], footer };
}

export function normalizeTheme(v: unknown): Theme {
  const o = isObj(v) ? v : {};
  const d = DEFAULT_THEME;
  const headingStyle = HEADING_STYLES.some((h) => h.id === o.headingStyle) ? (o.headingStyle as HeadingStyle) : d.headingStyle;
  return {
    template: str(o.template, d.template) || d.template,
    font: str(o.font, d.font) || d.font,
    headingFont: str(o.headingFont, str(o.font, d.headingFont)) || d.headingFont,
    fontSize: num(o.fontSize, d.fontSize, 6, 16),
    lineHeight: num(o.lineHeight, d.lineHeight, 1, 2.2),
    spacing: num(o.spacing, d.spacing, 0.4, 2.5),
    headingStyle,
    accent: color(o.accent, d.accent),
    text: color(o.text, d.text),
    muted: color(o.muted, d.muted),
    shade: color(o.shade, d.shade),
    shadeText: color(o.shadeText, color(o.text, d.shadeText)),
    shadeAccent: color(o.shadeAccent, color(o.accent, d.shadeAccent)),
    margin: num(o.margin, d.margin, 0, 5),
    columnGap: num(o.columnGap, d.columnGap, 0, 5),
  };
}

/** Turn any object that claims to be a v2 document into a valid one. */
function normalizeMeta(v: unknown): ResumeMeta {
  const o = isObj(v) ? v : {};
  return { basedOn: str(o.basedOn), target: str(o.target), notes: str(o.notes) };
}

export function normalizeDocument(v: unknown): ResumeDocument {
  const o = isObj(v) ? v : {};
  const seen = new Set<string>();
  const sections = arr(o.sections)
    .map(normalizeSection)
    .filter((s): s is Section => s !== null)
    .map((s) => {
      // Duplicate ids would make placements ambiguous.
      if (seen.has(s.id)) s = { ...s, id: uid(s.type) };
      seen.add(s.id);
      return s;
    });
  const pages = arr(o.pages).map((p) => normalizePage(p, seen));
  return {
    schema: SCHEMA_ID,
    version: SCHEMA_VERSION,
    id: id(o.id, 'resume'),
    title: str(o.title).trim() || 'My resume',
    updatedAt: str(o.updatedAt) || new Date().toISOString(),
    meta: normalizeMeta(o.meta),
    profile: normalizeProfile(o.profile),
    sections,
    pages: pages.length ? pages : [normalizePage({}, seen)],
    theme: normalizeTheme(o.theme),
  };
}
