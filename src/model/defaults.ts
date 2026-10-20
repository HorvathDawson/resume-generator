import type {
  Entry,
  Page,
  Placement,
  Profile,
  Reference,
  ResumeDocument,
  Row,
  Section,
  SectionType,
  SkillGroup,
  Theme,
} from './types';
import { SCHEMA_ID, SCHEMA_VERSION } from './types';
import { defaultVariant } from './variants';

export function uid(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function emptyProfile(): Profile {
  return { name: '', headline: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '' };
}

export function newEntry(fields: Partial<Entry> = {}): Entry {
  return {
    id: uid('item'),
    title: '',
    subtitle: '',
    location: '',
    dates: '',
    note: '',
    description: '',
    bullets: [],
    tags: [],
    url: '',
    ...fields,
  };
}

export function newSkillGroup(fields: Partial<SkillGroup> = {}): SkillGroup {
  return { id: uid('group'), name: '', skills: [], ...fields };
}

export function newReference(fields: Partial<Reference> = {}): Reference {
  return { id: uid('ref'), name: '', role: '', organization: '', email: '', phone: '', note: '', ...fields };
}

const DEFAULT_TITLES: Record<SectionType, string> = {
  header: 'Name',
  contact: 'Contact',
  text: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  list: 'Certifications',
  references: 'References',
  spacer: 'Blank space',
};

/** The fields every section shares, with defaults for a new section. */
export function sectionBase(type: SectionType, title = DEFAULT_TITLES[type]) {
  return {
    id: uid(type),
    title,
    variant: defaultVariant(type),
    showTitle: type !== 'header' && type !== 'contact' && type !== 'spacer',
  };
}

/** A new, empty section of the given type with one blank item to fill in. */
export function newSection(type: SectionType, title = DEFAULT_TITLES[type]): Section {
  const base = sectionBase(type, title);
  switch (type) {
    case 'header':
    case 'contact':
      return { ...base, type };
    case 'text':
      return { ...base, type, body: '' };
    case 'experience':
    case 'education':
      return { ...base, type, items: [newEntry()] };
    case 'skills':
      return { ...base, type, groups: [newSkillGroup()] };
    case 'list':
      return { ...base, type, items: [] };
    case 'references':
      return { ...base, type, items: [], emptyText: 'Available upon request.' };
    case 'spacer':
      return { ...base, type, height: 0.5 };
  }
}

export function newPlacement(sectionId: string): Placement {
  return { id: uid('place'), sectionId };
}

export function newRow(columnCount: 1 | 2 = 1, split = 32): Row {
  return {
    id: uid('row'),
    columns: columnCount === 1 ? [[]] : [[], []],
    split,
    shade: 'none',
  };
}

export function newPage(): Page {
  return { id: uid('page'), rows: [newRow(1)], footer: 'none' };
}

export const DEFAULT_THEME: Theme = {
  template: 'sidebar',
  font: 'Inter',
  headingFont: 'Inter',
  fontSize: 9.5,
  lineHeight: 1.4,
  spacing: 1,
  headingStyle: 'underline',
  accent: '#2c5aa0',
  text: '#1f2937',
  muted: '#6b7280',
  shade: '#f1f5f9',
  shadeText: '#1f2937',
  shadeAccent: '#2c5aa0',
  margin: 1.2,
  columnGap: 0.7,
};

/** A blank resume with a sensible starting structure. */
export function blankDocument(): ResumeDocument {
  const header = newSection('header');
  const contact = newSection('contact');
  const summary = newSection('text');
  const experience = newSection('experience');
  const education = newSection('education');
  const skills = newSection('skills');
  const sections = [header, contact, summary, experience, education, skills];
  const top = newRow(1);
  top.columns[0] = [newPlacement(header.id), newPlacement(contact.id), newPlacement(summary.id)];
  const body = newRow(1);
  body.columns[0] = [newPlacement(experience.id), newPlacement(education.id), newPlacement(skills.id)];
  return {
    schema: SCHEMA_ID,
    version: SCHEMA_VERSION,
    id: uid('resume'),
    title: 'My resume',
    updatedAt: new Date().toISOString(),
    profile: emptyProfile(),
    sections: sections.map((s) => (s.type === 'contact' ? { ...s, variant: 'inline' } : s)),
    pages: [{ id: uid('page'), rows: [top, body], footer: 'none' }],
    theme: { ...DEFAULT_THEME, template: 'classic' },
  };
}

/** How many reorderable items a section has (what `from`/`to` slice). */
export function itemCount(section: Section): number {
  switch (section.type) {
    case 'experience':
    case 'education':
    case 'list':
    case 'references':
      return section.items.length;
    case 'skills':
      return section.groups.length;
    default:
      return 0;
  }
}

/** Keep only items [from, to) of a section, for sections split across pages. */
export function sliceSection(section: Section, from = 0, to?: number): Section {
  const cut = <T,>(list: T[]) => list.slice(from, to);
  switch (section.type) {
    case 'experience':
    case 'education':
      return { ...section, items: cut(section.items) };
    case 'list':
      return { ...section, items: cut(section.items) };
    case 'references':
      return { ...section, items: cut(section.items) };
    case 'skills':
      return { ...section, groups: cut(section.groups) };
    default:
      return section;
  }
}
