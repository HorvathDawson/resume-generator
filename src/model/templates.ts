import type { FooterType, Page, ResumeDocument, Row, Section, SectionType, Shade, Theme } from './types';
import { DEFAULT_THEME, newPlacement, newRow, uid } from './defaults';

/**
 * Where a section goes in a template's layout:
 * header = name, contact = contact details, about = the first text section,
 * main = experience and other text, side = education, skills, lists, references.
 */
export type Slot = 'header' | 'contact' | 'about' | 'main' | 'side';

export interface RowSpec {
  /** One or two columns, each a list of slots filled top to bottom. */
  cols: Slot[][];
  /** Left column width in percent for two-column rows. */
  split?: number;
  shade?: Shade;
}

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  theme: Omit<Theme, 'template' | 'fontSize'> & { fontSize?: number };
  /** Section styles. `narrow` overrides them for sections in a column under 45% wide. */
  variants: Partial<Record<SectionType, string>>;
  narrow?: Partial<Record<SectionType, string>>;
  rows: RowSpec[];
  footer: FooterType;
}

const NARROW: Partial<Record<SectionType, string>> = { experience: 'stacked', education: 'stacked', references: 'list', contact: 'stacked' };

export const TEMPLATES: DesignTemplate[] = [
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Name across the top, tinted side column for contact and skills.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Inter',
      headingFont: 'Inter',
      headingStyle: 'caps',
      accent: '#1d4e89',
      text: '#18212f',
      muted: '#5b6676',
      shade: '#eef3f9',
      shadeText: '#18212f',
      shadeAccent: '#1d4e89',
      fontSize: 9.5,
    },
    variants: { header: 'left', contact: 'stacked', experience: 'standard', education: 'standard', skills: 'tags', list: 'bullets', text: 'plain', references: 'grid' },
    narrow: NARROW,
    rows: [{ cols: [['header']] }, { cols: [['contact', 'side'], ['about', 'main']], split: 32, shade: 'left' }],
    footer: 'none',
  },
  {
    id: 'split-header',
    name: 'Split header',
    description: 'Name and contact beside your summary, then a wide main column.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Source Sans 3',
      headingFont: 'Work Sans',
      headingStyle: 'caps',
      accent: '#0f766e',
      text: '#1f2933',
      muted: '#5f6b7a',
      shade: '#ecf6f4',
      shadeText: '#1f2933',
      shadeAccent: '#0f766e',
      margin: 1.2,
      fontSize: 10,
    },
    variants: { header: 'rule', contact: 'stacked', text: 'lead', experience: 'standard', education: 'standard', skills: 'dots', list: 'bullets', references: 'list' },
    narrow: NARROW,
    rows: [
      { cols: [['header', 'contact'], ['about']], split: 40 },
      { cols: [['main'], ['side']], split: 66, shade: 'right' },
    ],
    footer: 'mountains',
  },
  {
    id: 'headline',
    name: 'Headline',
    description: 'Name beside a short pitch, contact strip, then a two-column body.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Source Sans 3',
      headingFont: 'Merriweather',
      headingStyle: 'underline',
      accent: '#9f1239',
      text: '#1c1917',
      muted: '#6b6460',
      shade: '#fbf1f3',
      shadeText: '#1c1917',
      shadeAccent: '#9f1239',
      margin: 1.3,
      fontSize: 10,
    },
    variants: { header: 'caps', contact: 'pills', text: 'lead', experience: 'dates-left', education: 'standard', skills: 'outline', list: 'bullets', references: 'list' },
    narrow: { ...NARROW, text: 'plain' },
    rows: [
      { cols: [['header'], ['about']], split: 42 },
      { cols: [['contact']] },
      { cols: [['side'], ['main']], split: 30, shade: 'left' },
    ],
    footer: 'modern',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Single serif column. Safe for any application system.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Source Serif 4',
      headingFont: 'Source Serif 4',
      headingStyle: 'caps',
      accent: '#1f2937',
      text: '#111827',
      muted: '#4b5563',
      shade: '#f3f4f6',
      shadeText: '#111827',
      shadeAccent: '#1f2937',
      margin: 1.6,
      lineHeight: 1.35,
      fontSize: 10,
    },
    variants: { header: 'centered', contact: 'centered', experience: 'standard', education: 'standard', skills: 'lines', list: 'columns', text: 'plain', references: 'grid' },
    rows: [{ cols: [['header', 'contact', 'about', 'main', 'side']] }],
    footer: 'none',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Centered serif header, wide main column, tinted right column.',
    theme: {
      ...DEFAULT_THEME,
      font: 'EB Garamond',
      headingFont: 'EB Garamond',
      headingStyle: 'caps',
      accent: '#1e3a5f',
      text: '#1b2430',
      muted: '#556171',
      shade: '#eef2f7',
      shadeText: '#1b2430',
      shadeAccent: '#1e3a5f',
      margin: 1.4,
      fontSize: 11,
      lineHeight: 1.3,
    },
    variants: { header: 'centered', contact: 'centered', text: 'plain', experience: 'standard', education: 'standard', skills: 'lines', list: 'plain', references: 'list' },
    narrow: NARROW,
    rows: [
      { cols: [['header', 'contact']] },
      { cols: [['about']] },
      { cols: [['main'], ['side']], split: 67, shade: 'right' },
    ],
    footer: 'minimal',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean sans-serif, dates in a left margin, lots of white space.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Lato',
      headingFont: 'Lato',
      headingStyle: 'plain',
      accent: '#111827',
      text: '#1f2937',
      muted: '#6b7280',
      shade: '#f4f4f5',
      shadeText: '#1f2937',
      shadeAccent: '#111827',
      margin: 1.5,
      spacing: 1.1,
    },
    variants: { header: 'left', contact: 'inline', experience: 'dates-left', education: 'dates-left', skills: 'grid', list: 'inline', text: 'plain', references: 'grid' },
    rows: [{ cols: [['header', 'contact']] }, { cols: [['about', 'main', 'side']] }],
    footer: 'none',
  },
  {
    id: 'banner',
    name: 'Banner',
    description: 'Bold color header, timeline experience and a slim right column.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Work Sans',
      headingFont: 'Poppins',
      headingStyle: 'bar',
      accent: '#3730a3',
      text: '#1f2937',
      muted: '#6b7280',
      shade: '#eef0fb',
      shadeText: '#1f2937',
      shadeAccent: '#3730a3',
      margin: 1.2,
    },
    variants: { header: 'banner', contact: 'stacked', experience: 'timeline', education: 'stacked', skills: 'tags', list: 'bullets', text: 'accent', references: 'list' },
    narrow: NARROW,
    rows: [{ cols: [['header']] }, { cols: [['about', 'main'], ['contact', 'side']], split: 66 }],
    footer: 'default',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Full-height dark sidebar holding your name and details.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Open Sans',
      headingFont: 'Open Sans',
      headingStyle: 'caps',
      accent: '#0e7490',
      text: '#1e293b',
      muted: '#64748b',
      shade: '#1e293b',
      shadeText: '#e2e8f0',
      shadeAccent: '#67e8f9',
      margin: 1.1,
      fontSize: 9.5,
    },
    variants: { header: 'left', contact: 'stacked', experience: 'standard', education: 'stacked', skills: 'lines', list: 'plain', text: 'plain', references: 'list' },
    narrow: NARROW,
    rows: [{ cols: [['header', 'contact', 'side'], ['about', 'main']], split: 34, shade: 'left' }],
    footer: 'none',
  },
  {
    id: 'field',
    name: 'Field notes',
    description: 'Green banner, light sidebar and a fish footer. Made for outdoor work.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Source Sans 3',
      headingFont: 'Work Sans',
      headingStyle: 'underline',
      accent: '#2f6b3a',
      text: '#1d2a20',
      muted: '#5c6b60',
      shade: '#eef5ec',
      shadeText: '#1d2a20',
      shadeAccent: '#2f6b3a',
      margin: 1.1,
      fontSize: 10,
    },
    variants: { header: 'banner', contact: 'stacked', text: 'plain', experience: 'cards', education: 'stacked', skills: 'tags', list: 'bullets', references: 'list' },
    narrow: NARROW,
    rows: [{ cols: [['header']] }, { cols: [['contact', 'side'], ['about', 'main']], split: 33, shade: 'left' }],
    footer: 'fish',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense layout that fits a lot on one page.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Roboto',
      headingFont: 'Roboto',
      headingStyle: 'underline',
      accent: '#334e68',
      text: '#1f2937',
      muted: '#627080',
      shade: '#f0f4f8',
      shadeText: '#1f2937',
      shadeAccent: '#334e68',
      margin: 1,
      fontSize: 8.75,
      spacing: 0.8,
      lineHeight: 1.3,
    },
    variants: { header: 'left', contact: 'grid', text: 'plain', experience: 'compact', education: 'compact', skills: 'lines', list: 'inline', references: 'grid' },
    narrow: { ...NARROW, contact: 'grid' },
    rows: [
      { cols: [['header'], ['contact']], split: 50 },
      { cols: [['about']] },
      { cols: [['main'], ['side']], split: 64 },
    ],
    footer: 'none',
  },
  {
    id: 'stone',
    name: 'Stone',
    description: 'Warm neutral sidebar, Poppins headings and a ridgeline footer with a paraglider.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Source Sans 3',
      headingFont: 'Poppins',
      headingStyle: 'caps',
      accent: '#44403c',
      text: '#292524',
      muted: '#78716c',
      shade: '#f1efeb',
      shadeText: '#292524',
      shadeAccent: '#57534e',
      margin: 1.1,
      spacing: 1.15,
      fontSize: 10.5,
    },
    variants: { header: 'left', contact: 'stacked', text: 'plain', experience: 'standard', education: 'stacked', skills: 'dots', list: 'plain', references: 'list' },
    narrow: NARROW,
    rows: [{ cols: [['header', 'contact', 'side'], ['about', 'main']], split: 33, shade: 'left' }],
    footer: 'paraglider',
  },
  {
    id: 'deep',
    name: 'Deep',
    description: 'One column with a timeline down the side, ocean blues and a diver footer.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Open Sans',
      headingFont: 'Merriweather',
      headingStyle: 'underline',
      accent: '#0b4f6c',
      text: '#122330',
      muted: '#587080',
      shade: '#eaf3f7',
      shadeText: '#122330',
      shadeAccent: '#0b4f6c',
      margin: 1.4,
      fontSize: 9.75,
    },
    variants: { header: 'rule', contact: 'inline', text: 'accent', experience: 'timeline', education: 'timeline', skills: 'outline', list: 'inline', references: 'grid' },
    rows: [{ cols: [['header', 'contact']] }, { cols: [['about', 'main', 'side']] }],
    footer: 'diver',
  },
];

