import React from 'react';
import type { Section } from '../../types/resume';

interface TextTemplateProps {
  section: Section & { type: 'text' };
}

export const TextTemplate: React.FC<TextTemplateProps> = ({ section }) => {
  const content = section.customFields?.content || 
                 (section.items?.[0]?.description) || 
                 'No content available';

  return (
    <div className="section text-section">
      <h2>{section.title}</h2>
      <div className="text-content">
        <p>{content}</p>
      </div>
    </div>
  );
};
