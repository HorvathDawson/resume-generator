
import type { ResumeData } from '../types';

interface GlobalStylesPanelProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

export function GlobalStylesPanel({ resumeData, onResumeDataChange }: GlobalStylesPanelProps) {
  // Provide default values if globalStyles is undefined
  const defaultGlobalStyles = {
    fontFamily: 'Arial, sans-serif',
    fontSizes: {
      h1: '1.2cm',
      h2: '0.6cm',
      h3: '0.4cm',
      body: '0.35cm',
      small: '0.3cm'
    },
    colorScheme: {
      primary: '#2c5aa0',
      secondary: '#f8f9fa',
      text: '#333333',
      accent: '#4a90e2'
    },
    spacing: {
      sectionMargin: '0.5cm',
      itemMargin: '0.3cm',
      pageMargin: '1.27cm'
    }
  };

  const globalStyles = resumeData.layout?.globalStyles || defaultGlobalStyles;

  const updateGlobalStyles = (updates: any) => {
    // Ensure layout structure exists with defaults
    const currentLayout = resumeData.layout || {
      pages: [],
      sectionInstances: []
    };
    
    const newResumeData = {
      ...resumeData,
      layout: {
        ...currentLayout,
        globalStyles: {
          ...globalStyles,
          ...updates
        }
      }
    };
    onResumeDataChange(newResumeData);
  };

  const updateFontSizes = (key: string, value: string) => {
    updateGlobalStyles({
      fontSizes: {
        ...globalStyles.fontSizes,
        [key]: value
      }
    });
  };

  const updateColorScheme = (key: string, value: string) => {
    updateGlobalStyles({
      colorScheme: {
        ...globalStyles.colorScheme,
        [key]: value
      }
    });
  };

  const updateSpacing = (key: string, value: string) => {
    updateGlobalStyles({
      spacing: {
        ...globalStyles.spacing,
        [key]: value
      }
    });
  };

  const commonFonts = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Calibri', value: 'Calibri, sans-serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { name: 'Palatino', value: 'Palatino, serif' }
  ];

  return (
    <div className="global-styles-panel">
      <h3>🎨 Global Styles</h3>
      
      <div className="compact-styles-grid">
        {/* Font & Colors Row */}
        <div className="compact-row">
          <div className="compact-group">
            <label>Font</label>
            <select 
              value={globalStyles.fontFamily}
              onChange={(e) => updateGlobalStyles({ fontFamily: e.target.value })}
              className="compact-select"
            >
              {commonFonts.map(font => (
                <option key={font.value} value={font.value}>{font.name}</option>
              ))}
            </select>
          </div>
          
          <div className="compact-group">
            <label>Primary</label>
            <input
              type="color"
              value={globalStyles.colorScheme.primary}
              onChange={(e) => updateColorScheme('primary', e.target.value)}
              className="compact-color"
            />
          </div>
          
          <div className="compact-group">
            <label>Secondary</label>
            <input
              type="color"
              value={globalStyles.colorScheme.secondary}
              onChange={(e) => updateColorScheme('secondary', e.target.value)}
              className="compact-color"
            />
          </div>
          
          <div className="compact-group">
            <label>Text</label>
            <input
              type="color"
              value={globalStyles.colorScheme.text}
              onChange={(e) => updateColorScheme('text', e.target.value)}
              className="compact-color"
            />
          </div>
        </div>

        {/* Font Sizes Row */}
        <div className="compact-row">
          <div className="compact-group">
            <label>Name</label>
            <input
              type="text"
              value={globalStyles.fontSizes.h1}
              onChange={(e) => updateFontSizes('h1', e.target.value)}
              className="compact-input"
              placeholder="1.2cm"
            />
          </div>
          <div className="compact-group">
            <label>Headers</label>
            <input
              type="text"
              value={globalStyles.fontSizes.h2}
              onChange={(e) => updateFontSizes('h2', e.target.value)}
              className="compact-input"
              placeholder="0.6cm"
            />
          </div>
          <div className="compact-group">
            <label>Sub-head</label>
            <input
              type="text"
              value={globalStyles.fontSizes.h3}
              onChange={(e) => updateFontSizes('h3', e.target.value)}
              className="compact-input"
              placeholder="0.4cm"
            />
          </div>
          <div className="compact-group">
            <label>Body</label>
            <input
              type="text"
              value={globalStyles.fontSizes.body}
              onChange={(e) => updateFontSizes('body', e.target.value)}
              className="compact-input"
              placeholder="0.35cm"
            />
          </div>
        </div>

        {/* Spacing Row */}
        <div className="compact-row">
          <div className="compact-group">
            <label>Page Margin</label>
            <input
              type="text"
              value={globalStyles.spacing.pageMargin}
              onChange={(e) => updateSpacing('pageMargin', e.target.value)}
              className="compact-input"
              placeholder="1.27cm"
            />
          </div>
          <div className="compact-group">
            <label>Section Gap</label>
            <input
              type="text"
              value={globalStyles.spacing.sectionMargin}
              onChange={(e) => updateSpacing('sectionMargin', e.target.value)}
              className="compact-input"
              placeholder="0.5cm"
            />
          </div>
          <div className="compact-group">
            <label>Item Gap</label>
            <input
              type="text"
              value={globalStyles.spacing.itemMargin}
              onChange={(e) => updateSpacing('itemMargin', e.target.value)}
              className="compact-input"
              placeholder="0.3cm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
