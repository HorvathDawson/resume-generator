import { useState } from 'react';
import type { ResumeData, LayoutBuilderState, TemplateLibrary } from '../types';
import { LayoutBuilder } from './LayoutBuilder';

interface ResumeEditorProps {
  resumeData: ResumeData;
  layoutState: LayoutBuilderState;
  templateLibrary: TemplateLibrary;
  onResumeDataChange: (data: ResumeData) => void;
  onLayoutStateChange: (state: LayoutBuilderState) => void;
}

export function ResumeEditor({
  resumeData,
  layoutState: _layoutState,
  templateLibrary: _templateLibrary,
  onResumeDataChange,
  onLayoutStateChange: _onLayoutStateChange,
}: ResumeEditorProps) {
  
  // Debug callback
  const handleResumeDataChange = (data: ResumeData) => {
    onResumeDataChange(data);
  };
  
  const [activeTab, setActiveTab] = useState<'layout' | 'styles'>('layout');
  
  const handleLayoutChange = (newLayout: any) => {
    onResumeDataChange({
      ...resumeData,
      layout: newLayout
    });
  };
  return (
    <div className="resume-editor">
      <h2>Resume Editor</h2>
      <div className="editor-tabs">
        <button 
          className={`tab ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          Layout
        </button>
        <button 
          className={`tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
      </div>
      
      <div className="editor-content">
        {activeTab === 'layout' && (
          <div className="layout-tab">
            <LayoutBuilder
              resumeData={resumeData}
              onLayoutChange={handleLayoutChange}
              onResumeDataChange={handleResumeDataChange}
            />
          </div>
        )}

        {activeTab === 'styles' && (
          <div className="styles-tab">
            <h3>Styles</h3>
            <p>Style customization coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
