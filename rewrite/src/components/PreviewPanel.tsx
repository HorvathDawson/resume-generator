import type { ResumeData, LayoutBuilderState } from '../types';
import { TEMPLATE_REGISTRY } from './templates/TemplateRegistry';
import { Footer } from './Footer';
import './ResumeStyles.css';

interface PreviewPanelProps {
  resumeData: ResumeData;
  layoutState: LayoutBuilderState;
  onZoomChange: (zoom: number) => void;
}

export function PreviewPanel({
  resumeData,
  layoutState,
  onZoomChange,
}: PreviewPanelProps) {
  return (
    <div className="preview-panel">
      <div className="preview-controls">
        <h2>Preview</h2>
        <div className="zoom-controls">
          <label>
            Zoom: {Math.round(layoutState.zoom * 100)}%
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.1"
              value={layoutState.zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            />
          </label>
        </div>
      </div>
      
      <div className="preview-container">
        <div id="resume-preview" className="resume-preview">
          {resumeData?.layout?.pages?.map((page: any, pageIndex: number) => (
            <div key={pageIndex} className="page-wrapper">
              <div className="page-number">Page {pageIndex + 1}</div>
              <div 
                className="a4-page resume-page" 
                style={{ 
                  transform: `scale(${layoutState.zoom})`,
                  transformOrigin: 'top center'
                }}
              >
              <div className="page-content">
                {/* Render layout rows for this page */}
                {page.rows?.map((row: any, rowIndex: number) => {
                if (row.type === 'columns') {
                  return (
                    <div key={rowIndex} className="layout-row columns-row" style={{ display: 'flex' }}>
                      {row.columns.map((column: any, colIndex: number) => (
                        <div 
                          key={colIndex} 
                          className="layout-column"
                          style={{ 
                            width: column.width, // Already includes % or other units
                            backgroundColor: column.backgroundColor || '#ffffff',
                            color: column.textColor || '#333333',
                            padding: '0.5cm'
                          }}
                        >
                          {column.sections.map((sectionId: string) => {
                            if (sectionId === 'personalInfo') {
                              // Render personal info using template registry
                              const personalInfo = resumeData?.personalInfo;
                              if (!personalInfo) return null;
                              
                              const personalInfoTemplates = TEMPLATE_REGISTRY['personal_info'] || [];
                              const template = personalInfoTemplates.find(t => t.id === 'personal-info-standard') || personalInfoTemplates[0];
                              
                              if (template) {
                                const TemplateComponent = template.component;
                                return <TemplateComponent key={sectionId} personalInfo={personalInfo} />;
                              }
                              return null;
                            }
                            
                            // Find and render regular section
                            const section = resumeData?.sections.find(s => s.id === sectionId);
                            if (!section) return null;
                            
                            const availableTemplates = TEMPLATE_REGISTRY[section.type] || [];
                            const selectedTemplate = availableTemplates.find(t => t.id === section.templateId) || availableTemplates[0];
                            
                            if (selectedTemplate) {
                              const TemplateComponent = selectedTemplate.component;
                              return <TemplateComponent key={section.id} section={section} />;
                            }
                            return null;
                          })}
                        </div>
                      ))}
                    </div>
                  );
                } else if (row.type === 'wholePage') {
                  return (
                    <div 
                      key={rowIndex} 
                      className="layout-row whole-page-row"
                      style={{ 
                        backgroundColor: row.backgroundColor || '#ffffff',
                        color: row.textColor || '#333333',
                        padding: '0.5cm'
                      }}
                    >
                      {row.sections.map((sectionId: string) => {
                        const section = resumeData?.sections.find(s => s.id === sectionId);
                        if (!section) return null;
                        
                        const availableTemplates = TEMPLATE_REGISTRY[section.type] || [];
                        const selectedTemplate = availableTemplates.find(t => t.id === section.templateId) || availableTemplates[0];
                        
                        if (selectedTemplate) {
                          const TemplateComponent = selectedTemplate.component;
                          return <TemplateComponent key={section.id} section={section} />;
                        }
                        return null;
                      })}
                    </div>
                  );
                }
                return null;
              })}
              </div>
            
              {/* Render footer if configured for this page */}
              {page?.footer && (
                <Footer config={page.footer} />
              )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
