import type { Section } from '../../types/resume';

// Standard awards template
export const AwardsStandardTemplate = ({ section }: { section: Section }) => (
  <div className="section awards-section">
    <h2>{section.title || 'Awards & Recognition'}</h2>
    <div className="awards-standard-list">
      {section.items?.map((item, index) => (
        <div key={index} className="award-item">
          <div className="award-header">
            <div className="award-title">{item.title}</div>
            <div className="award-dates">{item.dates}</div>
          </div>
          <div className="award-organization">{item.organization}</div>
          {item.description && (
            <div className="award-description">{item.description}</div>
          )}
        </div>
      )) || []}
    </div>
  </div>
);

// Compact awards template
export const AwardsCompactTemplate = ({ section }: { section: Section }) => (
  <div className="section awards-section awards-compact">
    <h2>{section.title || 'Awards & Recognition'}</h2>
    <div className="awards-compact-list">
      {section.items?.map((item, index) => (
        <div key={index} className="award-item-compact">
          <div className="award-line">
            <strong className="award-title-compact">{item.title}</strong>
            <span className="award-org-compact">{item.organization}</span>
            <span className="award-dates-compact">({item.dates})</span>
          </div>
          {item.description && (
            <div className="award-description-compact">{item.description}</div>
          )}
        </div>
      )) || []}
    </div>
  </div>
);

// Timeline awards template
export const AwardsTimelineTemplate = ({ section }: { section: Section }) => (
  <div className="section experience">
    <h2>{section.title || 'Awards & Recognition'}</h2>
    <ul>
      {section.items?.map((item, index) => (
        <li key={index}>
          <div className="experience-header">
            <div className="first-row">
              <div className="fw-bold">{item.title}</div>
              <span>{item.organization}</span>
            </div>
            <div className="second-row">
              <i className="fa fa-calendar"></i> {item.dates}
            </div>
          </div>
          {item.description && (
            <div className="experience-body">
              <p>{item.description}</p>
            </div>
          )}
        </li>
      )) || []}
    </ul>
  </div>
);

// Badge awards template (outline style)
export const AwardsBadgeTemplate = ({ section }: { section: Section }) => (
  <div className="section awards-section awards-badge">
    <h2>{section.title || 'Awards & Recognition'}</h2>
    <div className="awards-badge-container">
      {section.items?.map((item, index) => (
        <div key={index} className="award-badge-item">
          <div className="badge-main">
            <span className="badge-icon">🏆</span>
            <span className="badge-title">{item.title}</span>
            <span className="badge-year">'{item.dates?.slice(-2) || '23'}</span>
          </div>
          <div className="badge-organization">{item.organization}</div>
          {item.description && (
            <div className="badge-description">
              {item.description}
            </div>
          )}
        </div>
      )) || []}
    </div>
  </div>
);

// Minimal awards template
export const AwardsMinimalTemplate = ({ section }: { section: Section }) => (
  <div className="section awards-section awards-minimal">
    <h2>{section.title || 'Awards & Recognition'}</h2>
    <div className="awards-minimal-list">
      {section.items?.map((item, index) => (
        <div key={index} className="award-minimal-item">
          <div className="minimal-row">
            <span className="minimal-title">{item.title}</span>
            <span className="minimal-separator">—</span>
            <span className="minimal-org">{item.organization}</span>
            <span className="minimal-dates">({item.dates})</span>
          </div>
        </div>
      )) || []}
    </div>
  </div>
);

// Sidebar awards template
export const AwardsSidebarTemplate = ({ section }: { section: Section }) => (
  <div className="section awards-section awards-sidebar">
    <h2>{section.title || 'Awards & Recognition'}</h2>
    <div className="awards-sidebar-list">
      {section.items?.map((item, index) => (
        <div key={index} className="award-sidebar-item">
          <div className="sidebar-date-column">
            <div className="sidebar-dates">{item.dates}</div>
          </div>
          <div className="sidebar-content-column">
            <h3 className="sidebar-title">{item.title}</h3>
            <div className="sidebar-organization">{item.organization}</div>
            {item.description && (
              <div className="sidebar-description">
                {item.description}
              </div>
            )}
          </div>
        </div>
      )) || []}
    </div>
  </div>
);

// Modern awards template
export const AwardsModernTemplate = ({ section }: { section: Section }) => (
  <div className="section awards-section awards-modern">
    <h2>{section.title || 'Awards & Recognition'}</h2>
    <div className="awards-modern-list">
      {section.items?.map((item, index) => (
        <div key={index} className="award-modern-item">
          <div className="modern-header">
            <div className="modern-icon-container">
              <div className="modern-icon">
                <i className="fas fa-award"></i>
              </div>
            </div>
            <div className="modern-content">
              <h3 className="modern-title">{item.title}</h3>
              <div className="modern-meta">
                <span className="modern-organization">{item.organization}</span>
                <span className="modern-dot">•</span>
                <span className="modern-dates">{item.dates}</span>
              </div>
            </div>
          </div>
          {item.description && (
            <div className="modern-description">
              {item.description}
            </div>
          )}
        </div>
      )) || []}
    </div>
  </div>
);

// Template registry for awards
export const AwardsTemplates = {
  standard: {
    id: 'awards-standard',
    name: 'Standard Awards',
    description: 'Traditional awards layout with clear hierarchy',
    component: AwardsStandardTemplate
  },
  
  compact: {
    id: 'awards-compact',
    name: 'Compact Awards',
    description: 'Space-efficient awards format',
    component: AwardsCompactTemplate
  },
  
  timeline: {
    id: 'awards-timeline',
    name: 'Timeline Awards',
    description: 'Timeline-style awards with visual flow',
    component: AwardsTimelineTemplate
  },
  
  badge: {
    id: 'awards-badge',
    name: 'Badge Awards',
    description: 'Modern badge-style awards with emojis',
    component: AwardsBadgeTemplate
  },
  
  minimal: {
    id: 'awards-minimal',
    name: 'Minimal Awards',
    description: 'Clean minimal awards format',
    component: AwardsMinimalTemplate
  },
  
  sidebar: {
    id: 'awards-sidebar',
    name: 'Sidebar Awards',
    description: 'Two-column layout with dates on side',
    component: AwardsSidebarTemplate
  },
  
  modern: {
    id: 'awards-modern',
    name: 'Modern Awards',
    description: 'Contemporary awards design with icons',
    component: AwardsModernTemplate
  }
};
