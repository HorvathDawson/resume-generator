import React, { useState, useEffect } from 'react';
import type { ResumeData } from '../types';
import type { SectionType } from '../types/resume';
import { TEMPLATE_REGISTRY } from './templates/TemplateRegistry';

import { SectionSplittingManager } from './SectionSplittingManager';
import { SectionTemplateSelector } from './SectionTemplateSelector';
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
  sectionItemOrders?: { [sectionId: string]: number[] }; // Store item order for each section
}

interface LayoutColumn {
  width: string;
  sections: string[];
  backgroundColor?: string;
  textColor?: string;
  sectionItemOrders?: { [sectionId: string]: number[] }; // Store item order for each section
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
            textColor: col.textColor,
            sectionItemOrders: col.sectionItemOrders || {}
          })) || []
        } : {
          sections: row.sections || [],
          backgroundColor: row.backgroundColor,
          textColor: row.textColor,
          sectionItemOrders: row.sectionItemOrders || {}
        })
      })) || []
    }));
  });

  // Keep track of whether we're updating from internal changes
  const [isUpdatingFromInternal, setIsUpdatingFromInternal] = useState(false);

  // Update pages when resumeData.layout changes (e.g., after import)
  useEffect(() => {
    // Skip if we're updating from an internal change to avoid conflicts
    if (isUpdatingFromInternal) {
      setIsUpdatingFromInternal(false);
      return;
    }
    
    const layoutPages = resumeData.layout?.pages || [];
    if (layoutPages.length > 0) {
      console.log('=== LAYOUT BUILDER: Updating pages from resumeData.layout ===');
      console.log('New layout pages:', layoutPages);
      
      const newPages = layoutPages.map((page: any, index: number) => ({
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
              textColor: col.textColor,
              sectionItemOrders: col.sectionItemOrders || {}
            })) || []
          } : {
            sections: row.sections || [],
            backgroundColor: row.backgroundColor,
            textColor: row.textColor,
            sectionItemOrders: row.sectionItemOrders || {}
          })
        })) || []
      }));
      
      console.log('=== LAYOUT BUILDER: Setting new pages ===');
      console.log('New processed pages:', newPages);
      setPages(newPages);
    }
  }, [resumeData.layout, isUpdatingFromInternal]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  // Ensure currentPageIndex is within bounds
  const safePageIndex = Math.min(currentPageIndex, pages.length - 1);
  const currentPage = pages[safePageIndex] || pages[0];

  
  // Get all possible section types from template registry
  const allSectionTypes = Object.keys(TEMPLATE_REGISTRY) as SectionType[];
  
  // Get all used section IDs for styling purposes
  const usedSectionIds = new Set<string>();
  pages.forEach(page => {
    page.rows.forEach(row => {
      if (row.columns) {
        row.columns.forEach(col => {
          col.sections.forEach((sectionRef: any) => {
            const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
            usedSectionIds.add(sectionId);
          });
        });
      }
      if (row.sections) {
        row.sections.forEach((sectionRef: any) => {
          const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
          usedSectionIds.add(sectionId);
        });
      }
    });
  });
  
  // Show ALL sections from resume data, marking used ones
  const availableResumeSection = resumeData.sections?.map(s => ({ 
    id: s.id, 
    title: s.title, 
    type: s.type,
    isAvailable: true,
    isUsed: usedSectionIds.has(s.id)
  })) || [];
  
  // Create comprehensive list showing all possible section types
  const availableSections = [
    // First show actual sections from resume data
    ...availableResumeSection,
    
    // Then show all possible section types that don't exist in resume data
    ...allSectionTypes
      .filter(sectionType => 
        // Don't show types that already exist in resume data
        !resumeData.sections?.some(section => section.type === sectionType)
      )
      .map(sectionType => ({
        id: `placeholder-${sectionType}-${Date.now()}`,
        title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1).replace('_', ' '),
        type: sectionType,
        isAvailable: false // Mark as placeholder/unavailable
      })),
    
    // Always add padding option if not already available
    ...(!availableResumeSection.some(s => s.type === 'padding') ? [{
      id: 'create-padding',
      title: 'Add Spacing',
      type: 'padding' as const,
      isAvailable: true
    }] : [])
  ];

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

  // Item reordering state
  const [reorderingSection, setReorderingSection] = useState<string | null>(null);

  // Get item order for a section from layout
  const getSectionItemOrder = (sectionId: string, rowIndex: number, columnIndex?: number): number[] => {
    const row = pages[currentPageIndex]?.rows[rowIndex];
    if (!row) return [];
    
    const orders = columnIndex !== undefined 
      ? row.columns?.[columnIndex]?.sectionItemOrders?.[sectionId]
      : row.sectionItemOrders?.[sectionId];
    
    const section = resumeData.sections?.find(s => s.id === sectionId);
    const reorderableItems = getReorderableItems(section);
    const itemCount = reorderableItems?.length || 0;
    
    if (!orders || orders.length !== itemCount) {
      // Return default order [0, 1, 2, ...]
      return Array.from({ length: itemCount }, (_, i) => i);
    }
    
    return orders;
  };

  // Update item order for a section in layout
  const updateSectionItemOrder = (sectionId: string, newOrder: number[], rowIndex: number, columnIndex?: number) => {
    const updatedPages = [...pages];
    const row = updatedPages[currentPageIndex].rows[rowIndex];
    
    if (columnIndex !== undefined && row.columns) {
      if (!row.columns[columnIndex].sectionItemOrders) {
        row.columns[columnIndex].sectionItemOrders = {};
      }
      row.columns[columnIndex].sectionItemOrders![sectionId] = newOrder;
    } else {
      if (!row.sectionItemOrders) {
        row.sectionItemOrders = {};
      }
      row.sectionItemOrders[sectionId] = newOrder;
    }
    
    // Mark that we're updating from an internal change
    setIsUpdatingFromInternal(true);
    
    // Update local state first
    setPages(updatedPages);
    
    // Notify parent of the change
    onLayoutChange({ pages: updatedPages.map(p => ({ ...p, rows: p.rows })) });
  };

  // Toggle item reordering mode for a section
  const toggleSectionReorder = (sectionId: string) => {
    setReorderingSection(reorderingSection === sectionId ? null : sectionId);
  };

  // Get reorderable items from any section type
  const getReorderableItems = (section: any) => {
    if (!section) return [];
    
    // Skills sections use categories
    if (section.type === 'skills') {
      // Try different possible locations for categories
      if (section.categories) return section.categories;
      if (section.customFields?.categories) return section.customFields.categories;
      if (section.items?.[0]?.categories) return section.items[0].categories;
      return [];
    }
    
    // Other sections use items
    return section.items || [];
  };

  // Move an item up in the order
  const moveItemUp = (sectionId: string, originalIndex: number, rowIndex: number, columnIndex?: number) => {
    const currentOrder = getSectionItemOrder(sectionId, rowIndex, columnIndex);
    const currentPosition = currentOrder.indexOf(originalIndex);
    
    if (currentPosition > 0) {
      const newOrder = [...currentOrder];
      // Swap with the item above
      [newOrder[currentPosition], newOrder[currentPosition - 1]] = [newOrder[currentPosition - 1], newOrder[currentPosition]];
      updateSectionItemOrder(sectionId, newOrder, rowIndex, columnIndex);
    }
  };

  // Move an item down in the order
  const moveItemDown = (sectionId: string, originalIndex: number, rowIndex: number, columnIndex?: number) => {
    const currentOrder = getSectionItemOrder(sectionId, rowIndex, columnIndex);
    const currentPosition = currentOrder.indexOf(originalIndex);
    
    if (currentPosition < currentOrder.length - 1) {
      const newOrder = [...currentOrder];
      // Swap with the item below
      [newOrder[currentPosition], newOrder[currentPosition + 1]] = [newOrder[currentPosition + 1], newOrder[currentPosition]];
      updateSectionItemOrder(sectionId, newOrder, rowIndex, columnIndex);
    }
  };

  // Template selector state
  const [templateSelector, setTemplateSelector] = useState<{
    sectionId: string;
    sectionType: string;
    position: { x: number; y: number };
  } | null>(null);
  const [sectionTemplates, setSectionTemplates] = useState<Record<string, string>>(
    resumeData.sectionTemplates || {}
  );
  const [draggedLayoutButton, setDraggedLayoutButton] = useState<'columns' | 'wholePage' | null>(null);

  // Handle layout button drag start
  const handleLayoutButtonDragStart = (e: React.DragEvent, layoutType: 'columns' | 'wholePage') => {
    setDraggedLayoutButton(layoutType);
    e.dataTransfer.setData('text/plain', `layout-${layoutType}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle layout button drop
  const handleLayoutDrop = (e: React.DragEvent, insertIndex: number) => {
    e.preventDefault();
    if (draggedLayoutButton) {
      addNewRow(draggedLayoutButton, insertIndex);
      setDraggedLayoutButton(null);
    }
  };

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
      
      let actualSectionId = draggedSection;
      
      // Handle special case for creating padding sections
      if (draggedSection === 'create-padding') {
        actualSectionId = createPaddingSection();
      }
      
      if (targetColumnIndex !== undefined) {
        // Add to column
        const targetCol = updatedRows[targetRowIndex].columns![targetColumnIndex];
        if (insertIndex !== undefined && insertIndex >= 0) {
          targetCol.sections.splice(insertIndex, 0, actualSectionId);
        } else {
          targetCol.sections.push(actualSectionId);
        }
      } else {
        // Add to whole page row
        const targetSections = updatedRows[targetRowIndex].sections!;
        if (insertIndex !== undefined && insertIndex >= 0) {
          targetSections.splice(insertIndex, 0, actualSectionId);
        } else {
          targetSections.push(actualSectionId);
        }
      }
      
      // Update state
      const newPages = [...pages];
      newPages[safePageIndex] = { ...currentPage, rows: updatedRows };
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
        const index = column.sections.findIndex((sectionRef: any) => {
          const refSectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
          return refSectionId === sectionId;
        });
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
        const index = sections.findIndex((sectionRef: any) => {
          const refSectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
          return refSectionId === sectionId;
        });
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

  const addNewRow = (type: 'columns' | 'wholePage', insertIndex?: number) => {
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

    const newRows = [...currentPage.rows];
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= newRows.length) {
      newRows.splice(insertIndex, 0, newRow);
    } else {
      newRows.push(newRow);
    }
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

  // Store newly created sections temporarily until they're reflected in resumeData
  const [tempSections, setTempSections] = useState<{[id: string]: any}>({});

  // Helper function to find section from either resumeData or tempSections
  const findSection = (sectionId: string) => {
    const resumeSection = resumeData.sections?.find(s => s.id === sectionId);
    if (resumeSection) {
      // If found in resumeData, clean up temp version
      if (tempSections[sectionId]) {
        setTempSections(prev => {
          const newTemp = { ...prev };
          delete newTemp[sectionId];
          return newTemp;
        });
      }
      return resumeSection;
    }
    return tempSections[sectionId] || null;
  };

  // Update temp section when template changes
  const updateTempSection = (sectionId: string, updates: any) => {
    if (tempSections[sectionId]) {
      setTempSections(prev => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          ...updates
        }
      }));
    }
  };

  // Create a new padding section
  const createPaddingSection = (): string => {
    if (!onResumeDataChange) return '';

    // Generate unique ID for the padding section
    const paddingId = `padding-${Date.now()}`;
    
    // Create the padding section
    const paddingSection = {
      id: paddingId,
      title: 'Spacing (1cm)',
      type: 'padding' as const,
      templateId: 'padding-medium',
      isVisible: true,
      items: [],
      customFields: {
        height: '1cm'
      }
    };

    console.log('🟢 Creating padding section:', paddingSection);

    // Store temporarily for immediate access
    setTempSections(prev => ({
      ...prev,
      [paddingId]: paddingSection
    }));

    // Add to resume data SYNCHRONOUSLY and trigger re-render
    const newSections = [...(resumeData.sections || []), paddingSection];
    const updatedResumeData = {
      ...resumeData,
      sections: newSections
    };

    console.log('🟢 Updated resume data sections:', updatedResumeData.sections);
    onResumeDataChange(updatedResumeData);
    return paddingId;
  };

  // Create a personalInfo section from personalInfo data
  const createPersonalInfoSection = (): string => {
    if (!onResumeDataChange) return '';

    // Generate unique ID for the personalInfo section
    const personalInfoId = `personalInfo-${Date.now()}`;

    const personalInfoSection = {
      id: personalInfoId,
      title: 'Contact Information',
      type: 'personal_info' as const,
      templateId: 'personal-info-standard',
      isVisible: true,
      items: [],
      personalInfo: resumeData.personalInfo || {}
    };

    console.log('🟢 Creating personalInfo section:', personalInfoSection);

    // Store temporarily for immediate access
    setTempSections(prev => ({
      ...prev,
      [personalInfoId]: personalInfoSection
    }));

    // Add to resume data SYNCHRONOUSLY and trigger re-render
    const newSections = [...(resumeData.sections || []), personalInfoSection];
    const updatedResumeData = {
      ...resumeData,
      sections: newSections
    };

    console.log('🟢 Updated resume data sections:', updatedResumeData.sections);
    onResumeDataChange(updatedResumeData);
    return personalInfoId;
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
  const updatePageFooter = (footerType: 'none' | 'default' | 'mountains' | 'fish' | 'salmon' | 'minimal' | 'modern') => {
    console.log('=== updatePageFooter called ===');
    console.log('Footer type:', footerType);
    console.log('Current page index:', currentPageIndex);
    console.log('Pages before update:', pages);
    
    const updatedPages = [...pages];
    
    // Set correct heights based on old implementation
    const getFooterHeight = (type: string) => {
      switch (type) {
        case 'default': return '4.25cm';
        case 'fish': return '4.25cm';
        case 'salmon': return '4.25cm';
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
    
    console.log('Pages after update:', updatedPages);
    console.log('Updated current page footer:', updatedPages[currentPageIndex]?.footer);
    
    setPages(updatedPages);
    
    // Update the layout
    onLayoutChange({
      pages: updatedPages
    });
    
    console.log('Footer update completed');
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
        if (row.type === 'columns' && row.columns) {
          // Columns layout
          row.columns.forEach(column => {
            if (column.sections) {
              allSectionIds.push(...column.sections.map((ref: any) => typeof ref === 'string' ? ref : ref.sectionId));
            }
          });
        } else if (row.type === 'wholePage' && row.sections) {
          // Whole page layout
          allSectionIds.push(...row.sections.map((ref: any) => typeof ref === 'string' ? ref : ref.sectionId));
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
    
    const section = findSection(sectionId);
    if (!section) {
      console.log('❌ Section not found for template selector:', sectionId);
      return;
    }

    console.log('🔧 Opening template selector for section:', section);
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
    
    // For padding sections, update the height in customFields
    const section = findSection(sectionId);
    if (section?.type === 'padding') {
      const heightMap: { [key: string]: string } = {
        'padding-extra-small': '0.25cm',
        'padding-small': '0.5cm',
        'padding-medium': '1cm',
        'padding-large': '1.5cm',
        'padding-extra-large': '2cm',
        'padding-xxl': '3cm'
      };
      
      const newHeight = heightMap[templateId] || '1cm';
      const templateDisplayNames: { [key: string]: string } = {
        'padding-extra-small': 'Spacing (0.25cm)',
        'padding-small': 'Spacing (0.5cm)',
        'padding-medium': 'Spacing (1cm)',
        'padding-large': 'Spacing (1.5cm)',
        'padding-extra-large': 'Spacing (2cm)',
        'padding-xxl': 'Spacing (3cm)'
      };
      
      // Update the section data
      const updatedSections = (resumeData.sections || []).map(s => 
        s.id === sectionId 
          ? {
              ...s,
              title: templateDisplayNames[templateId] || s.title,
              templateId,
              customFields: {
                ...s.customFields,
                height: newHeight
              }
            }
          : s
      );
      
      console.log('🔧 Updated padding section:', sectionId, 'to height:', newHeight);
      
      // Also update temp section if it exists
      updateTempSection(sectionId, {
        title: templateDisplayNames[templateId] || section.title,
        templateId,
        customFields: {
          ...section.customFields,
          height: newHeight
        }
      });
      
      // Update resume data with both template change and section update
      if (onResumeDataChange) {
        onResumeDataChange({
          ...resumeData,
          sections: updatedSections,
          sectionTemplates: newSectionTemplates
        });
      }
    } else {
      // For non-padding sections, just update template mapping
      if (onResumeDataChange) {
        onResumeDataChange({
          ...resumeData,
          sectionTemplates: newSectionTemplates
        });
      }
    }
  };

  const handleCloseTemplateSelector = () => {
    setTemplateSelector(null);
  };

  return (
    <div className={`layout-builder-viewport ${(draggedSectionInRow || draggedSection) ? 'has-dragging-section' : ''}`}>


      {/* Main Layout Area */}
      <div className="layout-main-area">
        {/* Sticky Left Sidebar */}
        <div className="layout-sidebar">
          {/* Available sections */}
          <div className="available-sections">
            <div className="sections-header">
              <h4>Available Sections</h4>
              <p className="section-tip">Drag items into the layout to use them</p>
            </div>
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
                        className={`section-item draggable ${
                          (section as any).isAvailable === false ? 'unavailable' : ''
                        } ${
                          (section as any).isUsed ? 'used' : ''
                        }`}
                        draggable={(section as any).isAvailable !== false}
                        onDragStart={(section as any).isAvailable !== false ? (e) => handleDragStart(e, section.id) : undefined}
                        title={
                          (section as any).isAvailable === false ? 
                            `${section.title} section not available in current resume data` :
                          (section as any).isUsed ?
                            `${section.title} is already used in layout (drag to add another instance)` :
                            undefined
                        }
                      >
                        {section.title || section.id}
                        {(section as any).isAvailable === false && (
                          <span className="section-status"> (not available)</span>
                        )}
                        {(section as any).isUsed && (section as any).isAvailable !== false && (
                          <span className="section-status"> (in use)</span>
                        )}
                      </div>
                      {canSplit && (section as any).isAvailable !== false && (
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
                <h4 className="split-sections-header">Split Sections</h4>
                <p className="section-tip">Click combine to merge split sections back together</p>
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
          </div>
        </div>

        {/* Main Viewport */}
        <div className="layout-viewport">
          {/* Fixed Top Controls - Always Visible */}
          <div className="layout-top-fixed-controls">
            {/* Layout Buttons */}
            <div className="layout-buttons-panel">
              <div className="layout-button-header">
                <div className="draggable-layout-buttons">
                  <div
                    className="layout-button-item"
                    draggable={true}
                    onDragStart={(e) => handleLayoutButtonDragStart(e, 'columns')}
                  >
                    <div className="layout-button-preview">
                      <div className="layout-preview-columns">
                        <div className="preview-column"></div>
                        <div className="preview-column"></div>
                      </div>
                    </div>
                    <span className="layout-button-label">Column Row</span>
                  </div>
                  
                  <div
                    className="layout-button-item"
                    draggable={true}
                    onDragStart={(e) => handleLayoutButtonDragStart(e, 'wholePage')}
                  >
                    <div className="layout-button-preview">
                      <div className="layout-preview-whole">
                        <div className="preview-whole-page"></div>
                      </div>
                    </div>
                    <span className="layout-button-label">Full Width Row</span>
                  </div>
                </div>
                <div className="layout-button-info">
                  <p>← Drag layout elements into your resume</p>
                </div>
              </div>
            </div>

            {/* Page Tabs */}
            <div className="page-tabs-viewport">
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
            </div>

            {/* Footer Controls */}
            <div className="footer-controls">
              <label className="footer-label">Page Footer:</label>
              <select
                value={pages[currentPageIndex]?.footer?.type || 'none'}
                onChange={(e) => {
                  console.log('Footer selector onChange:', e.target.value);
                  console.log('Current page footer before:', pages[currentPageIndex]?.footer);
                  updatePageFooter(e.target.value as any);
                }}
                className="footer-select"
              >
                  <option value="none">No Footer</option>
                  <option value="default">Default Design</option>
                  <option value="minimal">Minimal Line</option>
                  <option value="modern">Modern Accent</option>
                  <option value="mountains">Mountains</option>
                  <option value="fish">Fish Design</option>
                  <option value="salmon">Salmon Design</option>
                </select>
              </div>
          </div>
          
          {/* Scrollable Layout Content */}
          <div className="layout-content-scrollable">
            <div className="layout-rows">
            <h4>Page {currentPage.pageNumber} Layout</h4>
            <p className="layout-tip">Drop layout elements and sections here to build your resume</p>
            
            {/* Drop zone at the top */}
            <div
              className="layout-drop-zone"
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedLayoutButton) {
                  e.dataTransfer.dropEffect = 'copy';
                }
              }}
              onDrop={(e) => handleLayoutDrop(e, 0)}
            >
              Drop layout here
            </div>
            
            {currentPage.rows.map((row: LayoutRow, rowIndex: number) => (
              <React.Fragment key={row.id}>
                <div
                  className="layout-row-builder"
                  draggable
                  onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex)}
                >
                  {/* Row content will continue here */}
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
                        {column.sections.map((sectionRef: any, sectionIndex: number) => {
                          const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
                          const section = findSection(sectionId);
                          
                          if (sectionId.startsWith('padding-')) {
                            console.log('🔍 Rendering padding section:', sectionId, 'section found:', section);
                          }
                          
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
                                {(() => {
                                  const debugSection = findSection(sectionId);
                                  if (sectionId.startsWith('padding-')) {
                                    console.log('📝 Rendering section title for:', sectionId);
                                    console.log('📝 Found section:', debugSection);
                                    console.log('📝 Section title:', debugSection?.title);
                                  }
                                  return debugSection?.title || sectionId;
                                })()}
                              </span>
                              
                              <div className="section-actions">
                                <button
                                  className="remove-section-button"
                                  onClick={() => removeSectionFromRow(sectionId, rowIndex, columnIndex, sectionIndex)}
                                  title="Remove section"
                                >
                                  ×
                                </button>
                                <button
                                  className="template-button"
                                  onClick={(e) => handleSectionRightClick(e, sectionId)}
                                  title="Select template"
                                >
                                  ⚙
                                </button>
                                <button
                                  className={`reorder-button ${reorderingSection === sectionId ? 'active' : ''}`}
                                  onClick={() => toggleSectionReorder(sectionId)}
                                  title="Reorder items in section"
                                >
                                  📋
                                </button>
                              </div>
                            </div>
                            {/* Item Reordering Interface - positioned below section */}
                            {reorderingSection === sectionId && (() => {
                              const section = findSection(sectionId);
                              const reorderableItems = getReorderableItems(section);
                              const currentOrder = getSectionItemOrder(sectionId, rowIndex, columnIndex);
                              
                              if (!reorderableItems || reorderableItems.length <= 1) {
                                return (
                                  <div className="reorder-interface">
                                    <p className="reorder-message">This section has {reorderableItems?.length || 0} items. Need at least 2 items to reorder.</p>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="reorder-interface">
                                  <h4>Reorder Items</h4>
                                  {currentOrder.map((originalIndex: number, displayPosition: number) => {
                                    const item = reorderableItems[originalIndex];
                                    const isFirst = displayPosition === 0;
                                    const isLast = displayPosition === currentOrder.length - 1;
                                    
                                    // Get appropriate title based on item type
                                    const itemTitle = item.title || item.name || item.organization || 'Untitled';
                                    
                                    return (
                                      <div key={`reorder-${originalIndex}`} className="reorder-item">
                                        <span className="item-title">
                                          Item {displayPosition + 1}: {itemTitle}
                                        </span>
                                        <div className="reorder-controls">
                                          <button
                                            className="reorder-move-btn"
                                            onClick={() => moveItemUp(sectionId, originalIndex, rowIndex, columnIndex)}
                                            disabled={isFirst}
                                            title="Move up"
                                          >
                                            ↑
                                          </button>
                                          <span className="reorder-position">{displayPosition + 1}</span>
                                          <button
                                            className="reorder-move-btn"
                                            onClick={() => moveItemDown(sectionId, originalIndex, rowIndex, columnIndex)}
                                            disabled={isLast}
                                            title="Move down"
                                          >
                                            ↓
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <button
                                    className="reorder-done-button"
                                    onClick={() => setReorderingSection(null)}
                                  >
                                    Done
                                  </button>
                                </div>
                              );
                            })()}
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
                        {row.sections?.map((sectionRef: any, sectionIndex: number) => {
                          const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
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
                            {(() => {
                              const debugSection = findSection(sectionId);
                              if (sectionId.startsWith('padding-')) {
                                console.log('📝 Whole page rendering section title for:', sectionId);
                                console.log('📝 Found section:', debugSection);
                                console.log('📝 Section title:', debugSection?.title);
                              }
                              return debugSection?.title || sectionId;
                            })()}
                          </span>
                          
                          <div className="section-actions">
                            <button
                              className="remove-section-button"
                              onClick={() => removeSectionFromRow(sectionId, rowIndex, undefined, sectionIndex)}
                              title="Remove section"
                            >
                              ×
                            </button>
                            <button
                              className="template-button"
                              onClick={(e) => handleSectionRightClick(e, sectionId)}
                              title="Select template"
                            >
                              ⚙
                            </button>
                            <button
                              className={`reorder-button ${reorderingSection === sectionId ? 'active' : ''}`}
                              onClick={() => toggleSectionReorder(sectionId)}
                              title="Reorder items in section"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                        {/* Item Reordering Interface for Whole Page - positioned below section */}
                        {reorderingSection === sectionId && (() => {
                          const section = findSection(sectionId);
                          const reorderableItems = getReorderableItems(section);
                          const currentOrder = getSectionItemOrder(sectionId, rowIndex, undefined);
                          
                          if (!reorderableItems || reorderableItems.length <= 1) {
                            return (
                              <div className="reorder-interface">
                                <p className="reorder-message">This section has {reorderableItems?.length || 0} items. Need at least 2 items to reorder.</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="reorder-interface">
                              <h4>Reorder Items</h4>
                              {currentOrder.map((originalIndex: number, displayPosition: number) => {
                                const item = reorderableItems[originalIndex];
                                const isFirst = displayPosition === 0;
                                const isLast = displayPosition === currentOrder.length - 1;
                                
                                // Get appropriate title based on item type
                                const itemTitle = item.title || item.name || item.organization || 'Untitled';
                                
                                return (
                                  <div key={`reorder-whole-${originalIndex}`} className="reorder-item">
                                    <span className="item-title">
                                      Item {displayPosition + 1}: {itemTitle}
                                    </span>
                                    <div className="reorder-controls">
                                      <button
                                        className="reorder-move-btn"
                                        onClick={() => moveItemUp(sectionId, originalIndex, rowIndex, undefined)}
                                        disabled={isFirst}
                                        title="Move up"
                                      >
                                        ↑
                                      </button>
                                      <span className="reorder-position">{displayPosition + 1}</span>
                                      <button
                                        className="reorder-move-btn"
                                        onClick={() => moveItemDown(sectionId, originalIndex, rowIndex, undefined)}
                                        disabled={isLast}
                                        title="Move down"
                                      >
                                        ↓
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              <button
                                className="reorder-done-button"
                                onClick={() => setReorderingSection(null)}
                              >
                                Done
                              </button>
                            </div>
                          );
                        })()}
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
            
            {/* Drop zone after each row */}
            <div
              className="layout-drop-zone"
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedLayoutButton) {
                  e.dataTransfer.dropEffect = 'copy';
                }
              }}
              onDrop={(e) => handleLayoutDrop(e, rowIndex + 1)}
            >
              Drop layout here
            </div>
          </React.Fragment>
          ))}
            </div>
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
