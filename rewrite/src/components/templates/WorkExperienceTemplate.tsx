import React from 'react';
import type { Section, SectionItem } from '../../types/resume';

interface WorkExperienceTemplateProps {
  section: Section & { type: 'experience' };
  isContinuation?: boolean;
}

export const WorkExperienceTemplate: React.FC<WorkExperienceTemplateProps> = ({ 
  section, 
  isContinuation = false 
}) => {
  return (
    <div className="section experience">
      {isContinuation ? (
        <h2>
          {section.title} <span className="continuation">(continued)</span>
        </h2>
      ) : (
        <h2>{section.title}</h2>
      )}
      <ul>
        {section.items.map((item: SectionItem, index: number) => (
          <li key={index}>
            <div className="experience-header">
              <div className="first-row">
                <div className="fw-bold">{item.organization}</div>
                <span>{item.title}</span>
              </div>
              <div className="second-row">
                <i className="fa fa-calendar"></i> {item.dates}
              </div>
            </div>
            {item.details && item.details.length > 0 && (
              <div className="experience-body">
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
