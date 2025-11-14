import React, { useState } from 'react';
import type { ResumeData } from '../types';

import { SectionSplittingManager } from './SectionSplittingManager';
import { SectionTemplateSelector } from './SectionTemplateSelector';
import { GlobalStylesPanel } from './GlobalStylesPanel';
import type { FooterConfig } from './Footer';
import './LayoutBuilder.css';
import './GlobalStylesPanel.css';

interface LayoutBuilderProps {
  resumeData: ResumeData;
  onLayoutChange: (newLayout: any) => void;
  onResumeDataChange?: (newResumeData: ResumeData) => void;
}

interface PageLayout {
  id: string;
  pageNumber: number;
  rows: LayoutRow[];
  footer?: FooterConfig;
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
  onLayoutChange,
  onResumeDataChange 
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
  
  // Derive available sections from current resume data (updates when resume data changes)
  const availableSections = resumeData.sections?.map(s => ({ id: s.id, title: s.title })) || [];

  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  
  // State for within-row dragging
  const [draggedSectionInRow, setDraggedSectionInRow] = useState<{
    sectionId: string;
    fromRowIndex: number;
    fromColumnIndex?: number;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    rowIndex: number;
    columnIndex?: number;
    insertIndex?: number;
  } | null>(null);
  
  // Section splitting state

  const [splittingSection, setSplittingSection] = useState<string | null>(null);

  // Template selector state
  const [templateSelector, setTemplateSelector] = useState<{
    sectionId: string;
    sectionType: string;
    position: { x: number; y: number };
  } | null>(null);
  const [sectionTemplates, setSectionTemplates] = useState<Record<string, string>>(
    resumeData.sectionTemplates || {}
  );

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
    e.stopPropagation();
    
    
    if (draggedSection) {
      // When dragging from sidebar, we want to ADD a new instance, not move an existing one
      // Clone the current rows without removing any existing instances
      const updatedRows = [...currentPage.rows];

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

  // Handlers for within-row dragging and section management
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string, rowIndex: number, columnIndex?: number) => {
    setDraggedSectionInRow({
      sectionId,
      fromRowIndex: rowIndex,
      fromColumnIndex: columnIndex
    });
    e.dataTransfer.effectAllowed = 'move';
    // Stop propagation to prevent row dragging
    e.stopPropagation();
  };

  const handleSectionDrop = (e: React.DragEvent, targetRowIndex: number, targetColumnIndex?: number, insertIndex?: number, isSwap: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);



    // Handle sidebar section drops (creating new instances)
    if (draggedSection && !draggedSectionInRow) {
      const updatedRows = [...currentPage.rows];
      
      if (targetColumnIndex !== undefined) {
        // Add to column
        const targetCol = updatedRows[targetRowIndex].columns![targetColumnIndex];
        if (insertIndex !== undefined && insertIndex >= 0) {
          targetCol.sections.splice(insertIndex, 0, draggedSection);
        } else {
          targetCol.sections.push(draggedSection);
        }
      } else {
        // Add to whole page row
        const targetSections = updatedRows[targetRowIndex].sections!;
        if (insertIndex !== undefined && insertIndex >= 0) {
          targetSections.splice(insertIndex, 0, draggedSection);
        } else {
          targetSections.push(draggedSection);
        }
      }
      
      // Update state
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
      setPages(newPages);
      onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
      setDraggedSection(null);
      return;
    }

