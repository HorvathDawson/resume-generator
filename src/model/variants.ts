import type { FooterType, HeadingStyle, SectionType } from './types';

export interface Option<T extends string = string> {
  id: T;
  label: string;
}

/** Style variants each section type can render with. The first is the default. */
export const SECTION_VARIANTS: Record<SectionType, Option[]> = {
  header: [
    { id: 'left', label: 'Left aligned' },
    { id: 'centered', label: 'Centered' },
    { id: 'banner', label: 'Color banner' },
  ],
  contact: [
    { id: 'stacked', label: 'Stacked with icons' },
    { id: 'inline', label: 'One line' },
    { id: 'centered', label: 'One line, centered' },
  ],
  text: [
    { id: 'plain', label: 'Plain' },
    { id: 'accent', label: 'Accent bar' },
  ],
  experience: [
    { id: 'standard', label: 'Standard' },
    { id: 'compact', label: 'Compact' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'stacked', label: 'Stacked (narrow columns)' },
  ],
  education: [
    { id: 'standard', label: 'Standard' },
    { id: 'compact', label: 'Compact' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'stacked', label: 'Stacked (narrow columns)' },
  ],
  skills: [
    { id: 'tags', label: 'Tags' },
    { id: 'lines', label: 'Comma lists' },
    { id: 'grid', label: 'Two-column grid' },
  ],
  list: [
    { id: 'bullets', label: 'Bullets' },
    { id: 'plain', label: 'Plain lines' },
    { id: 'inline', label: 'Inline' },
  ],
  references: [
    { id: 'grid', label: 'Grid' },
    { id: 'list', label: 'List' },
  ],
  spacer: [{ id: 'default', label: 'Blank space' }],
};

export function defaultVariant(type: SectionType): string {
  return SECTION_VARIANTS[type][0].id;
}

export function isValidVariant(type: SectionType, variant: unknown): variant is string {
  return SECTION_VARIANTS[type].some((v) => v.id === variant);
}

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  header: 'Name & headline',
  contact: 'Contact details',
  text: 'Text / summary',
  experience: 'Experience & projects',
  education: 'Education',
  skills: 'Skills',
  list: 'Simple list',
  references: 'References',
  spacer: 'Blank space',
};

export const HEADING_STYLES: Option<HeadingStyle>[] = [
  { id: 'underline', label: 'Underline' },
  { id: 'bar', label: 'Side bar' },
  { id: 'caps', label: 'Small caps' },
  { id: 'boxed', label: 'Tinted box' },
  { id: 'plain', label: 'Plain' },
];

export const FOOTERS: Option<FooterType>[] = [
  { id: 'none', label: 'None' },
  { id: 'minimal', label: 'Dot' },
  { id: 'modern', label: 'Fading line' },
  { id: 'default', label: 'Angled shapes' },
  { id: 'mountains', label: 'Mountains' },
  { id: 'fish', label: 'Fish' },
  { id: 'salmon', label: 'Salmon' },
];

/** Height reserved at the bottom of the page for each footer, in cm. */
export const FOOTER_HEIGHT: Record<FooterType, number> = {
  none: 0,
  minimal: 0.8,
  modern: 0.8,
  default: 1.6,
  mountains: 1.6,
  fish: 1.6,
  salmon: 1.6,
};

export interface FontOption {
  id: string;
  label: string;
  /** CSS font-family value. */
  stack: string;
  /** Google Fonts family query, if it should be loaded from there. */
  google?: string;
}

export const FONTS: FontOption[] = [
  { id: 'Inter', label: 'Inter', stack: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400;500;600;700' },
  { id: 'Roboto', label: 'Roboto', stack: "'Roboto', Arial, sans-serif", google: 'Roboto:wght@400;500;700' },
  { id: 'Lato', label: 'Lato', stack: "'Lato', Arial, sans-serif", google: 'Lato:wght@400;700' },
  { id: 'Open Sans', label: 'Open Sans', stack: "'Open Sans', Arial, sans-serif", google: 'Open+Sans:wght@400;600;700' },
  { id: 'Source Sans 3', label: 'Source Sans', stack: "'Source Sans 3', Arial, sans-serif", google: 'Source+Sans+3:wght@400;600;700' },
  { id: 'Work Sans', label: 'Work Sans', stack: "'Work Sans', Arial, sans-serif", google: 'Work+Sans:wght@400;500;600;700' },
  { id: 'Poppins', label: 'Poppins', stack: "'Poppins', Arial, sans-serif", google: 'Poppins:wght@400;500;600;700' },
  { id: 'Merriweather', label: 'Merriweather', stack: "'Merriweather', Georgia, serif", google: 'Merriweather:wght@400;700' },
  { id: 'Source Serif 4', label: 'Source Serif', stack: "'Source Serif 4', Georgia, serif", google: 'Source+Serif+4:wght@400;600;700' },
  { id: 'EB Garamond', label: 'EB Garamond', stack: "'EB Garamond', Garamond, serif", google: 'EB+Garamond:wght@400;500;600;700' },
  { id: 'Arial', label: 'Arial (no download)', stack: 'Arial, Helvetica, sans-serif' },
  { id: 'Georgia', label: 'Georgia (no download)', stack: 'Georgia, serif' },
];

export function fontStack(id: string): string {
  return FONTS.find((f) => f.id === id)?.stack ?? `'${id}', sans-serif`;
}

/** Google Fonts stylesheet URL for the given font ids, or null if none need loading. */
export function googleFontsUrl(ids: string[]): string | null {
  const families = [...new Set(ids)]
    .map((id) => FONTS.find((f) => f.id === id)?.google)
    .filter((g): g is string => !!g);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
}
