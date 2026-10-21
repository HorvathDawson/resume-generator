import { FOOTERS, HEADING_STYLES, SECTION_VARIANTS } from '../model/variants';
import { SCHEMA_ID, SCHEMA_VERSION } from '../model/types';
import type { SectionType } from '../model/types';
import { APP_URL } from './guide';

// JSON Schema (draft 2020-12) for one .resume.json file, written into each
// library as resume.schema.json so agents and editors can check their edits.
// It describes what the app writes; the app itself is more forgiving on read.

const str = { type: 'string' };
const strings = { type: 'array', items: str };
const id = { type: 'string', minLength: 1 };
const color = { type: 'string', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$' };
const range = (minimum: number, maximum: number) => ({ type: 'number', minimum, maximum });

const entry = {
  type: 'object',
  required: ['id', 'title'],
  properties: {
    id,
    title: str,
    subtitle: str,
    location: str,
    dates: str,
    note: str,
    description: str,
    bullets: strings,
    tags: strings,
    url: str,
  },
};

const reference = {
  type: 'object',
  required: ['id', 'name'],
  properties: { id, name: str, role: str, organization: str, email: str, phone: str, note: str },
};

const sectionFields: Record<SectionType, Record<string, unknown>> = {
  header: {},
  contact: {},
  text: { body: str },
  experience: { items: { type: 'array', items: entry } },
  education: { items: { type: 'array', items: entry } },
  skills: {
    groups: { type: 'array', items: { type: 'object', required: ['id', 'skills'], properties: { id, name: str, skills: strings } } },
  },
  list: { items: strings },
  references: { items: { type: 'array', items: reference }, emptyText: str },
  spacer: { height: range(0, 20) },
};

const section = {
  oneOf: (Object.keys(sectionFields) as SectionType[]).map((type) => ({
    type: 'object',
    required: ['id', 'type'],
    properties: {
      id,
      type: { const: type },
      title: str,
      variant: { enum: SECTION_VARIANTS[type].map((v) => v.id) },
      showTitle: { type: 'boolean' },
      ...sectionFields[type],
    },
  })),
};

const placement = {
  type: 'object',
  required: ['id', 'sectionId'],
  properties: { id, sectionId: id, from: { type: 'integer', minimum: 0 }, to: { type: 'integer', minimum: 0 } },
};

export const RESUME_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: `${APP_URL}resume.schema.json`,
  title: 'Resume Builder resume',
  description: `One resume made with Resume Builder (${APP_URL}). See AGENTS.md in the library for how the fields fit together.`,
  type: 'object',
  required: ['schema', 'version', 'id', 'title', 'profile', 'sections', 'pages', 'theme'],
  properties: {
    schema: { const: SCHEMA_ID },
    version: { const: SCHEMA_VERSION },
    id,
    title: str,
    updatedAt: str,
    meta: {
      type: 'object',
      properties: {
        basedOn: { type: 'string', description: 'id of the resume this one was copied from, or "".' },
        target: { type: 'string', description: 'The job or kind of job this version is for.' },
        notes: str,
      },
    },
    profile: {
      type: 'object',
      properties: { name: str, headline: str, email: str, phone: str, location: str, website: str, linkedin: str, github: str },
    },
    sections: { type: 'array', items: section },
    pages: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'rows'],
        properties: {
          id,
          footer: { enum: FOOTERS.map((f) => f.id) },
          rows: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['id', 'columns'],
              properties: {
                id,
                columns: { type: 'array', minItems: 1, maxItems: 2, items: { type: 'array', items: placement } },
                split: range(15, 85),
                shade: { enum: ['none', 'left', 'right'] },
              },
            },
          },
        },
      },
    },
    theme: {
      type: 'object',
      properties: {
        template: str,
        font: str,
        headingFont: str,
        fontSize: range(6, 16),
        lineHeight: range(1, 2.2),
        spacing: range(0.4, 2.5),
        headingStyle: { enum: HEADING_STYLES.map((h) => h.id) },
        accent: color,
        text: color,
        muted: color,
        shade: color,
        shadeText: color,
        shadeAccent: color,
        margin: range(0, 5),
        columnGap: range(0, 5),
      },
    },
  },
};

export const resumeSchemaText = () => `${JSON.stringify(RESUME_SCHEMA, null, 2)}\n`;
