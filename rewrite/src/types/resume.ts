import type { ResumeMetadata } from './styles';
import type { FlexLayoutConfig } from './layout';

// Core resume data types - comprehensive and serializable
export interface PersonalInfo {
  fullName: string; // Changed from 'name' to match your JSON structure
  email?: string;
  phone?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  location?: string;
  [key: string]: string | undefined; // Allow custom fields
}

// Base section item for experience, education, projects, etc.
export interface SectionItem {
  id: string;
  title: string;
  organization?: string;
  location?: string;
  dates?: string;
  description?: string;
  details?: string[];
  tags?: string[];
  url?: string;
  gpa?: string;
  degree?: string;
  institution?: string;
  [key: string]: any; // Allow custom fields for flexibility
}

// Section definition with items and metadata
export interface Section {
  id: string;
  title: string;
  type: SectionType;
  items: SectionItem[];
  templateId: string; // Which template to use for rendering
  isVisible: boolean;
  customFields?: Record<string, any>;
}

// Available section types
export type SectionType = 
  | 'personal_info'
  | 'education' 
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'text'
  | 'list'
  | 'volunteer'
  | 'publications'
  | 'awards'
  | 'custom';

// Page break definition for manual section splitting
export interface PageBreak {
  id: string;
  afterItemIndex: number; // Insert page break after this item index
  sectionId: string;
}

// Enhanced layout positioning
export interface LayoutPosition {
  column: 'left' | 'right' | 'whole-page';
  order: number; // Order within the column/page
  pageNumber?: number; // Optional: force to specific page
}

// Section placement in layout with page breaks
export interface SectionPlacement {
  sectionId: string;
  templateId?: string; // Override section's default template
  position: LayoutPosition;
  pageBreaks: PageBreak[]; // Manual page breaks within this section
  isVisible: boolean;
}

// Complete resume data structure
export interface ResumeData {
  id: string;
  name: string;
  personalInfo: PersonalInfo;
  sections: Section[];
  
  // New flexible layout configuration
  layout: FlexLayoutConfig;
  
  metadata: ResumeMetadata;
}
