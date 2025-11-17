import React, { useState, useEffect } from 'react';
import type { ResumeSection } from '../types/sections';
import './SectionSplittingManager.css';

interface SectionSplittingManagerProps {
  section: ResumeSection;
  onSplit: (splitData: { sections: any[] }) => void;
  onClose: () => void;
}

interface SplitPart {
  title: string;
  items: any[];
  selectedItems: string[];
}

export const SectionSplittingManager: React.FC<SectionSplittingManagerProps> = ({
  section,
  onSplit,
  onClose
}) => {
  console.log('=== SectionSplittingManager received section ===');
  console.log('Section:', section);
  console.log('Section keys:', section ? Object.keys(section) : 'null');
  console.log('Section items:', section?.items);
  console.log('Section categories:', (section as any)?.categories);
  
  const [splitParts, setSplitParts] = useState<SplitPart[]>([]);
  const [activePart, setActivePart] = useState(0);

  // Get items from the section if it has them
  const getItems = (section: ResumeSection): any[] => {
    console.log('=== getItems called ===');
    console.log('Section in getItems:', section);
    
    if (section && typeof section === 'object') {
      // Handle skills section with categories
      if ('categories' in section && section.categories) {
        console.log('Found categories:', (section as any).categories);
        return (section as any).categories || [];
      }
      // Handle other sections with items
      if ('items' in section) {
        console.log('Found items:', (section as any).items);
        return (section as any).items || [];
      }
    }
    console.log('No items found, returning empty array');
    return [];
  };

  const items = getItems(section);

  // Generate IDs for items that don't have them
  const itemsWithIds = items.map((item, index) => ({
    ...item,
    id: item.id || `${section.id}-item-${index}`
  }));

  // Initialize with the original section as first part
  useEffect(() => {
    if (splitParts.length === 0) {
      setSplitParts([{
        title: section.title,
        items: itemsWithIds,
        selectedItems: itemsWithIds.map(item => item.id)
      }]);
    }
  }, [section.title, itemsWithIds, splitParts.length]);



  // Get display title for split parts
  const getItemDisplayTitle = (item: any, sectionType: string) => {
    switch (sectionType) {
      case 'experience':
        return item.title || item.position || 'Untitled Position';
      case 'education':
        return item.degree || item.program || 'Untitled Program';
      case 'projects':
        return item.name || item.title || 'Untitled Project';
      case 'skills':
        return item.name || item.category || 'Untitled Skill';
      case 'certifications':
        return item.name || item.certification || 'Untitled Certification';
      default:
        return item.name || item.title || 'Untitled Item';
    }
  };

  const addNewPart = () => {
    const currentCount = splitParts.length;
    let newTitle: string;

    if (currentCount === 1) {
      // When adding the second part, use "(cont)" 
      newTitle = `${section.title} (cont)`;
    } else {
      // For 3+ parts, use "Part X" numbering
      newTitle = `${section.title} (Part ${currentCount + 1})`;
    }

    const newPart: SplitPart = {
      title: newTitle,
      items: itemsWithIds,
      selectedItems: [] // Start with no items selected - user must select them
    };

    const newParts = [...splitParts, newPart];
    
    // If we now have 3 parts, rename the second part from "(cont)" to "(Part 2)"
    if (newParts.length === 3 && newParts[1].title.endsWith('(cont)')) {
      newParts[1] = {
        ...newParts[1],
        title: `${section.title} (Part 2)`
      };
    }

    setSplitParts(newParts);
    setActivePart(splitParts.length);
  };

  const removePart = (partIndex: number) => {
    if (splitParts.length <= 1) return; // Can't remove the last part
    
    let newParts = splitParts.filter((_, index) => index !== partIndex);
    
    // Handle renaming when going from 3+ parts back to 2 parts
    if (newParts.length === 2) {
      // Rename the second part to use "(cont)" instead of "(Part 2)"
      newParts[1] = {
        ...newParts[1],
        title: `${section.title} (cont)`
      };
    } else if (newParts.length > 2) {
      // Renumber all parts after the first one to maintain proper "Part X" numbering
      newParts = newParts.map((part, index) => {
        if (index === 0) return part; // Keep first part unchanged
        return {
          ...part,
          title: `${section.title} (Part ${index + 1})`
        };
      });
    }
    
    setSplitParts(newParts);
    setActivePart(Math.min(activePart, newParts.length - 1));
  };

  const updatePartTitle = (partIndex: number, title: string) => {
    const newParts = [...splitParts];
    newParts[partIndex] = { ...newParts[partIndex], title };
    setSplitParts(newParts);
  };

  const toggleItemSelection = (partIndex: number, itemId: string) => {
    const part = splitParts[partIndex];
    const selectedItems = part.selectedItems.includes(itemId)
      ? part.selectedItems.filter(id => id !== itemId)
      : [...part.selectedItems, itemId];
    
    const newParts = [...splitParts];
    newParts[partIndex] = { ...newParts[partIndex], selectedItems };
    setSplitParts(newParts);
  };

  const applySplit = () => {
    // Create new sections from split parts
    const sections = splitParts.map(part => {
      const selectedItemsData = part.selectedItems.map(itemId => 
        itemsWithIds.find(item => item.id === itemId)
      ).filter(Boolean);

      // Create the new section preserving the original structure
      const newSection = {
        ...section, // Copy all original properties
        title: part.title, // Override with new title
        // Override the items/categories based on section type
        ...(section.type === 'skills' 
          ? { categories: selectedItemsData }
          : { items: selectedItemsData }
        )
      };

      return newSection;
    });

    onSplit({ sections });
  };

  if (splitParts.length === 0) {
    return null;
  }

  const currentPart = splitParts[activePart];

  return (
    <div className="section-splitting-overlay">
      <div className="section-splitting-modal">
        <div className="modal-header">
          <h3>Split Section: {section.title}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="modal-body">
          <div className="split-tabs">
            {splitParts.map((part, index) => (
              <button
                key={index}
                className={`split-tab ${index === activePart ? 'active' : ''}`}
                onClick={() => setActivePart(index)}
              >
                {part.title.length > 20 ? `${part.title.substring(0, 20)}...` : part.title}
                {splitParts.length > 1 && (
                  <span
                    className="remove-part"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePart(index);
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
            <button onClick={addNewPart} className="add-part-button">
              + Add Part
            </button>
          </div>

          <div className="split-content">
            <div className="part-title-section">
              <label>Part Title:</label>
              <input
                type="text"
                value={currentPart.title}
                onChange={(e) => updatePartTitle(activePart, e.target.value)}
                className="part-title-input"
              />
            </div>

            <div className="items-section">
              <h4>Select items for this part:</h4>
              <div className="items-list">
                {itemsWithIds.map((item) => (
                  <div key={item.id} className="item-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentPart.selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(activePart, item.id)}
                      />
                      <span className="item-title">
                        {getItemDisplayTitle(item, section.type)}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button onClick={applySplit} className="apply-button">
            Split Section
          </button>
        </div>
      </div>
    </div>
  );
};
