import type { FlexLayoutConfig, FlexPageLayout, ColumnPair, WholePageRow, SectionReference } from '../types/layout';

// Helper function to convert old string[] to new SectionReference[]
function mapSectionsToReferences(sectionIds: string[]): SectionReference[] {
  if (!sectionIds) return [];
  return sectionIds.map(id => ({
    id: id, // Use section ID as the reference ID for simplicity
    type: 'section', // Assume all old sections are "base" sections
    sectionId: id,
  }));
}

// Convert old layout format to new flexible layout format
export function convertToFlexLayout(oldResumeData: any): FlexLayoutConfig {
  const oldLayout = oldResumeData.layout;
  const globalStyles = oldResumeData.globalStyles;
  const pageStyles = oldResumeData.pageStyles || [];

  const pages: FlexPageLayout[] = [];

  // Convert each page
  oldLayout.pages?.forEach((page: any, index: number) => {
    const pageStyle = pageStyles.find((ps: any) => ps.pageId === page.id) || pageStyles[0];
    
    const rows: Array<ColumnPair | WholePageRow> = [];

    // Add column pair if there are left/right column sections
    const hasLeftSections = page.leftColumn?.length > 0;
    const hasRightSections = page.rightColumn?.length > 0;

    if (hasLeftSections || hasRightSections) {
      const leftWidth = parseFloat(pageStyle?.leftColumn?.width?.replace('%', '')) || 30;
      const rightWidth = 100 - leftWidth;

      const columnPair: ColumnPair = {
        id: `columns-${index}`,
        left: {
          id: `left-${index}`,
          width: leftWidth,
          sections: mapSectionsToReferences(page.leftColumn || []),
          backgroundColor: pageStyle?.leftColumn?.backgroundColor,
          textColor: pageStyle?.leftColumn?.textColor,
        },
        right: {
          id: `right-${index}`,
          width: rightWidth,
          sections: mapSectionsToReferences(page.rightColumn || []),
          backgroundColor: pageStyle?.rightColumn?.backgroundColor,
          textColor: pageStyle?.rightColumn?.textColor,
        }
      };
      rows.push(columnPair);
    }

    // Add whole page sections
    if (page.wholePage?.length > 0) {
      const wholePageRow: WholePageRow = {
        id: `wholepage-${index}`,
        sections: mapSectionsToReferences(page.wholePage),
        backgroundColor: pageStyle?.backgroundColor || pageStyle?.rightColumn?.backgroundColor,
        textColor: pageStyle?.textColor || pageStyle?.rightColumn?.textColor,
      };
      rows.push(wholePageRow);
    }

    const flexPage: FlexPageLayout = {
      id: page.id || `page-${index + 1}`,
      rows,
      margins: pageStyle?.margins || {
        top: '1.0cm',
        bottom: '1.0cm',
        left: '1.0cm',
        right: '1.0cm',
      },
      columnGap: '0.5cm',
      rowGap: '0.3cm',
    };

    pages.push(flexPage);
  });

  return {
    pages,
    sectionInstances: [], // Added missing property
    globalStyles: {
      fontSizes: globalStyles?.fontSizes || {
        h1: '1.3cm',
        h2: '0.6cm',
        h3: '0.4cm',
        body: '0.4cm',
        small: '0.35cm',
      },
      fontFamily: globalStyles?.fontFamily || 'Roboto, sans-serif',
      colorScheme: globalStyles?.colorScheme || {
        primary: '#2c5aa0',
        secondary: '#333333',
        text: '#333333',
        accent: '#2563eb',
      },
      spacing: globalStyles?.spacing || {
        sectionMargin: '0.6cm',
        itemMargin: '0.4cm',
        pageMargin: '1.27cm',
      },
    },
  };
}

// Helper functions to create common layout templates
export function createLayoutTemplate(
  template: 'single-column' | 'two-column-equal' | 'two-column-left' | 'two-column-right',
  sections: string[]
): ColumnPair | WholePageRow {
  switch (template) {
    case 'single-column':
      return {
        id: 'wholepage-row',
        sections: mapSectionsToReferences(sections),
      } as WholePageRow;

    case 'two-column-equal':
      return {
        id: 'equal-columns',
        left: {
          id: 'left-col',
          width: 50,
          sections: mapSectionsToReferences(sections.slice(0, Math.ceil(sections.length / 2))),
        },
        right: {
          id: 'right-col',
          width: 50,
          sections: mapSectionsToReferences(sections.slice(Math.ceil(sections.length / 2))),
        }
      } as ColumnPair;

    case 'two-column-left':
      // Left column wider (e.g., 70/30)
      return {
        id: 'left-heavy-columns',
        left: {
          id: 'left-col',
          width: 70,
          sections: mapSectionsToReferences(sections.slice(0, Math.ceil(sections.length * 0.7))),
        },
        right: {
          id: 'right-col',
          width: 30,
          sections: mapSectionsToReferences(sections.slice(Math.ceil(sections.length * 0.7))),
        }
      } as ColumnPair;

    case 'two-column-right':
      // Right column wider (e.g., 30/70)
      return {
        id: 'right-heavy-columns',
        left: {
          id: 'left-col',
          width: 30,
          sections: mapSectionsToReferences(sections.slice(0, Math.ceil(sections.length * 0.3))),
        },
        right: {
          id: 'right-col',
          width: 70,
          sections: mapSectionsToReferences(sections.slice(Math.ceil(sections.length * 0.3))),
        }
      } as ColumnPair;

    default:
      throw new Error(`Unknown template: ${template}`);
  }
}

// Create a flexible layout that matches the pattern: |c|cc| over |cc|c|
export function createCustomMixedLayout(
  sections: string[]
): Array<ColumnPair | WholePageRow> {
  const rows: Array<ColumnPair | WholePageRow> = [];
  
  // First row: |c|cc| (30/70 split)
  const firstRowSections = sections.slice(0, Math.ceil(sections.length / 3));
  const secondRowSections = sections.slice(Math.ceil(sections.length / 3), Math.ceil(sections.length * 2 / 3));
  const thirdRowSections = sections.slice(Math.ceil(sections.length * 2 / 3));

  if (firstRowSections.length > 0 || secondRowSections.length > 0) {
    rows.push({
      id: 'row-1',
      left: {
        id: 'row-1-left',
        width: 30,
        sections: mapSectionsToReferences(firstRowSections),
      },
      right: {
        id: 'row-1-right', 
        width: 70,
        sections: mapSectionsToReferences(secondRowSections),
      }
    });
  }

  // Second row: |cc|c| (70/30 split)
  if (thirdRowSections.length > 0) {
    rows.push({
      id: 'row-2',
      left: {
        id: 'row-2-left',
        width: 70,
        sections: mapSectionsToReferences(thirdRowSections.slice(0, Math.ceil(thirdRowSections.length * 0.7))),
      },
      right: {
        id: 'row-2-right',
        width: 30,
        sections: mapSectionsToReferences(thirdRowSections.slice(Math.ceil(thirdRowSections.length * 0.7))),
      }
    });
  }

  return rows;
}