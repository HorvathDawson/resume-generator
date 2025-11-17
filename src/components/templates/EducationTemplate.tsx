import React from 'react';
import type { Section, SectionItem } from '../../types/resume';

interface EducationTemplateProps {
  section: Section & { type: 'education' };
  isContinuation?: boolean;
}

export const EducationTemplate: React.FC<EducationTemplateProps> = ({ 
  section, 
  isContinuation = false 
}) => {
  return (
    <div className="section education">
      {isContinuation ? (
        <h2>
          {section.title} <span className="continuation">(continued)</span>
        </h2>
      ) : (
        <h2>{section.title}</h2>
      )}
      <ul className="education-list">
        {section.items.map((item: SectionItem, index: number) => (
          <li key={index} className="education-item">
            <div className="education-item-header">
              <div className="institution fw-bold">{item.institution}</div>
              <div className="degree">{item.degree}</div>
              <div className="location small-text">{item.location}</div>
              <div className="dates small-text">
                <i className="fa fa-calendar"></i> {item.dates}
              </div>
            </div>
            {item.details && item.details.length > 0 && (
              <div className="education-details">
                <ul>
                  {item.details.map((detail: string, detailIndex: number) => (
                    <li key={detailIndex}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
