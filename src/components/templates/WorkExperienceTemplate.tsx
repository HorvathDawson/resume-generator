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
              <div className="card-header">
                <div className="card-title-row">
                  <div className="card-position">{item.title}</div>
                  <div className="card-dates">{item.dates}</div>
                </div>
                <div className="card-company">{item.organization}</div>
              </div>
              {item.details && item.details.length > 0 && (
                <div className="card-body">
                  {item.details.slice(0, 3).map((detail, detailIndex) => (
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
        <h2 style={{ marginBottom: '0.25cm' }}>{section.title}</h2>
        <div className="experience-compact-list">
          {section.items?.map((item, index) => (
            <div key={index} className="experience-item-compact" style={{ 
              marginBottom: '0.2cm',
              fontSize: '0.32cm'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '0.05cm'
              }}>
                <strong style={{ color: 'var(--primary-color, #2c5aa0)' }}>
                  {item.title}
                </strong>
                <span style={{ fontSize: '0.3cm', opacity: '0.8' }}>
                  {item.dates}
                </span>
              </div>
              <div style={{ 
                fontStyle: 'italic', 
                marginBottom: '0.05cm',
                fontSize: '0.31cm'
              }}>
                {item.organization} {item.location && `• ${item.location}`}
              </div>
              {item.details && item.details.length > 0 && (
                <div style={{ fontSize: '0.3cm', lineHeight: '1.3' }}>
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
            <div key={index} style={{ 
              display: 'flex',
              marginBottom: '0.4cm',
              gap: '0.5cm'
            }}>
              <div style={{ 
                minWidth: '2.5cm',
                fontSize: '0.3cm',
                color: 'var(--primary-color, #2c5aa0)',
                fontWeight: '600',
                textAlign: 'right'
              }}>
                {item.dates}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  marginBottom: '0.1cm',
                  fontSize: '0.38cm'
                }}>
                  {item.title}
                </h3>
                <div style={{ 
                  fontStyle: 'italic',
                  marginBottom: '0.15cm',
                  fontSize: '0.33cm'
                }}>
                  {item.organization} {item.location && `• ${item.location}`}
                </div>
                {item.details && item.details.length > 0 && (
                  <ul style={{ 
                    marginLeft: '0.5cm',
                    fontSize: '0.32cm',
                    lineHeight: '1.4'
                  }}>
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex} style={{ marginBottom: '0.1cm' }}>
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
            <div key={index} style={{ marginBottom: '0.5cm' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '0.1cm'
              }}>
                <h3 style={{ 
                  color: 'var(--primary-color, #2c5aa0)',
                  fontSize: '0.4cm'
                }}>
                  {item.title}
                </h3>
                <span style={{ 
                  fontWeight: '600',
                  fontSize: '0.32cm'
                }}>
                  {item.dates}
                </span>
              </div>
              <div style={{ 
                marginBottom: '0.2cm',
                fontSize: '0.34cm',
                fontWeight: '500'
              }}>
                {item.organization} {item.location && `• ${item.location}`}
              </div>
              {item.details && item.details.length > 0 && (
                <div style={{ 
                  backgroundColor: 'var(--secondary-color, #f8f9fa)',
                  padding: '0.2cm',
                  borderRadius: '0.1cm',
                  fontSize: '0.32cm',
                  lineHeight: '1.4'
                }}>
                  <strong>Key Achievements:</strong>
                  <ul style={{ marginTop: '0.1cm', marginLeft: '0.5cm' }}>
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex} style={{ marginBottom: '0.05cm' }}>
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
            <div key={index} style={{ 
              marginBottom: '0.6cm',
              paddingLeft: '0.3cm',
              borderLeft: '0.05cm solid var(--primary-color, #4a90e2)'
            }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.5cm',
                alignItems: 'baseline',
                marginBottom: '0.1cm'
              }}>
                <h3 style={{ 
                  fontSize: '0.38cm',
                  fontWeight: '700',
                  color: 'var(--text-color, #333)'
                }}>
                  {item.title}
                </h3>
                <div style={{ 
                  backgroundColor: 'var(--primary-color, #4a90e2)',
                  color: 'white',
                  padding: '0.05cm 0.2cm',
                  borderRadius: '0.3cm',
                  fontSize: '0.28cm',
                  fontWeight: '600'
                }}>
                  {item.dates}
                </div>
              </div>
              <div style={{ 
                fontSize: '0.34cm',
                fontWeight: '500',
                color: 'var(--primary-color, #2c5aa0)',
                marginBottom: '0.15cm'
              }}>
                {item.organization} {item.location && `• ${item.location}`}
              </div>
              {item.details && item.details.length > 0 && (
                <ul style={{ 
                  fontSize: '0.32cm',
                  lineHeight: '1.5',
                  marginLeft: '0.4cm'
                }}>
                  {item.details.map((detail, detailIndex) => (
                    <li key={detailIndex} style={{ 
                      marginBottom: '0.1cm',
                      position: 'relative'
                    }}>
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
