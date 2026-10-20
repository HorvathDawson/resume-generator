// The single source of truth for a resume. Everything the app shows, saves,
// imports and exports is a ResumeDocument; there is no other hidden state.

export const SCHEMA_ID = 'resume-generator';
export const SCHEMA_VERSION = 2;

export interface Profile {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export type SectionType =
  | 'header'
  | 'contact'
  | 'text'
  | 'experience'
  | 'education'
  | 'skills'
  | 'list'
  | 'references'
  | 'spacer';

/** One job, degree, project, award, publication... */
export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  dates: string;
  /** Short extra line, e.g. "GPA 3.7" or a credential ID. */
  note: string;
  description: string;
  bullets: string[];
  tags: string[];
  url: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
}

export interface Reference {
  id: string;
  name: string;
  role: string;
  organization: string;
  email: string;
  phone: string;
  note: string;
}

interface SectionBase {
  id: string;
  title: string;
  /** Style variant id, see model/variants.ts. */
  variant: string;
  showTitle: boolean;
}

export interface HeaderSection extends SectionBase { type: 'header' }
export interface ContactSection extends SectionBase { type: 'contact' }
export interface TextSection extends SectionBase { type: 'text'; body: string }
export interface EntriesSection extends SectionBase { type: 'experience' | 'education'; items: Entry[] }
export interface SkillsSection extends SectionBase { type: 'skills'; groups: SkillGroup[] }
export interface ListSection extends SectionBase { type: 'list'; items: string[] }
export interface ReferencesSection extends SectionBase { type: 'references'; items: Reference[]; emptyText: string }
export interface SpacerSection extends SectionBase { type: 'spacer'; height: number }

export type Section =
  | HeaderSection
  | ContactSection
  | TextSection
  | EntriesSection
  | SkillsSection
  | ListSection
  | ReferencesSection
  | SpacerSection;

/**
 * A section placed on a page. `from`/`to` show only part of the section's
 * items (0-based, `to` exclusive), which is how a long section is split
 * across pages.
 */
export interface Placement {
  id: string;
  sectionId: string;
  from?: number;
  to?: number;
}

export type Shade = 'none' | 'left' | 'right';

/** A horizontal band of the page: one column, or two side by side. */
export interface Row {
  id: string;
  columns: Placement[][];
  /** Width of the left column in percent when there are two columns. */
  split: number;
  /** Which column (if any) gets the sidebar background. */
  shade: Shade;
}

export type FooterType = 'none' | 'default' | 'mountains' | 'fish' | 'salmon' | 'minimal' | 'modern';

export interface Page {
  id: string;
  rows: Row[];
  footer: FooterType;
}

export type HeadingStyle = 'underline' | 'bar' | 'caps' | 'plain' | 'boxed';

export interface Theme {
  /** Id of the design template this theme started from. */
  template: string;
  font: string;
  headingFont: string;
  /** Body font size in points. */
  fontSize: number;
  lineHeight: number;
  /** Multiplier for the space between sections and items. */
  spacing: number;
  headingStyle: HeadingStyle;
  accent: string;
  text: string;
  muted: string;
  shade: string;
  shadeText: string;
  shadeAccent: string;
  /** Page margin in cm. */
  margin: number;
  /** Gap between two columns in cm. */
  columnGap: number;
}

export interface ResumeDocument {
  schema: typeof SCHEMA_ID;
  version: typeof SCHEMA_VERSION;
  id: string;
  /** What the user calls this resume, also used for file names. */
  title: string;
  updatedAt: string;
  profile: Profile;
  sections: Section[];
  pages: Page[];
  theme: Theme;
}
