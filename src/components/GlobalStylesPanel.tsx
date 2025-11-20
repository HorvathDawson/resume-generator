
import { useState, useRef, useEffect } from 'react';
import type { ResumeData } from '../types';
import './GlobalStylesPanel.css';

interface FontOption {
  name: string;
  value: string;
}

interface FontDropdownProps {
  currentFont: string;
  fonts: FontOption[];
  onChange: (fontValue: string) => void;
}

function FontDropdown({ currentFont, fonts, onChange }: FontDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentFontName = fonts.find(f => f.value === currentFont)?.name || 'Custom Font';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="font-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="font-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontFamily: currentFont }}
      >
        <span className="font-name">{currentFontName}</span>
        <span className="font-preview">Aa</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="font-dropdown-menu">
          {fonts.map(font => (
            <button
              key={font.value}
              type="button"
              className={`font-option ${font.value === currentFont ? 'selected' : ''}`}
              onClick={() => {
                onChange(font.value);
                setIsOpen(false);
              }}
              style={{ fontFamily: font.value }}
            >
              <span className="font-name">{font.name}</span>
              <span className="font-preview">Aa</span>
              {font.value === currentFont && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface GlobalStylesPanelProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

export function GlobalStylesPanel({ resumeData, onResumeDataChange }: GlobalStylesPanelProps) {
  // Provide default values if globalStyles is undefined
  const defaultGlobalStyles = {
    fontFamily: 'Roboto, sans-serif',
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
      textDark: '#111827',
      textMuted: '#9ca3af',
      textLighter: '#d1d5db',
      headerH1Color: '#2c5aa0',
      headerH2Color: '#2c5aa0',
      headerH3Color: '#2c5aa0',
      accentTextColor: '#4a90e2',
      mutedBackground: '#f3f4f6',
      successColor: '#059669',
      borderLight: '#e9ecef',
      borderSubtle: '#f3f4f6'
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
    // Modern Google Fonts - Professional Resume Fonts
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Nunito Sans', value: 'Nunito Sans, sans-serif' },
    { name: 'Work Sans', value: 'Work Sans, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    
    // Professional Serif Options
    { name: 'Merriweather', value: 'Merriweather, serif' },
    { name: 'Source Serif Pro', value: 'Source Serif Pro, serif' },
    { name: 'Crimson Text', value: 'Crimson Text, serif' },
    
    // System Fonts (fallbacks)
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Calibri', value: 'Calibri, sans-serif' }
  ];

  return (
    <div className="global-styles-panel">
      <h3>🎨 Resume Styles</h3>
      
      <div className="styles-sections">
        {/* Typography Section */}
        <div className="style-section">
          <h4 className="section-title">✏️ Typography</h4>
          <div className="section-content">
            <div className="full-width-group">
              <label>Font Family</label>
              <FontDropdown 
                currentFont={globalStyles.fontFamily}
                fonts={commonFonts}
                onChange={(fontValue) => updateGlobalStyles({ fontFamily: fontValue })}
              />
            </div>
            
            <div className="style-row">
              <div className="style-group">
                <label>Name Size</label>
                <input
                  type="text"
                  value={globalStyles.fontSizes.h1}
                  onChange={(e) => updateFontSizes('h1', e.target.value)}
                  className="style-input"
                  placeholder="1.2cm"
                />
              </div>
              <div className="style-group">
                <label>Section Headers</label>
                <input
                  type="text"
                  value={globalStyles.fontSizes.h2}
                  onChange={(e) => updateFontSizes('h2', e.target.value)}
                  className="style-input"
                  placeholder="0.6cm"
                />
              </div>
              <div className="style-group">
                <label>Sub-headers</label>
                <input
                  type="text"
                  value={globalStyles.fontSizes.h3}
                  onChange={(e) => updateFontSizes('h3', e.target.value)}
                  className="style-input"
                  placeholder="0.4cm"
                />
              </div>
              <div className="style-group">
                <label>Body Text</label>
                <input
                  type="text"
                  value={globalStyles.fontSizes.body}
                  onChange={(e) => updateFontSizes('body', e.target.value)}
                  className="style-input"
                  placeholder="0.35cm"
                />
              </div>
            </div>
          </div>
        </div>

        
        {/* Color Scheme Section */}
        <div className="style-section">
          <h4 className="section-title">🎨 Colors</h4>
          <div className="section-content">
            <div className="subsection">
              <h5 className="subsection-title">Main Colors</h5>
              <div className="style-row">
                <div className="style-group">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.primary}
                    onChange={(e) => updateColorScheme('primary', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Secondary Color</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.secondary}
                    onChange={(e) => updateColorScheme('secondary', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Body Text</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.text}
                    onChange={(e) => updateColorScheme('text', e.target.value)}
                    className="style-color"
                  />
                </div>
              </div>
            </div>
            
            <div className="subsection">
              <h5 className="subsection-title">Header Colors</h5>
              <div className="style-row">
                <div className="style-group">
                  <label>Name (H1)</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.headerH1Color || '#2c5aa0'}
                    onChange={(e) => updateColorScheme('headerH1Color', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Sections (H2)</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.headerH2Color || '#2c5aa0'}
                    onChange={(e) => updateColorScheme('headerH2Color', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Sub-heads (H3)</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.headerH3Color || '#2c5aa0'}
                    onChange={(e) => updateColorScheme('headerH3Color', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Accent Text</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.accentTextColor || '#4a90e2'}
                    onChange={(e) => updateColorScheme('accentTextColor', e.target.value)}
                    className="style-color"
                  />
                </div>
              </div>
            </div>
            
            <div className="subsection">
              <h5 className="subsection-title">Supporting Colors</h5>
              <div className="style-row">
                <div className="style-group">
                  <label>Muted Background</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.mutedBackground || '#f3f4f6'}
                    onChange={(e) => updateColorScheme('mutedBackground', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Text Muted</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.textMuted || '#9ca3af'}
                    onChange={(e) => updateColorScheme('textMuted', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Border Light</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.borderLight || '#e9ecef'}
                    onChange={(e) => updateColorScheme('borderLight', e.target.value)}
                    className="style-color"
                  />
                </div>
                <div className="style-group">
                  <label>Text Dark</label>
                  <input
                    type="color"
                    value={globalStyles.colorScheme.textDark || '#111827'}
                    onChange={(e) => updateColorScheme('textDark', e.target.value)}
                    className="style-color"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Spacing Section */}
        <div className="style-section">
          <h4 className="section-title">📐 Spacing</h4>
          <div className="section-content">
            <div className="style-row">
              <div className="style-group">
                <label>Page Margin</label>
                <input
                  type="text"
                  value={globalStyles.spacing.pageMargin}
                  onChange={(e) => updateSpacing('pageMargin', e.target.value)}
                  className="style-input"
                  placeholder="1.27cm"
                />
              </div>
              <div className="style-group">
                <label>Section Gap</label>
                <input
                  type="text"
                  value={globalStyles.spacing.sectionMargin}
                  onChange={(e) => updateSpacing('sectionMargin', e.target.value)}
                  className="style-input"
                  placeholder="0.5cm"
                />
              </div>
              <div className="style-group">
                <label>Item Gap</label>
                <input
                  type="text"
                  value={globalStyles.spacing.itemMargin}
                  onChange={(e) => updateSpacing('itemMargin', e.target.value)}
                  className="style-input"
                  placeholder="0.3cm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
