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

// Template registry for different experience section types
export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  component: React.FC<any>;
}

export const ExperienceTemplates = {
  detailed: {
    id: 'experience-detailed',
    name: 'Detailed Format',
    description: 'Comprehensive experience layout',
    component: ({ section }: { section: Section }) => (
      <div className="section experience detailed">
        <h2>{section.title}</h2>
        <ul>
          {section.items?.map((item, index) => (
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
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  },
  
  minimal: {
    id: 'experience-minimal',
    name: 'Minimal Format',
    description: 'Clean, minimal experience layout',
    component: ({ section }: { section: Section }) => (
      <div className="section experience minimal">
        <h2>{section.title}</h2>
        <div className="experience-minimal-list">
          {section.items?.map((item, index) => (
            <div key={index} className="experience-item-minimal">
              <div className="exp-header-minimal">
                <strong>{item.title}</strong> at {item.organization} <em>({item.dates})</em>
              </div>
              {item.details && item.details.length > 0 && (
                <div className="exp-summary">{item.details[0]}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },
  
  timeline: {
    id: 'experience-timeline',
    name: 'Timeline Format',
    description: 'Timeline-style layout with dots and lines (matches original)',
    component: ({ section, isContinuation }: { section: Section, isContinuation?: boolean }) => (
      <div className="section experience">
        <h2>
          {section.title}
          {isContinuation && <span className="continuation"> (continued)</span>}
        </h2>
        <ul>
          {section.items?.map((item, index) => (
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
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  },
  
  cards: {
    id: 'experience-cards',
    name: 'Card Format',
    description: 'Card-based experience layout',
    component: ({ section }: { section: Section }) => (
      <div className="section experience cards">
        <h2>{section.title}</h2>
        <div className="experience-cards-grid">
          {section.items?.map((item, index) => (
            <div key={index} className="experience-card">
              <div className="card-title-row">
                <div className="card-left-column">
                  <div className="card-position">{item.title}</div>
                  <div className="card-company">{item.organization}</div>
                </div>
                <div className="card-dates">{item.dates}</div>
              </div>
              {item.details && item.details.length > 0 && (
                <div className="card-details">
                  {item.details.slice(0, 2).map((detail, detailIndex) => (
                    <div key={detailIndex} className="card-detail">{detail}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  compact: {
    id: 'experience-compact',
    name: 'Compact',
    description: 'Ultra-compact experience with minimal spacing',
    component: ({ section }: { section: Section }) => (
      <div className="section experience-compact">
        <h2>{section.title}</h2>
        <div className="experience-compact-list">
          {section.items?.map((item, index) => (
            <div key={index} className="experience-item-compact">
              <div>
                <strong>
                  {item.title}
                </strong>
                <span>
                  {item.dates}
                </span>
              </div>
              <div>
                {item.organization} {item.location && `• ${item.location}`}
              </div>
              {item.details && item.details.length > 0 && (
                <div>
                  {item.details.slice(0, 2).join(' • ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  sidebar: {
    id: 'experience-sidebar',
    name: 'Sidebar Layout',
    description: 'Two-column layout with dates on left',
    component: ({ section }: { section: Section }) => (
      <div className="section experience-sidebar">
        <h2>{section.title}</h2>
        <div className="experience-sidebar-list">
          {section.items?.map((item, index) => (
            <div key={index}>
              <div>
                {item.dates}
              </div>
              <div>
                <h3>
                  {item.title}
                </h3>
                <div>
                  {item.organization} {item.location && `• ${item.location}`}
                </div>
                {item.details && item.details.length > 0 && (
                  <ul>
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },

  focused: {
    id: 'experience-focused',
    name: 'Achievement Focused',
    description: 'Emphasizes key achievements and results',
    component: ({ section }: { section: Section }) => (
      <div className="section experience-focused">
        <h2>{section.title}</h2>
        <div className="experience-focused-list">
          {section.items?.map((item, index) => (
            <div key={index}>
              <div>
                <h3>
                  {item.title}
                </h3>
                <span>
                  {item.dates}
                </span>
              </div>
              <div>
                {item.organization} {item.location && `• ${item.location}`}
              </div>
              {item.details && item.details.length > 0 && (
                <div>
                  <strong>Key Achievements:</strong>
                  <ul>
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  modern: {
    id: 'experience-modern',
    name: 'Modern Clean',
    description: 'Clean modern layout with accent colors',
    component: ({ section }: { section: Section }) => (
      <div className="section experience-modern">
        <h2>{section.title}</h2>
        <div className="experience-modern-list">
          {section.items?.map((item, index) => (
            <div key={index}>
              <div>
                <h3>
                  {item.title}
                </h3>
                <div>
                  {item.dates}
                </div>
              </div>
              <div>
                {item.organization} {item.location && `• ${item.location}`}
              </div>
              {item.details && item.details.length > 0 && (
                <ul>
                  {item.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
};
