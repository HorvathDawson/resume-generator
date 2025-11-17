import type { SectionType } from './resume';

// Template variant for different visual styles
export type TemplateVariant = 'default' | 'compact' | 'wide' | 'timeline' | 'grid' | 'cards';

// Template configuration for a specific section type
export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  sectionType: SectionType;
  variant: TemplateVariant;
  
  // Visual properties
  layout: {
    orientation: 'vertical' | 'horizontal' | 'grid';
    itemSpacing: string; // cm value
    showBullets: boolean;
    showDividers: boolean;
    showIcons: boolean;
  };
  
  // Field configuration - which fields to show/hide
  fields: {
    showDates: boolean;
    showLocation: boolean;
    showOrganization: boolean;
    showDescription: boolean;
    showDetails: boolean;
    showTags: boolean;
    showLinks: boolean;
    customFields: string[]; // Additional custom fields to display
  };
  
  // Typography overrides specific to this template
  typography?: {
    titleSize?: string; // cm value
    titleWeight?: 'normal' | 'bold' | 'semibold';
    titleColor?: string;
    bodySize?: string;
    emphasizeFirstItem?: boolean;
  };
  
  // Preview image for template selection
  previewImage?: string;
  
  // Template metadata
  isBuiltIn: boolean;
  category: 'professional' | 'creative' | 'minimal' | 'modern' | 'academic';
  tags: string[];
}

// Template library containing all available templates
export interface TemplateLibrary {
  sections: Record<SectionType, SectionTemplate[]>;
  categories: {
    [category: string]: {
      name: string;
      description: string;
      templates: string[]; // template IDs
    };
  };
}

// Template selection state for the UI
export interface TemplateSelection {
  sectionId: string;
  selectedTemplateId: string;
  isPreviewMode: boolean;
}

// Template customization options
export interface TemplateCustomization {
  templateId: string;
  sectionId: string;
  overrides: {
    layout?: Partial<SectionTemplate['layout']>;
    fields?: Partial<SectionTemplate['fields']>;
    typography?: Partial<SectionTemplate['typography']>;
  };
}