export function getTemplate(id: string): DesignTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function themeFor(template: DesignTemplate, current?: Theme): Theme {
  return {
    ...template.theme,
    fontSize: template.theme.fontSize ?? current?.fontSize ?? DEFAULT_THEME.fontSize,
    template: template.id,
    // An uploaded footer belongs to the person, not the template.
    customFooter: current?.customFooter ?? null,
  };
}

/** Width in percent of each column of a row. */
function columnWidths(row: Row): number[] {
  return row.columns.length === 2 ? [row.split, 100 - row.split] : [100];
}

/** Variant a section should get from a template, given the narrowest column it sits in. */
function variantIn(t: DesignTemplate, section: Section, narrow: boolean): string | undefined {
  return (narrow && t.narrow?.[section.type]) || t.variants[section.type];
}

/** Narrowest column width each section is placed in. */
function placedWidths(doc: ResumeDocument): Map<string, number> {
  const widths = new Map<string, number>();
  for (const page of doc.pages)
    for (const row of page.rows)
      columnWidths(row).forEach((w, i) => {
        for (const p of row.columns[i]) widths.set(p.sectionId, Math.min(w, widths.get(p.sectionId) ?? 100));
      });
  return widths;
}

/**
 * Apply a template's look (colors, fonts, section styles, footer) without
 * moving any sections. Two-column rows pick up the template's sidebar shading.
 */
