import React, { useState } from 'react';
import type { ResumeSection, SectionInstance } from '../types/sections';
import './SectionSplittingManager.css';

interface SectionSplittingManagerProps {
  section: ResumeSection;
  instances: SectionInstance[];
  onUpdateInstances: (instances: SectionInstance[]) => void;
  onClose: () => void;
}

export const SectionSplittingManager: React.FC<SectionSplittingManagerProps> = ({
  section,
  instances,
  onUpdateInstances,
  onClose
}) => {
  const [activeInstance, setActiveInstance] = useState(0);

  // Get items from the section if it has them
  const getItems = (section: ResumeSection): any[] => {
    if (section && typeof section === 'object') {
      // Handle skills section with categories
      if ('categories' in section && section.categories) {
        return (section as any).categories || [];
      }
      // Handle other sections with items
      if ('items' in section) {
        return (section as any).items || [];
      }
    }
    return [];
  };

  const items = getItems(section);

  // Generate IDs for items that don't have them
  const itemsWithIds = items.map((item, index) => ({
    ...item,
    id: item.id || `${section.id}-item-${index}`
  }));

  // Get display title for an item based on section type
  const getItemDisplayTitle = (item: any, sectionType: string) => {
    switch (sectionType) {
      case 'experience':
        return item.title || item.position || 'Untitled Position';
      case 'education':
        return item.degree || item.program || 'Untitled Program';
      case 'projects':
        return item.title || item.name || 'Untitled Project';
      case 'skills':
        return item.name || 'Untitled Category';
      case 'certifications':
      case 'list':
        return item.name || item.title || 'Untitled Certification';
      default:
        return item.title || item.name || `Item ${item.id}`;
    }
  };

  // Get display organization for an item
  const getItemDisplayOrganization = (item: any, sectionType: string) => {
    switch (sectionType) {
      case 'experience':
      case 'projects':
        return item.organization || item.company;
      case 'education':
        return item.institution || item.school;
      case 'skills':
        // For skills, show number of skills in category
        const skillCount = item.skills ? item.skills.length : 0;
        return `${skillCount} skill${skillCount !== 1 ? 's' : ''}`;
      case 'certifications':
      case 'list':
        return item.issuer || item.organization;
      default:
        return item.organization || item.company || item.institution;
    }
  };

  // Get display dates for an item
  const getItemDisplayDates = (item: any) => {
    if (item.dates) return item.dates;
    if (item.startDate || item.endDate) {
      const start = item.startDate || '';
      const end = item.isCurrent ? 'Present' : (item.endDate || '');
      return `${start}${start && end ? ' - ' : ''}${end}`;
    }
    if (item.date) return item.date;
    // For skills categories, show preview of skills
    if (item.skills && Array.isArray(item.skills)) {
      const preview = item.skills.slice(0, 3).join(', ');
      return item.skills.length > 3 ? `${preview}, ...` : preview;
    }
    return '';
  };

  // Create a new instance if none exist
  if (instances.length === 0) {
    const newInstance: SectionInstance = {
      id: `${section.id}-instance-1`,
      sectionId: section.id,
      instanceNumber: 1,
      selectedItems: itemsWithIds.map(item => item.id),
      showContinuation: false,
      title: section.title
    };
    onUpdateInstances([newInstance]);
    return null;
  }

  const addNewInstance = () => {
    const newInstance: SectionInstance = {
      id: `${section.id}-instance-${instances.length + 1}`,
      sectionId: section.id,
      instanceNumber: instances.length + 1,
      selectedItems: [],
      showContinuation: true,
      continuationText: 'continued',
      title: `${section.title} (continued)`
    };
    onUpdateInstances([...instances, newInstance]);
    setActiveInstance(instances.length);
  };

  const removeInstance = (instanceIndex: number) => {
    if (instances.length <= 1) return; // Can't remove the last instance
    
    const newInstances = instances.filter((_, index) => index !== instanceIndex);
    // Renumber instances
    const renumberedInstances = newInstances.map((instance, index) => ({
      ...instance,
      instanceNumber: index + 1,
      id: `${section.id}-instance-${index + 1}`
    }));
    
    onUpdateInstances(renumberedInstances);
    setActiveInstance(Math.min(activeInstance, renumberedInstances.length - 1));
  };

  const updateInstance = (instanceIndex: number, updates: Partial<SectionInstance>) => {
    const newInstances = [...instances];
    newInstances[instanceIndex] = { ...newInstances[instanceIndex], ...updates };
    onUpdateInstances(newInstances);
  };

  const toggleItemSelection = (instanceIndex: number, itemId: string) => {
    const instance = instances[instanceIndex];
    const selectedItems = instance.selectedItems.includes(itemId)
      ? instance.selectedItems.filter(id => id !== itemId)
      : [...instance.selectedItems, itemId];
    
    updateInstance(instanceIndex, { selectedItems });
  };

  const currentInstance = instances[activeInstance];

  return (
    <div className="section-splitting-overlay">
      <div className="section-splitting-modal">
        <div className="modal-header">
          <h3>Split Section: {section.title}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="modal-body">
          <div className="instance-tabs">
            {instances.map((instance, index) => (
              <button
                key={instance.id}
                className={`instance-tab ${index === activeInstance ? 'active' : ''}`}
                onClick={() => setActiveInstance(index)}
              >
                Instance {instance.instanceNumber}
                {instances.length > 1 && (
                  <button
                    className="remove-instance"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeInstance(index);
                    }}
                  >
                    ×
                  </button>
                )}
              </button>
            ))}
            <button onClick={addNewInstance} className="add-instance-button">
              + Add Instance
            </button>
          </div>

          <div className="instance-config">
            <div className="instance-settings">
              <div className="setting-group">
                <label>
                  Title:
                  <input
                    type="text"
                    value={currentInstance.title || section.title}
                    onChange={(e) => updateInstance(activeInstance, { title: e.target.value })}
                  />
                </label>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={currentInstance.showContinuation}
                    onChange={(e) => updateInstance(activeInstance, { showContinuation: e.target.checked })}
                  />
                  Show continuation indicator
                </label>
              </div>

              {currentInstance.showContinuation && (
                <div className="setting-group">
                  <label>
                    Continuation text:
                    <input
                      type="text"
                      value={currentInstance.continuationText || 'continued'}
                      onChange={(e) => updateInstance(activeInstance, { continuationText: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="item-selection">
              <h4>
                {section.type === 'skills' 
                  ? `Select Categories for Instance ${currentInstance.instanceNumber}:`
                  : `Select Items for Instance ${currentInstance.instanceNumber}:`
                }
              </h4>
              <div className="items-list">
                {itemsWithIds.map((item) => {
                  const isSelected = currentInstance.selectedItems.includes(item.id);
                  const displayTitle = getItemDisplayTitle(item, section.type);
                  const displayOrganization = getItemDisplayOrganization(item, section.type);
                  const displayDates = getItemDisplayDates(item);
                  
                  return (
                    <div
                      key={item.id}
                      className={`item-card ${isSelected ? 'selected' : ''} ${section.type === 'skills' ? 'skills-category' : ''}`}
                      onClick={() => toggleItemSelection(activeInstance, item.id)}
                    >
                      <div className="item-header">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by onClick of parent
                        />
                        <span className="item-title">{displayTitle}</span>
                      </div>
                      {displayOrganization && (
                        <div className="item-organization">{displayOrganization}</div>
                      )}
                      {displayDates && (
                        <div className="item-dates">{displayDates}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-button">Cancel</button>
          <button onClick={onClose} className="apply-button">Apply Changes</button>
        </div>
      </div>
    </div>
  );
};
