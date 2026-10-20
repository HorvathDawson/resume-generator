import type { Page, ResumeDocument, Row, Section, SectionType, Shade, Theme } from './types';
import { DEFAULT_THEME, newPlacement, newRow, uid } from './defaults';

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  theme: Omit<Theme, 'template' | 'fontSize'> & { fontSize?: number };
  variants: Partial<Record<SectionType, string>>;
  /** How "Auto-arrange" lays sections out for this template. */
  arrangement:
    | { kind: 'single' }
    | { kind: 'sidebar'; side: 'left' | 'right'; split: number; shade: boolean; headerInSidebar?: boolean };
}

export const TEMPLATES: DesignTemplate[] = [
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Tinted side column for contact and skills, roomy main column.',
    theme: { ...DEFAULT_THEME },
    variants: { header: 'left', contact: 'stacked', experience: 'standard', education: 'stacked', skills: 'tags', list: 'bullets', text: 'plain', references: 'grid' },
    arrangement: { kind: 'sidebar', side: 'left', split: 32, shade: true },
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Single column serif layout. Safe for any application system.',
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
    variants: { header: 'centered', contact: 'centered', experience: 'standard', education: 'standard', skills: 'lines', list: 'bullets', text: 'plain', references: 'list' },
    arrangement: { kind: 'single' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean sans-serif, thin rules and lots of white space.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Lato',
      headingFont: 'Lato',
      headingStyle: 'plain',
      accent: '#0f766e',
      text: '#1f2937',
      muted: '#6b7280',
      shade: '#f0fdfa',
      shadeText: '#1f2937',
      shadeAccent: '#0f766e',
      margin: 1.5,
      spacing: 1.1,
    },
    variants: { header: 'left', contact: 'inline', experience: 'compact', education: 'compact', skills: 'grid', list: 'inline', text: 'plain', references: 'list' },
    arrangement: { kind: 'single' },
  },
  {
    id: 'banner',
    name: 'Banner',
    description: 'Bold color header with a timeline and a slim right column.',
    theme: {
      ...DEFAULT_THEME,
      font: 'Work Sans',
      headingFont: 'Poppins',
      headingStyle: 'bar',
      accent: '#7c3aed',
      text: '#1f2937',
      muted: '#6b7280',
      shade: '#f5f3ff',
      shadeText: '#1f2937',
      shadeAccent: '#6d28d9',
      margin: 1.2,
    },
    variants: { header: 'banner', contact: 'stacked', experience: 'timeline', education: 'stacked', skills: 'tags', list: 'bullets', text: 'accent', references: 'list' },
    arrangement: { kind: 'sidebar', side: 'right', split: 66, shade: false },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Dark sidebar with light text for a striking first page.',
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
      fontSize: 9,
    },
    variants: { header: 'left', contact: 'stacked', experience: 'standard', education: 'stacked', skills: 'lines', list: 'plain', text: 'plain', references: 'list' },
    arrangement: { kind: 'sidebar', side: 'left', split: 34, shade: true, headerInSidebar: true },
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
  };
}

/**
 * Apply a template's look (colors, fonts, section styles) without moving any
 * sections. Two-column rows pick up the template's sidebar shading.
 */
export function applyTemplate(doc: ResumeDocument, templateId: string): ResumeDocument {
  const t = getTemplate(templateId);
  const shadeFor = (row: Row): Shade => {
    if (row.columns.length < 2 || t.arrangement.kind !== 'sidebar' || !t.arrangement.shade) return 'none';
    // Shade whichever column is the narrow one.
    return row.split <= 50 ? 'left' : 'right';
  };
  return {
    ...doc,
    theme: themeFor(t, doc.theme),
    sections: doc.sections.map((s) => {
      const variant = t.variants[s.type];
      return variant ? { ...s, variant } : s;
    }),
    pages: doc.pages.map((p) => ({ ...p, rows: p.rows.map((r) => ({ ...r, shade: shadeFor(r) })) })),
  };
}

const SIDEBAR_TYPES: SectionType[] = ['contact', 'education', 'skills', 'list', 'references'];

/** Lay every section out on one page using the template's structure. */
export function arrangeLayout(doc: ResumeDocument, templateId: string): ResumeDocument {
  const t = getTemplate(templateId);
  const visible = doc.sections.filter((s) => s.type !== 'spacer');
  const headers = visible.filter((s) => s.type === 'header');
  const rest = visible.filter((s) => s.type !== 'header');
  const place = (list: Section[]) => list.map((s) => newPlacement(s.id));

  const rows: Row[] = [];
  const top = newRow(1);
  top.columns[0] = place(headers);

  if (t.arrangement.kind === 'single') {
    // Contact goes straight under the name in single-column layouts.
    const contact = rest.filter((s) => s.type === 'contact');
    top.columns[0].push(...place(contact));
    const body = newRow(1);
    body.columns[0] = place(rest.filter((s) => s.type !== 'contact'));
    rows.push(top, body);
  } else {
    const { side, split, shade, headerInSidebar } = t.arrangement;
    const sidebar = [...(headerInSidebar ? headers : []), ...rest.filter((s) => SIDEBAR_TYPES.includes(s.type))];
    const main = rest.filter((s) => !SIDEBAR_TYPES.includes(s.type));
    if (headerInSidebar) top.columns[0] = [];
    const body = newRow(2, split);
    body.columns = side === 'left' ? [place(sidebar), place(main)] : [place(main), place(sidebar)];
    body.shade = shade ? side : 'none';
    if (top.columns[0].length) rows.push(top);
    rows.push(body);
  }

  const first = doc.pages[0];
  const page: Page = { id: first?.id ?? uid('page'), rows, footer: first?.footer ?? 'none' };
  return applyTemplate({ ...doc, pages: [page] }, templateId);
}
