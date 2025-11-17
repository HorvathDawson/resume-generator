// Main type exports for the resume builder
export type * from './resume';
export type * from './styles';
export type * from './template';
export type * from './sections';

// Re-export commonly used interfaces
export type { 
  ResumeData, 
  Section, 
  SectionItem, 
  PersonalInfo,
  SectionType 
} from './resume';

export type { 
  GlobalStyles, 
  PageStyles, 
  ColorScheme,
  FontSizes,
  Margins 
} from './styles';

export type { 
  SectionTemplate, 
  TemplateLibrary,
  TemplateVariant 
} from './template';

export type { 
  LayoutBuilderState, 
  PageLayout,
  LayoutPosition,
  PageBreakInfo,
  PageStyle,
  ColumnConfig,
  GlobalLayoutStyles,
  LayoutConfig
} from './layout';
