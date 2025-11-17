import React, { useState, useRef, useEffect } from 'react';
import { TEMPLATE_REGISTRY, type TemplateOption } from './templates/TemplateRegistry';
import './SectionTemplateSelector.css';

interface SectionTemplateSelectorProps {
  sectionId: string;
  sectionType: string;
  currentTemplateId?: string;
  onTemplateChange: (sectionId: string, templateId: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export const SectionTemplateSelector: React.FC<SectionTemplateSelectorProps> = ({
  sectionId,
  sectionType,
  currentTemplateId,
  onTemplateChange,
  onClose,
  position
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get available templates for this section type
  const availableTemplates = TEMPLATE_REGISTRY[sectionType] || [];

  // Calculate optimal position to keep popup on screen
  useEffect(() => {
    if (dropdownRef.current) {
      const popup = dropdownRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y;
      
      // Adjust horizontal position if popup would go off right edge
      if (position.x + rect.width > viewportWidth - 20) {
        newX = viewportWidth - rect.width - 20;
      }
      
      // Adjust horizontal position if popup would go off left edge
      if (newX < 20) {
        newX = 20;
      }
      
      // Adjust vertical position if popup would go off bottom edge
      if (position.y + rect.height > viewportHeight - 20) {
        newY = viewportHeight - rect.height - 20;
      }
      
      // Adjust vertical position if popup would go off top edge
      if (newY < 20) {
        newY = 20;
      }
      
      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150); // Allow fade out animation
  };

  const handleTemplateSelect = (templateId: string) => {
    onTemplateChange(sectionId, templateId);
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="section-template-selector"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <div className="template-selector-header">
        <h4>Select Template</h4>
        <button 
          className="close-button"
          onClick={handleClose}
          aria-label="Close template selector"
        >
          ×
        </button>
      </div>
      
      <div className="template-options">
        {availableTemplates.length === 0 ? (
          <div className="no-templates">
            No templates available for {sectionType}
          </div>
        ) : (
          availableTemplates.map((template: TemplateOption) => (
            <button
              key={template.id}
              className={`template-option ${
                currentTemplateId === template.id ? 'selected' : ''
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className="template-info">
                <span className="template-name">{template.name}</span>
                <span className="template-description">{template.description}</span>
              </div>
              {currentTemplateId === template.id && (
                <div className="current-indicator">
                  <i className="fa fa-check" />
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
