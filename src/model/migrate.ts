import type { FooterType, Page, Placement, Profile, ResumeDocument, Row, Section, Theme } from './types';
import { SCHEMA_ID, SCHEMA_VERSION } from './types';
import { DEFAULT_THEME, newEntry, newPlacement, newReference, newRow, newSkillGroup, sectionBase, uid } from './defaults';
import { normalizeProfile } from './normalize';
import { FONTS } from './variants';
import { arrangeLayout } from './templates';

// Converts files saved by the previous version of the app (and the
// hand-written JSON files in /data) into the current format. The old app had
// several overlapping shapes for the same data, so every field is looked up
// in each place it used to live.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const objs = (v: unknown): Obj[] => arr(v).filter(isObj);
const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const first = (...vals: unknown[]): string => vals.map(str).find((s) => s.trim() !== '') ?? '';
const splitList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (isObj(x) ? str(x.name) : str(x))).filter(Boolean) : str(v).split(',').map((s) => s.trim()).filter(Boolean);

/** True when the data looks like something the old app saved. */
export function isLegacyResume(data: unknown): boolean {
  if (!isObj(data)) return false;
  const r = isObj(data.resumeData) ? data.resumeData : data;
  return Array.isArray(r.sections) || isObj(r.personalInfo);
}

const PADDING_HEIGHTS: Record<string, number> = {
  'padding-extra-small': 0.25,
  'padding-small': 0.5,
  'padding-medium': 1,
  'padding-large': 1.5,
  'padding-extra-large': 2,
  'padding-xxl': 3,
};

function cm(v: unknown): number | null {
  const m = /^\s*([\d.]+)\s*(cm|mm|pt|px)?\s*$/.exec(str(v));
  if (!m) return null;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case 'mm':
      return n / 10;
    case 'pt':
      return n / 28.35;
    case 'px':
      return n / 37.8;
    default:
      return n;
  }
}

function variantFor(type: Section['type'], templateId: string, narrow: boolean): string | undefined {
  const t = templateId.toLowerCase();
  switch (type) {
    case 'header':
      return t.includes('centered') ? 'centered' : 'left';
    case 'contact':
      return /wide|compact|inline/.test(t) ? 'inline' : 'stacked';
    case 'text':
      return /highlight|quote/.test(t) ? 'accent' : 'plain';
    case 'experience':
    case 'education':
      if (/compact|minimal/.test(t)) return 'compact';
      if (t.includes('timeline')) return 'timeline';
      if (narrow || /sidebar|sleek/.test(t)) return 'stacked';
      return 'standard';
    case 'skills':
      return /simple|lines|minimal|clean/.test(t) ? 'lines' : 'tags';
    case 'list':
      if (t.includes('inline')) return 'inline';
      return t.includes('compact') ? 'plain' : 'bullets';
    case 'references':
      return /compact|minimal/.test(t) ? 'list' : 'grid';
  }
  return undefined;
}

/** Items of a legacy section that hold "content" entries, wherever they were stored. */
function legacyItems(s: Obj): Obj[] {
  return objs(s.items);
}