export function applyTemplate(doc: ResumeDocument, templateId: string, reshade = true): ResumeDocument {
  const t = getTemplate(templateId);
  const shadesSidebar = t.rows.some((r) => r.shade && r.shade !== 'none');
  const widths = placedWidths(doc);
  return {
    ...doc,
    theme: themeFor(t, doc.theme),
    sections: doc.sections.map((s) => {
      const variant = variantIn(t, s, (widths.get(s.id) ?? 100) < 45);
      return variant ? { ...s, variant } : s;
    }),
    pages: doc.pages.map((p) => ({
      ...p,
      // A footer the person made themselves stays put.
      footer: p.footer === 'custom' && doc.theme.customFooter ? 'custom' : t.footer,
      rows: reshade
        ? p.rows.map((r) => ({
            ...r,
            // Shade whichever column is the narrow one.
            shade: r.columns.length === 2 && shadesSidebar ? (r.split <= 50 ? 'left' : 'right') : 'none',
          }))
        : p.rows,
    })),
  };
}

/** Which template slot a section belongs in. */
function slotOf(section: Section, firstTextId: string | undefined): Slot | null {
  switch (section.type) {
    case 'header':
      return 'header';
    case 'contact':
      return 'contact';
    case 'text':
      return section.id === firstTextId ? 'about' : 'main';
    case 'experience':
      return 'main';
    case 'spacer':
      return null;
    default:
      return 'side';
  }
}

