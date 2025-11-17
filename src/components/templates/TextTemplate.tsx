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

// Template registry for different text section types
export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  component: React.FC<any>;
}

export const TextTemplates = {
  basic: {
    id: 'text-basic',
    name: 'Basic Paragraph',
    description: 'Simple paragraph text',
    component: ({ section }: { section: Section }) => {
      const content = (section as any).content || 
                     section.customFields?.content || 
                     (section.items?.[0]?.content) ||
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
    }
  },
  
  highlighted: {
    id: 'text-highlighted',
    name: 'Highlighted Text',
    description: 'Text with highlighted background',
    component: ({ section }: { section: Section }) => {
      const content = (section as any).content || 
                     section.customFields?.content || 
                     (section.items?.[0]?.content) ||
                     (section.items?.[0]?.description) || 
                     'No content available';
      return (
        <div className="section text-section highlighted">
          <h2>{section.title}</h2>
          <div className="text-content highlighted-content">
            <p>{content}</p>
          </div>
        </div>
      );
    }
  },
  
  quote: {
    id: 'text-quote',
    name: 'Quote Style',
    description: 'Text formatted as a quote',
    component: ({ section }: { section: Section }) => {
      const content = (section as any).content || 
                     section.customFields?.content || 
                     (section.items?.[0]?.content) ||
                     (section.items?.[0]?.description) || 
                     'No content available';
      return (
        <div className="section text-section quote-style">
          <h2>{section.title}</h2>
          <blockquote className="text-content quote-content">
            <p>{content}</p>
          </blockquote>
        </div>
      );
    }
  }
};
