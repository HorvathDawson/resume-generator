// Core resume data types with comprehensive styling support

/**
 * Measurement units - everything in centimeters for A4 compatibility
 */
export type Measurement = `${number}cm`;

/**
 * Color definitions - hex, rgb, or named colors
 */
export type Color = string;

/**
 * Font family definitions
 */
export type FontFamily = string;

/**
 * Available template types for sections
 */
export type TemplateType = 
  | 'default'
  | 'minimal'
  | 'modern'
  | 'compact'
  | 'detailed'
  | 'timeline'
  | 'grid'
  | 'wide';

/**
 * Column placement options
 */
export type ColumnPlacement = 'left' | 'right' | 'whole-page';

/**
 * Footer types available
 */
export type FooterType = 
  | 'none'
  | 'minimal'
  | 'modern'
  | 'mountains'
  | 'mountains-random'
  | 'fish'
  | 'custom';

/**
 * Individual margin settings for each edge
 */
export interface PageMargins {
  top: Measurement;
  bottom: Measurement;
  left: Measurement;
  right: Measurement;
}

/**
 * Footer configuration
 */
export interface FooterConfig {
  type: FooterType;
  height?: Measurement;
  margin?: Measurement;
  customContent?: string;
  seed?: string; // For random footers
}

/**
 * Font size definitions for different elements
 */
export interface FontSizes {
  h1: Measurement;
  h2: Measurement;
  h3: Measurement;
  body: Measurement;
  small: Measurement;
}

/**
 * Global layout styling configuration
 */
export interface GlobalLayoutStyles {
  fontSizes: FontSizes;
  fontFamily: FontFamily;
  primaryColor: Color;
  secondaryColor: Color;
  lineHeight: number;
  sectionSpacing: Measurement;
  itemSpacing: Measurement;
  borderWidth: Measurement;
  borderColor: Color;
}

/**
 * Column-specific style overrides
 */
export interface ColumnStyles {
  backgroundColor?: Color;
  textColor?: Color;
  borderColor?: Color;
  padding?: Measurement;
  // Can override any global styles
  fontSizes?: Partial<FontSizes>;
  fontFamily?: FontFamily;
}

/**
 * Page-level style configuration
 */
export interface PageStyles {
  margins: PageMargins;
  footer: FooterConfig;
  backgroundColor?: Color;
  // Style overrides for this specific page
  globalOverrides?: Partial<GlobalLayoutStyles>;
  leftColumnOverrides?: ColumnStyles;
  rightColumnOverrides?: ColumnStyles;
  wholePageOverrides?: ColumnStyles;
}
