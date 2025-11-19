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

// Template registry for different education section types
export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  component: React.FC<any>;
}

export const EducationTemplates = {
  standard: {
    id: 'education-standard',
    name: 'Modern Standard',
    description: 'Clean, modern flat design with optimal spacing',
    component: ({ section }: { section: Section }) => (
      <div className="section education standard-modern">
        <h2>{section.title}</h2>
        <div className="education-list-modern">
          {section.items?.map((item, index) => (
            <div key={index} className="education-item-modern">
              <div className="education-header-modern">
                <div className="education-main-info">
                  <div className="degree-modern">{item.degree}</div>
                  <div className="institution-modern">{item.institution || item.organization}</div>
                </div>
                <div className="education-meta-info">
                  <div className="dates-modern">{item.dates}</div>
                  {item.location && (
                    <div className="location-modern">{item.location}</div>
                  )}
                  {item.gpa && (
                    <div className="gpa-modern">GPA: {item.gpa}</div>
                  )}
                </div>
              </div>
              {item.details && item.details.length > 0 && (
                <ul className="education-details-modern">
                  {item.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="detail-item-modern">
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
                    <i className="fa fa-university"></i> {item.institution || item.organization}
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
              <div className="compact-header">
                <span className="degree-compact">{item.degree}</span>
                <span className="institution-compact">{item.institution || item.organization}</span>
              </div>
              <div className="compact-meta">
                <span className="dates-compact">{item.dates}</span>
                {item.gpa && <span className="gpa-compact">GPA: {item.gpa}</span>}
              </div>
              {item.details && item.details.length > 0 && (
                <ul className="details-compact">
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
              <div className="timeline-content">
                <div className="timeline-date">{item.dates}</div>
                <div className="timeline-institution">{item.institution || item.organization}</div>
                <div className="timeline-degree">
                  {item.degree}
                  {item.gpa && (
                    <span className="timeline-gpa-inline"> • <strong>GPA:</strong> {item.gpa}</span>
                  )}
                </div>
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
                <strong>{item.degree}</strong> • {item.institution || item.organization} • {item.dates}
                {item.location && <span className="location-inline"> • {item.location}</span>}
                {item.gpa && <span className="gpa-inline"> • <strong>GPA:</strong> {item.gpa}</span>}
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

  clean: {
    id: 'education-clean',
    name: 'Clean Modern',
    description: 'Streamlined modern layout with subtle accents',
    component: ({ section }: { section: Section }) => (
      <div className="section education clean-modern">
        <h2>{section.title}</h2>
        <div className="education-clean-list">
          {section.items?.map((item, index) => (
            <div key={index} className="education-item-clean">
              <div className="education-clean-header">
                <div className="degree-clean">{item.degree}</div>
                <div className="dates-clean">{item.dates}</div>
              </div>
              <div className="institution-clean">{item.institution || item.organization}</div>
              <div className="education-clean-meta">
                {item.location && (
                  <span className="location-clean">{item.location}</span>
                )}
                {item.gpa && (
                  <span className="gpa-clean">GPA: {item.gpa}</span>
                )}
              </div>
              {item.details && item.details.length > 0 && (
                <div className="education-details-clean">
                  {item.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="detail-clean">
                      {detail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  sleek: {
    id: 'education-sleek',
    name: 'Sleek Flat',
    description: 'Ultra-modern flat design with perfect typography',
    component: ({ section }: { section: Section }) => (
      <div className="section education sleek-flat">
        <h2>{section.title}</h2>
        <div className="education-sleek-list">
          {section.items?.map((item, index) => (
            <div key={index} className="education-item-sleek">
              <div className="education-sleek-main">
                <div className="degree-sleek">{item.degree}</div>
                <div className="institution-sleek">{item.institution || item.organization}</div>
                <div className="education-sleek-footer">
                  <span className="dates-sleek">{item.dates}</span>
                  {item.location && (
                    <>
                      <span className="separator-sleek">|</span>
                      <span className="location-sleek">{item.location}</span>
                    </>
                  )}
                  {item.gpa && (
                    <>
                      <span className="separator-sleek">|</span>
                      <span className="gpa-sleek">GPA {item.gpa}</span>
                    </>
                  )}
                </div>
              </div>
              {item.details && item.details.length > 0 && (
                <div className="education-details-sleek">
                  {item.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="detail-sleek">
                      {detail}
                    </div>
                  ))}
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
                <div className="sidebar-institution">{item.institution || item.organization}</div>
                {item.location && <div className="sidebar-location">{item.location}</div>}
                {item.gpa && (
                  <div className="sidebar-gpa">
                    <strong>GPA:</strong> {item.gpa}
                  </div>
                )}
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
                <i className="fa fa-university"></i> {item.institution || item.organization}
              </div>
              {item.location && (
                <div className="card-location">
                  <i className="fa fa-map-marker"></i> {item.location}
                </div>
              )}
              {item.gpa && (
                <div className="card-gpa">
                  <i className="fa fa-star"></i> <strong>GPA:</strong> {item.gpa}
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
                {item.institution || item.organization}
                {item.location && <div className="table-location">{item.location}</div>}
                {item.gpa && <div className="table-gpa"><strong>GPA:</strong> {item.gpa}</div>}
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
                <span className="badge-institution">{item.institution || item.organization}</span>
                <span className="badge-dates">({item.dates})</span>
              </div>
              {item.location && (
                <div className="badge-location">{item.location}</div>
              )}
              {item.gpa && (
                <div className="badge-gpa">
                  <strong>GPA:</strong> {item.gpa}
                </div>
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
