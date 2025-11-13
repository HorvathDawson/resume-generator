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
  name: Object.values(NameTemplates)
};
