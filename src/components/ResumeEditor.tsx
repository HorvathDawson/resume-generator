
import { useState, useRef } from 'react';
import type { ResumeData, LayoutBuilderState, TemplateLibrary } from '../types';
import { LayoutBuilder } from './LayoutBuilder';
import { ResumeContentBuilder } from './ResumeContentBuilder';
import { GlobalStylesPanel } from './GlobalStylesPanel';
import './ResumeEditor.css';

interface ResumeEditorProps {
  resumeData: ResumeData;
  layoutState: LayoutBuilderState;
  templateLibrary: TemplateLibrary;
  onResumeDataChange: (data: ResumeData) => void;
  onLayoutStateChange: (state: LayoutBuilderState) => void;
  // Import/Export functionality
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  showImportExportMenu: boolean;
  onImportExportMenuToggle: () => void;
  onImportJSON: () => void;
  onExportJSON: () => void;
}

type EditorTab = 'layout' | 'content' | 'styles';

export function ResumeEditor({
  resumeData,
  layoutState: _layoutState,
  templateLibrary: _templateLibrary,
  onResumeDataChange,
  onLayoutStateChange: _onLayoutStateChange,
  showImportExportMenu,
  onImportExportMenuToggle,
  onImportJSON,
  onExportJSON,
}: ResumeEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('layout');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
  const getDropdownPosition = () => {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + 8,
        left: rect.left
      };
    }
    return { top: 64, left: 20 };
  };
  
  // Debug callback
  const handleResumeDataChange = (data: ResumeData) => {
    onResumeDataChange(data);
  };
  
  const handleLayoutChange = (newLayout: any) => {
    onResumeDataChange({
      ...resumeData,
      layout: newLayout
    });
  };
  
  return (
    <div className="resume-editor">
      <div className="editor-tabs">
        {/* Import/Export Menu */}
        <div className="import-export-tab-menu">
          <button 
            ref={menuButtonRef}
            className="import-export-tab-button"
            onClick={(e) => {
              e.stopPropagation();
              onImportExportMenuToggle();
            }}
            title="Import/Export Menu"
          >
            ☰
          </button>
          {showImportExportMenu && (
            <div 
              className="dropdown-menu import-export-tab-dropdown" 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: `${getDropdownPosition().top}px`,
                left: `${getDropdownPosition().left}px`,
                zIndex: 10000
              }}
            >
              <button 
                onClick={() => {
                  onImportJSON();
                }}
                className="menu-item"
              >
                Import JSON
              </button>
              <button 
                onClick={() => {
                  onExportJSON();
                }}
                className="menu-item"
              >
                Export JSON
              </button>
            </div>
          )}
        </div>
        
        <button
          className={`editor-tab ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          📐 Layout Builder
        </button>
        <button
          className={`editor-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📝 Resume Builder
        </button>
        <button
          className={`editor-tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          🎨 Global Styles
        </button>
      </div>
      
      <div className="editor-content">
        {activeTab === 'layout' ? (
          <LayoutBuilder
            resumeData={resumeData}
            onLayoutChange={handleLayoutChange}
            onResumeDataChange={handleResumeDataChange}
          />
        ) : activeTab === 'content' ? (
          <ResumeContentBuilder
            resumeData={resumeData}
            onResumeDataChange={handleResumeDataChange}
          />
        ) : (
          <GlobalStylesPanel
            resumeData={resumeData}
            onResumeDataChange={handleResumeDataChange}
          />
        )}
      </div>
    </div>
  );
}
