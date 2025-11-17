import type { TemplateType } from './styling';

/**
 * Base interface for all resume sections
 */
export interface BaseSection {
  id: string;
  title: string;
  templateType: TemplateType;
  isVisible: boolean;
  order: number;
}

/**
 * Contact information section
 */
export interface ContactInfo extends BaseSection {
  type: 'contact';
  data: {
    fullName: string;
    email: string;
    phone: string;
    website?: string;
    linkedin?: string;
    github?: string;
    location: string;
  };
}

/**
 * Individual experience/education/project item with manual page break support
 */
export interface ResumeItem {
  id: string;
  title: string;
  subtitle?: string;
  organization?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  details: string[];
  tags?: string[];
  order: number;
  // Manual page break control
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  // Section splitting control
  isVisible?: boolean; // Can be hidden in specific section instances
}

/**
 * Section instance configuration for splitting
 */
export interface SectionInstance {
  id: string;
  sectionId: string; // Reference to the original section
  instanceNumber: number; // Which instance this is (1, 2, 3, etc.)
  selectedItems: string[]; // Array of item IDs to include in this instance
  showContinuation: boolean; // Whether to show "continued" indicator
  continuationText?: string; // Custom continuation text
  title?: string; // Override title for this instance
}

/**
 * Work experience section
 */
export interface WorkExperience extends BaseSection {
  type: 'work-experience';
  data: {
    items: ResumeItem[];
  };
}

/**
 * Generic experience section (can be reused for various types of experience)
 */
export interface Experience extends BaseSection {
  type: 'experience';
  data: {
    items: ResumeItem[];
  };
}

/**
 * Education section
 */
export interface Education extends BaseSection {
  type: 'education';
  data: {
    items: ResumeItem[];
  };
}

/**
 * Projects section
 */
export interface Projects extends BaseSection {
  type: 'projects';
  data: {
    items: ResumeItem[];
  };
}

/**
 * Skills section with categories
 */
export interface Skills extends BaseSection {
  type: 'skills';
  data: {
    categories: Array<{
      id: string;
      name: string;
      skills: Array<{
        id: string;
        name: string;
        level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      }>;
      order: number;
    }>;
  };
}

/**
 * Simple text section (summary, objective, etc.)
 */
export interface TextSection extends BaseSection {
  type: 'text';
  data: {
    content: string;
  };
}

/**
 * Certifications section
 */
export interface Certifications extends BaseSection {
  type: 'certifications';
  data: {
    items: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
      expiryDate?: string;
      credentialId?: string;
      url?: string;
      order: number;
    }>;
  };
}

/**
 * Union type of all possible sections
 */
export type ResumeSection = 
  | ContactInfo
  | WorkExperience
  | Experience
  | Education
  | Projects
  | Skills
  | TextSection
  | Certifications;

/**
 * Available section types
 */
export type SectionType = ResumeSection['type'];
