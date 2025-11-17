import type { ResumeData, LayoutBuilderState } from '../types';
import { TEMPLATE_REGISTRY } from './templates/TemplateRegistry';
import { Footer } from './Footer';
import './ResumeStyles.css';
import './PreviewPanel.css';

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
  
  // Helper function to reorder section items based on layout
  const applySectionItemOrder = (section: any, rowIndex: number, columnIndex?: number) => {
    // Get reorderable items based on section type
    const getReorderableItems = (sec: any) => {
      if (!sec) return [];
      if (sec.type === 'skills') {
        // Try different possible locations for categories
        if (sec.categories) return sec.categories;
        if (sec.customFields?.categories) return sec.customFields.categories;
        if (sec.items?.[0]?.categories) return sec.items[0].categories;
        return [];
      }
      return sec.items || [];
    };
    
    const reorderableItems = getReorderableItems(section);
    
    if (!reorderableItems || reorderableItems.length <= 1) {
      return section;
    }
    
    const row = resumeData.layout?.pages?.[0]?.rows?.[rowIndex] as any;
    if (!row) return section;
    
    const orders = columnIndex !== undefined 
      ? row.columns?.[columnIndex]?.sectionItemOrders?.[section.id]
      : row.sectionItemOrders?.[section.id];
    
    if (!orders || orders.length !== reorderableItems.length) {
      return section; // Return original section if no custom order
    }
    
    // Create reordered items array
    const reorderedItems = orders.map((originalIndex: number) => reorderableItems[originalIndex]).filter(Boolean);
    
    // Return section with reordered items in the appropriate property
    if (section.type === 'skills') {
      // Handle different possible structures for skills sections
      if (section.categories) {
        return {
          ...section,
          categories: reorderedItems
        };
      } else if (section.customFields?.categories) {
        return {
          ...section,
          customFields: {
            ...section.customFields,
            categories: reorderedItems
          }
        };
      } else if (section.items?.[0]?.categories) {
        return {
          ...section,
          items: [
            {
              ...section.items[0],
              categories: reorderedItems
            },
            ...section.items.slice(1)
          ]
        };
      }
      return section;
    } else {
      return {
        ...section,
        items: reorderedItems
      };
    }
  };
  // Early return if no resume data or layout is available
  if (!resumeData || !resumeData.layout || !resumeData.layout.pages || resumeData.layout.pages.length === 0) {
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            No layout data available. Add sections to your resume to see the preview.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
          {/* Dynamic Print Styles - Inject actual values for print media */}
          <style>
            {`
              @media print {
                #resume-preview .page-content {
                  padding: ${resumeData?.layout?.globalStyles?.spacing?.pageMargin || '1.27cm'} !important;
                }
                #resume-preview h1 {
                  font-size: ${resumeData?.layout?.globalStyles?.fontSizes?.h1 || '1.2cm'} !important;
                  color: ${resumeData?.layout?.globalStyles?.colorScheme?.primary || '#2c5aa0'} !important;
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.sectionMargin || '0.5cm'} !important;
                }
                #resume-preview h2 {
                  font-size: ${resumeData?.layout?.globalStyles?.fontSizes?.h2 || '0.6cm'} !important;
                  color: ${resumeData?.layout?.globalStyles?.colorScheme?.primary || '#2c5aa0'} !important;
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                  margin-top: ${resumeData?.layout?.globalStyles?.spacing?.sectionMargin || '0.5cm'} !important;
                }
                #resume-preview h3 {
                  font-size: ${resumeData?.layout?.globalStyles?.fontSizes?.h3 || '0.4cm'} !important;
                  color: ${resumeData?.layout?.globalStyles?.colorScheme?.primary || '#2c5aa0'} !important;
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                #resume-preview p, #resume-preview li {
                  font-size: ${resumeData?.layout?.globalStyles?.fontSizes?.body || '0.35cm'} !important;
                  color: ${resumeData?.layout?.globalStyles?.colorScheme?.text || '#333333'} !important;
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                #resume-preview ul li, #resume-preview ol li {
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                #resume-preview .section-item, #resume-preview .experience-item, #resume-preview .education-item, #resume-preview .skill-item {
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                #resume-preview .section .text-content div,
                #resume-preview .section .content div,
                #resume-preview .experience-body div,
                #resume-preview .education-details div,
                #resume-preview .skills-section div:not(.skill-progress):not(.skill-bar):not(.skill-cloud-tag) {
                  font-size: ${resumeData?.layout?.globalStyles?.fontSizes?.body || '0.35cm'} !important;
                  color: ${resumeData?.layout?.globalStyles?.colorScheme?.text || '#333333'} !important;
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                #resume-preview .small-text, #resume-preview .dates {
                  font-size: ${resumeData?.layout?.globalStyles?.fontSizes?.small || '0.3cm'} !important;
                  color: ${resumeData?.layout?.globalStyles?.colorScheme?.text || '#333333'} !important;
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                #resume-preview .section {
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.sectionMargin || '0.5cm'} !important;
                }
                #resume-preview .section-item {
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                /* Override browser print preview margin reset */
                #resume-preview * {
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm'} !important;
                }
                #resume-preview h1, #resume-preview h2, #resume-preview h3 {
                  margin-bottom: ${resumeData?.layout?.globalStyles?.spacing?.sectionMargin || '0.5cm'} !important;
                }
              }
            `}
          </style>
          <div 
            id="resume-preview" 
            className="resume-preview"
            style={{
              '--font-family': resumeData?.layout?.globalStyles?.fontFamily || 'Roboto, sans-serif',
              '--font-size-h1': resumeData?.layout?.globalStyles?.fontSizes?.h1 || '1.2cm',
              '--font-size-h2': resumeData?.layout?.globalStyles?.fontSizes?.h2 || '0.6cm',
              '--font-size-h3': resumeData?.layout?.globalStyles?.fontSizes?.h3 || '0.4cm',
              '--font-size-body': resumeData?.layout?.globalStyles?.fontSizes?.body || '0.35cm',
              '--font-size-small': resumeData?.layout?.globalStyles?.fontSizes?.small || '0.3cm',
              '--primary-color': resumeData?.layout?.globalStyles?.colorScheme?.primary || '#2c5aa0',
              '--accent-color': resumeData?.layout?.globalStyles?.colorScheme?.accent || '#4a90e2',
              '--secondary-color': resumeData?.layout?.globalStyles?.colorScheme?.secondary || '#f8f9fa',
              '--text-color': resumeData?.layout?.globalStyles?.colorScheme?.text || '#333333',
              '--section-margin': resumeData?.layout?.globalStyles?.spacing?.sectionMargin || '0.5cm',
              '--item-margin': resumeData?.layout?.globalStyles?.spacing?.itemMargin || '0.3cm',
              '--page-margin': resumeData?.layout?.globalStyles?.spacing?.pageMargin || '1.27cm'
            } as React.CSSProperties}
          >
            {resumeData?.layout?.pages?.map((page: any, pageIndex: number) => (
              <div key={pageIndex} className="page-wrapper">
                <div className="page-number">Page {pageIndex + 1}</div>
                <div 
                  className="page-scale-wrapper"
                  style={{ 
                    transform: `scale(${layoutState.zoom})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <div 
                    className="a4-page resume-page"
                    style={{
                      position: 'relative',
                      minHeight: '29.7cm',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      className="page-content"
                      style={{
                        paddingBottom: page?.footer ? `calc(var(--page-margin) + ${page.footer.height})` : undefined,
                        minHeight: page?.footer ? `calc(29.7cm - ${page.footer.height})` : '29.7cm'
                      }}
                    >
                      {/* Render layout rows for this page */}
                      {page.rows?.map((row: any, rowIndex: number) => {
                        if (row.type === 'columns') {
                          return (
                            <div key={rowIndex} className="layout-row columns-row" style={{ 
                              display: 'flex',
                              gap: row.columnMargin ? `${row.columnMargin}%` : '0'
                            }}>
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
                                    {column.sections.map((sectionRef: any, sectionIndex: number) => {
                                      // Find and render regular section (including personal_info sections)
                                      const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
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
                                              {/* Empty spacer element */}
                                            </div>
                                          );
                                        }
                                      }
                                      if (!section) return null;
                                      // Apply item reordering based on layout
                                      const reorderedSection = applySectionItemOrder(section, rowIndex, colIndex);
                                      const availableTemplates = TEMPLATE_REGISTRY[reorderedSection.type] || [];
                                      // Check for template override first, then fallback to section.templateId
                                      const templateId = resumeData.sectionTemplates?.[sectionId] || reorderedSection.templateId;
                                      const selectedTemplate = availableTemplates.find(t => t.id === templateId) || availableTemplates[0];
                                      if (selectedTemplate) {
                                        const TemplateComponent = selectedTemplate.component;
                                        // Handle personal_info sections specially - they need access to external personalInfo
                                        if (reorderedSection.type === 'personal_info') {
                                          return <TemplateComponent key={`${colIndex}-${sectionIndex}-${sectionId}`} section={reorderedSection} personalInfo={resumeData?.personalInfo} />;
                                        }
                                        return <TemplateComponent key={`${colIndex}-${sectionIndex}-${sectionId}`} section={reorderedSection} />;
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
                                {row.sections.map((sectionRef: any, sectionIndex: number) => {
                                  const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
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
                                          {/* Empty spacer element */}
                                        </div>
                                      );
                                    }
                                  }
                                  if (!section) return null;
                                  // Apply item reordering based on layout for whole page sections
                                  const reorderedSection = applySectionItemOrder(section, rowIndex, undefined);
                                  const availableTemplates = TEMPLATE_REGISTRY[reorderedSection.type] || [];
                                  // Check for template override first, then fallback to section.templateId
                                  const templateId = resumeData.sectionTemplates?.[sectionId] || reorderedSection.templateId;
                                  const selectedTemplate = availableTemplates.find(t => t.id === templateId) || availableTemplates[0];
                                  if (selectedTemplate) {
                                    const TemplateComponent = selectedTemplate.component;
                                    // Handle personal_info sections specially - they need access to external personalInfo
                                    if (reorderedSection.type === 'personal_info') {
                                      return <TemplateComponent key={`${rowIndex}-${sectionIndex}-${sectionId}`} section={reorderedSection} personalInfo={resumeData?.personalInfo} />;
                                    }
                                    return <TemplateComponent key={`${rowIndex}-${sectionIndex}-${sectionId}`} section={reorderedSection} />;
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
                    {/* Render footer if configured for this page - positioned absolutely at bottom */}
                    {page?.footer && (
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: page.footer.height,
                          backgroundColor: page.footer.backgroundColor || 'transparent',
                          color: page.footer.textColor || 'inherit'
                        }}
                      >
                        <Footer config={page.footer} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
