// CSS measurement type for cm-based values
export type CmValue = string; // e.g., "1.5cm", "2.0cm"

// Color value type
export type ColorValue = string; // e.g., "#ffffff", "rgb(255,255,255)", "var(--primary)"

// Font family options
export type FontFamily = 'serif' | 'sans-serif' | 'monospace' | string;

// Margin configuration for all edges
export interface Margins {
  top: CmValue;
  right: CmValue;
  bottom: CmValue;
  left: CmValue;
}

// Font size definitions for different text levels
export interface FontSizes {
  h1: CmValue;          // Main name/title
  h2: CmValue;          // Section headers
  h3: CmValue;          // Subsection headers (job titles, etc.)
  body: CmValue;        // Regular body text
  small: CmValue;       // Small text (dates, details)
  caption: CmValue;     // Very small text
}

// Global color scheme
export interface ColorScheme {
  primary: ColorValue;
  secondary: ColorValue;
  accent: ColorValue;
  text: {
    primary: ColorValue;
    secondary: ColorValue;
    muted: ColorValue;
  };
  background: {
    primary: ColorValue;
    secondary: ColorValue;
  };
  border: ColorValue;
}

// Column-specific style overrides
export interface ColumnStyles {
  backgroundColor?: ColorValue;
  textColor?: ColorValue;
  borderColor?: ColorValue;
  padding?: Margins;
}

// Footer configuration
export interface FooterConfig {
  type: 'none' | 'simple' | 'mountains' | 'fish' | 'custom';
  height: CmValue;
  backgroundColor?: ColorValue;
  textColor?: ColorValue;
  content?: string; // For custom footers
  seed?: string;    // For randomized footers
}

// Global styles affecting entire resume
export interface GlobalStyles {
  fontFamily: FontFamily;
  fontSizes: FontSizes;
  colorScheme: ColorScheme;
  lineHeight: number;
  spacing: {
    sectionSpacing: CmValue;
    itemSpacing: CmValue;
    paragraphSpacing: CmValue;
  };
  borders: {
    width: CmValue;
    style: 'solid' | 'dashed' | 'dotted' | 'none';
    radius: CmValue;
  };
}

// Page-specific styles (can override global styles)
export interface PageStyles {
  pageNumber: number;
  margins: Margins;
  footer: FooterConfig;
  columns: {
    left?: ColumnStyles;
    right?: ColumnStyles;
    wholePage?: ColumnStyles;
  };
  background?: {
    color?: ColorValue;
    image?: string;
    pattern?: string;
  };
  // Page-specific style overrides
  fontSizeOverrides?: Partial<FontSizes>;
  colorOverrides?: Partial<ColorScheme>;
}

// Resume metadata for serialization and management
export interface ResumeMetadata {
  version: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  description?: string;
  tags: string[];
  templateName?: string;
  exportSettings: {
    format: 'a4';
    orientation: 'portrait';
    scale: number; // For preview scaling
    printOptimized: boolean;
  };
}
