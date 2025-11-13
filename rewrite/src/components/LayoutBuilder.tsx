import React, { useState } from 'react';
import type { ResumeData } from '../types';
import type { SectionInstance } from '../types/sections';
import { SectionSplittingManager } from './SectionSplittingManager';
import { SectionTemplateSelector } from './SectionTemplateSelector';
import './LayoutBuilder.css';

interface LayoutBuilderProps {
  resumeData: ResumeData;
  onLayoutChange: (newLayout: any) => void;
}

interface PageLayout {
  id: string;
  pageNumber: number;
  rows: LayoutRow[];
}

interface LayoutRow {
  id: string;
  type: 'columns' | 'wholePage';
  columns?: LayoutColumn[];
  sections?: string[];
  backgroundColor?: string;
  textColor?: string;
}

interface LayoutColumn {
  width: string;
  sections: string[];
  backgroundColor?: string;
  textColor?: string;
}

export const LayoutBuilder: React.FC<LayoutBuilderProps> = ({ 
  resumeData, 
  onLayoutChange 
}) => {
  // Initialize pages from resume data
  const [pages, setPages] = useState<PageLayout[]>(() => {
    const layoutPages = resumeData.layout?.pages || [];
    if (layoutPages.length === 0) {
      // Create a default page if none exist
      return [{
        id: 'page-1',
        pageNumber: 1,
        rows: []
      }];
    }
    
    return layoutPages.map((page: any, index: number) => ({
      id: `page-${index + 1}`,
      pageNumber: index + 1,
      rows: page.rows?.map((row: any, rowIndex: number) => ({
        id: `page-${index + 1}-row-${rowIndex}`,
        type: row.type === 'columns' ? 'columns' : 'wholePage',
        ...(row.type === 'columns' ? {
          columns: row.columns?.map((col: any) => ({
            width: col.width,
            sections: col.sections || [],
            backgroundColor: col.backgroundColor,
            textColor: col.textColor
          })) || []
        } : {
          sections: row.sections || [],
          backgroundColor: row.backgroundColor,
          textColor: row.textColor
        })
      })) || []
    }));
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPage = pages[currentPageIndex] || pages[0];
  
  const [availableSections] = useState(() => 
    resumeData.sections?.map(s => ({ id: s.id, title: s.title })) || []
  );

  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  
  // Section splitting state
  const [sectionInstances, setSectionInstances] = useState<SectionInstance[]>([]);
  const [splittingSection, setSplittingSection] = useState<string | null>(null);

  // Template selector state
  const [templateSelector, setTemplateSelector] = useState<{
    sectionId: string;
    sectionType: string;
    position: { x: number; y: number };
  } | null>(null);
  const [sectionTemplates, setSectionTemplates] = useState<Record<string, string>>(() => {
    return resumeData.layout?.sectionTemplates || {};
  });

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragStart = (e: React.DragEvent, rowIndex: number) => {
    setDraggedRow(rowIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetRowIndex: number, targetColumnIndex?: number) => {
    e.preventDefault();
    
    if (draggedSection) {
      // Remove section from its current location in current page
      const updatedRows = currentPage.rows.map(row => ({
        ...row,
        columns: row.columns?.map(col => ({
          ...col,
          sections: col.sections.filter(s => s !== draggedSection)
        })),
        sections: row.sections?.filter(s => s !== draggedSection)
      }));

      // Add section to new location
      if (targetColumnIndex !== undefined) {
        // Drop in specific column
        if (updatedRows[targetRowIndex]?.columns?.[targetColumnIndex]) {
          updatedRows[targetRowIndex].columns![targetColumnIndex].sections.push(draggedSection);
        }
      } else {
        // Drop in whole page row
        if (updatedRows[targetRowIndex]?.sections) {
          updatedRows[targetRowIndex].sections!.push(draggedSection);
        }
      }

      // Update the current page
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
      setPages(newPages);
      onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
      setDraggedSection(null);
    } else if (draggedRow !== null) {
      // Reorder rows within current page
      const newRows = [...currentPage.rows];
      const [movedRow] = newRows.splice(draggedRow, 1);
      newRows.splice(targetRowIndex, 0, movedRow);
      
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: newRows };
      setPages(newPages);
      onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
      setDraggedRow(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addNewRow = (type: 'columns' | 'wholePage') => {
    const rowId = `page-${currentPage.pageNumber}-row-${currentPage.rows.length}`;
    const newRow: LayoutRow = {
      id: rowId,
      type,
      ...(type === 'columns' ? {
        columns: [
          { width: '50%', sections: [], backgroundColor: '#ffffff', textColor: '#333333' },
          { width: '50%', sections: [], backgroundColor: '#ffffff', textColor: '#333333' }
        ]
      } : {
        sections: [],
        backgroundColor: '#ffffff',
        textColor: '#333333'
      })
    };

    const newRows = [...currentPage.rows, newRow];
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...currentPage, rows: newRows };
    setPages(newPages);
    onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
  };

  const removeRow = (rowIndex: number) => {
    const newRows = currentPage.rows.filter((_, index) => index !== rowIndex);
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...currentPage, rows: newRows };
    setPages(newPages);
    onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
  };

  const updateColumnWidth = (rowIndex: number, columnIndex: number, newWidth: string) => {
    const newRows = [...currentPage.rows];
    if (newRows[rowIndex]?.columns?.[columnIndex]) {
      newRows[rowIndex].columns![columnIndex].width = newWidth;
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: newRows };
      setPages(newPages);
      onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
    }
  };

  // Page management functions
  const addNewPage = () => {
    const newPage: PageLayout = {
      id: `page-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      rows: []
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setCurrentPageIndex(pages.length); // Switch to new page
    onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
  };

  const removePage = (pageIndex: number) => {
    if (pages.length <= 1) return; // Can't remove the last page
    
    const newPages = pages.filter((_, index) => index !== pageIndex);
    // Renumber pages
    const renumberedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
      id: `page-${index + 1}`
    }));
    
    setPages(renumberedPages);
    setCurrentPageIndex(Math.min(currentPageIndex, renumberedPages.length - 1));
    onLayoutChange({ pages: renumberedPages.map(p => ({ ...p, rows: p.rows })) });
  };

  // Section splitting handlers
  const handleUpdateSectionInstances = (instances: SectionInstance[]) => {
    setSectionInstances(prevInstances => {
      const otherInstances = prevInstances.filter(inst => 
        inst.sectionId !== instances[0]?.sectionId
      );
      return [...otherInstances, ...instances];
    });
  };

  const getSectionForSplitting = () => {
    if (!splittingSection) return null;
    const section = resumeData.sections?.find(s => s.id === splittingSection);
    return section as any; // Type cast for now - will need proper type alignment later
  };

  const getSectionInstances = (sectionId: string) => {
    return sectionInstances.filter(inst => inst.sectionId === sectionId);
  };

  // Template selection handlers
  const handleSectionRightClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const section = resumeData.sections?.find(s => s.id === sectionId);
    if (!section) return;

    setTemplateSelector({
      sectionId,
      sectionType: section.type,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleTemplateChange = (sectionId: string, templateId: string) => {
    setSectionTemplates(prev => ({
      ...prev,
      [sectionId]: templateId
    }));
    
    // Update the layout with the new template selection
    const updatedLayout = {
      pages: pages.map(p => ({ ...p, rows: p.rows })),
      sectionTemplates: {
        ...sectionTemplates,
        [sectionId]: templateId
      }
    };
    
    onLayoutChange(updatedLayout);
  };

  const handleCloseTemplateSelector = () => {
    setTemplateSelector(null);
  };

  return (
    <div className="layout-builder">
      <div className="layout-builder-header">
        <h3>Layout Builder</h3>
        <div className="layout-controls">
          <button 
            className="btn btn-small"
            onClick={() => addNewRow('columns')}
          >
            Add Column Row
          </button>
          <button 
            className="btn btn-small"
            onClick={() => addNewRow('wholePage')}
          >
            Add Full Width Row
          </button>
        </div>
      </div>

      <div className="layout-builder-content">
        {/* Page Management */}
        <div className="page-tabs">
          <div className="page-tab-list">
            {pages.map((page, index) => (
              <button
                key={page.id}
                className={`page-tab ${index === currentPageIndex ? 'active' : ''}`}
                onClick={() => setCurrentPageIndex(index)}
              >
                Page {page.pageNumber}
                {pages.length > 1 && (
                  <button
                    className="remove-page"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePage(index);
                    }}
                  >
                    ×
                  </button>
                )}
              </button>
            ))}
            <button onClick={addNewPage} className="add-page-button">
              + Add Page
            </button>
          </div>
        </div>

        {/* Layout Content */}
        <div className="layout-content-wrapper">
          {/* Available sections */}
          <div className="available-sections">
            <h4>Available Sections</h4>
            <div className="sections-list">
              {availableSections.map((section) => (
                <div
                  key={section.id}
                  className="section-item draggable"
                  draggable
                  onDragStart={(e) => handleDragStart(e, section.id)}
                >
                  {section.title || section.id}
                </div>
              ))}
            </div>
          </div>

          {/* Layout rows for current page */}
          <div className="layout-rows">
            <h4>Page {currentPage.pageNumber} Layout</h4>
            {currentPage.rows.map((row: LayoutRow, rowIndex: number) => (
            <div
              key={row.id}
              className="layout-row-builder"
              draggable
              onDragStart={(e) => handleRowDragStart(e, rowIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, rowIndex)}
            >
              <div className="row-header">
                <span className="row-type">{row.type}</span>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={() => removeRow(rowIndex)}
                >
                  Remove
                </button>
              </div>

              {row.type === 'columns' && row.columns ? (
                <div className="columns-builder">
                  {row.columns.map((column: LayoutColumn, columnIndex: number) => (
                    <div
                      key={columnIndex}
                      className="column-builder"
                      style={{ width: column.width }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, rowIndex, columnIndex)}
                    >
                      <div className="column-header">
                        <input
                          type="text"
                          value={column.width}
                          onChange={(e) => updateColumnWidth(rowIndex, columnIndex, e.target.value)}
                          className="width-input"
                        />
                      </div>
                      <div className="column-sections">
                        {column.sections.map((sectionId: string) => {
                          const section = availableSections.find(s => s.id === sectionId);
                          const resumeSection = resumeData.sections?.find(s => s.id === sectionId);
                          const canSplit = resumeSection && (
                            resumeSection.type === 'experience' || 
                            resumeSection.type === 'education' || 
                            resumeSection.type === 'projects' ||
                            resumeSection.type === 'skills' ||
                            resumeSection.type === 'certifications' ||
                            resumeSection.type === 'list'
                          );
                          
                          return (
                            <div 
                              key={sectionId} 
                              className="section-item placed"
                              onContextMenu={(e) => handleSectionRightClick(e, sectionId)}
                            >
                              <span className="section-title">
                                {section?.title || sectionId}
                              </span>
                              <div className="section-actions">
                                <button
                                  className="template-button"
                                  onClick={(e) => handleSectionRightClick(e, sectionId)}
                                  title="Select template"
                                >
                                  🎨
                                </button>
                                {canSplit && (
                                  <button
                                    className="split-button"
                                    onClick={() => setSplittingSection(sectionId)}
                                    title="Split section"
                                  >
                                    ⚡
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {column.sections.length === 0 && (
                          <div className="drop-zone">Drop sections here</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="whole-page-builder"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex)}
                >
                  <div className="whole-page-sections">
                    {row.sections?.map((sectionId: string) => {
                      const section = availableSections.find(s => s.id === sectionId);
                      const resumeSection = resumeData.sections?.find(s => s.id === sectionId);
                      const canSplit = resumeSection && (
                        resumeSection.type === 'experience' || 
                        resumeSection.type === 'education' || 
                        resumeSection.type === 'projects' ||
                        resumeSection.type === 'skills' ||
                        resumeSection.type === 'certifications' ||
                        resumeSection.type === 'list'
                      );
                      
                      return (
                        <div 
                          key={sectionId} 
                          className="section-item placed"
                          onContextMenu={(e) => handleSectionRightClick(e, sectionId)}
                        >
                          <span className="section-title">
                            {section?.title || sectionId}
                          </span>
                          <div className="section-actions">
                            <button
                              className="template-button"
                              onClick={(e) => handleSectionRightClick(e, sectionId)}
                              title="Select template"
                            >
                              🎨
                            </button>
                            {canSplit && (
                              <button
                                className="split-button"
                                onClick={() => setSplittingSection(sectionId)}
                                title="Split section"
                              >
                                ⚡
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(!row.sections || row.sections.length === 0) && (
                      <div className="drop-zone">Drop sections here</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
      
      {/* Section Splitting Modal */}
      {splittingSection && (
        <SectionSplittingManager
          section={getSectionForSplitting()!}
          instances={getSectionInstances(splittingSection)}
          onUpdateInstances={handleUpdateSectionInstances}
          onClose={() => setSplittingSection(null)}
        />
      )}
      
      {/* Template Selector */}
      {templateSelector && (
        <SectionTemplateSelector
          sectionId={templateSelector.sectionId}
          sectionType={templateSelector.sectionType}
          currentTemplateId={sectionTemplates[templateSelector.sectionId]}
          onTemplateChange={handleTemplateChange}
          onClose={handleCloseTemplateSelector}
          position={templateSelector.position}
        />
      )}
    </div>
  );
};