function convertSection(s: Obj, profile: Profile): Section {
  const type = str(s.type);
  const title = str(s.title);
  const items = legacyItems(s);
  const content = isObj(s.content) ? s.content : isObj(items[0]?.content) ? (items[0].content as Obj) : null;

  switch (type) {
    case 'name': {
      if (content) {
        if (!profile.name) profile.name = first(content.fullName, content.name);
        if (!profile.headline) profile.headline = first(content.title, content.subtitle);
      }
      return { ...sectionBase('header', title || 'Name'), type: 'header' };
    }
    case 'personal_info': {
      const info = items.find((i) => isObj(i.personalInfo))?.personalInfo;
      if (isObj(info)) {
        const p = normalizeProfile({ ...info, name: info.fullName });
        for (const key of Object.keys(p) as (keyof Profile)[]) if (!profile[key]) profile[key] = p[key];
      }
      return { ...sectionBase('contact', title || 'Contact'), type: 'contact' };
    }
    case 'skills': {
      const custom = isObj(s.customFields) ? s.customFields.categories : undefined;
      const categories = [s.categories, custom, ...items.map((i) => i.categories)].flatMap((c) => objs(c));
      return {
        ...sectionBase('skills', title || 'Skills'),
        type: 'skills',
        groups: categories.map((c) => newSkillGroup({ name: str(c.name), skills: splitList(c.skills) })),
      };
    }
    case 'references': {
      const refs = items.map((i) =>
        newReference({
          name: first(i.name, i.title),
          role: str(i.jobTitle),
          organization: str(i.organization),
          email: str(i.email),
          phone: str(i.phone),
          note: [str(i.relationship), ...arr(i.details).map(str)].filter(Boolean).join('. '),
        }),
      );
      // Files often used a single fake reference as "Available upon request".
      const placeholder = refs.length > 0 && refs.every((r) => !r.email && !r.phone && !r.organization && !r.role);
      return {
        ...sectionBase('references', title || 'References'),
        type: 'references',
        items: placeholder ? [] : refs,
        emptyText: placeholder ? refs.map((r) => r.name).join(' ') : 'Available upon request.',
      };
    }
    case 'padding': {
      return {
        ...sectionBase('spacer', title || 'Blank space'),
        type: 'spacer',
        height: cm(content?.height) ?? PADDING_HEIGHTS[str(s.templateId)] ?? 1,
      };
    }
    case 'list': {
      // Lists whose items carry organizations or details read better as entries.
      const rich = items.some((i) => first(i.organization, i.dates) || arr(i.details).length);
      if (!rich) {
        return {
          ...sectionBase('list', title || 'List'),
          type: 'list',
          items: items.map((i) => first(i.content, i.title, i.name)).filter(Boolean),
        };
      }
      break;
    }
    case 'text':
    case 'custom': {
      const parts = [str(s.content), ...items.map((i) => str(i.content))].filter(Boolean);
      const details = items.flatMap((i) => arr(i.details).map(str)).filter(Boolean);
      return {
        ...sectionBase('text', title || 'Text'),
        type: 'text',
        body: [...parts, ...details.map((d) => `• ${d}`)].join('\n\n'),
      };
    }
  }

  // experience, education, projects, volunteer, awards, publications,
  // certifications and anything unknown become entry lists.
  const entryType = type === 'education' ? 'education' : 'experience';
  const entries = items.map((i) =>
    newEntry({
      title: first(i.title, i.degree, i.name),
      subtitle: first(i.institution, i.organization),
      location: str(i.location),
      dates: str(i.dates),
      note: [i.gpa ? `GPA: ${str(i.gpa)}` : '', i.credentialId ? `ID: ${str(i.credentialId)}` : '']
        .filter(Boolean)
        .join(' · '),
      description: str(i.description),
      bullets: arr(i.details).map(str).filter(Boolean),
      tags: splitList(i.technologies ?? i.tags),
      url: str(i.url),
    }),
  );
  return { ...sectionBase(entryType, title || 'Experience'), type: entryType, items: entries };
}