    // Handle layout section drops (moving/reordering existing sections)
    if (draggedSectionInRow) {
      const { sectionId, fromRowIndex, fromColumnIndex } = draggedSectionInRow;
      
      // Clone the current rows
      const updatedRows = [...currentPage.rows];
      
      // Check if we're moving within the same container
      const sameContainer = fromRowIndex === targetRowIndex && fromColumnIndex === targetColumnIndex;
      
      if (sameContainer) {
        // Handle reordering within the same container
        let sections: string[];
        if (fromColumnIndex !== undefined) {
          sections = [...updatedRows[fromRowIndex].columns![fromColumnIndex].sections];
        } else {
          sections = [...updatedRows[fromRowIndex].sections!];
        }
        
        const currentIndex = sections.indexOf(sectionId);
        let targetIndex = insertIndex !== undefined ? insertIndex : sections.length;
        
        // Handle swapping behavior when dropping directly on another section
        if (isSwap && insertIndex !== undefined) {
          // Find the target section at the insertIndex
          const targetSectionId = sections[insertIndex];
          if (targetSectionId && targetSectionId !== sectionId) {
            // Swap the positions
            sections[currentIndex] = targetSectionId;
            sections[insertIndex] = sectionId;
            
            // Update the sections array
            if (fromColumnIndex !== undefined) {
              updatedRows[fromRowIndex].columns![fromColumnIndex].sections = sections;
            } else {
              updatedRows[fromRowIndex].sections = sections;
            }
            
            // Update state and return
            const newPages = [...pages];
            newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
            setPages(newPages);
            onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
            setDraggedSectionInRow(null);
            return;
          }
        }
        
        // Clamp target index to valid range
        targetIndex = Math.max(0, Math.min(targetIndex, sections.length));
        
        // If we're moving to the same position, do nothing
        if (currentIndex === targetIndex || (currentIndex === targetIndex - 1 && targetIndex > currentIndex)) {
          setDraggedSectionInRow(null);
          return;
        }
        
        // Remove from current position
        sections.splice(currentIndex, 1);
        
        // Adjust target index if we're moving to a position after the original position
        if (targetIndex > currentIndex) {
          targetIndex -= 1;
        }
        
        // Insert at new position
        sections.splice(targetIndex, 0, sectionId);
        
        // Update the sections array
        if (fromColumnIndex !== undefined) {
          updatedRows[fromRowIndex].columns![fromColumnIndex].sections = sections;
        } else {
          updatedRows[fromRowIndex].sections = sections;
        }
      } else {
        // Handle moving between different containers
        // Remove from source
        if (fromColumnIndex !== undefined) {
          const sourceCol = updatedRows[fromRowIndex].columns![fromColumnIndex];
          sourceCol.sections = sourceCol.sections.filter(s => s !== sectionId);
        } else {
          updatedRows[fromRowIndex].sections = updatedRows[fromRowIndex].sections!.filter(s => s !== sectionId);
        }
        
        // Add to target position
        if (targetColumnIndex !== undefined) {
          // Add to column
          const targetCol = updatedRows[targetRowIndex].columns![targetColumnIndex];
          if (insertIndex !== undefined && insertIndex >= 0) {
            targetCol.sections.splice(insertIndex, 0, sectionId);
          } else {
            targetCol.sections.push(sectionId);
          }
        } else {
          // Add to whole page row
          const targetSections = updatedRows[targetRowIndex].sections!;
          if (insertIndex !== undefined && insertIndex >= 0) {
            targetSections.splice(insertIndex, 0, sectionId);
          } else {
            targetSections.push(sectionId);
          }
        }
      }
      
      // Update state
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
      setPages(newPages);
      onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
      setDraggedSectionInRow(null);
    }
  };

  const removeSectionFromRow = (sectionId: string, rowIndex: number, columnIndex?: number, sectionIndex?: number) => {
    const updatedRows = [...currentPage.rows];
    
    if (columnIndex !== undefined) {
      // Remove from column
      const column = updatedRows[rowIndex].columns![columnIndex];
      if (sectionIndex !== undefined) {
        // Remove specific instance by index
        column.sections.splice(sectionIndex, 1);
      } else {
        // Fallback: remove first occurrence
        const index = column.sections.indexOf(sectionId);
        if (index > -1) {
          column.sections.splice(index, 1);
        }
      }
    } else {
      // Remove from whole page row
      const sections = updatedRows[rowIndex].sections!;
      if (sectionIndex !== undefined) {
        // Remove specific instance by index
        sections.splice(sectionIndex, 1);
      } else {
        // Fallback: remove first occurrence
        const index = sections.indexOf(sectionId);
        if (index > -1) {
          sections.splice(index, 1);
        }
      }
    }
    
    // Update state
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
    setPages(newPages);
    onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
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

  // Padding section creation function
  const createPaddingSection = (height: string) => {
    if (!onResumeDataChange) return;

    // Generate unique ID for the padding section
    const paddingId = `padding-${Date.now()}`;
    
    // Create the padding section
    const paddingSection = {
      id: paddingId,
      title: `Spacing (${height})`,
      type: 'padding' as const,
      templateId: 'padding-custom',
      isVisible: true,
      items: [],
      customFields: {
        height: height
      }
    };

    // Add to resume data
    const newSections = [...(resumeData.sections || []), paddingSection];
    const updatedResumeData = {
      ...resumeData,
      sections: newSections
    };

    onResumeDataChange(updatedResumeData);
  };

  // Update padding section height
  const updatePaddingSectionHeight = (sectionId: string, newHeight: string) => {
    if (!onResumeDataChange) return;

    const updatedSections = resumeData.sections?.map(section => {
      if (section.id === sectionId && section.type === 'padding') {
        return {
          ...section,
          title: `Spacing (${newHeight})`,
          customFields: {
            ...section.customFields,
            height: newHeight
          }
        };
      }
      return section;
    }) || [];

    const updatedResumeData = {
      ...resumeData,
      sections: updatedSections
    };

    onResumeDataChange(updatedResumeData);
  };

  // Section splitting handlers - create actual separate sections
  const handleSplitSection = (originalSectionId: string, splitData: { sections: any[] }) => {
    if (!onResumeDataChange) return;

    // Find the original section
    const originalSection = resumeData.sections?.find(s => s.id === originalSectionId);
    if (!originalSection) return;

    // Create new sections with unique IDs and smart titles
    const newSections = splitData.sections.map((sectionData, index) => {
      let defaultTitle: string;
      
      if (splitData.sections.length === 2) {
        // For exactly 2 parts: first keeps original name, second gets "(cont)"
        defaultTitle = index === 0 ? originalSection.title : `${originalSection.title} (cont)`;
      } else {
        // For 3+ parts: use "Part 1", "Part 2", etc.
        defaultTitle = `${originalSection.title} (Part ${index + 1})`;
      }
      
      return {
        ...sectionData,
        id: `${originalSectionId}_split_${index + 1}`,
        title: sectionData.title || defaultTitle
      };
    });

    console.log('🔄 Split sections created:', newSections.map(s => ({ id: s.id, title: s.title, itemCount: s.items?.length || s.categories?.length || 0 })));

    // Update resume data - replace original section with new sections
    const updatedSections = (resumeData.sections || [])
      .filter(s => s.id !== originalSectionId) // Remove original
      .concat(newSections); // Add new split sections

    const newResumeData = {
      ...resumeData,
      sections: updatedSections
    };

    // Update layout - replace original section ID with new section IDs
    const updatedPages = pages.map(page => ({
      ...page,
      rows: page.rows.map(row => ({
        ...row,
        columns: row.columns?.map(col => ({
          ...col,
          sections: col.sections.flatMap(sId => 
            sId === originalSectionId ? newSections.map(ns => ns.id) : [sId]
          )
        })),
        sections: row.sections?.flatMap(sId => 
          sId === originalSectionId ? newSections.map(ns => ns.id) : [sId]
        )
      }))
    }));

    console.log('🏗️ Updated layout sections:', updatedPages.flatMap(p => p.rows.flatMap(r => r.columns?.flatMap(c => c.sections) || r.sections || [])));
    console.log('🔍 Original section being replaced:', originalSectionId);
    console.log('� New section IDs:', newSections.map(s => s.id));

    console.log('�📤 Calling onResumeDataChange with updated data');
    onResumeDataChange(newResumeData);
    
    // Update local layout state 
    setPages(updatedPages);
    setSplittingSection(null);
  };

  const getSectionForSplitting = () => {
    if (!splittingSection) return null;
    const section = resumeData.sections?.find(s => s.id === splittingSection);
    return section as any; // Type cast for now - will need proper type alignment later
  };

  // Section combining handlers - merge split sections back into one
  const handleCombineSections = (sectionIds: string[], containerInfo: { rowIndex: number, columnIndex?: number, startIndex: number }) => {
    if (!onResumeDataChange || sectionIds.length < 2) return;

    // Find all the sections to combine
    const sectionsToProcess = sectionIds.map(id => resumeData.sections?.find(s => s.id === id)).filter(Boolean) as any[];
    if (sectionsToProcess.length !== sectionIds.length) return;

    // Determine the original section ID (remove _split_X suffix)
    const firstSection = sectionsToProcess[0];
    if (!firstSection) return;
    
    const baseId = firstSection.id.replace(/_split_\d+$/, '');
    
    // Combine all items/categories from the split sections
    const combinedItems: any[] = [];
    const combinedCategories: any[] = [];
    
    sectionsToProcess.forEach((section: any) => {
      if (section?.items) {
        combinedItems.push(...section.items);
      }
      if (section?.categories) {
        combinedCategories.push(...section.categories);
      }
    });

    // Create the combined section
    const combinedSection = {
      ...firstSection,
      id: baseId, // Use original ID
      title: firstSection.title.replace(/ \((Part \d+|cont)\)$/, ''), // Remove "(Part X)" or "(cont)" from title
      ...(firstSection.type === 'skills' && combinedCategories.length > 0 ? { categories: combinedCategories } : {}),
      ...(firstSection.type !== 'skills' && combinedItems.length > 0 ? { items: combinedItems } : {})
    } as any;

    // Update resume data - remove split sections and add combined section
    const updatedSections = (resumeData.sections || [])
      .filter(s => !sectionIds.includes(s.id)) // Remove all split sections
      .concat([combinedSection]); // Add combined section

    const newResumeData = {
      ...resumeData,
      sections: updatedSections
    };

    // Update layout - replace all split section IDs with the combined section ID
    const updatedPages = pages.map(page => ({
      ...page,
      rows: page.rows.map((row, rowIdx) => {
        if (rowIdx !== containerInfo.rowIndex) return row;
        
        return {
          ...row,
          columns: row.columns?.map((col, colIdx) => {
            if (containerInfo.columnIndex !== undefined && colIdx !== containerInfo.columnIndex) return col;
            if (containerInfo.columnIndex === undefined) return col; // This is a whole page row
            
            // Replace consecutive split sections with single combined section
            const newSections = [...col.sections];
            newSections.splice(containerInfo.startIndex, sectionIds.length, baseId);
            
            return {
              ...col,
              sections: newSections
            };
          }),
          sections: containerInfo.columnIndex === undefined ? (() => {
            // Handle whole page row
            const newSections = [...(row.sections || [])];
            newSections.splice(containerInfo.startIndex, sectionIds.length, baseId);
            return newSections;
          })() : row.sections
        };
      })
    }));

    console.log('🔗 Sections combined:', sectionIds, '→', baseId);
    onResumeDataChange(newResumeData);
    
    // Update local layout state
    setPages(updatedPages);
  };

  // Sidebar-based combine function - automatically finds and removes split sections from layout
  const handleCombineFromSidebar = (baseId: string, splitSectionIds: string[]) => {
    if (!onResumeDataChange || splitSectionIds.length < 2) return;

    // Find all the sections to combine
    const sectionsToProcess = splitSectionIds.map(id => resumeData.sections?.find(s => s.id === id)).filter(Boolean) as any[];
    if (sectionsToProcess.length !== splitSectionIds.length) return;

    const firstSection = sectionsToProcess[0];
    if (!firstSection) return;
    
    // Combine all items/categories from the split sections
    const combinedItems: any[] = [];
    const combinedCategories: any[] = [];
    
    sectionsToProcess.forEach((section: any) => {
      if (section?.items) {
        combinedItems.push(...section.items);
      }
      if (section?.categories) {
        combinedCategories.push(...section.categories);
      }
    });

    // Create the combined section with original base ID
    const combinedSection = {
      ...firstSection,
      id: baseId, // Use original base ID
      title: firstSection.title.replace(/ \((Part \d+|cont)\)$/, ''), // Remove "(Part X)" or "(cont)" from title
      ...(firstSection.type === 'skills' && combinedCategories.length > 0 ? { categories: combinedCategories } : {}),
      ...(firstSection.type !== 'skills' && combinedItems.length > 0 ? { items: combinedItems } : {})
    } as any;

    // Update resume data - remove split sections and add combined section
    const updatedSections = (resumeData.sections || [])
      .filter(s => !splitSectionIds.includes(s.id)) // Remove all split sections
      .concat([combinedSection]); // Add combined section

    const newResumeData = {
      ...resumeData,
      sections: updatedSections
    };

    // Update layout - remove all split sections from layout (don't add base section automatically)
    const updatedPages = pages.map(page => ({
      ...page,
      rows: page.rows.map(row => ({
        ...row,
        columns: row.columns?.map(col => ({
          ...col,
          sections: col.sections.filter(sId => !splitSectionIds.includes(sId))
        })),
        sections: row.sections?.filter(sId => !splitSectionIds.includes(sId))
      }))
    }));

    console.log('🔗 Sections combined from sidebar:', splitSectionIds, '→', baseId);
    onResumeDataChange(newResumeData);
    
    // Update local layout state and force re-render
    setPages(updatedPages);
    
    // Force a small delay to ensure state updates are processed
    setTimeout(() => {
      console.log('🔄 Layout updated after combine');
    }, 100);
  };

  // Helper function to convert percentage string to number
  const parsePercentage = (widthStr: string): number => {
    const match = widthStr.match(/^(\d+)%?$/);
    return match ? parseInt(match[1], 10) : 50;
  };

  // Helper function to determine if a drop zone should be hidden
  const shouldHideDropZone = (
    rowIndex: number, 
    columnIndex: number | undefined, 
    sectionIndex: number, 
    isBeforeSection: boolean
  ): boolean => {
    // Only hide drop zones when dragging from within the layout (not from sidebar)
    if (!draggedSectionInRow || draggedSection) {
      return false;
    }

    const { fromRowIndex, fromColumnIndex } = draggedSectionInRow;

    // Check if we're in the same row and column as the dragged section
    const sameRow = rowIndex === fromRowIndex;
    const sameColumn = columnIndex === fromColumnIndex;

    if (!sameRow || !sameColumn) {
      return false;
    }

    // Get the sections array to find the dragged section's index
    let sections: string[];
    if (columnIndex !== undefined) {
      // Column layout
      sections = currentPage.rows[rowIndex].columns?.[columnIndex]?.sections || [];
    } else {
      // Whole page layout
      sections = currentPage.rows[rowIndex].sections || [];
    }

    const draggedSectionIndex = sections.findIndex(id => id === draggedSectionInRow.sectionId);
    if (draggedSectionIndex === -1) return false;

    // Hide drop zones immediately adjacent to the dragged section
    if (isBeforeSection) {
      // Drop zone before a section - hide if it's right before the dragged section
      return sectionIndex === draggedSectionIndex;
    } else {
      // Drop zone after a section - hide if it's right after the dragged section
      return sectionIndex === draggedSectionIndex;
    }
  };

  // Cycle column background between white, secondary, and primary colors
  const toggleColumnBackground = (rowIndex: number, columnIndex: number) => {
    const updatedPages = [...pages];
    const row = updatedPages[currentPageIndex].rows[rowIndex];
    
    if (row.type === 'columns' && row.columns) {
      const column = row.columns[columnIndex];
      const primaryColor = resumeData.layout?.globalStyles?.colorScheme?.primary || '#2c5aa0';
      const secondaryColor = resumeData.layout?.globalStyles?.colorScheme?.secondary || '#f8f9fa';
      const textColor = resumeData.layout?.globalStyles?.colorScheme?.text || '#333333';
      
      // Cycle through: white -> secondary -> primary -> white
      let newBackgroundColor = '#ffffff';
      let newTextColor = textColor;
      
      if (column.backgroundColor === '#ffffff' || !column.backgroundColor) {
        // White -> Secondary
        newBackgroundColor = secondaryColor;
        newTextColor = textColor;
      } else if (column.backgroundColor === secondaryColor) {
        // Secondary -> Primary
        newBackgroundColor = primaryColor;
        newTextColor = '#ffffff';
      } else {
        // Primary (or any other color) -> White
        newBackgroundColor = '#ffffff';
        newTextColor = textColor;
      }
      
      row.columns[columnIndex] = {
        ...column,
        backgroundColor: newBackgroundColor,
        textColor: newTextColor
      };
      
      setPages(updatedPages);
      
      // Update the layout
      const currentPage = pages[currentPageIndex];
      const updatedCurrentPage = {
        ...currentPage,
        rows: [...updatedPages[currentPageIndex].rows]
      };
      
      onLayoutChange({
        pages: updatedPages.map((page, idx) => 
          idx === currentPageIndex ? updatedCurrentPage : page
        )
      });
    }
  };

  // Cycle whole page row background between white, secondary, and primary colors
  const toggleWholePageBackground = (rowIndex: number) => {
    const updatedPages = [...pages];
    const row = updatedPages[currentPageIndex].rows[rowIndex];
    
    if (row.type === 'wholePage') {
      const primaryColor = resumeData.layout?.globalStyles?.colorScheme?.primary || '#2c5aa0';
      const secondaryColor = resumeData.layout?.globalStyles?.colorScheme?.secondary || '#f8f9fa';
      const textColor = resumeData.layout?.globalStyles?.colorScheme?.text || '#333333';
      
      // Cycle through: white -> secondary -> primary -> white
      let newBackgroundColor = '#ffffff';
      let newTextColor = textColor;
      
      if (row.backgroundColor === '#ffffff' || !row.backgroundColor) {
        // White -> Secondary
        newBackgroundColor = secondaryColor;
        newTextColor = textColor;
      } else if (row.backgroundColor === secondaryColor) {
        // Secondary -> Primary
        newBackgroundColor = primaryColor;
        newTextColor = '#ffffff';
      } else {
        // Primary (or any other color) -> White
        newBackgroundColor = '#ffffff';
        newTextColor = textColor;
      }
      
      updatedPages[currentPageIndex].rows[rowIndex] = {
        ...row,
        backgroundColor: newBackgroundColor,
        textColor: newTextColor
      };
      
      setPages(updatedPages);
      
      // Update the layout
      const currentPage = pages[currentPageIndex];
      const updatedCurrentPage = {
        ...currentPage,
        rows: [...updatedPages[currentPageIndex].rows]
      };
      
      onLayoutChange({
        pages: updatedPages.map((page, idx) => 
          idx === currentPageIndex ? updatedCurrentPage : page
        )
      });
    }
  };

  // Set custom text color for column
  const setColumnTextColor = (rowIndex: number, columnIndex: number, color: string) => {
    const updatedPages = [...pages];
    const row = updatedPages[currentPageIndex].rows[rowIndex];
    
    if (row.type === 'columns' && row.columns) {
      row.columns[columnIndex] = {
        ...row.columns[columnIndex],
        textColor: color
      };
      
      setPages(updatedPages);
      
      // Update the layout
      const currentPage = pages[currentPageIndex];
      const updatedCurrentPage = {
        ...currentPage,
        rows: [...updatedPages[currentPageIndex].rows]
      };
      
      onLayoutChange({
        pages: updatedPages.map((page, idx) => 
          idx === currentPageIndex ? updatedCurrentPage : page
        )
      });
    }
  };

  // Set custom text color for whole-page row
  const setWholePageTextColor = (rowIndex: number, color: string) => {
    const updatedPages = [...pages];
    const row = updatedPages[currentPageIndex].rows[rowIndex];
    
    if (row.type === 'wholePage') {
      updatedPages[currentPageIndex].rows[rowIndex] = {
        ...row,
        textColor: color
      };
      
      setPages(updatedPages);
      
      // Update the layout
      const currentPage = pages[currentPageIndex];
      const updatedCurrentPage = {
        ...currentPage,
        rows: [...updatedPages[currentPageIndex].rows]
      };
      
      onLayoutChange({
        pages: updatedPages.map((page, idx) => 
          idx === currentPageIndex ? updatedCurrentPage : page
        )
      });
    }
  };

  // Update footer configuration for current page
  const updatePageFooter = (footerType: 'none' | 'default' | 'mountains' | 'fish' | 'minimal' | 'modern') => {
    const updatedPages = [...pages];
    
    // Set correct heights based on old implementation
    const getFooterHeight = (type: string) => {
      switch (type) {
        case 'default': return '4.25cm';
        case 'fish': return '4.25cm';
        case 'mountains': return '2.5cm';
        case 'modern': return '2cm';
        case 'minimal': return '1cm';
        default: return '2cm';
      }
    };
    
    updatedPages[currentPageIndex] = {
      ...updatedPages[currentPageIndex],
      footer: footerType === 'none' ? undefined : {
        type: footerType,
        height: getFooterHeight(footerType),
        backgroundColor: 'transparent',
        textColor: resumeData.layout?.globalStyles?.colorScheme?.text || '#333333'
      }
    };
    
    setPages(updatedPages);
    
    // Update the layout
    onLayoutChange({
      pages: updatedPages
    });
  };

  // Helper function to update column width with percentage
  const updateColumnWidthSlider = (rowIndex: number, columnIndex: number, percentage: number) => {
    const updatedRows = [...currentPage.rows];
    const row = updatedRows[rowIndex];
    if (row.columns && row.columns[columnIndex]) {
      row.columns[columnIndex].width = `${percentage}%`;
      
      // Auto-adjust other column in 2-column layout
      if (row.columns.length === 2) {
        const otherIndex = columnIndex === 0 ? 1 : 0;
        row.columns[otherIndex].width = `${100 - percentage}%`;
      }
      
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
      setPages(newPages);
      onLayoutChange({ pages: newPages.map(p => ({ ...p, rows: p.rows })) });
    }
  };

  // Helper function to get all section IDs currently used in layout
  const getAllLayoutSectionIds = () => {
    const allSectionIds: string[] = [];
    pages.forEach(page => {
      page.rows.forEach(row => {
        if (row.columns) {
          row.columns.forEach(col => {
            allSectionIds.push(...col.sections);
          });
        }
        if (row.sections) {
          allSectionIds.push(...row.sections);
        }
      });
    });
    return [...new Set(allSectionIds)]; // Remove duplicates
  };

  // Helper function to detect split sections that can be combined
  const getSplitSectionsInLayout = () => {
    const layoutSectionIds = getAllLayoutSectionIds();
    const splitGroups: { [baseId: string]: string[] } = {};
    
    layoutSectionIds.forEach(sectionId => {
      const match = sectionId.match(/^(.+)_split_\d+$/);
      if (match) {
        const baseId = match[1];
        if (!splitGroups[baseId]) {
          splitGroups[baseId] = [];
        }
        splitGroups[baseId].push(sectionId);
      }
    });
    
    // Only return groups with multiple sections
    return Object.entries(splitGroups).filter(([_, sections]) => sections.length > 1);
  };

  // Helper function to detect combinable section groups
  const getCombinableSectionGroups = (sections: string[], rowIndex: number, columnIndex?: number) => {
    const groups: { sectionIds: string[], startIndex: number, endIndex: number, baseType: string }[] = [];
    
    let currentGroup: string[] = [];
    let currentBaseType: string | null = null;
    let groupStartIndex = -1;
    
    sections.forEach((sectionId, index) => {
      // Extract base type (remove _split_X suffix)
      const baseId = sectionId.replace(/_split_\d+$/, '');
      const isSplitSection = sectionId.includes('_split_');
      
      if (isSplitSection && baseId === currentBaseType) {
        // Continue current group
        currentGroup.push(sectionId);
      } else if (isSplitSection) {
        // Finish previous group if it has multiple sections
        if (currentGroup.length > 1) {
          groups.push({
            sectionIds: [...currentGroup],
            startIndex: groupStartIndex,
            endIndex: groupStartIndex + currentGroup.length - 1,
            baseType: currentBaseType!
          });
        }
        
        // Start new group
        currentGroup = [sectionId];
        currentBaseType = baseId;
        groupStartIndex = index;
      } else {
        // Finish previous group if it has multiple sections
        if (currentGroup.length > 1) {
          groups.push({
            sectionIds: [...currentGroup],
            startIndex: groupStartIndex,
            endIndex: groupStartIndex + currentGroup.length - 1,
            baseType: currentBaseType!
          });
        }
        
        // Reset for non-split section
        currentGroup = [];
        currentBaseType = null;
        groupStartIndex = -1;
      }
    });
    
    // Don't forget the last group
    if (currentGroup.length > 1) {
      groups.push({
        sectionIds: [...currentGroup],
        startIndex: groupStartIndex,
        endIndex: groupStartIndex + currentGroup.length - 1,
        baseType: currentBaseType!
      });
    }
    
    return groups;
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
    const newSectionTemplates = {
      ...sectionTemplates,
      [sectionId]: templateId
    };
    
    setSectionTemplates(newSectionTemplates);
    
    // Update the resume data with the new section templates
    if (onResumeDataChange) {
      onResumeDataChange({
        ...resumeData,
        sectionTemplates: newSectionTemplates
      });
    }
  };

  const handleCloseTemplateSelector = () => {
    setTemplateSelector(null);
  };

  return (
    <div className={`layout-builder ${(draggedSectionInRow || draggedSection) ? 'has-dragging-section' : ''}`}>
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
        {/* Global Styles Panel */}
        {onResumeDataChange && (
          <GlobalStylesPanel 
            resumeData={resumeData}
            onResumeDataChange={onResumeDataChange}
          />
        )}

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
                  <span
                    className="remove-page"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePage(index);
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
            <button onClick={addNewPage} className="add-page-button">
              + Add Page
            </button>
          </div>

          {/* Footer Controls */}
          <div className="footer-controls">
            <label className="footer-label">Page Footer:</label>
            <select
              value={pages[currentPageIndex]?.footer?.type || 'none'}
              onChange={(e) => updatePageFooter(e.target.value as any)}
              className="footer-select"
            >
              <option value="none">No Footer</option>
              <option value="default">Default Design</option>
              <option value="minimal">Minimal Line</option>
              <option value="modern">Modern Accent</option>
              <option value="mountains">Mountains</option>
              <option value="fish">Fish Design</option>
            </select>
          </div>
        </div>

        {/* Layout Content */}
        <div className="layout-content-wrapper">
          {/* Available sections */}
          <div className="available-sections">
            <h4>Available Sections</h4>
            <div className="sections-list">
              {availableSections.map((section) => {
                const resumeSection = resumeData.sections?.find(s => s.id === section.id);
                // Check if section can be split (has splittable type AND more than 1 item)
                const canSplit = resumeSection && (
                  resumeSection.type === 'experience' || 
                  resumeSection.type === 'education' || 
                  resumeSection.type === 'projects' ||
                  resumeSection.type === 'skills' ||
                  resumeSection.type === 'certifications' ||
                  resumeSection.type === 'list'
                ) && (() => {
                  // Check item count based on section type
                  if (resumeSection.type === 'skills') {
                    return (resumeSection as any).categories?.length > 1;
                  } else {
                    return (resumeSection as any).items?.length > 1;
                  }
                })();

                return (
                  <div key={section.id} className="section-item-wrapper">
                    <div className="section-item-with-controls">
                      <div
                        className="section-item draggable"
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                      >
                        {section.title || section.id}
                      </div>
                      {canSplit && (
                        <button
                          className="sidebar-split-button inline"
                          onClick={() => setSplittingSection(section.id)}
                          title="Split section into parts"
                        >
                          ⚡
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Combinable split sections */}
            {getSplitSectionsInLayout().length > 0 && (
              <>
                <h4 style={{ marginTop: '1.5rem', color: '#8b5cf6' }}>Split Sections</h4>
                <div className="split-sections-list">
                  {getSplitSectionsInLayout().map(([baseId, splitSectionIds]) => {
                    const baseSectionTitle = resumeData.sections?.find(s => s.id === splitSectionIds[0])?.title?.replace(/ \((Part \d+|cont)\)$/, '') || baseId;
                    return (
                      <div key={baseId} className="split-section-group">
                        <div className="split-section-info">
                          <span className="split-section-title">{baseSectionTitle}</span>
                          <span className="split-section-count">({splitSectionIds.length} parts)</span>
                        </div>
                        <button
                          className="sidebar-combine-button"
                          onClick={() => handleCombineFromSidebar(baseId, splitSectionIds)}
                          title={`Combine ${splitSectionIds.length} parts back into one section`}
                        >
                          🔗 Combine
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Padding Section Creator */}
            <div className="padding-section-creator">
              <h4 style={{ marginTop: '1.5rem', color: '#34d399' }}>Vertical Spacing</h4>
              <div className="padding-templates">
                {[
                  { height: '0.25cm', label: 'Extra Small (0.25cm)' },
                  { height: '0.5cm', label: 'Small (0.5cm)' },
                  { height: '1cm', label: 'Medium (1cm)' },
                  { height: '1.5cm', label: 'Large (1.5cm)' },
                  { height: '2cm', label: 'Extra Large (2cm)' },
                  { height: '3cm', label: 'XXL (3cm)' }
                ].map((template) => (
                  <div
                    key={template.height}
                    className="padding-template draggable"
                    draggable
                    onDragStart={(e) => {
                      createPaddingSection(template.height);
                      // Wait for state update, then find the new section and drag it
                      setTimeout(() => {
                        const newSection = availableSections.find(s => s.title.includes(`Spacing (${template.height})`));
                        if (newSection) {
                          handleDragStart(e, newSection.id);
                        }
                      }, 100);
                    }}
                  >
                    📏 {template.label}
                  </div>
                ))}
              </div>
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
                  {/* Single slider to control column split */}
                  <div 
                    className="column-split-control"
                    onDragOver={(e) => e.stopPropagation()}
                    onDrop={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseMove={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <div className="split-header-inline">
                      <span className="split-label">{row.columns[0].width} | {row.columns[1].width}</span>
                      
                      <div className="split-controls-inline">
                        <button
                          className="split-btn-compact"
                          onClick={() => {
                            if (row.columns && row.columns[0]) {
                              const current = parsePercentage(row.columns[0].width);
                              const newValue = Math.max(10, current - 5);
                              updateColumnWidthSlider(rowIndex, 0, newValue);
                            }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title="Decrease by 5%"
                        >
                          −
                        </button>
                        
                        <div className="percentage-input-group">
                          <input
                            type="number"
                            min="10"
                            max="90"
                            value={parsePercentage(row.columns[0].width)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);
                              if (!isNaN(value) && value >= 10 && value <= 90) {
                                updateColumnWidthSlider(rowIndex, 0, value);
                              }
                            }}
                            className="percentage-input"
                            onMouseDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.preventDefault()}
                          />
                          <span className="percentage-symbol">%</span>
                        </div>
                        
                        <button
                          className="split-btn-compact"
                          onClick={() => {
                            if (row.columns && row.columns[0]) {
                              const current = parsePercentage(row.columns[0].width);
                              const newValue = Math.min(90, current + 5);
                              updateColumnWidthSlider(rowIndex, 0, newValue);
                            }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          title="Increase by 5%"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="split-progress-bar">
                      <div 
                        className="split-progress-fill"
                        style={{ width: `${parsePercentage(row.columns[0].width)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="columns-container">
                    {row.columns.map((column: LayoutColumn, columnIndex: number) => (
                    <div
                      key={columnIndex}
                      className="column-builder"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, rowIndex, columnIndex)}
                    >
                      {/* Column Header with Background Toggle */}
                      <div className="column-header">
                        <span className="column-title">Column {columnIndex + 1}</span>
                        <div className="column-controls">
                          <button
                            className={`bg-toggle-btn ${column.backgroundColor !== '#ffffff' ? 'active' : ''}`}
                            onClick={() => toggleColumnBackground(rowIndex, columnIndex)}
                            title="Cycle background: White → Secondary → Primary"
                          >
                            🎨
                          </button>
                          <input
                            type="color"
                            value={column.textColor || resumeData.layout?.globalStyles?.colorScheme?.text || '#333333'}
                            onChange={(e) => setColumnTextColor(rowIndex, columnIndex, e.target.value)}
                            className="text-color-picker"
                            title="Set text color"
                          />
                        </div>
                      </div>
                      <div className="column-sections">
                        {column.sections.map((sectionId: string, sectionIndex: number) => {
                          const section = availableSections.find(s => s.id === sectionId);

                          
                          return (
                            <React.Fragment key={`${rowIndex}-${columnIndex}-${sectionIndex}-${sectionId}`}>
                              {/* Drop zone above each section */}
                              {sectionIndex === 0 && !shouldHideDropZone(rowIndex, columnIndex, sectionIndex, true) && (
                                <div
                                  className="section-drop-zone"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onDrop={(e) => {
                                    e.stopPropagation();
                                    handleSectionDrop(e, rowIndex, columnIndex, 0);
                                  }}
                                />
                              )}
                              <div 
                                className={`section-item placed ${
                                  draggedSectionInRow?.sectionId === sectionId ? 'dragging' : ''
                                }`}
                                draggable
                                onDragStart={(e) => handleSectionDragStart(e, sectionId, rowIndex, columnIndex)}
                                onDragEnd={() => {
                                  setDraggedSectionInRow(null);
                                  setDragOverTarget(null);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverTarget({ rowIndex, columnIndex });
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  setDragOverTarget(null);
                                }}
                                onDrop={(e) => handleSectionDrop(e, rowIndex, columnIndex, sectionIndex, true)}
                                onContextMenu={(e) => handleSectionRightClick(e, sectionId)}
                              >
                              <span className="section-title">
                                {section?.title || sectionId}
                              </span>
                              <div className="section-actions">
                                {/* Special controls for padding sections */}
                                {resumeData.sections?.find(s => s.id === sectionId)?.type === 'padding' && (
                                  <select
                                    className="padding-height-selector"
                                    value={resumeData.sections?.find(s => s.id === sectionId)?.customFields?.height || '1cm'}
                                    onChange={(e) => updatePaddingSectionHeight(sectionId, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    title="Change padding height"
                                  >
                                    <option value="0.25cm">0.25cm</option>
                                    <option value="0.5cm">0.5cm</option>
                                    <option value="1cm">1cm</option>
                                    <option value="1.5cm">1.5cm</option>
                                    <option value="2cm">2cm</option>
                                    <option value="3cm">3cm</option>
                                    <option value="4cm">4cm</option>
                                    <option value="5cm">5cm</option>
                                  </select>
                                )}
                                <button
                                  className="remove-section-button"
                                  onClick={() => removeSectionFromRow(sectionId, rowIndex, columnIndex, sectionIndex)}
                                  title="Remove section"
                                >
                                  ×
                                </button>
                                {resumeData.sections?.find(s => s.id === sectionId)?.type !== 'padding' && (
                                  <button
                                    className="template-button"
                                    onClick={(e) => handleSectionRightClick(e, sectionId)}
                                    title="Select template"
                                  >
                                    ⚙
                                  </button>
                                )}
                              </div>
                            </div>
                            {/* Drop zone below each section */}
                            {!shouldHideDropZone(rowIndex, columnIndex, sectionIndex, false) && (
                              <div
                                className="section-drop-zone"
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                  e.stopPropagation();
                                  handleSectionDrop(e, rowIndex, columnIndex, sectionIndex + 1);
                                }}
                              />
                            )}
                            </React.Fragment>
                          );
                        })}
                        {column.sections.length === 0 && (
                          <div 
                            className={`drop-zone ${
                              dragOverTarget?.rowIndex === rowIndex && dragOverTarget?.columnIndex === columnIndex ? 'drag-over' : ''
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverTarget({ rowIndex, columnIndex });
                            }}
                            onDragLeave={() => setDragOverTarget(null)}
                            onDrop={(e) => handleSectionDrop(e, rowIndex, columnIndex)}
                          >
                            Drop sections here
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <div
                  className="whole-page-builder"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex)}
                >
                  {/* Whole Page Header with Background Toggle */}
                  <div className="whole-page-header">
                    <span className="whole-page-title">Full Width Row</span>
                    <div className="whole-page-controls">
                      <button
                        className={`bg-toggle-btn ${row.backgroundColor !== '#ffffff' ? 'active' : ''}`}
                        onClick={() => toggleWholePageBackground(rowIndex)}
                        title="Cycle background: White → Secondary → Primary"
                      >
                        🎨
                      </button>
                      <input
                        type="color"
                        value={row.textColor || resumeData.layout?.globalStyles?.colorScheme?.text || '#333333'}
                        onChange={(e) => setWholePageTextColor(rowIndex, e.target.value)}
                        className="text-color-picker"
                        title="Set text color"
                      />
                    </div>
                  </div>
                  <div className="whole-page-sections">
                        {row.sections?.map((sectionId: string, sectionIndex: number) => {
                      const section = availableSections.find(s => s.id === sectionId);                      
                      return (
                        <React.Fragment key={`${rowIndex}-whole-${sectionIndex}-${sectionId}`}>
                          {/* Drop zone above each section */}
                          {sectionIndex === 0 && !shouldHideDropZone(rowIndex, undefined, sectionIndex, true) && (
                            <div
                              className="section-drop-zone"
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDrop={(e) => {
                                e.stopPropagation();
                                handleSectionDrop(e, rowIndex, undefined, 0);
                              }}
                            />
                          )}
                          <div 
                            className={`section-item placed ${
                              draggedSectionInRow?.sectionId === sectionId ? 'dragging' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleSectionDragStart(e, sectionId, rowIndex)}
                            onDragEnd={() => {
                              setDraggedSectionInRow(null);
                              setDragOverTarget(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverTarget({ rowIndex });
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setDragOverTarget(null);
                            }}
                            onDrop={(e) => handleSectionDrop(e, rowIndex, undefined, sectionIndex, true)}
                            onContextMenu={(e) => handleSectionRightClick(e, sectionId)}
                          >
                          <span className="section-title">
                            {section?.title || sectionId}
                          </span>
                          <div className="section-actions">
                            {/* Special controls for padding sections */}
                            {resumeData.sections?.find(s => s.id === sectionId)?.type === 'padding' && (
                              <select
                                className="padding-height-selector"
                                value={resumeData.sections?.find(s => s.id === sectionId)?.customFields?.height || '1cm'}
                                onChange={(e) => updatePaddingSectionHeight(sectionId, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                title="Change padding height"
                              >
                                <option value="0.25cm">0.25cm</option>
                                <option value="0.5cm">0.5cm</option>
                                <option value="1cm">1cm</option>
                                <option value="1.5cm">1.5cm</option>
                                <option value="2cm">2cm</option>
                                <option value="3cm">3cm</option>
                                <option value="4cm">4cm</option>
                                <option value="5cm">5cm</option>
                              </select>
                            )}
                            <button
                              className="remove-section-button"
                              onClick={() => removeSectionFromRow(sectionId, rowIndex, undefined, sectionIndex)}
                              title="Remove section"
                            >
                              ×
                            </button>
                            {resumeData.sections?.find(s => s.id === sectionId)?.type !== 'padding' && (
                              <button
                                className="template-button"
                                onClick={(e) => handleSectionRightClick(e, sectionId)}
                                title="Select template"
                              >
                                ⚙
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Drop zone below each section */}
                        {!shouldHideDropZone(rowIndex, undefined, sectionIndex, false) && (
                          <div
                            className="section-drop-zone"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.stopPropagation();
                              handleSectionDrop(e, rowIndex, undefined, sectionIndex + 1);
                            }}
                          />
                        )}
                        </React.Fragment>
                      );
                    })}
                    {(!row.sections || row.sections.length === 0) && (
                      <div 
                        className={`drop-zone ${
                          dragOverTarget?.rowIndex === rowIndex && dragOverTarget?.columnIndex === undefined ? 'drag-over' : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTarget({ rowIndex });
                        }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={(e) => handleSectionDrop(e, rowIndex)}
                      >
                        Drop sections here
                      </div>
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
          onSplit={(splitData) => handleSplitSection(splittingSection, splitData)}
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
