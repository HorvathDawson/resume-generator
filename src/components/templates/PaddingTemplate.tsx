import type { Section } from '../../types/resume';

// Helper function to get height for padding template
const getPaddingHeight = (templateId: string): string => {
  const heightMap: { [key: string]: string } = {
    'padding-extra-small': '0.25cm',
    'padding-small': '0.5cm',
    'padding-medium': '1cm',
    'padding-large': '1.5cm',
    'padding-extra-large': '2cm',
    'padding-xxl': '3cm'
  };
  return heightMap[templateId] || '1cm';
};

export const PaddingTemplates = {
  extraSmall: {
    id: 'padding-extra-small',
    name: 'Extra Small (0.25cm)',
    description: 'Extra small vertical space',
    component: ({ section }: { section?: Section }) => {
      const height = section?.customFields?.height || getPaddingHeight('padding-extra-small');
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  small: {
    id: 'padding-small',
    name: 'Small (0.5cm)',
    description: 'Small vertical space',
    component: ({ section }: { section?: Section }) => {
      const height = section?.customFields?.height || getPaddingHeight('padding-small');
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  medium: {
    id: 'padding-medium',
    name: 'Medium (1cm)',
    description: 'Medium vertical space',
    component: ({ section }: { section?: Section }) => {
      const height = section?.customFields?.height || getPaddingHeight('padding-medium');
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  large: {
    id: 'padding-large',
    name: 'Large (1.5cm)',
    description: 'Large vertical space',
    component: ({ section }: { section?: Section }) => {
      const height = section?.customFields?.height || getPaddingHeight('padding-large');
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  extraLarge: {
    id: 'padding-extra-large',
    name: 'Extra Large (2cm)',
    description: 'Extra large vertical space',
    component: ({ section }: { section?: Section }) => {
      const height = section?.customFields?.height || getPaddingHeight('padding-extra-large');
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  xxl: {
    id: 'padding-xxl',
    name: 'XXL (3cm)',
    description: 'Very large vertical space',
    component: ({ section }: { section?: Section }) => {
      const height = section?.customFields?.height || getPaddingHeight('padding-xxl');
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  }
};