/**
 * Lay every section out using the template's row structure, all on the first
 * page; the caller runs "fix overflow" afterwards to spread it over pages.
 */
export function arrangeLayout(doc: ResumeDocument, templateId: string): ResumeDocument {
  const t = getTemplate(templateId);
  const firstText = doc.sections.find((s) => s.type === 'text')?.id;
  const bySlot: Record<Slot, Section[]> = { header: [], contact: [], about: [], main: [], side: [] };
  for (const s of doc.sections) {
    const slot = slotOf(s, firstText);
    if (slot) bySlot[slot].push(s);
  }

  // Slots the template doesn't have fall back to a related one.
  const has = (slot: Slot) => t.rows.some((r) => r.cols.some((c) => c.includes(slot)));
  if (!has('about')) bySlot.main.unshift(...bySlot.about.splice(0));
  if (!has('side')) bySlot.main.push(...bySlot.side.splice(0));
  if (!has('main')) bySlot.side.push(...bySlot.main.splice(0));
  if (!has('contact')) bySlot.header.push(...bySlot.contact.splice(0));

  const rows: Row[] = t.rows.map((spec) => {
    const row = newRow(spec.cols.length === 2 ? 2 : 1, spec.split ?? 32);
    row.shade = spec.shade ?? 'none';
    row.columns = spec.cols.map((slots) => {
      let list = slots.flatMap((slot) => bySlot[slot]);
      // A column holding both main and side content keeps the user's section order.
      if (slots.includes('main') && slots.includes('side')) {
        const body = new Set([...bySlot.main, ...bySlot.side]);
        const order = doc.sections.filter((s) => body.has(s));
        const at = list.findIndex((s) => body.has(s));
        list = [...list.slice(0, at).filter((s) => !body.has(s)), ...order, ...list.slice(at).filter((s) => !body.has(s))];
      }
      return list.map((s) => newPlacement(s.id));
    });
    return row;
  });
  // Rows left empty (say, no summary) are dropped.
  const used = rows.filter((r) => r.columns.some((c) => c.length));

  const page: Page = { id: doc.pages[0]?.id ?? uid('page'), rows: used.length ? used : [newRow(1)], footer: doc.pages[0]?.footer ?? t.footer };
  return applyTemplate({ ...doc, pages: [page] }, templateId, false);
}
