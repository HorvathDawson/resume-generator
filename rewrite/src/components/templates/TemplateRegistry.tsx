import React from 'react';
import type { Section } from '../../types/resume';

// Template registry for different section types
export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  component: React.FC<any>;
}

export interface TemplateRegistry {
  [sectionType: string]: TemplateOption[];
}

// Basic text templates
export const TextTemplates = {
  basic: {
    id: 'text-basic',
    name: 'Basic Paragraph',
    description: 'Simple paragraph text',
    component: ({ section }: { section: Section }) => {
      const content = (section as any).content || 
                     section.customFields?.content || 
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
      const content = section.customFields?.content || 
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

// Education templates
export const EducationTemplates = {
  standard: {
    id: 'education-standard',
    name: 'Standard Layout',
    description: 'Traditional education format',
    component: ({ section }: { section: Section }) => (
      <div className="section education standard">
        <h2>{section.title}</h2>
        <ul className="education-list">
          {section.items?.map((item, index) => (
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
  
  wide: {
    id: 'education-wide',
    name: 'Wide Layout',
    description: 'Horizontal education format with inline details',
    component: ({ section }: { section: Section }) => (
      <div className="section education-wide">
        <h2>{section.title}</h2>
        {section.items?.map((item, index) => (
          <div key={index} className="education-item-wide">
            <div className="education-row">
              <div className="education-main">
                <h3>{item.degree}</h3>
                <div className="education-institution-line">
                  <span className="institution">
                    <i className="fa fa-university"></i> {item.institution}
                  </span>
                  {item.location && (
                    <span className="location optional">
                      <i className="fa fa-map-marker"></i> {item.location}
                    </span>
                  )}
                  <span className="dates">
                    <i className="fa fa-calendar"></i> {item.dates}
                  </span>
                  {item.gpa && <span className="gpa">GPA: {item.gpa}</span>}
                </div>
              </div>
              {item.details && item.details.length > 0 && (
                <div className="education-details-wide">
                  <ul>
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  },
  
  compact: {
    id: 'education-compact',
    name: 'Compact Layout',
    description: 'Space-efficient education format',
    component: ({ section }: { section: Section }) => (
      <div className="section education compact">
        <h2>{section.title}</h2>
        <div className="education-compact-list">
          {section.items?.map((item, index) => (
            <div key={index} className="education-item-compact">
              <strong>{item.institution}</strong> - {item.degree} ({item.dates})
              {item.details && item.details.length > 0 && (
                <div className="education-details-compact">
                  {item.details.join(' • ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },
  
  timeline: {
    id: 'education-timeline',
    name: 'Timeline Style',
    description: 'Timeline-based education format',
    component: ({ section }: { section: Section }) => (
      <div className="section education timeline">
        <h2>{section.title}</h2>
        <div className="education-timeline">
          {section.items?.map((item, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-date">{item.dates}</div>
                <div className="timeline-institution">{item.institution}</div>
                <div className="timeline-degree">{item.degree}</div>
                {item.details && item.details.length > 0 && (
                  <ul className="timeline-details">
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
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

  minimal: {
    id: 'education-minimal',
    name: 'Minimal Format',
    description: 'Ultra-clean education layout with minimal spacing',
    component: ({ section }: { section: Section }) => (
      <div className="section education minimal">
        <h2>{section.title}</h2>
        <div className="education-minimal-list">
          {section.items?.map((item, index) => (
            <div key={index} className="education-item-minimal">
              <div className="education-row-minimal">
                <strong>{item.degree}</strong> • {item.institution} • {item.dates}
                {item.location && <span className="location-inline"> • {item.location}</span>}
              </div>
              {item.details && item.details.length > 0 && (
                <div className="education-details-minimal">
                  {item.details.join(' • ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  sidebar: {
    id: 'education-sidebar',
    name: 'Sidebar Layout',
    description: 'Two-column education format with dates on the side',
    component: ({ section }: { section: Section }) => (
      <div className="section education sidebar">
        <h2>{section.title}</h2>
        <div className="education-sidebar-list">
          {section.items?.map((item, index) => (
            <div key={index} className="education-item-sidebar">
              <div className="education-date-column">
                <div className="sidebar-dates">{item.dates}</div>
              </div>
              <div className="education-content-column">
                <div className="sidebar-degree">{item.degree}</div>
                <div className="sidebar-institution">{item.institution}</div>
                {item.location && <div className="sidebar-location">{item.location}</div>}
                {item.details && item.details.length > 0 && (
                  <ul className="sidebar-details">
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
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

  cards: {
    id: 'education-cards',
    name: 'Card Layout',
    description: 'Card-based education format with visual separation',
    component: ({ section }: { section: Section }) => (
      <div className="section education cards">
        <h2>{section.title}</h2>
        <div className="education-cards-grid">
          {section.items?.map((item, index) => (
            <div key={index} className="education-card">
              <div className="card-header">
                <h3 className="card-degree">{item.degree}</h3>
                <div className="card-dates">{item.dates}</div>
              </div>
              <div className="card-institution">
                <i className="fa fa-university"></i> {item.institution}
              </div>
              {item.location && (
                <div className="card-location">
                  <i className="fa fa-map-marker"></i> {item.location}
                </div>
              )}
              {item.details && item.details.length > 0 && (
                <ul className="card-details">
                  {item.details.map((detail, detailIndex) => (
                    <li key={detailIndex}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  table: {
    id: 'education-table',
    name: 'Table Format',
    description: 'Structured table-like education layout',
    component: ({ section }: { section: Section }) => (
      <div className="section education table">
        <h2>{section.title}</h2>
        <div className="education-table">
          <div className="table-header">
            <div className="col-degree">Degree</div>
            <div className="col-institution">Institution</div>
            <div className="col-dates">Dates</div>
          </div>
          {section.items?.map((item, index) => (
            <div key={index} className="table-row">
              <div className="col-degree">{item.degree}</div>
              <div className="col-institution">
                {item.institution}
                {item.location && <div className="table-location">{item.location}</div>}
              </div>
              <div className="col-dates">{item.dates}</div>
              {item.details && item.details.length > 0 && (
                <div className="table-details">
                  <ul>
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
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

  badge: {
    id: 'education-badge',
    name: 'Badge Style',
    description: 'Modern badge-style education format',
    component: ({ section }: { section: Section }) => (
      <div className="section education badge">
        <h2>{section.title}</h2>
        <div className="education-badge-list">
          {section.items?.map((item, index) => (
            <div key={index} className="education-badge-item">
              <div className="badge-main">
                <span className="badge-degree">{item.degree}</span>
                <span className="badge-separator">@</span>
                <span className="badge-institution">{item.institution}</span>
                <span className="badge-dates">({item.dates})</span>
              </div>
              {item.location && (
                <div className="badge-location">{item.location}</div>
              )}
              {item.details && item.details.length > 0 && (
                <div className="badge-details">
                  {item.details.map((detail, detailIndex) => (
                    <span key={detailIndex} className="badge-detail">
                      {detail}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
};

// Experience templates
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
                <h3>{item.title}</h3>
                <div className="card-company">{item.organization}</div>
                <div className="card-dates">{item.dates}</div>
              </div>
              {item.details && item.details.length > 0 && (
                <div className="card-body">
                  <ul>
                    {item.details.slice(0, 2).map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
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
              borderLeft: '0.05cm solid var(--accent-color, #4a90e2)'
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
                  backgroundColor: 'var(--accent-color, #4a90e2)',
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

// Skills templates
export const SkillsTemplates = {
  categorized: {
    id: 'skills-categorized',
    name: 'Categorized Skills',
    description: 'Skills organized by category',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || [];
      return (
        <div className="section skills-section categorized">
          <h2>{section.title}</h2>
          <div className="skills-content">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category">
                <h3 className="category-name">{category.name}</h3>
                <div className="skills-list">
                  {category.skills.map((skill: string, skillIndex: number) => (
                    <span key={skillIndex} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },
  
  wide: {
    id: 'skills-wide',
    name: 'Grid Layout',
    description: 'Skills in a responsive grid layout',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || [];
      return (
        <div className="section skills-wide">
          <h2>{section.title}</h2>
          <div className="skills-grid">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-wide">
                <h3>{category.name}</h3>
                <div className="tags-grid">
                  {category.skills.map((skill: string, skillIndex: number) => (
                    <span key={skillIndex} className="cvtag-wide">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },
  
  wide2: {
    id: 'skills-wide2',
    name: 'Inline Layout',
    description: 'Skills in horizontal lines by category',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || [];
      return (
        <div className="section skills-wide2">
          <h2>{section.title}</h2>
          <div className="skills-list">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-line">
                <span className="category-label">{category.name}:</span>
                <div className="tags-inline">
                  {category.skills.map((skill: string, skillIndex: number) => (
                    <span key={skillIndex} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  compact: {
    id: 'skills-compact',
    name: 'Compact',
    description: 'Ultra-compact skills layout with minimal spacing',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || [];
      return (
        <div className="section skills-compact" style={{ marginBottom: '0.3cm' }}>
          <h2 style={{ marginBottom: '0.2cm' }}>{section.title}</h2>
          <div className="skills-compact-content" style={{ lineHeight: '1.3' }}>
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-compact" style={{ 
                marginBottom: '0.1cm', 
                fontSize: '0.32cm' 
              }}>
                <strong style={{ 
                  fontWeight: '600', 
                  color: 'var(--primary-color, #2c5aa0)' 
                }}>
                  {category.name}:
                </strong>{' '}
                {category.skills.join(', ')}
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  minimal: {
    id: 'skills-minimal',
    name: 'Minimal Dots',
    description: 'Skills with bullet-separated format',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || [];
      return (
        <div className="section skills-minimal">
          <h2 style={{ marginBottom: '0.25cm' }}>{section.title}</h2>
          <div className="skills-minimal-content">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-minimal" style={{ 
                display: 'flex', 
                marginBottom: '0.15cm', 
                alignItems: 'baseline' 
              }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: 'var(--primary-color, #2c5aa0)',
                  minWidth: '3cm',
                  marginRight: '0.3cm',
                  fontSize: '0.33cm'
                }}>
                  {category.name}
                </span>
                <span style={{ 
                  fontSize: '0.32cm', 
                  lineHeight: '1.4' 
                }}>
                  {category.skills.join(' • ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },
  
  bars: {
    id: 'skills-bars',
    name: 'Progress Bars',
    description: 'Skills with progress indicators',
    component: ({ section }: { section: Section }) => {
      const categories = section.customFields?.categories || [];
      return (
        <div className="section skills-section bars">
          <h2>{section.title}</h2>
          <div className="skills-bars">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-bars">
                <h3 className="category-name">{category.name}</h3>
                <div className="skills-bar-list">
                  {category.skills.slice(0, 5).map((skill: string, skillIndex: number) => (
                    <div key={skillIndex} className="skill-bar-item">
                      <span className="skill-name">{skill}</span>
                      <div className="skill-progress">
                        <div className="skill-bar" style={{ width: `${85 + skillIndex * 3}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },
  
  cloud: {
    id: 'skills-cloud',
    name: 'Skills Cloud',
    description: 'Tag cloud style skills',
    component: ({ section }: { section: Section }) => {
      const categories = section.customFields?.categories || [];
      const allSkills = categories.flatMap((cat: any) => cat.skills);
      return (
        <div className="section skills-section cloud">
          <h2>{section.title}</h2>
          <div className="skills-cloud">
            {allSkills.map((skill: string, index: number) => (
              <span 
                key={index} 
                className="skill-cloud-tag"
                style={{ fontSize: `${0.8 + (index % 3) * 0.2}em` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      );
    }
  }
};

// Name templates
export const NameTemplates = {
  standard: {
    id: 'name-standard',
    name: 'Standard Name',
    description: 'Standard name display',
    component: ({ section }: { section: any }) => (
      <div className="name">
        <h1>{section.content?.fullName || section.content?.name || 'Name'}</h1>
      </div>
    )
  },
  
  centered: {
    id: 'name-centered',
    name: 'Centered Name',
    description: 'Centered name display',
    component: ({ section }: { section: any }) => (
      <div className="name centered">
        <h1>{section.content?.fullName || section.content?.name || 'Name'}</h1>
      </div>
    )
  }
};

// Personal Info templates
export const PersonalInfoTemplates = {
  standard: {
    id: 'personal-info-standard',
    name: 'Standard Contact',
    description: 'Vertical contact information',
    component: ({ personalInfo }: { personalInfo: any }) => (
      <div className="contact-info">
        <ul>
          {personalInfo.email && (
            <li className="contact">
              <div className="icons"><i className="fas fa-envelope"></i></div>
              <div className="words">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo.phone && (
            <li className="contact">
              <div className="icons"><i className="fas fa-phone"></i></div>
              <div className="words">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo.website && (
            <li className="contact">
              <div className="icons"><i className="fas fa-globe"></i></div>
              <div className="words">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo.github && (
            <li className="contact">
              <div className="icons"><i className="fab fa-github"></i></div>
              <div className="words">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo.linkedin && (
            <li className="contact">
              <div className="icons"><i className="fab fa-linkedin"></i></div>
              <div className="words">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo.location && (
            <li className="contact">
              <div className="icons"><i className="fas fa-map-marker-alt"></i></div>
              <div className="words">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },
  
  wide: {
    id: 'personal-info-wide',
    name: 'Horizontal Contact',
    description: 'Horizontal contact information line',
    component: ({ personalInfo }: { personalInfo: any }) => (
      <div className="contact-info-wide">
        <div className="contact-line">
          {personalInfo.email && (
            <span className="contact-item">
              <i className="fas fa-envelope"></i>
              <span className="contact-text">{personalInfo.email}</span>
            </span>
          )}
          {personalInfo.phone && (
            <span className="contact-item">
              <i className="fas fa-phone"></i>
              <span className="contact-text">{personalInfo.phone}</span>
            </span>
          )}
          {personalInfo.website && (
            <span className="contact-item">
              <i className="fas fa-globe"></i>
              <span className="contact-text">{personalInfo.website}</span>
            </span>
          )}
          {personalInfo.github && (
            <span className="contact-item">
              <i className="fab fa-github"></i>
              <span className="contact-text">{personalInfo.github}</span>
            </span>
          )}
          {personalInfo.linkedin && (
            <span className="contact-item">
              <i className="fab fa-linkedin"></i>
              <span className="contact-text">{personalInfo.linkedin}</span>
            </span>
          )}
          {personalInfo.location && (
            <span className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <span className="contact-text">{personalInfo.location}</span>
            </span>
          )}
        </div>
      </div>
    )
  }
};

// Certification templates (for both academic awards and professional certifications)
export const CertificationTemplates = {
  standard: {
    id: 'certification-standard',
    name: 'Standard List',
    description: 'Vertical list with details',
    component: ({ items, title = 'Certifications' }: { items: any[], title?: string }) => (
      <div className="section">
        <h2>{title}</h2>
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              <div className="award-item">
                <div className="award-name">{item.name}</div>
                {(item.organization || item.dates) && (
                  <div className="award-details">
                    {item.organization && <span className="organization">{item.organization}</span>}
                    {item.dates && <span className="dates">{item.dates}</span>}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  },
  
  simple: {
    id: 'certification-simple',
    name: 'Simple List',
    description: 'Simple bullet list',
    component: ({ items, title = 'Certifications' }: { items: any[], title?: string }) => (
      <div className="section">
        <h2>{title}</h2>
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item.name}</li>
          ))}
        </ul>
      </div>
    )
  },
  
  wide: {
    id: 'certification-wide',
    name: 'Horizontal Tags',
    description: 'Horizontal tag layout',
    component: ({ items, title = 'Certifications', isContinuation }: { items: any[], title?: string, isContinuation?: boolean }) => (
      <div className="section certifications-wide">
        <h2>
          {title}
          {isContinuation && <span className="continuation"> (continued)</span>}
        </h2>
        <div className="certifications-list">
          <div className="cert-line">
            <div className="tags-inline">
              {items.map((item, index) => (
                <span key={index} className="cert-tag">
                  {item.name}
                  {item.organization && ` (${item.organization})`}
                  {item.dates && ` - ${item.dates}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
};

// Academic Awards templates (use certification templates with different title)
export const AcademicAwardsTemplates = {
  standard: {
    ...CertificationTemplates.standard,
    id: 'academic-awards-standard',
    component: ({ items }: { items: any[] }) => 
      CertificationTemplates.standard.component({ items, title: 'Academic Awards' })
  },
  wide: {
    ...CertificationTemplates.wide,
    id: 'academic-awards-wide',
    component: ({ items, isContinuation }: { items: any[], isContinuation?: boolean }) => 
      CertificationTemplates.wide.component({ items, title: 'Academic Awards', isContinuation })
  }
};

// Padding templates for vertical spacing
export const PaddingTemplates = {
  small: {
    id: 'padding-small',
    name: 'Small Spacing',
    description: 'Small vertical space (0.5cm)',
    component: ({ section }: { section: Section }) => {
      const height = section.customFields?.height || '0.5cm';
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  medium: {
    id: 'padding-medium',
    name: 'Medium Spacing',
    description: 'Medium vertical space (1cm)',
    component: ({ section }: { section: Section }) => {
      const height = section.customFields?.height || '1cm';
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  large: {
    id: 'padding-large',
    name: 'Large Spacing',
    description: 'Large vertical space (2cm)',
    component: ({ section }: { section: Section }) => {
      const height = section.customFields?.height || '2cm';
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  },
  
  custom: {
    id: 'padding-custom',
    name: 'Custom Spacing',
    description: 'User-defined vertical space',
    component: ({ section }: { section: Section }) => {
      const height = section.customFields?.height || '1cm';
      return (
        <div className="section padding-section" style={{ height, minHeight: height }}>
          {/* Empty spacer element */}
        </div>
      );
    }
  }
};

// Template registry
export const TEMPLATE_REGISTRY: TemplateRegistry = {
  text: Object.values(TextTemplates),
  education: Object.values(EducationTemplates),
  experience: Object.values(ExperienceTemplates),
  projects: Object.values(ExperienceTemplates), // Projects can use experience templates
  skills: Object.values(SkillsTemplates),
  certifications: Object.values(CertificationTemplates),
  academic_awards: Object.values(AcademicAwardsTemplates),
  list: Object.values(TextTemplates),
  personal_info: Object.values(PersonalInfoTemplates),
  name: Object.values(NameTemplates),
  padding: Object.values(PaddingTemplates)
};
