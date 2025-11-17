import type { SectionPlacement } from './resume';
import type { Margins, ColorValue, CmValue, FontFamily, FontSizes, ColorScheme } from './styles';
import type { SectionInstance } from './sections';

// Section reference that can be either a regular section or a section instance
export interface SectionReference {
  id: string;
  type: 'section' | 'section-instance';
  sectionId: string; // For instances, this points to the original section
  instanceId?: string; // Only for section instances
}

// Simplified flexible column system
export interface FlexColumn {
  id: string;
  width: number; // Percentage (e.g., 30 for 30%)
  sections: SectionReference[]; // Array of section references (can be split instances)
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
}

// Column pair represents two columns side by side
export interface ColumnPair {
  id: string;
  left: FlexColumn;
  right: FlexColumn;
}

// Full-width section that spans the entire page width
export interface WholePageRow {
  id: string;
  sections: SectionReference[]; // Array of section references that span the full width
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
}

// Page layout with flexible rows of columns and whole-page sections
export interface FlexPageLayout {
  id: string;
  rows: Array<ColumnPair | WholePageRow>; // Mix of column pairs and whole-page rows
  margins: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };
  columnGap?: string; // Gap between columns in a pair
  rowGap?: string; // Gap between rows
  backgroundColor?: string;
}

// Complete flexible layout configuration
export interface FlexLayoutConfig {
  pages: FlexPageLayout[];
  sectionInstances: SectionInstance[]; // Track all section splitting instances
  globalStyles: {
    fontSizes: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
      small: string;
    };
    fontFamily: string;
    colorScheme: {
      primary: string;
      secondary: string;
      text: string;
      accent: string;
    };
    spacing: {
      sectionMargin: string;
      itemMargin: string;
      pageMargin: string;
    };
  };
}

// Helper functions to create common layouts
export type LayoutTemplate = 
  | 'single-column'     // |-----|
  | 'two-column-equal'  // |c|c|
  | 'two-column-left'   // |cc|c|
  | 'two-column-right'  // |c|cc|
  | 'three-column'      // |c|c|c|
  | 'mixed-layout';     // Custom mix

// Legacy support - keeping existing complex types for backward compatibility
// ... rest of the existing types remain unchanged ...

// Column layout configuration with width and positioning
export interface ColumnConfig {
  width: string; // e.g., "30%", "8cm"
  alignment: 'left' | 'right' | 'center';
  padding: Margins;
  backgroundColor?: ColorValue;
  textColor?: ColorValue;
  borderColor?: ColorValue;
  borderWidth?: CmValue;
}

// Footer configuration for each page
export interface FooterConfig {
  type: 'none' | 'simple' | 'mountains' | 'fish' | 'custom';
  height: CmValue;
  backgroundColor?: ColorValue;
  textColor?: ColorValue;
  content?: string; // For custom footers
  seed?: string;    // For randomized footers like mountains
  position: 'bottom' | 'top'; // Usually bottom, but allow flexibility
}

// Page-level style configuration
export interface PageStyle {
  margins: Margins;
  footer: FooterConfig;
  background: {
    color: ColorValue;
    image?: string;
    pattern?: string;
  };
  columns: {
    left: ColumnConfig;
    right: ColumnConfig;
    wholePage: ColumnConfig;
  };
  // Page-specific overrides for global styles
  fontSizeOverrides?: Partial<FontSizes>;
  colorOverrides?: Partial<ColorScheme>;
  spacing?: {
    sectionSpacing?: CmValue;
    itemSpacing?: CmValue;
    paragraphSpacing?: CmValue;
  };
}

// Global layout styles that apply across all pages
export interface GlobalLayoutStyles {
  // Typography
  fontFamily: FontFamily;
  fontSizes: FontSizes;
  lineHeight: number;
  
  // Color scheme
  colorScheme: ColorScheme;
  
  // Spacing and layout
  spacing: {
    sectionSpacing: CmValue;
    itemSpacing: CmValue;
    paragraphSpacing: CmValue;
    columnGap: CmValue;
  };
  
  // Borders and visual elements
  borders: {
    width: CmValue;
    style: 'solid' | 'dashed' | 'dotted' | 'none';
    radius: CmValue;
    color: ColorValue;
  };
  
  // Default column styles (can be overridden per page)
  defaultColumnStyles: {
    left: Partial<ColumnConfig>;
    right: Partial<ColumnConfig>;
    wholePage: Partial<ColumnConfig>;
  };
}

// Complete layout configuration
export interface LayoutConfig {
  id: string;
  name: string;
  description?: string;
  
  // Global styles that apply to all pages
  globalStyles: GlobalLayoutStyles;
  
  // Page-specific configurations
  pages: {
    [pageNumber: number]: PageStyle;
  };
  
  // Default page style for new pages
  defaultPageStyle: PageStyle;
  
  // Layout metadata
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
    tags: string[];
  };
}

// Drag and drop types for layout builder
export interface DragItem {
  id: string;
  type: 'section' | 'page-break';
  sectionId: string;
  currentPosition: LayoutPosition;
}

export interface DropZone {
  id: string;
  column: 'left' | 'right' | 'whole-page';
  pageNumber: number;
  position: number; // Insert at this position
  isActive: boolean;
  isValid: boolean; // Can this item be dropped here?
}

// Layout position with enhanced metadata
export interface LayoutPosition {
  column: 'left' | 'right' | 'whole-page';
  pageNumber: number;
  order: number;
  isLocked?: boolean; // Prevent moving this item
}

// Page layout structure for the visual builder
export interface PageLayout {
  pageNumber: number;
  leftColumn: SectionPlacement[];
  rightColumn: SectionPlacement[];
  wholePageSections: SectionPlacement[];
  pageBreaks: PageBreakInfo[];
  isEmpty: boolean;
}

// Page break information with context
export interface PageBreakInfo {
  id: string;
  sectionId: string;
  afterItemIndex: number;
  itemTitle?: string; // Title of the item before the break
  pageNumber: number;
  isManual: boolean; // User-created vs auto-generated
}

// Layout builder state
export interface LayoutBuilderState {
  pages: PageLayout[];
  selectedSection: string | null;
  selectedPageBreak: string | null;
  draggedItem: DragItem | null;
  previewMode: boolean;
  zoom: number; // For page preview scaling
}

// Layout validation results
export interface LayoutValidation {
  isValid: boolean;
  errors: LayoutError[];
  warnings: LayoutWarning[];
}

export interface LayoutError {
  id: string;
  type: 'missing-section' | 'duplicate-placement' | 'invalid-position' | 'circular-reference';
  message: string;
  sectionId?: string;
  pageNumber?: number;
}

export interface LayoutWarning {
  id: string;
  type: 'empty-page' | 'overcrowded-page' | 'orphaned-break' | 'style-conflict';
  message: string;
  suggestion?: string;
  pageNumber?: number;
}

// Layout operations for undo/redo functionality
export interface LayoutOperation {
  id: string;
  type: 'move-section' | 'add-break' | 'remove-break' | 'reorder' | 'change-template';
  timestamp: Date;
  description: string;
  beforeState: Partial<LayoutBuilderState>;
  afterState: Partial<LayoutBuilderState>;
  canUndo: boolean;
  canRedo: boolean;
}

// Layout preferences for user customization
export interface LayoutPreferences {
  defaultColumn: 'left' | 'right' | 'auto';
  showGridLines: boolean;
  showPageBreaks: boolean;
  snapToGrid: boolean;
  autoSave: boolean;
  previewQuality: 'low' | 'medium' | 'high';
}