function convertTheme(gs: unknown, pageMargin: number | null): Theme {
  const theme: Theme = { ...DEFAULT_THEME };
  if (!isObj(gs)) return theme;
  const family = str(gs.fontFamily).split(',')[0].replace(/['"]/g, '').trim();
  if (family) {
    const known = FONTS.find((f) => f.id.toLowerCase() === family.toLowerCase());
    theme.font = known?.id ?? family;
    theme.headingFont = theme.font;
  }
  const sizes = isObj(gs.fontSizes) ? gs.fontSizes : {};
  const body = cm(sizes.body);
  // The old app used large cm sizes; clamp to a readable resume range.
  if (body) theme.fontSize = Math.round(Math.min(11, Math.max(8, body * 28.35 * 0.85)) * 2) / 2;
  const cs = isObj(gs.colorScheme) ? gs.colorScheme : {};
  const hex = (v: unknown) => (/^#[0-9a-f]{3,6}$/i.test(str(v)) ? str(v) : '');
  theme.accent = hex(cs.headerH2Color) || hex(cs.primary) || theme.accent;
  theme.shadeAccent = theme.accent;
  theme.text = hex(cs.text) || theme.text;
  theme.shadeText = theme.text;
  theme.muted = hex(cs.textMuted) || theme.muted;
  const spacing = isObj(gs.spacing) ? gs.spacing : {};
  theme.margin = pageMargin ?? cm(spacing.pageMargin) ?? theme.margin;
  return theme;
}

const FOOTER_TYPES: FooterType[] = ['none', 'default', 'mountains', 'fish', 'salmon', 'minimal', 'modern'];

export function migrateLegacy(data: unknown): ResumeDocument {
  if (!isLegacyResume(data)) throw new Error('Not a resume file');
  const root = data as Obj;
  const r = isObj(root.resumeData) ? root.resumeData : root;
  const legacyLayout = isObj(r.layout) ? r.layout : null;
  // Very old exports kept the layout next to resumeData.
  const layoutState = isObj(root.layoutState) ? root.layoutState : null;
  const legacyPages = objs(layoutState?.pages ?? legacyLayout?.pages);

  const top = isObj(r.personalInfo) ? r.personalInfo : {};
  const profile = normalizeProfile({ ...top, name: top.fullName ?? top.name });

  // Convert sections, remembering the old id so layout references resolve.
  const byOldId = new Map<string, Section>();
  const sections: Section[] = [];
  const oldTemplate = new Map<string, string>();
  const hidden = new Set<string>();
  for (const s of objs(r.sections)) {
    const sec = convertSection(s, profile);
    const oldId = str(s.id) || sec.id;
    byOldId.set(oldId, sec);
    oldTemplate.set(sec.id, str(s.templateId));
    if (s.isVisible === false) hidden.add(sec.id);
    sections.push(sec);
  }

  const gs = legacyLayout?.globalStyles ?? r.globalStyles ?? root.globalStyles;
  const firstMargins = isObj(legacyPages[0]?.margins) ? (legacyPages[0].margins as Obj) : null;
  const theme = convertTheme(gs, firstMargins ? cm(firstMargins.left) : null);

  const variantSet = new Set<string>();
  const place = (ref: unknown, narrow: boolean): Placement | null => {
    const oldId = isObj(ref) ? str(ref.sectionId) : str(ref);
    let sec = byOldId.get(oldId);
    if (!sec && oldId.startsWith('padding')) {
      // The old app rendered spacers for padding ids even without a section.
      sec = {
        ...sectionBase('spacer'),
        type: 'spacer',
        height: PADDING_HEIGHTS[str(isObj(ref) ? ref.template : '')] ?? 1,
      };
      byOldId.set(oldId, sec);
      sections.push(sec);
    }
    if (!sec || hidden.has(sec.id)) return null;
    if (!variantSet.has(sec.id)) {
      variantSet.add(sec.id);
      const tpl = (isObj(ref) && str(ref.template)) || oldTemplate.get(sec.id) || '';
      const v = variantFor(sec.type, tpl, narrow);
      if (v) sec.variant = v;
    }
    return newPlacement(sec.id);
  };
  const placeAll = (refs: unknown, narrow: boolean) =>
    arr(refs)
      .map((ref) => place(ref, narrow))
      .filter((p): p is Placement => p !== null);

  const pages: Page[] = legacyPages.map((p) => {
    const rows: Row[] = objs(p.rows).map((row) => {
      const cols = objs(row.columns);
      if (str(row.type) !== 'columns' || cols.length === 0) {
        const r1 = newRow(1);
        r1.columns[0] = placeAll(row.sections, false);
        return r1;
      }
      if (cols.length === 1) {
        const r1 = newRow(1);
        r1.columns[0] = placeAll(cols[0].sections, false);
        return r1;
      }
      const width = parseFloat(str(cols[0].width)) || 50;
      const r2 = newRow(2, Math.round(Math.min(80, Math.max(20, width))));
      r2.columns = [
        placeAll(cols[0].sections, width < 45),
        // Anything past the second column is folded into it.
        cols.slice(1).flatMap((c) => placeAll(c.sections, width > 55)),
      ];
      const tinted = (c: Obj) => {
        const bg = str(c.backgroundColor).toLowerCase();
        return bg && bg !== '#ffffff' && bg !== '#fff' && bg !== 'transparent' ? bg : '';
      };
      const leftBg = tinted(cols[0]);
      const rightBg = tinted(cols[1]);
      if (leftBg || rightBg) {
        r2.shade = leftBg ? 'left' : 'right';
        theme.shade = leftBg || rightBg;
      }
      return r2;
    });
    const footerType = isObj(p.footer) ? (str(p.footer.type) as FooterType) : 'none';
    return {
      id: uid('page'),
      rows: rows.length ? rows : [newRow(1)],
      footer: FOOTER_TYPES.includes(footerType) ? footerType : 'none',
    };
  });

  const doc: ResumeDocument = {
    schema: SCHEMA_ID,
    version: SCHEMA_VERSION,
    id: uid('resume'),
    title: first(r.name, profile.name && `${profile.name} resume`, 'Imported resume'),
    updatedAt: new Date().toISOString(),
    meta: { basedOn: '', target: '', notes: '' },
    profile,
    sections,
    pages,
    theme,
  };
  if (pages.length > 0) return doc;

  // Files without a layout get the default arrangement but keep their fonts and colors.
  const arranged = arrangeLayout(doc, theme.template);
  const { font, headingFont, fontSize, accent, text, muted, margin } = theme;
  return {
    ...arranged,
    theme: { ...arranged.theme, font, headingFont, fontSize, accent, shadeAccent: accent, text, muted, margin },
  };
}
