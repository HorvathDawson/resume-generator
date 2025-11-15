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
        {/* Dynamic Style Injection for Global Styles */}
        <style>
          {`
            .resume-preview {
              --font-family: ${resumeData?.layout?.globalStyles?.fontFamily || 'Roboto, sans-serif'};
              --font-size-h1: ${resumeData?.layout?.globalStyles?.fontSizes?.h1 || '1.2cm'};
              --font-size-h2: ${resumeData?.layout?.globalStyles?.fontSizes?.h2 || '0.6cm'};
              --font-size-h3: ${resumeData?.layout?.globalStyles?.fontSizes?.h3 || '0.4cm'};
              --font-size-body: ${resumeData?.layout?.globalStyles?.fontSizes?.body || '0.35cm'};
              --font-size-small: ${resumeData?.layout?.globalStyles?.fontSizes?.small || '0.3cm'};
              --primary-color: ${resumeData?.layout?.globalStyles?.colorScheme?.primary || '#2c5aa0'};
              --accent-color: ${resumeData?.layout?.globalStyles?.colorScheme?.accent || '#4a90e2'};
              --secondary-color: ${resumeData?.layout?.globalStyles?.colorScheme?.secondary || '#f8f9fa'};
              --text-color: ${resumeData?.layout?.globalStyles?.colorScheme?.text || '#333333'};
              --section-margin: ${resumeData?.layout?.globalStyles?.spacing?.sectionMargin || '0.5cm'};
              --item-margin: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'};
              --page-margin: ${resumeData?.layout?.globalStyles?.spacing?.pageMargin || '1.27cm'};
            }

            /* Apply global font to text elements, but preserve FontAwesome icons */
            .resume-preview p,
            .resume-preview span:not([class*="fa"]):not(.fa):not(.fas):not(.fab):not(.far):not(.fal):not(.fad),
            .resume-preview div:not([class*="fa"]):not(.fa):not(.fas):not(.fab):not(.far):not(.fal):not(.fad),
            .resume-preview h1, .resume-preview h2, .resume-preview h3, .resume-preview h4, .resume-preview h5, .resume-preview h6,
            .resume-preview li,
            .resume-preview td, .resume-preview th,
            .resume-preview a:not([class*="fa"]):not(.fa):not(.fas):not(.fab):not(.far):not(.fal):not(.fad) {
              font-family: var(--font-family) !important;
            }

            /* Ensure FontAwesome icons use their correct font family */
            .resume-preview .fa,
            .resume-preview .fas,
            .resume-preview .fab,
            .resume-preview .far,
            .resume-preview .fal,
            .resume-preview .fad,
            .resume-preview [class*="fa-"],
            .resume-preview .icon,
            .resume-preview .emoji {
              font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands", "FontAwesome" !important;
            }

            .resume-preview .page-content {
              padding: var(--page-margin) !important;
            }

            .resume-preview h1 {
              font-size: var(--font-size-h1) !important;
              color: var(--primary-color) !important;
              margin-bottom: var(--section-margin) !important;
            }

            .resume-preview h2 {
              font-size: var(--font-size-h2) !important;
              color: var(--primary-color) !important;
              margin-bottom: var(--item-margin) !important;
              margin-top: var(--section-margin) !important;
            }

            .resume-preview h3 {
              font-size: var(--font-size-h3) !important;
              color: var(--primary-color) !important;
              margin-bottom: var(--item-margin) !important;
            }

            .resume-preview p, .resume-preview li {
              font-size: var(--font-size-body) !important;
              color: var(--text-color) !important;
              margin-bottom: var(--item-margin) !important;
            }

            .resume-preview .section .text-content div,
            .resume-preview .section .content div,
            .resume-preview .experience-body div,
            .resume-preview .education-details div,
            .resume-preview .skills-section div:not(.skill-progress):not(.skill-bar):not(.skill-cloud-tag) {
              font-size: var(--font-size-body) !important;
              color: var(--text-color) !important;
              margin-bottom: var(--item-margin) !important;
            }

            .resume-preview .small-text, .resume-preview .dates {
              font-size: var(--font-size-small) !important;
              color: var(--text-color) !important;
              opacity: 0.8;
            }

            .resume-preview .section {
              margin-bottom: var(--section-margin) !important;
            }

            /* Ensure background colors extend to page edges */
            .resume-preview .layout-column,
            .resume-preview .whole-page-row {
              box-sizing: border-box;
            }

            /* Override default margins for full-width backgrounds */
            .resume-preview .layout-row {
              margin: 0;
            }
          `}
        </style>
        
        <div id="resume-preview" className="resume-preview">
          {resumeData?.layout?.pages?.map((page: any, pageIndex: number) => (
            <div key={pageIndex} className="page-wrapper">
              <div className="page-number">Page {pageIndex + 1}</div>
              <div 
                className="a4-page resume-page" 
                style={{ 
                  transform: `scale(${layoutState.zoom})`,
                  transformOrigin: 'top left'
                }}
              >
              <div 
                className="page-content"
                style={{
                  paddingBottom: page?.footer ? `calc(var(--page-margin) + ${page.footer.height})` : undefined
                }}
              >
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
                            width: column.width,
                            position: 'relative',
                            // If only one column, extend to full page height
                            ...(row.columns.length === 1 ? {
                              minHeight: `calc(29.7cm - 2 * var(--page-margin) - ${page?.footer?.height || '0px'})`
                            } : {})
                          }}
                        >
                          {/* Background div that extends to page edges when background is set */}
                          {column.backgroundColor && column.backgroundColor !== '#ffffff' && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: colIndex === 0 ? 'calc(-1 * var(--page-margin))' : '0',
                                right: colIndex === row.columns.length - 1 ? 'calc(-1 * var(--page-margin))' : '0',
                                backgroundColor: column.backgroundColor,
                                zIndex: -1,
                                // For single column, extend to full page height
                                ...(row.columns.length === 1 ? {
                                  top: 'calc(-1 * var(--page-margin))',
                                  bottom: page?.footer?.height ? `calc(-1 * ${page.footer.height})` : 'calc(-1 * var(--page-margin))'
                                } : {})
                              }}
                            />
                          )}
                          
                          {/* Content wrapper with consistent padding */}
                          <div
                            style={{
                              padding: '0.1cm',
                              color: column.textColor || '#333333',
                              position: 'relative',
                              zIndex: 1
                            }}
                          >
                          {column.sections.map((sectionId: string, sectionIndex: number) => {
                            // Find and render regular section (including personal_info sections)
                            const section = resumeData?.sections.find(s => s.id === sectionId);
                            if (sectionId.startsWith('padding-')) {
                              // If padding section not found, render a placeholder with template-based height
                              if (!section) {
                                // Try to get the height from template mappings
                                const templateId = resumeData.sectionTemplates?.[sectionId] || 'padding-medium';
                                const heightMap: { [key: string]: string } = {
                                  'padding-extra-small': '0.25cm',
                                  'padding-small': '0.5cm',
                                  'padding-medium': '1cm',
                                  'padding-large': '1.5cm',
                                  'padding-extra-large': '2cm',
                                  'padding-xxl': '3cm'
                                };
                                const height = heightMap[templateId] || '1cm';
                                

                                return (
                                  <div 
                                    key={`${colIndex}-${sectionIndex}-${sectionId}`} 
                                    className="section padding-section" 
                                    style={{ height, minHeight: height }}
                                  >
                                    {/* Placeholder for missing padding section */}
                                  </div>
                                );
                              }
                            }
                            if (!section) return null;
                            
                            const availableTemplates = TEMPLATE_REGISTRY[section.type] || [];
                            // Check for template override first, then fallback to section.templateId
                            const templateId = resumeData.sectionTemplates?.[sectionId] || section.templateId;
                            const selectedTemplate = availableTemplates.find(t => t.id === templateId) || availableTemplates[0];
                            
                            if (selectedTemplate) {
                              const TemplateComponent = selectedTemplate.component;
                              
                              // Handle personal_info sections specially - they need access to external personalInfo
                              if (section.type === 'personal_info') {
                                return <TemplateComponent key={`${colIndex}-${sectionIndex}-${sectionId}`} section={section} personalInfo={resumeData?.personalInfo} />;
                              }
                              
                              return <TemplateComponent key={`${colIndex}-${sectionIndex}-${sectionId}`} section={section} />;
                            }
                            return null;
                          })}
                          </div>
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
                        position: 'relative',
                        // Extend to full page height if this is the only row on the page
                        ...(page.rows.length === 1 ? {
                          minHeight: `calc(29.7cm - 2 * var(--page-margin) - ${page?.footer?.height || '0px'})`,
                          display: 'flex',
                          flexDirection: 'column'
                        } : {})
                      }}
                    >
                      {/* Background div that extends to page edges when background is set */}
                      {row.backgroundColor && row.backgroundColor !== '#ffffff' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: page.rows.length === 1 ? 'calc(-1 * var(--page-margin))' : '0',
                            bottom: page.rows.length === 1 && page?.footer?.height ? `calc(-1 * ${page.footer.height})` : (page.rows.length === 1 ? 'calc(-1 * var(--page-margin))' : '0'),
                            left: 'calc(-1 * var(--page-margin))',
                            right: 'calc(-1 * var(--page-margin))',
                            backgroundColor: row.backgroundColor,
                            zIndex: -1
                          }}
                        />
                      )}
                      
                      {/* Content wrapper with consistent padding */}
                      <div
                        style={{
                          padding: '0.1cm',
                          color: row.textColor || '#333333',
                          position: 'relative',
                          zIndex: 1,
                          flex: page.rows.length === 1 ? '1' : 'auto'
                        }}
                      >
                      {row.sections.map((sectionId: string, sectionIndex: number) => {
                        const section = resumeData?.sections.find(s => s.id === sectionId);
                        if (sectionId.startsWith('padding-')) {
                          // If padding section not found, render a placeholder with template-based height
                          if (!section) {
                            // Try to get the height from template mappings
                            const templateId = resumeData.sectionTemplates?.[sectionId] || 'padding-medium';
                            const heightMap: { [key: string]: string } = {
                              'padding-extra-small': '0.25cm',
                              'padding-small': '0.5cm',
                              'padding-medium': '1cm',
                              'padding-large': '1.5cm',
                              'padding-extra-large': '2cm',
                              'padding-xxl': '3cm'
                            };
                            const height = heightMap[templateId] || '1cm';
                            

                            return (
                              <div 
                                key={`${rowIndex}-${sectionIndex}-${sectionId}`} 
                                className="section padding-section" 
                                style={{ height, minHeight: height }}
                              >
                                {/* Placeholder for missing padding section */}
                              </div>
                            );
                          }
                        }
                        if (!section) return null;
                        
                        const availableTemplates = TEMPLATE_REGISTRY[section.type] || [];
                        // Check for template override first, then fallback to section.templateId
                        const templateId = resumeData.sectionTemplates?.[sectionId] || section.templateId;
                        const selectedTemplate = availableTemplates.find(t => t.id === templateId) || availableTemplates[0];
                        
                        if (selectedTemplate) {
                          const TemplateComponent = selectedTemplate.component;
                          
                          // Handle personal_info sections specially - they need access to external personalInfo
                          if (section.type === 'personal_info') {
                            return <TemplateComponent key={`${rowIndex}-${sectionIndex}-${sectionId}`} section={section} personalInfo={resumeData?.personalInfo} />;
                          }
                          
                          return <TemplateComponent key={`${rowIndex}-${sectionIndex}-${sectionId}`} section={section} />;
                        }
                        return null;
                      })}
                      </div>
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
