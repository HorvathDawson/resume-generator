
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
      <h3>🎨 Global Styles</h3>
      
      <div className="compact-styles-grid">
        {/* Font & Colors Row */}
        <div className="compact-row">
          <div className="compact-group">
            <label>Font</label>
            <FontDropdown 
              currentFont={globalStyles.fontFamily}
              fonts={commonFonts}
              onChange={(fontValue) => updateGlobalStyles({ fontFamily: fontValue })}
            />
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
