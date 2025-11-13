import { useState } from 'react';
import type { ResumeData, LayoutBuilderState, TemplateLibrary } from '../types';
import { TemplateSelector } from './TemplateSelector';
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
  
  const [activeTab, setActiveTab] = useState<'sections' | 'layout' | 'styles'>('sections');
  
  const handleTemplateChange = (sectionId: string, templateId: string) => {
    const updatedSections = resumeData.sections.map(section => 
      section.id === sectionId 
        ? { ...section, templateId } 
        : section
    );
    
    onResumeDataChange({
      ...resumeData,
      sections: updatedSections
    });
  };

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
          className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          Sections
        </button>
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
        {activeTab === 'sections' && (
          <div className="sections-list">
            <h3>Sections</h3>
            {resumeData.sections.map((section) => (
              <div key={section.id} className="section-item">
                <div className="section-header">
                  <h4>{section.title}</h4>
                  <p>
                    {section.type} - {
                      section.items ? `${section.items.length} items` : 
                      (section as any).content ? 'text content' :
                      (section as any).categories ? `${(section as any).categories.length} categories` :
                      'no content'
                    }
                  </p>
                </div>
                <TemplateSelector
                  section={section}
                  selectedTemplateId={section.templateId}
                  onTemplateChange={handleTemplateChange}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="layout-tab">
            <LayoutBuilder
              resumeData={resumeData}
              onLayoutChange={handleLayoutChange}
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
