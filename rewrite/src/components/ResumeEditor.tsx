
import { useState } from 'react';
import type { ResumeData, LayoutBuilderState, TemplateLibrary } from '../types';
import { LayoutBuilder } from './LayoutBuilder';
import { ResumeContentBuilder } from './ResumeContentBuilder';
import './ResumeEditor.css';

interface ResumeEditorProps {
  resumeData: ResumeData;
  layoutState: LayoutBuilderState;
  templateLibrary: TemplateLibrary;
  onResumeDataChange: (data: ResumeData) => void;
  onLayoutStateChange: (state: LayoutBuilderState) => void;
}

type EditorTab = 'layout' | 'content';

export function ResumeEditor({
  resumeData,
  layoutState: _layoutState,
  templateLibrary: _templateLibrary,
  onResumeDataChange,
  onLayoutStateChange: _onLayoutStateChange,
}: ResumeEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('layout');
  
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
        <button
          className={`editor-tab ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          🎨 Layout Builder
        </button>
        <button
          className={`editor-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📝 Resume Builder
        </button>
      </div>
      
      <div className="editor-content">
        {activeTab === 'layout' ? (
          <LayoutBuilder
            resumeData={resumeData}
            onLayoutChange={handleLayoutChange}
            onResumeDataChange={handleResumeDataChange}
          />
        ) : (
          <ResumeContentBuilder
            resumeData={resumeData}
            onResumeDataChange={handleResumeDataChange}
          />
        )}
      </div>
    </div>
  );
}
