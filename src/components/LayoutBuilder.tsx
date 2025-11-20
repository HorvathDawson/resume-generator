import React, { useState, useEffect } from 'react';
import type { ResumeData } from '../types';

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
  columnMargin?: number; // Margin between columns as a percentage (e.g., 4 for 4%)
  originalSplit?: { left: number; right: number }; // Store original split ratio before margin adjustments
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
  // Helper function to preserve globalStyles when updating layout
  const updateLayout = (pages: PageLayout[]) => {
    onLayoutChange({
      pages,
      globalStyles: resumeData.layout?.globalStyles // Preserve existing globalStyles
    });
  };

  // Get pages from resume data, ensuring we always have at least one page
  const getPages = (): PageLayout[] => {
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
      footer: page.footer, // Preserve footer configuration
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
          })) || [],
          columnMargin: row.columnMargin || 0,
          originalSplit: row.originalSplit || null
        } : {
          sections: row.sections || [],
          backgroundColor: row.backgroundColor,
          textColor: row.textColor,
          sectionItemOrders: row.sectionItemOrders || {}
        })
      })) || []
    }));
  };

  const pages = getPages();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  // Ensure currentPageIndex is within bounds
  const safePageIndex = Math.min(currentPageIndex, pages.length - 1);
  const currentPage = pages[safePageIndex] || pages[0];

  
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
  
  // Show ALL sections from resume data, marking used ones (except padding sections)
  const availableResumeSection = resumeData.sections?.map(s => ({ 
    id: s.id, 
    title: s.title, 
    type: s.type,
    isAvailable: true,
    isUsed: s.type === 'padding' ? false : usedSectionIds.has(s.id)  // Padding sections never show "in use"
  })) || [];
  
  // Split sections into non-padding and padding sections, then sort appropriately
  const nonPaddingSections = availableResumeSection.filter(s => s.type !== 'padding');
  const paddingSections = availableResumeSection.filter(s => s.type === 'padding');
  
  // Add create-padding option if no padding sections exist
  const createPaddingOption = !paddingSections.length ? [{
    id: 'create-padding',
    title: 'Add Spacing',
    type: 'padding' as const,
    isAvailable: true,
    isUsed: false
  }] : [];
  
  // Only show sections that actually exist in resume data, with padding sections at the bottom
  const availableSections = [
    // Show non-padding sections first
    ...nonPaddingSections,
    // Then padding sections
    ...paddingSections,
    // Then create-padding option if needed
    ...createPaddingOption
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
  
  // Auto-scroll state
  const [autoScrollInterval, setAutoScrollInterval] = useState<number | null>(null);

  
  // Cleanup auto-scroll interval on unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollInterval]);
  
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
    
    // Notify parent of the change
    updateLayout(updatedPages);
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
    instanceId?: string;
    sectionType: string;
    position: { x: number; y: number };
  } | null>(null);
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
    setDraggedSectionInRow(null); // Clear any existing layout drag state
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragStart = (e: React.DragEvent, rowIndex: number) => {
    // Check if the drag is originating from a section element
    const target = e.target as HTMLElement;
    const row = currentPage.rows[rowIndex];
    
    console.log('🏗️ ROW DRAG START ATTEMPT:', {
      rowIndex,
      rowId: row?.id,
      rowType: row?.type,
      targetElement: target.className,
      targetTagName: target.tagName,
      closestSection: !!target.closest('.section-item'),
      targetPath: target.classList.toString()
    });
    
    if (target.closest('.section-item')) {
      // Prevent row drag when dragging a section
      console.log('❌ PREVENTING ROW DRAG - Section detected');
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Allow row drag from row headers, badges, and empty content areas
    console.log('✅ ALLOWING ROW DRAG:', {
      rowIndex,
      rowId: row?.id,
      rowType: row?.type,
      totalRows: currentPage.rows.length
    });
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `row-${rowIndex}-${row?.id}`);
    
    // Set drag state with a small delay to ensure drag operation is established
    // This prevents CSS changes from interfering with drag initiation
    requestAnimationFrame(() => {
      setDraggedRow(rowIndex);
      
      // Auto-scroll to keep rows visible after collapse
      setTimeout(() => {
        const layoutContent = document.querySelector('.layout-content-scrollable');
        const rowElements = document.querySelectorAll('.layout-row-builder');
        
        if (layoutContent && rowElements.length > 0) {
          // Calculate position to show the dragged row and some context
          const draggedRowElement = rowElements[rowIndex] as HTMLElement;
          if (draggedRowElement) {
            const containerRect = layoutContent.getBoundingClientRect();
            const rowRect = draggedRowElement.getBoundingClientRect();
            
            // If the row is not visible, scroll to show it
            if (rowRect.top < containerRect.top || rowRect.bottom > containerRect.bottom) {
              const scrollTop = layoutContent.scrollTop;
              const targetScroll = scrollTop + (rowRect.top - containerRect.top) - 100; // 100px padding from top
              
              layoutContent.scrollTo({
                top: Math.max(0, targetScroll),
                behavior: 'smooth'
              });
            }
          }
        }
      }, 150); // Slightly longer delay to ensure collapse is complete
    });
  };

  const handleDrop = (e: React.DragEvent, targetRowIndex: number, targetColumnIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    cleanupAutoScroll(); // Clean up auto-scroll on drop

    console.log('🎯 ROW DROP EVENT:', {
      draggedSection: !!draggedSection,
      draggedRow,
      draggedLayoutButton,
      targetRowIndex,
      targetColumnIndex
    });

    if (draggedSection) {
      // When dragging from sidebar, we want to ADD a new instance, not move an existing one
      // Clone the current rows without removing any existing instances
      const updatedRows = [...currentPage.rows];

      let actualSectionId = draggedSection;
      
      // Handle special case for creating padding sections
      if (draggedSection === 'create-padding') {
        actualSectionId = createPaddingSection();
      }

      // Create proper section reference object
      const sectionReference = createSectionReference(actualSectionId);
      
      // Add section to new location
      if (targetColumnIndex !== undefined) {
        // Drop in specific column
        if (updatedRows[targetRowIndex]?.columns?.[targetColumnIndex]) {
          (updatedRows[targetRowIndex].columns![targetColumnIndex].sections as any).push(sectionReference);
        }
      } else {
        // Drop in whole page row
        if (updatedRows[targetRowIndex]?.sections) {
          (updatedRows[targetRowIndex].sections! as any).push(sectionReference);
        }
      }

      // Update the current page
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
      updateLayout(newPages);
      setDraggedSection(null);
    } else if (draggedRow !== null) {
      const draggedRowData = currentPage.rows[draggedRow];
      console.log('🔄 REORDERING ROW:', { 
        draggedRow, 
        targetRowIndex,
        draggedRowId: draggedRowData?.id,
        draggedRowType: draggedRowData?.type
      });
      
      // Validate indices
      if (draggedRow < 0 || draggedRow >= currentPage.rows.length) {
        console.error('❌ Invalid draggedRow index:', draggedRow);
        setDraggedRow(null);
        return;
      }
      
      // Reorder rows within current page
      const newRows = [...currentPage.rows];
      const [movedRow] = newRows.splice(draggedRow, 1);
      
      // Adjust target index if moving a row to a position after its original position
      let adjustedTargetIndex = targetRowIndex;
      if (draggedRow < targetRowIndex) {
        adjustedTargetIndex = targetRowIndex - 1;
      }
      
      newRows.splice(adjustedTargetIndex, 0, movedRow);
      
      console.log('🔄 ROW REORDER RESULT:', { 
        originalIndex: draggedRow, 
        newIndex: adjustedTargetIndex,
        totalRows: newRows.length,
        movedRowId: movedRow.id,
        movedRowType: movedRow.type
      });
      
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: newRows };
      updateLayout(newPages);
      
      // Clear drag state immediately
      setDraggedRow(null);
      setDragOverTarget(null);
    }
  };

  // Persistent auto-scroll that checks mouse position continuously
  const startPersistentAutoScroll = () => {
    if (autoScrollInterval) return; // Already running
    
    const interval = setInterval(() => {
      // Get current mouse position from global mouse events
      const mouseEvent = (window as any).lastMouseEvent;
      if (!mouseEvent) return;
      
      // Find the scrollable container
      let scrollContainer: HTMLElement | null = null;
      const candidates = [
        '.editor-panel',
        '.layout-builder-viewport', 
        '.layout-main-area',
        document.documentElement,
        document.body
      ];
      
      for (const selector of candidates) {
        const element = typeof selector === 'string' 
          ? document.querySelector(selector) as HTMLElement
          : selector as HTMLElement;
          
        if (element && element.scrollHeight > element.clientHeight) {
          scrollContainer = element;
          break;
        }
      }
      
      if (!scrollContainer) return;
      
      const containerRect = scrollContainer.getBoundingClientRect();
      const scrollThreshold = 120;
      const mouseY = mouseEvent.clientY;
      const containerTop = containerRect.top;
      const containerBottom = containerRect.bottom;
      
      const distanceFromTop = mouseY - containerTop;
      const distanceFromBottom = containerBottom - mouseY;
      
      // Scroll up if near top
      if (distanceFromTop < scrollThreshold && distanceFromTop >= 0) {
        const scrollSpeed = Math.max(5, Math.min(30, (scrollThreshold - distanceFromTop) / 3));
        if (scrollContainer.scrollTop > 0) {
          scrollContainer.scrollTop -= scrollSpeed;
        }
      }
      // Scroll down if near bottom
      else if (distanceFromBottom < scrollThreshold && distanceFromBottom >= 0) {
        const scrollSpeed = Math.max(5, Math.min(30, (scrollThreshold - distanceFromBottom) / 3));
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        if (scrollContainer.scrollTop < maxScroll) {
          scrollContainer.scrollTop += scrollSpeed;
        }
      }
    }, 16) as unknown as number; // 60fps
    
    setAutoScrollInterval(interval);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Store mouse position globally for persistent auto-scroll
    (window as any).lastMouseEvent = e.nativeEvent;
    
    // Debug: Log what drag type is active during drag over
    if (draggedRow !== null) {
      console.log('🔄 DRAG OVER - Row dragging:', draggedRow);
    }
    
    // Start persistent auto-scroll if not already running
    if (!autoScrollInterval && (draggedSection || draggedRow !== null || draggedLayoutButton)) {
      startPersistentAutoScroll();
    }
  };

  // Cleanup auto-scroll
  const cleanupAutoScroll = () => {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
    // Clean up global mouse tracking
    (window as any).lastMouseEvent = null;
  };

  // Handlers for within-row dragging and section management
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string, rowIndex: number, columnIndex?: number) => {
    console.log('📦 SECTION DRAG START:', sectionId, 'from row:', rowIndex, 'column:', columnIndex);
    setDraggedSectionInRow({
      sectionId,
      fromRowIndex: rowIndex,
      fromColumnIndex: columnIndex
    });
    setDraggedSection(null); // Clear any existing sidebar drag state
    setDraggedRow(null); // Ensure no row drag state
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId); // Set data for better drag handling
    // Stop propagation to prevent row dragging
    e.stopPropagation();
  };

  const handleSectionDrop = (e: React.DragEvent, targetRowIndex: number, targetColumnIndex?: number, insertIndex?: number, isSwap: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    cleanupAutoScroll(); // Clean up auto-scroll on drop

    // Ensure only one drag type is active
    const isSidebarDrag = draggedSection && !draggedSectionInRow;
    const isLayoutDrag = draggedSectionInRow && !draggedSection;
    
    if (!isSidebarDrag && !isLayoutDrag) {
      // Clear any stale state and return
      setDraggedSection(null);
      setDraggedSectionInRow(null);
      return;
    }

    // Handle sidebar section drops (creating new instances)
    if (isSidebarDrag) {
      const updatedRows = [...currentPage.rows];
      
      let actualSectionId = draggedSection;
      
      // Handle special case for creating padding sections
      if (draggedSection === 'create-padding') {
        actualSectionId = createPaddingSection();
      }
      
      // Create proper section reference object
      const sectionReference = createSectionReference(actualSectionId);
      
      if (targetColumnIndex !== undefined) {
        // Add to column
        const targetCol = updatedRows[targetRowIndex].columns![targetColumnIndex];
        if (insertIndex !== undefined && insertIndex >= 0) {
          (targetCol.sections as any).splice(insertIndex, 0, sectionReference);
        } else {
          (targetCol.sections as any).push(sectionReference);
        }
      } else {
        // Add to whole page row
        const targetSections = updatedRows[targetRowIndex].sections!;
        if (insertIndex !== undefined && insertIndex >= 0) {
          (targetSections as any).splice(insertIndex, 0, sectionReference);
        } else {
          (targetSections as any).push(sectionReference);
        }
      }
      
      // Update state
      const newPages = [...pages];
      newPages[safePageIndex] = { ...currentPage, rows: updatedRows };
      updateLayout(newPages);
      
      // Clear all drag state
      setDraggedSection(null);
      setDraggedSectionInRow(null);
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
        let sections: any[];
        if (fromColumnIndex !== undefined) {
          sections = [...updatedRows[fromRowIndex].columns![fromColumnIndex].sections];
        } else {
          sections = [...updatedRows[fromRowIndex].sections!];
        }
        
        // Find current section by sectionId (handle both string and object formats)
        const currentIndex = sections.findIndex(s => 
          typeof s === 'string' ? s === sectionId : s.sectionId === sectionId
        );
        let targetIndex = insertIndex !== undefined ? insertIndex : sections.length;
        
        // Handle swapping behavior when dropping directly on another section
        if (isSwap && insertIndex !== undefined && insertIndex < sections.length) {
          // Get the target section at the insertIndex
          const targetSection = sections[insertIndex];
          const currentSection = sections[currentIndex];
          
          if (targetSection && currentSection && 
              (typeof targetSection === 'string' ? targetSection : targetSection.sectionId) !== sectionId) {
            // Swap the positions
            sections[currentIndex] = targetSection;
            sections[insertIndex] = currentSection;
            
            // Update the sections array
            if (fromColumnIndex !== undefined) {
              updatedRows[fromRowIndex].columns![fromColumnIndex].sections = sections;
            } else {
              updatedRows[fromRowIndex].sections = sections;
            }
            
            // Update state and return
            const newPages = [...pages];
            newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
            updateLayout(newPages);
            
            // Clear all drag state
            setDraggedSection(null);
            setDraggedSectionInRow(null);
            return;
          }
        }
        
        // Clamp target index to valid range
        targetIndex = Math.max(0, Math.min(targetIndex, sections.length));
        
        // If we're moving to the same position, do nothing
        if (currentIndex === targetIndex || (currentIndex === targetIndex - 1 && targetIndex > currentIndex)) {
          // Clear all drag state
          setDraggedSection(null);
          setDraggedSectionInRow(null);
          return;
        }
        
        // Get the current section object before removing it
        const currentSection = sections[currentIndex];
        
        // Remove from current position
        sections.splice(currentIndex, 1);
        
        // Adjust target index if we're moving to a position after the original position
        if (targetIndex > currentIndex) {
          targetIndex -= 1;
        }
        
        // Insert at new position
        sections.splice(targetIndex, 0, currentSection);
        
        // Update the sections array
        if (fromColumnIndex !== undefined) {
          updatedRows[fromRowIndex].columns![fromColumnIndex].sections = sections;
        } else {
          updatedRows[fromRowIndex].sections = sections;
        }
      } else {
        // Handle moving between different containers
        
        // Check if this is a swap operation
        if (isSwap && insertIndex !== undefined) {
          // Get target section to swap with
          let targetSectionRef;
          if (targetColumnIndex !== undefined) {
            const targetCol = updatedRows[targetRowIndex].columns![targetColumnIndex];
            targetSectionRef = targetCol.sections[insertIndex];
          } else {
            const targetSections = updatedRows[targetRowIndex].sections!;
            targetSectionRef = targetSections[insertIndex];
          }
          
          if (targetSectionRef) {
            // Get the dragged section reference
            let draggedSectionRef;
            if (fromColumnIndex !== undefined) {
              const sourceCol = updatedRows[fromRowIndex].columns![fromColumnIndex];
              draggedSectionRef = sourceCol.sections.find(s => {
                const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
                return refSectionId === sectionId;
              });
            } else {
              draggedSectionRef = updatedRows[fromRowIndex].sections!.find(s => {
                const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
                return refSectionId === sectionId;
              });
            }
            
            if (draggedSectionRef) {
              // Perform the swap
              // Replace target with dragged section
              if (targetColumnIndex !== undefined) {
                const targetCol = updatedRows[targetRowIndex].columns![targetColumnIndex];
                targetCol.sections[insertIndex] = draggedSectionRef;
              } else {
                const targetSections = updatedRows[targetRowIndex].sections!;
                targetSections[insertIndex] = draggedSectionRef;
              }
              
              // Replace dragged section with target section
              if (fromColumnIndex !== undefined) {
                const sourceCol = updatedRows[fromRowIndex].columns![fromColumnIndex];
                const sourceIndex = sourceCol.sections.findIndex(s => {
                  const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
                  return refSectionId === sectionId;
                });
                if (sourceIndex > -1) {
                  sourceCol.sections[sourceIndex] = targetSectionRef;
                }
              } else {
                const sourceSections = updatedRows[fromRowIndex].sections!;
                const sourceIndex = sourceSections.findIndex(s => {
                  const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
                  return refSectionId === sectionId;
                });
                if (sourceIndex > -1) {
                  sourceSections[sourceIndex] = targetSectionRef;
                }
              }
              
              // Update state and return early
              const newPages = [...pages];
              newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
              updateLayout(newPages);
              
              // Clear all drag state
              setDraggedSection(null);
              setDraggedSectionInRow(null);
              return;
            }
          }
        }
        
        // Regular move (not swap) - Remove from source and add to target
        // First, get the section reference object from the source
        let sectionReference;
        if (fromColumnIndex !== undefined) {
          const sourceCol = updatedRows[fromRowIndex].columns![fromColumnIndex];
          sectionReference = sourceCol.sections.find(s => {
            const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
            return refSectionId === sectionId;
          });
        } else {
          sectionReference = updatedRows[fromRowIndex].sections!.find(s => {
            const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
            return refSectionId === sectionId;
          });
        }
        
        // If we can't find the section reference, create a new one (fallback)
        if (!sectionReference) {
          sectionReference = createSectionReference(sectionId);
        }
        
        // Remove from source
        if (fromColumnIndex !== undefined) {
          const sourceCol = updatedRows[fromRowIndex].columns![fromColumnIndex];
          sourceCol.sections = sourceCol.sections.filter(s => {
            // Handle both string IDs and object-based section references
            const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
            return refSectionId !== sectionId;
          });
        } else {
          updatedRows[fromRowIndex].sections = updatedRows[fromRowIndex].sections!.filter(s => {
            // Handle both string IDs and object-based section references
            const refSectionId = typeof s === 'string' ? s : (s as any).sectionId;
            return refSectionId !== sectionId;
          });
        }
        
        // Add to target position using the preserved section reference
        if (targetColumnIndex !== undefined) {
          // Add to column
          const targetCol = updatedRows[targetRowIndex].columns![targetColumnIndex];
          if (insertIndex !== undefined && insertIndex >= 0) {
            (targetCol.sections as any).splice(insertIndex, 0, sectionReference);
          } else {
            (targetCol.sections as any).push(sectionReference);
          }
        } else {
          // Add to whole page row
          const targetSections = updatedRows[targetRowIndex].sections!;
          if (insertIndex !== undefined && insertIndex >= 0) {
            (targetSections as any).splice(insertIndex, 0, sectionReference);
          } else {
            (targetSections as any).push(sectionReference);
          }
        }
      }
      
      // Update state
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...currentPage, rows: updatedRows };
      updateLayout(newPages);
      
      // Clear all drag state
      setDraggedSection(null);
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
    updateLayout(newPages);
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
        ],
        columnMargin: 0
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
    updateLayout(newPages);
  };

  const removeRow = (rowIndex: number) => {
    const newRows = currentPage.rows.filter((_, index) => index !== rowIndex);
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...currentPage, rows: newRows };
    updateLayout(newPages);
  };

  // Page management functions
  const addNewPage = () => {
    const newPage: PageLayout = {
      id: `page-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      rows: []
    };
    const newPages = [...pages, newPage];
    setCurrentPageIndex(pages.length); // Switch to new page
    updateLayout(newPages);
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
    
    updateLayout(renumberedPages);
    setCurrentPageIndex(Math.min(currentPageIndex, renumberedPages.length - 1));
    updateLayout(renumberedPages);
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
    
    // Check temp sections
    if (tempSections[sectionId]) {
      return tempSections[sectionId];
    }
    
    // Handle virtual sections like "create-padding"
    const virtualSection = availableSections.find(s => s.id === sectionId);
    if (virtualSection) {
      return {
        id: virtualSection.id,
        title: virtualSection.title,
        type: virtualSection.type,
        items: []
      };
    }
    
    return null;
  };



  // Create a new padding section
  const createPaddingSection = (): string => {
    if (!onResumeDataChange) return '';

    // Generate unique ID for the padding section
    const paddingId = `padding-${Date.now()}`;
    
    // Default to medium padding template
    const selectedTemplateId = 'padding-medium';
    
    // Map template IDs to heights and titles
    const templateInfo: { [key: string]: { height: string; title: string } } = {
      'padding-extra-small': { height: '0.25cm', title: 'Spacing (0.25cm)' },
      'padding-small': { height: '0.5cm', title: 'Spacing (0.5cm)' },
      'padding-medium': { height: '1cm', title: 'Spacing (1cm)' },
      'padding-large': { height: '1.5cm', title: 'Spacing (1.5cm)' },
      'padding-extra-large': { height: '2cm', title: 'Spacing (2cm)' },
      'padding-xxl': { height: '3cm', title: 'Spacing (3cm)' }
    };
    
    const info = templateInfo[selectedTemplateId] || templateInfo['padding-medium'];
    
    // Create the padding section
    const paddingSection = {
      id: paddingId,
      title: info.title,
      type: 'padding' as const,
      templateId: selectedTemplateId,
      isVisible: true,
      items: [],
      customFields: {
        height: info.height
      }
    };

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
    onResumeDataChange(updatedResumeData);
    return paddingId;
  };

  // Section splitting handlers - create actual separate sections
  const handleSplitSection = (originalSectionId: string, splitData: { sections: any[] }) => {
    if (!onResumeDataChange) return;

    // Check if this is a split section being re-edited
    let baseOriginalId = originalSectionId;
    const splitMatch = originalSectionId.match(/^(.+)_split_\d+$/);
    if (splitMatch) {
      baseOriginalId = splitMatch[1];
    }

    // Find the base original section
    const originalSection = resumeData.sections?.find(s => s.id === baseOriginalId);
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
        id: `${baseOriginalId}_split_${index + 1}`,
        title: sectionData.title || defaultTitle
      };
    });

    // Update resume data - keep original section and add new split sections
    const updatedSections = (resumeData.sections || [])
      .filter(s => !s.id.startsWith(`${baseOriginalId}_split_`)) // Remove existing splits
      .concat(newSections); // Add new split sections
    // Note: Original section is preserved (not filtered out)

    const newResumeData = {
      ...resumeData,
      sections: updatedSections
    };

    // Update layout - replace original section with first split if it's in layout
    const currentPages = getPages();
    const layoutSectionIds = getAllLayoutSectionIds();
    const originalInLayout = layoutSectionIds.includes(baseOriginalId);
    
    const updatedPages = currentPages.map(page => ({
      ...page,
      rows: page.rows.map(row => ({
        ...row,
        columns: row.columns?.map(col => ({
          ...col,
          sections: col.sections.map((sectionRef: any) => {
            const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
            // Replace original with first split if original is in layout
            if (sectionId === baseOriginalId && originalInLayout) {
              return newSections[0].id;
            }
            // Remove existing splits (but not the original)
            if (sectionId.startsWith(`${baseOriginalId}_split_`)) {
              return null;
            }
            return sectionRef;
          }).filter(Boolean)
        })),
        sections: row.sections?.map((sectionRef: any) => {
          const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
          // Replace original with first split if original is in layout
          if (sectionId === baseOriginalId && originalInLayout) {
            return newSections[0].id;
          }
          // Remove existing splits (but not the original)
          if (sectionId.startsWith(`${baseOriginalId}_split_`)) {
            return null;
          }
          return sectionRef;
        }).filter(Boolean)
      }))
    }));

    // Update resume data with both new sections AND new layout
    const completeUpdatedResumeData = {
      ...newResumeData,
      layout: {
        ...newResumeData.layout,
        pages: updatedPages as any // Type assertion for now
      }
    };
    
    onResumeDataChange(completeUpdatedResumeData);
    setSplittingSection(null);
  };

  const getSectionForSplitting = () => {
    if (!splittingSection) return null;
    const section = resumeData.sections?.find(s => s.id === splittingSection);
    return section as any; // Type cast for now - will need proper type alignment later
  };

  const getExistingSplitsForSection = (sectionId: string) => {
    if (!sectionId) return [];
    
    // Check if this is already a split section
    const splitMatch = sectionId.match(/^(.+)_split_\d+$/);
    const baseId = splitMatch ? splitMatch[1] : sectionId;
    
    // Find all existing splits for this base section
    const existingSplits = (resumeData.sections || [])
      .filter(s => s.id.startsWith(`${baseId}_split_`))
      .sort((a, b) => {
        // Sort by split number
        const aMatch = a.id.match(/_split_(\d+)$/);
        const bMatch = b.id.match(/_split_(\d+)$/);
        const aNum = aMatch ? parseInt(aMatch[1]) : 0;
        const bNum = bMatch ? parseInt(bMatch[1]) : 0;
        return aNum - bNum;
      });
    
    return existingSplits;
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
    const currentPages = getPages();
    
    const updatedPages = currentPages.map(page => ({
      ...page,
      rows: page.rows.map(row => {
        let addedCombinedSection = false;
        
        return {
          ...row,
          columns: row.columns?.map(col => {
            let foundFirstSplitSection = false;
            const updatedSections: any[] = [];
            
            col.sections.forEach((sectionRef: any) => {
              const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
              const shouldKeep = !splitSectionIds.includes(sectionId);
              
              if (!shouldKeep && !foundFirstSplitSection && !addedCombinedSection) {
                // Replace first split section with combined section
                updatedSections.push(baseId);
                foundFirstSplitSection = true;
                addedCombinedSection = true;
              } else if (shouldKeep) {
                updatedSections.push(sectionRef);
              }
            });
            
            return {
              ...col,
              sections: updatedSections
            };
          }),
          sections: row.sections ? (() => {
            let foundFirstSplitSection = false;
            const updatedSections: any[] = [];
            
            row.sections!.forEach((sectionRef: any) => {
              const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
              const shouldKeep = !splitSectionIds.includes(sectionId);
              
              if (!shouldKeep && !foundFirstSplitSection && !addedCombinedSection) {
                // Replace first split section with combined section
                updatedSections.push(baseId);
                foundFirstSplitSection = true;
                addedCombinedSection = true;
              } else if (shouldKeep) {
                updatedSections.push(sectionRef);
              }
            });
            
            return updatedSections;
          })() : undefined
        };
      })
    }));

    // Update resume data with both new sections AND new layout
    const completeUpdatedResumeData = {
      ...newResumeData,
      layout: {
        ...newResumeData.layout,
        pages: updatedPages as any // Type assertion for now
      }
    };
    
    onResumeDataChange(completeUpdatedResumeData);
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
    let sections: any[];
    if (columnIndex !== undefined) {
      // Column layout
      sections = currentPage.rows[rowIndex].columns?.[columnIndex]?.sections || [];
    } else {
      // Whole page layout
      sections = currentPage.rows[rowIndex].sections || [];
    }

    const draggedSectionIndex = sections.findIndex(sectionRef => {
      const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
      return sectionId === draggedSectionInRow.sectionId;
    });
    if (draggedSectionIndex === -1) return false;

    // Calculate the target insertion index for this drop zone
    let targetInsertionIndex: number;
    if (isBeforeSection) {
      // Drop zone before a section
      targetInsertionIndex = sectionIndex;
    } else {
      // Drop zone after a section  
      targetInsertionIndex = sectionIndex + 1;
    }

    // Hide drop zones that would result in no actual position change
    // When moving a section, we need to consider how the array indices shift
    if (targetInsertionIndex <= draggedSectionIndex) {
      // Dropping before or at the current position
      // After removal, the section would end up at targetInsertionIndex
      return targetInsertionIndex === draggedSectionIndex;
    } else {
      // Dropping after the current position  
      // After removal, indices shift down, so section ends up at targetInsertionIndex - 1
      return (targetInsertionIndex - 1) === draggedSectionIndex;
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
      
      updateLayout(updatedPages);
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
      
      updateLayout(updatedPages);
      
      // Update the layout
      const currentPage = pages[currentPageIndex];
      const updatedCurrentPage = {
        ...currentPage,
        rows: [...updatedPages[currentPageIndex].rows]
      };
      
      updateLayout(
        updatedPages.map((page, idx) => 
          idx === currentPageIndex ? updatedCurrentPage : page
        )
      );
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
      
      updateLayout(updatedPages);
      
      // Update the layout
      const currentPage = pages[currentPageIndex];
      const updatedCurrentPage = {
        ...currentPage,
        rows: [...updatedPages[currentPageIndex].rows]
      };
      
      updateLayout(
        updatedPages.map((page, idx) => 
          idx === currentPageIndex ? updatedCurrentPage : page
        )
      );
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
      
      updateLayout(updatedPages);
      
      // Update the layout
      const currentPage = pages[currentPageIndex];
      const updatedCurrentPage = {
        ...currentPage,
        rows: [...updatedPages[currentPageIndex].rows]
      };
      
      updateLayout(
        updatedPages.map((page, idx) => 
          idx === currentPageIndex ? updatedCurrentPage : page
        )
      );
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
    
    updateLayout(updatedPages);
    
    // Update the layout
    updateLayout(updatedPages);
    
    console.log('Footer update completed');
  };

  // Helper function to get the display percentage for the slider (original split, not current width)
  const getDisplayPercentage = (row: LayoutRow, columnIndex: number = 0): number => {
    if (row.originalSplit) {
      return columnIndex === 0 ? row.originalSplit.left : row.originalSplit.right;
    }
    // Fallback: calculate from current widths if no originalSplit stored
    const leftPercent = parsePercentage(row.columns?.[0]?.width || '50%');
    const rightPercent = parsePercentage(row.columns?.[1]?.width || '50%');
    const totalContent = leftPercent + rightPercent;
    
    if (columnIndex === 0) {
      return Math.round((leftPercent / totalContent) * 100);
    } else {
      return Math.round((rightPercent / totalContent) * 100);
    }
  };

  // Helper function to update column width with percentage
  const updateColumnWidthSlider = (rowIndex: number, columnIndex: number, percentage: number) => {
    const currentRow = currentPage.rows[rowIndex];
    if (!currentRow || !currentRow.columns || !currentRow.columns[columnIndex]) return;
    
    const margin = currentRow.columnMargin || 0;
    const availableWidth = 100 - margin;
    
    // Calculate the actual percentage of available width
    const actualPercentage = (percentage / 100) * availableWidth;
    const otherPercentage = availableWidth - actualPercentage;
    
    // Create new pages array
    const newPages = pages.map((page, pageIndex) => {
      if (pageIndex !== currentPageIndex) return page;
      
      const newRows = page.rows.map((row, rIndex) => {
        if (rIndex !== rowIndex) return row;
        
        const newColumns = row.columns!.map((col, colIndex) => {
          if (colIndex === columnIndex) {
            return { ...col, width: `${Math.round(actualPercentage * 100) / 100}%` };
          } else if (row.columns!.length === 2 && colIndex === (columnIndex === 0 ? 1 : 0)) {
            return { ...col, width: `${Math.round(otherPercentage * 100) / 100}%` };
          }
          return col;
        });
        
        return {
          ...row,
          columns: newColumns,
          // Update original split when user manually adjusts the slider (this is the original split, not affected by margin)
          originalSplit: {
            left: columnIndex === 0 ? percentage : (100 - percentage),
            right: columnIndex === 0 ? (100 - percentage) : percentage
          }
        };
      });
      
      return { ...page, rows: newRows };
    });
    
    updateLayout(newPages);
  };

  // Helper function to update column margin and adjust column widths accordingly
  const updateColumnMargin = (rowIndex: number, marginPercent: number) => {
    const currentRow = currentPage.rows[rowIndex];
    if (!currentRow || !currentRow.columns || currentRow.columns.length !== 2) return;
    
    // Calculate or get the original split ratio (without margin)
    let originalSplit = currentRow.originalSplit;
    
    if (!originalSplit) {
      // If no original split stored, calculate it from current widths
      const currentMargin = currentRow.columnMargin || 0;
      const leftPercent = parsePercentage(currentRow.columns[0].width);
      const rightPercent = parsePercentage(currentRow.columns[1].width);
      
      if (currentMargin > 0) {
        // If there's already a margin, we need to calculate back to the original split
        const totalCurrentWidth = leftPercent + rightPercent;
        const leftRatio = leftPercent / totalCurrentWidth;
        const rightRatio = rightPercent / totalCurrentWidth;
        originalSplit = {
          left: Math.round(leftRatio * 100),
          right: Math.round(rightRatio * 100)
        };
      } else {
        // No margin, so current widths represent the original split
        originalSplit = {
          left: Math.round(leftPercent),
          right: Math.round(rightPercent)
        };
      }
    }
    
    // Calculate new widths based on the original split and new margin
    const availableWidth = 100 - marginPercent;
    const newLeftWidth = (availableWidth * originalSplit.left) / 100;
    const newRightWidth = (availableWidth * originalSplit.right) / 100;
    
    // Create new pages array with updated row
    const newPages = pages.map((page, pageIndex) => {
      if (pageIndex !== currentPageIndex) return page;
      
      const newRows = page.rows.map((row, rIndex) => {
        if (rIndex !== rowIndex) return row;
        
        return {
          ...row,
          columnMargin: marginPercent,
          originalSplit: originalSplit,
          columns: [
            {
              ...row.columns![0],
              width: `${Math.round(newLeftWidth * 100) / 100}%`
            },
            {
              ...row.columns![1],
              width: `${Math.round(newRightWidth * 100) / 100}%`
            }
          ]
        };
      });
      
      return {
        ...page,
        rows: newRows
      };
    });
    
    updateLayout(newPages);
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

  // Helper function to detect ALL split sections that can be combined (including those not in layout)
  const getAllSplitSections = () => {
    const splitGroups: { [baseId: string]: string[] } = {};
    
    (resumeData.sections || []).forEach(section => {
      const match = section.id.match(/^(.+)_split_\d+$/);
      if (match) {
        const baseId = match[1];
        if (!splitGroups[baseId]) {
          splitGroups[baseId] = [];
        }
        splitGroups[baseId].push(section.id);
      }
    });
    
    // Only return groups with multiple sections
    return Object.entries(splitGroups).filter(([_, sections]) => sections.length > 1);
  };

  // Template selection handlers
  const handleSectionRightClick = (e: React.MouseEvent, sectionId: string, instanceId?: string) => {
    e.preventDefault();
    
    const section = findSection(sectionId);
    if (!section) {
      console.log('❌ Section not found for template selector:', sectionId);
      return;
    }

    console.log('🔧 Opening template selector for section:', section);
    setTemplateSelector({
      sectionId,
      instanceId,
      sectionType: section.type,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleTemplateChange = (sectionId: string, templateId: string, instanceId?: string) => {
    // Special handling for create-padding virtual section (should not happen with new structure)
    if (sectionId === 'create-padding') {
      console.warn('create-padding should not reach template change handler');
      setTemplateSelector(null);
      return;
    }
    
    // Require instanceId for proper template management
    if (!instanceId) {
      console.warn('Template change called without instanceId - this should not happen');
      setTemplateSelector(null);
      return;
    }

    // Update the template in the layout structure for the specific instance
    const updatedLayout = { ...resumeData.layout };
    let templateUpdated = false;

    // Helper function to update section template in a sections array
    const updateSectionTemplate = (sections: any[]) => {
      return sections.map(sectionRef => {
        if (sectionRef.instanceId === instanceId) {
          templateUpdated = true;
          return { ...sectionRef, template: templateId };
        }
        return sectionRef;
      });
    };

    // Update templates in all pages, rows, and columns
    if (updatedLayout.pages) {
      updatedLayout.pages = updatedLayout.pages.map((page: any) => ({
        ...page,
        rows: page.rows.map((row: any) => {
          if (row.type === 'wholePage' && row.sections) {
            return {
              ...row,
              sections: updateSectionTemplate(row.sections)
            };
          } else if (row.type === 'columns' && row.columns) {
            return {
              ...row,
              columns: row.columns.map((column: any) => ({
                ...column,
                sections: updateSectionTemplate(column.sections)
              }))
            };
          }
          return row;
        })
      }));
    }

    // Update resume data with the new layout
    if (onResumeDataChange && templateUpdated) {
      onResumeDataChange({
        ...resumeData,
        layout: updatedLayout
      });
    }

    setTemplateSelector(null);
  };

  const handleCloseTemplateSelector = () => {
    setTemplateSelector(null);
  };

  // Helper function to create a proper section reference with instanceId and default template
  const createSectionReference = (sectionId: string) => {
    // Generate unique instance ID
    const instanceId = `instance-${sectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Find the section to determine its type and default template
    const section = findSection(sectionId);
    let defaultTemplate = 'default';
    
    if (section) {
      // Use the section's existing templateId if available
      defaultTemplate = section.templateId || getDefaultTemplateForSectionType(section.type);
    }
    
    return {
      sectionId,
      instanceId,
      template: defaultTemplate
    };
  };

  // Helper function to get default template for section type
  const getDefaultTemplateForSectionType = (sectionType: string) => {
    const defaultTemplates: { [key: string]: string } = {
      'name': 'name-standard',
      'personal_info': 'contact-header',
      'text': 'text-paragraph',
      'experience': 'experience-detailed',
      'education': 'education-standard',
      'skills': 'skills-categorized',
      'list': 'list-simple',
      'publications': 'publications-standard',
      'awards': 'awards-standard',
      'references': 'references-standard',
      'padding': 'padding-medium'
    };
    return defaultTemplates[sectionType] || 'default';
  };

  // Helper function to find the current template for a specific instance
  const findInstanceTemplate = (instanceId: string) => {
    if (!instanceId || !resumeData.layout?.pages) return undefined;
    
    for (const page of resumeData.layout.pages) {
      for (const row of page.rows) {
        const rowData = row as any; // Cast to any to handle the union type
        if (rowData.type === 'wholePage' && rowData.sections) {
          const section = rowData.sections.find((s: any) => s.instanceId === instanceId);
          if (section) return section.template;
        } else if (rowData.type === 'columns' && rowData.columns) {
          for (const column of rowData.columns) {
            const section = column.sections.find((s: any) => s.instanceId === instanceId);
            if (section) return section.template;
          }
        }
      }
    }
    return undefined;
  };

  return (
    <div className={`layout-builder-viewport ${(draggedSectionInRow || draggedSection) ? 'has-dragging-section' : ''}`}>


      {/* Main Layout Area */}
      <div 
        className="layout-main-area"
        onDragOver={handleDragOver}
      >
        {/* Sticky Left Sidebar */}
        <div className="layout-sidebar">
          {/* Available sections */}
          <div className="available-sections">
            <div className="sections-header">
              <h4>Available Sections</h4>
              <p className="section-tip">Drag items into the layout to use them</p>
            </div>

            {/* Combinable split sections - show ALL splits, not just those in layout */}
            {getAllSplitSections().length > 0 && (
              <>
                <h4 className="split-sections-header">Split Sections</h4>
                <p className="section-tip">Click combine to merge split sections back together</p>
                <div className="split-sections-list">
                  {getAllSplitSections().map(([baseId, splitSectionIds]) => {
                    const baseSectionTitle = resumeData.sections?.find(s => s.id === splitSectionIds[0])?.title?.replace(/ \((Part \d+|cont)\)$/, '') || baseId;
                    const inLayoutCount = splitSectionIds.filter(id => getAllLayoutSectionIds().includes(id)).length;
                    return (
                      <div key={baseId} className="split-section-group">
                        <div className="split-section-info">
                          <span className="split-section-title">{baseSectionTitle}</span>
                          <span className="split-section-count">
                            ({splitSectionIds.length} parts{inLayoutCount > 0 ? `, ${inLayoutCount} in layout` : ''})
                          </span>
                        </div>
                        <div className="split-section-actions">
                          <button
                            className="sidebar-edit-split-button"
                            onClick={() => setSplittingSection(baseId)}
                            title="Edit split configuration"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="sidebar-combine-button"
                            onClick={() => handleCombineFromSidebar(baseId, splitSectionIds)}
                            title={`Combine ${splitSectionIds.length} parts back into one section`}
                          >
                            🔗 Combine
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <div className="sections-list">
              {availableSections.filter((section) => {
                const resumeSection = resumeData.sections?.find(s => s.id === section.id);
                const isSplitSection = resumeSection?.id.includes('_split_');
                const hasExistingSplits = resumeSection && !isSplitSection && 
                  getExistingSplitsForSection(resumeSection.id).length > 0;
                // Hide original sections that have been split
                return !hasExistingSplits;
              }).map((section) => {
                const resumeSection = resumeData.sections?.find(s => s.id === section.id);
                // Check if section can be split (has splittable type AND more than 1 item AND is not already a split)
                const isSplitSection = resumeSection?.id.includes('_split_');
                
                const canSplit = resumeSection && !isSplitSection && (
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
                          (section as any).isUsed ? 'used' : ''
                        }`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragEnd={() => {
                          console.log('🔚 SIDEBAR SECTION DRAG END - Resetting state');
                          setDraggedSection(null);
                          setDragOverTarget(null);
                        }}
                        title={
                          (section as any).isUsed ?
                            `${section.title} is already used in layout (drag to add another instance)` :
                            undefined
                        }
                      >
                        {section.title || section.id}
                        {(section as any).isUsed && (
                          <span className="section-status"> (in use)</span>
                        )}
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
                    onDragEnd={() => {
                      console.log('🔚 LAYOUT BUTTON DRAG END - Resetting state');
                      setDraggedLayoutButton(null);
                      setDragOverTarget(null);
                    }}
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
                    onDragEnd={() => {
                      console.log('🔚 LAYOUT BUTTON DRAG END - Resetting state');
                      setDraggedLayoutButton(null);
                      setDragOverTarget(null);
                    }}
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
                className={`footer-select ${(pages[currentPageIndex]?.footer?.type && pages[currentPageIndex]?.footer?.type !== 'none') ? 'has-footer' : ''}`}
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
            <div className={`layout-rows ${draggedRow !== null ? 'row-drag-active' : ''}`}>
            <h4>Page {currentPage.pageNumber} Layout</h4>
            <p className="layout-tip">Drop layout elements and sections here to build your resume</p>
            
            {/* Drop zone at the top */}
            <div
              className={`layout-drop-zone ${(draggedLayoutButton || draggedRow !== null) ? 'active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                handleDragOver(e);
                if (draggedLayoutButton) {
                  e.dataTransfer.dropEffect = 'copy';
                } else if (draggedRow !== null) {
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDrop={(e) => {
                if (draggedLayoutButton) {
                  handleLayoutDrop(e, 0);
                } else if (draggedRow !== null) {
                  console.log('🎯 LAYOUT DROP ZONE - Inserting at position 0');
                  handleDrop(e, 0);
                }
              }}
            >
              {draggedRow !== null ? 'Drop row here' : 'Drop layout here'}
            </div>
            
            {currentPage.rows.map((row: LayoutRow, rowIndex: number) => (
              <React.Fragment key={row.id}>
                <div
                  className="layout-row-builder"
                  draggable
                  onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                  onDragEnd={(e) => {
                    console.log('🔚 ROW DRAG END - Resetting all drag states', {
                      rowIndex,
                      draggedRow,
                      rowId: row.id,
                      rowType: row.type
                    });
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Force clear all drag states
                    setDraggedRow(null);
                    setDragOverTarget(null);
                    setDraggedSection(null);
                    setDraggedSectionInRow(null);
                    cleanupAutoScroll();
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex)}
                >
                  {/* Remove button in top right corner */}
                  <button 
                    className="row-remove-button"
                    onClick={() => removeRow(rowIndex)}
                    title="Remove this row"
                  >
                    ×
                  </button>
                  
                  {/* Top badges */}
                  <div className="row-badges-top">
                    <span className="row-position-badge" title={`Row ${rowIndex + 1} of ${currentPage.rows.length}`}>
                      #{rowIndex + 1}
                    </span>
                    
                    <span className="row-type-badge">{row.type}</span>
                    
                    {/* Row reorder buttons */}
                    <div className="row-reorder-controls">
                      <button
                        className="row-reorder-btn"
                        onClick={() => {
                          if (rowIndex > 0) {
                            // Move row up (swap with previous row)
                            const newRows = [...currentPage.rows];
                            const [movedRow] = newRows.splice(rowIndex, 1);
                            newRows.splice(rowIndex - 1, 0, movedRow);
                            
                            const newPages = [...pages];
                            newPages[currentPageIndex] = { ...currentPage, rows: newRows };
                            updateLayout(newPages);
                          }
                        }}
                        disabled={rowIndex === 0}
                        title="Move row up"
                      >
                        ▲
                      </button>
                      <button
                        className="row-reorder-btn"
                        onClick={() => {
                          if (rowIndex < currentPage.rows.length - 1) {
                            // Move row down (swap with next row)
                            const newRows = [...currentPage.rows];
                            const [movedRow] = newRows.splice(rowIndex, 1);
                            newRows.splice(rowIndex + 1, 0, movedRow);
                            
                            const newPages = [...pages];
                            newPages[currentPageIndex] = { ...currentPage, rows: newRows };
                            updateLayout(newPages);
                          }
                        }}
                        disabled={rowIndex === currentPage.rows.length - 1}
                        title="Move row down"
                      >
                        ▼
                      </button>
                    </div>
                    
                    {row.type === 'columns' && row.columns && (
                      <>
                        <div className="split-badge">
                          <span className="split-label">
                            {getDisplayPercentage(row, 0)}% | {getDisplayPercentage(row, 1)}%
                            {row.columnMargin ? ` (${row.columnMargin}% gap)` : ''}
                          </span>
                          
                          <div className="split-controls-inline">
                            {/* 5% adjustment buttons */}
                            <button
                              className="split-btn-compact split-btn-large"
                              onClick={() => {
                                if (row.columns && row.columns[0]) {
                                  const current = getDisplayPercentage(row, 0);
                                  const newValue = Math.max(10, current - 5);
                                  updateColumnWidthSlider(rowIndex, 0, newValue);
                                }
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Decrease by 5%"
                            >
                              −5
                            </button>
                            
                            {/* 1% adjustment buttons */}
                            <button
                              className="split-btn-compact split-btn-small"
                              onClick={() => {
                                if (row.columns && row.columns[0]) {
                                  const current = getDisplayPercentage(row, 0);
                                  const newValue = Math.max(10, current - 1);
                                  updateColumnWidthSlider(rowIndex, 0, newValue);
                                }
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Decrease by 1%"
                            >
                              −1
                            </button>
                            
                            <div className="percentage-input-group">
                              <input
                                type="number"
                                min="10"
                                max="90"
                                value={getDisplayPercentage(row, 0)}
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
                            
                            {/* 1% adjustment buttons */}
                            <button
                              className="split-btn-compact split-btn-small"
                              onClick={() => {
                                if (row.columns && row.columns[0]) {
                                  const current = getDisplayPercentage(row, 0);
                                  const newValue = Math.min(90, current + 1);
                                  updateColumnWidthSlider(rowIndex, 0, newValue);
                                }
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Increase by 1%"
                            >
                              +1
                            </button>
                            
                            {/* 5% adjustment buttons */}
                            <button
                              className="split-btn-compact split-btn-large"
                              onClick={() => {
                                if (row.columns && row.columns[0]) {
                                  const current = getDisplayPercentage(row, 0);
                                  const newValue = Math.min(90, current + 5);
                                  updateColumnWidthSlider(rowIndex, 0, newValue);
                                }
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Increase by 5%"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                        
                        <div className="gap-badge">
                          <span className="margin-label">Gap:</span>
                          <div className="margin-controls-inline">
                            <button
                              className="split-btn-compact"
                              onClick={() => updateColumnMargin(rowIndex, Math.max(0, (row.columnMargin || 0) - 1))}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Decrease gap by 1%"
                            >
                              −
                            </button>
                            
                            <div className="percentage-input-group">
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={row.columnMargin || 0}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value, 10);
                                  if (!isNaN(value) && value >= 0 && value <= 20) {
                                    updateColumnMargin(rowIndex, value);
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
                              onClick={() => updateColumnMargin(rowIndex, Math.min(20, (row.columnMargin || 0) + 1))}
                              onMouseDown={(e) => e.stopPropagation()}
                              title="Increase gap by 1%"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Row Content based on type */}
                  {row.type === 'columns' && row.columns && (
                    <div className="row-builder">
                      <div className="row-left-sidebar">
                      </div>
                      
                      <div className="row-content-area">
                        <div className="columns-builder">
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
                            
                            return (
                              <React.Fragment key={`${rowIndex}-${columnIndex}-${sectionIndex}-${sectionId}`}>
                                {/* Drop zone above each section */}
                                {sectionIndex === 0 && !shouldHideDropZone(rowIndex, columnIndex, sectionIndex, true) && (
                                  <div
                                    className={`section-drop-zone ${
                                      dragOverTarget?.rowIndex === rowIndex && 
                                      dragOverTarget?.columnIndex === columnIndex && 
                                      dragOverTarget?.insertIndex === 0 ? 'drag-over' : ''
                                    }`}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDragOverTarget({ rowIndex, columnIndex, insertIndex: 0 });
                                    }}
                                    onDragLeave={(e) => {
                                      e.preventDefault();
                                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                        setDragOverTarget(null);
                                      }
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
                                    cleanupAutoScroll();
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
                                  onContextMenu={(e) => handleSectionRightClick(e, sectionId, sectionRef.instanceId)}
                                >
                                <span className="section-title">
                                  {(() => {
                                    const debugSection = findSection(sectionId);
                                    
                                    // For padding sections, derive title from instance template
                                    if (debugSection?.type === 'padding' && sectionRef.template) {
                                      const templateDisplayNames: { [key: string]: string } = {
                                        'padding-extra-small': 'Spacing (0.25cm)',
                                        'padding-small': 'Spacing (0.5cm)',
                                        'padding-medium': 'Spacing (1cm)',
                                        'padding-large': 'Spacing (1.5cm)',
                                        'padding-extra-large': 'Spacing (2cm)',
                                        'padding-xxl': 'Spacing (3cm)'
                                      };
                                      return templateDisplayNames[sectionRef.template] || debugSection.title;
                                    }
                                    
                                    return debugSection?.title || sectionId;
                                  })()}
                                </span>
                                
                                <div className="section-actions">
                                  <button
                                    className="remove-section-button"
                                    onClick={() => removeSectionFromRow(sectionId, rowIndex, columnIndex, sectionIndex)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="Remove section"
                                  >
                                    ×
                                  </button>
                                  <button
                                    className="template-button"
                                    onClick={(e) => handleSectionRightClick(e, sectionId, sectionRef.instanceId)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    title="Select template"
                                  >
                                    ⚙
                                  </button>
                                  <button
                                    className={`reorder-button ${reorderingSection === sectionId ? 'active' : ''}`}
                                    onClick={() => toggleSectionReorder(sectionId)}
                                    onMouseDown={(e) => e.stopPropagation()}
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
                                  className={`section-drop-zone ${
                                    dragOverTarget?.rowIndex === rowIndex && 
                                    dragOverTarget?.columnIndex === columnIndex && 
                                    dragOverTarget?.insertIndex === sectionIndex + 1 ? 'drag-over' : ''
                                  }`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverTarget({ rowIndex, columnIndex, insertIndex: sectionIndex + 1 });
                                  }}
                                  onDragLeave={(e) => {
                                    e.preventDefault();
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                      setDragOverTarget(null);
                                    }
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
                      </div>
                    </div>
                  )}
                  
                  {/* --- BROKEN BLOCK REMOVED --- */}
                  {/* The malformed `wholePage` block that was here (lines 2235-2477) has been deleted. */}
                  
                  {row.type === 'wholePage' && (
                    <div className="row-builder">
                      <div className="row-left-sidebar">
                        <div className="color-controls-vertical">
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

                      <div className="row-content-area">
                        <div className="whole-page-builder">
                          {row.sections && row.sections.map((sectionRef: any, sectionIndex: number) => {
                            const sectionId = typeof sectionRef === 'string' ? sectionRef : sectionRef.sectionId;
                            
                            return (
                            <React.Fragment key={`${rowIndex}-${sectionIndex}-${sectionId}`}>
                              {/* Drop zone above each section */}
                              {sectionIndex === 0 && !shouldHideDropZone(rowIndex, undefined, sectionIndex, true) && (
                                <div
                                  className={`section-drop-zone ${
                                    dragOverTarget?.rowIndex === rowIndex && 
                                    dragOverTarget?.columnIndex === undefined && 
                                    dragOverTarget?.insertIndex === 0 ? 'drag-over' : ''
                                  }`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverTarget({ rowIndex, columnIndex: undefined, insertIndex: 0 });
                                  }}
                                  onDragLeave={(e) => {
                                    e.preventDefault();
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                      setDragOverTarget(null);
                                    }
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
                                onDragStart={(e) => handleSectionDragStart(e, sectionId, rowIndex, undefined)}
                                onDragEnd={() => {
                                  setDraggedSectionInRow(null);
                                  setDragOverTarget(null);
                                  cleanupAutoScroll();
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
                                onContextMenu={(e) => handleSectionRightClick(e, sectionId, sectionRef.instanceId)}
                              >
                              <span className="section-title">
                                {(() => {
                                  const debugSection = findSection(sectionId);
                                  
                                  // For padding sections, derive title from instance template
                                  if (debugSection?.type === 'padding' && sectionRef.template) {
                                    const templateDisplayNames: { [key: string]: string } = {
                                      'padding-extra-small': 'Spacing (0.25cm)',
                                      'padding-small': 'Spacing (0.5cm)',
                                      'padding-medium': 'Spacing (1cm)',
                                      'padding-large': 'Spacing (1.5cm)',
                                      'padding-extra-large': 'Spacing (2cm)',
                                      'padding-xxl': 'Spacing (3cm)'
                                    };
                                    return templateDisplayNames[sectionRef.template] || debugSection.title;
                                  }
                                  
                                  return debugSection?.title || sectionId;
                                })()}
                              </span>
                              
                              <div className="section-actions">
                                <button
                                  className="remove-section-button"
                                  onClick={() => removeSectionFromRow(sectionId, rowIndex, undefined, sectionIndex)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  title="Remove section"
                                >
                                  ×
                                </button>
                                <button
                                  className="template-button"
                                  onClick={(e) => handleSectionRightClick(e, sectionId, sectionRef.instanceId)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  title="Select template"
                                >
                                  ⚙
                                </button>
                                <button
                                  className={`reorder-button ${reorderingSection === sectionId ? 'active' : ''}`}
                                  onClick={() => toggleSectionReorder(sectionId)}
                                  onMouseDown={(e) => e.stopPropagation()}
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
                                className={`section-drop-zone ${
                                  dragOverTarget?.rowIndex === rowIndex && 
                                  dragOverTarget?.columnIndex === undefined && 
                                  dragOverTarget?.insertIndex === sectionIndex + 1 ? 'drag-over' : ''
                                }`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverTarget({ rowIndex, columnIndex: undefined, insertIndex: sectionIndex + 1 });
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    setDragOverTarget(null);
                                  }
                                }}
                                onDrop={(e) => {
                                  e.stopPropagation();
                                  handleSectionDrop(e, rowIndex, undefined, sectionIndex + 1);
                                }}
                              />
                            )}
                            </React.Fragment>
                          )})}
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
                    </div>
                  )}
                </div>
            
              {/* Drop zone after each row */}
              <div
                className={`layout-drop-zone ${(draggedLayoutButton || draggedRow !== null) ? 'active' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDragOver(e);
                  if (draggedLayoutButton) {
                    e.dataTransfer.dropEffect = 'copy';
                  } else if (draggedRow !== null) {
                    e.dataTransfer.dropEffect = 'move';
                  }
                }}
                onDrop={(e) => {
                  if (draggedLayoutButton) {
                    handleLayoutDrop(e, rowIndex + 1);
                  } else if (draggedRow !== null) {
                    console.log('🎯 LAYOUT DROP ZONE - Inserting at position', rowIndex + 1);
                    handleDrop(e, rowIndex + 1);
                  }
                }}
              >
                {draggedRow !== null ? 'Drop row here' : 'Drop layout here'}
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
          existingSplits={getExistingSplitsForSection(splittingSection) as any}
          onSplit={(splitData) => handleSplitSection(splittingSection, splitData)}
          onClose={() => setSplittingSection(null)}
        />
      )}
      
      {/* Template Selector */}
      {templateSelector && (
        <SectionTemplateSelector
          sectionId={templateSelector.sectionId}
          instanceId={templateSelector.instanceId}
          sectionType={templateSelector.sectionType}
          currentTemplateId={templateSelector.instanceId ? findInstanceTemplate(templateSelector.instanceId) : undefined}
          onTemplateChange={handleTemplateChange}
          onClose={handleCloseTemplateSelector}
          position={templateSelector.position}
        />
      )}
    </div>
  );
};