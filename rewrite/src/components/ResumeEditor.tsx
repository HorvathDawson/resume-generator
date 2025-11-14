
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
  
  const handleLayoutChange = (newLayout: any) => {
    onResumeDataChange({
      ...resumeData,
      layout: newLayout
    });
  };
  
  return (
    <div className="resume-editor">
      <div className="editor-content">
        <LayoutBuilder
          resumeData={resumeData}
          onLayoutChange={handleLayoutChange}
          onResumeDataChange={handleResumeDataChange}
        />
      </div>
    </div>
  );
}
