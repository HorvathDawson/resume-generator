import type { LayoutConfig, GlobalLayoutStyles, PageStyle, ColumnConfig } from '../types/layout';
import type { Margins } from '../types/styles';

// Create default margins
export const createDefaultMargins = (): Margins => ({
  top: '1.0cm',
  right: '1.0cm',
  bottom: '1.0cm',
  left: '1.0cm'
});

// Create default column configuration
export const createDefaultColumnConfig = (
  width: string,
  backgroundColor?: string,
  textColor?: string
): ColumnConfig => ({
  width,
  alignment: 'left',
  padding: {
    top: '0.5cm',
    right: '0.4cm',
    bottom: '0.5cm',
    left: '0.4cm'
  },
  backgroundColor,
  textColor
});

// Create default global layout styles
export const createDefaultGlobalLayoutStyles = (): GlobalLayoutStyles => ({
  fontFamily: 'Roboto, sans-serif',
  fontSizes: {
    h1: '1.3cm',
    h2: '0.6cm',
    h3: '0.4cm',
    body: '0.4cm',
    small: '0.35cm',
    caption: '0.3cm'
  },
  lineHeight: 1.4,
  colorScheme: {
    primary: '#2c5aa0',
    secondary: '#333333',
    accent: '#2563eb',
    text: {
      primary: '#333333',
      secondary: '#374151',
      muted: '#6b7280'
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa'
    },
    border: '#e0e0e0'
  },
  spacing: {
    sectionSpacing: '0.6cm',
    itemSpacing: '0.4cm',
    paragraphSpacing: '0.2cm',
    columnGap: '0.75cm'
  },
  borders: {
    width: '1px',
    style: 'solid',
    radius: '0.1cm',
    color: '#e0e0e0'
  },
  defaultColumnStyles: {
    left: {
      width: '30%',
      backgroundColor: '#f8f9fa',
      textColor: '#333333'
    },
    right: {
      width: '70%',
      backgroundColor: '#ffffff',
      textColor: '#333333'
    },
    wholePage: {
      width: '100%',
      backgroundColor: '#ffffff',
      textColor: '#333333'
    }
  }
});

// Create default page style
export const createDefaultPageStyle = (): PageStyle => ({
  margins: createDefaultMargins(),
  footer: {
    type: 'none',
    height: '0cm',
    position: 'bottom'
  },
  background: {
    color: '#ffffff'
  },
  columns: {
    left: createDefaultColumnConfig('30%', '#f8f9fa', '#333333'),
    right: createDefaultColumnConfig('70%', '#ffffff', '#333333'),
    wholePage: createDefaultColumnConfig('100%', '#ffffff', '#333333')
  }
});

// Create default layout configuration
export const createDefaultLayoutConfig = (): LayoutConfig => {
  const now = new Date().toISOString();
  
  return {
    id: 'default-layout',
    name: 'Professional Two-Column Layout',
    description: 'A classic two-column resume layout with left sidebar and main content area',
    globalStyles: createDefaultGlobalLayoutStyles(),
    pages: {
      1: createDefaultPageStyle()
    },
    defaultPageStyle: createDefaultPageStyle(),
    metadata: {
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      author: 'System',
      tags: ['professional', 'two-column', 'modern']
    }
  };
};

// Create layout configuration based on old format
export const createLayoutConfigFromOldFormat = (data: any): LayoutConfig => {
  const baseConfig = createDefaultLayoutConfig();
  
  // Override with data from old format if available
  if (data.globalStyles) {
    // Merge font sizes
    if (data.globalStyles.fontSizes) {
      baseConfig.globalStyles.fontSizes = {
        ...baseConfig.globalStyles.fontSizes,
        ...data.globalStyles.fontSizes
      };
    }
    
    // Merge color scheme
    if (data.globalStyles.colorScheme) {
      baseConfig.globalStyles.colorScheme = {
        ...baseConfig.globalStyles.colorScheme,
        ...data.globalStyles.colorScheme
      };
    }
  }
  
  // Override page styles if available
  if (data.pageStyles && data.pageStyles.length > 0) {
    const pageStyle = data.pageStyles[0];
    
    if (pageStyle.margins) {
      baseConfig.pages[1].margins = pageStyle.margins;
    }
    
    if (pageStyle.leftColumn) {
      baseConfig.pages[1].columns.left.backgroundColor = pageStyle.leftColumn.backgroundColor || baseConfig.pages[1].columns.left.backgroundColor;
      baseConfig.pages[1].columns.left.textColor = pageStyle.leftColumn.textColor || baseConfig.pages[1].columns.left.textColor;
    }
    
    if (pageStyle.rightColumn) {
      baseConfig.pages[1].columns.right.backgroundColor = pageStyle.rightColumn.backgroundColor || baseConfig.pages[1].columns.right.backgroundColor;
      baseConfig.pages[1].columns.right.textColor = pageStyle.rightColumn.textColor || baseConfig.pages[1].columns.right.textColor;
    }
  }
  
  return {
    ...baseConfig,
    id: data.id || 'imported-layout',
    name: `Layout for ${data.personalInfo?.fullName || 'Resume'}`,
    description: 'Imported from old format'
  };
};
