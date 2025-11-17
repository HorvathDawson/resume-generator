import React from 'react';
import type { Section } from '../../types/resume';

interface ReferencesTemplateProps {
  section: Section & { type: 'references' };
}

export const ReferencesTemplate: React.FC<ReferencesTemplateProps> = ({ section }) => {
  if (!section.items || section.items.length === 0) {
    return (
      <div className="section references-section">
        <h2>{section.title}</h2>
        <p>No references available</p>
      </div>
    );
  }

  return (
    <div className="section references-section">
      <h2>{section.title}</h2>
      <div className="references-list">
        {section.items.map((item) => (
          <div key={item.id} className="reference-item">
            <div className="reference-name">{item.title}</div>
            {item.organization && (
              <div className="reference-title">{item.organization}</div>
            )}
            {(item.phone || item.email) && (
              <div className="reference-contact">
                {item.phone && <span className="reference-phone">{item.phone}</span>}
                {item.phone && item.email && <span className="contact-separator"> | </span>}
                {item.email && <span className="reference-email">{item.email}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
