import React from 'react';
import type { Section } from '../types/resume';
import { TEMPLATE_REGISTRY } from './templates/TemplateRegistry';

interface TemplateSelectorProps {
  section: Section;
  selectedTemplateId: string;
  onTemplateChange: (sectionId: string, templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  section,
  selectedTemplateId,
  onTemplateChange
}) => {
  const availableTemplates = TEMPLATE_REGISTRY[section.type] || [];

  return (
    <div className="template-selector">
      <label htmlFor={`template-${section.id}`} className="template-label">
        Template Style:
      </label>
      <select 
        id={`template-${section.id}`}
        value={selectedTemplateId} 
        onChange={(e) => onTemplateChange(section.id, e.target.value)}
        className="template-select"
      >
        {availableTemplates.map((template: any) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      <div className="template-description">
        {availableTemplates.find((t: any) => t.id === selectedTemplateId)?.description || ''}
      </div>
    </div>
  );
};
