import React from 'react';
import type { Section } from '../../types/resume';

interface SkillsTemplateProps {
  section: Section & { type: 'skills' };
}

export const SkillsTemplate: React.FC<SkillsTemplateProps> = ({ section }) => {
  const categories = section.customFields?.categories || [];

  return (
    <div className="section skills-section">
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
};

// Template registry for different skills section types
export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  component: React.FC<any>;
}

export const SkillsTemplates = {
  mini: {
    id: 'skills-mini',
    name: 'Mini Tags',
    description: 'Extra small skill badges for space efficiency',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-mini">
          <h2>{section.title}</h2>
          <div className="skills-content">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category">
                <h3 className="category-name">{category.name}</h3>
                <div className="skills-list">
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    return (
                      <span key={skillIndex} className="skill-tag-mini">
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  simple: {
    id: 'skills-simple',
    name: 'Simple List',
    description: 'Clean text-only layout with comma separation',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-simple" style={{ marginBottom: '0.3cm' }}>
          <h2 style={{ marginBottom: '0.2cm' }}>{section.title}</h2>
          <div className="skills-simple-content" style={{ lineHeight: '1.4' }}>
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-simple" style={{ 
                marginBottom: '0.15cm', 
                fontSize: '0.33cm' 
              }}>
                <strong style={{ 
                  fontWeight: '600', 
                  color: 'var(--primary-color, #2c5aa0)',
                  marginRight: '0.2cm'
                }}>
                  {category.name}:
                </strong>
                <span style={{ color: '#4b5563' }}>
                  {category.skills.map((skill: any) => 
                    typeof skill === 'string' ? skill : skill.name || skill
                  ).join(', ')}
                </span>
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
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
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
                  lineHeight: '1.4',
                  color: '#4b5563'
                }}>
                  {category.skills.map((skill: any) => 
                    typeof skill === 'string' ? skill : skill.name || skill
                  ).join(' • ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  clean: {
    id: 'skills-clean',
    name: 'Clean Minimal',
    description: 'Ultra-clean layout with subtle spacing',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-clean" style={{ marginBottom: '0.4cm' }}>
          <h2 style={{ 
            marginBottom: '0.3cm',
            fontSize: 'var(--font-size-h2)',
            fontWeight: '600',
            color: '#111827'
          }}>
            {section.title}
          </h2>
          <div className="skills-clean-content">
            {categories.map((category: any, index: number) => (
              <div key={index} style={{ 
                marginBottom: '0.2cm',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.4cm'
              }}>
                <span style={{ 
                  fontWeight: '500', 
                  color: '#374151',
                  fontSize: '0.33cm',
                  minWidth: '2.5cm',
                  flexShrink: 0
                }}>
                  {category.name}
                </span>
                <span style={{ 
                  fontSize: '0.32cm',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  flex: 1
                }}>
                  {category.skills.map((skill: any) => 
                    typeof skill === 'string' ? skill : skill.name || skill
                  ).join(' · ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  lines: {
    id: 'skills-lines',
    name: 'Clean Lines',
    description: 'Skills separated by subtle lines - modern and minimal',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-lines">
          <h2>{section.title}</h2>
          <div className="skills-lines-content">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-line-group" style={{ 
                marginBottom: '0.25cm',
                paddingBottom: '0.15cm',
                borderBottom: index < categories.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <h3 style={{ 
                  fontSize: '0.38cm',
                  fontWeight: '600', 
                  color: 'var(--primary-color, #2c5aa0)',
                  marginBottom: '0.1cm',
                  letterSpacing: '0.02cm'
                }}>
                  {category.name}
                </h3>
                <div style={{ 
                  fontSize: '0.32cm',
                  color: '#4b5563',
                  lineHeight: '1.5',
                  fontWeight: '400'
                }}>
                  {category.skills.map((skill: any) => 
                    typeof skill === 'string' ? skill : skill.name || skill
                  ).join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  modern: {
    id: 'skills-modern',
    name: 'Modern Minimal',
    description: 'Ultra-clean modern layout with subtle typography',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-modern" style={{ marginBottom: '0.4cm' }}>
          <h2 style={{ 
            marginBottom: '0.3cm',
            fontSize: 'var(--font-size-h2)',
            fontWeight: '700',
            letterSpacing: '0.02cm'
          }}>
            {section.title}
          </h2>
          <div className="skills-modern-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(8cm, 1fr))',
            gap: '0.3cm'
          }}>
            {categories.map((category: any, index: number) => (
              <div key={index} style={{ 
                marginBottom: '0.2cm'
              }}>
                <div style={{ 
                  fontSize: '0.28cm',
                  fontWeight: '600', 
                  color: '#111827',
                  marginBottom: '0.08cm',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05cm'
                }}>
                  {category.name}
                </div>
                <div style={{ 
                  fontSize: '0.33cm',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  fontWeight: '400'
                }}>
                  {category.skills.map((skill: any) => 
                    typeof skill === 'string' ? skill : skill.name || skill
                  ).join(', ')}
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
    description: 'Tag cloud style skills with clean monochrome design',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      const allSkills = categories.flatMap((cat: any) => cat.skills.map((skill: any) => 
        typeof skill === 'string' ? skill : skill.name || skill
      ));
      
      return (
        <div className="section skills-section cloud">
          <h2>{section.title}</h2>
          <div className="skills-cloud">
            {allSkills.map((skill: string, index: number) => {
              // Create varied font sizes for cloud effect
              const fontSizeMultiplier = 0.8 + (index % 4) * 0.1; // Varies from 0.8 to 1.1 (less dramatic)
              return (
                <span 
                  key={index} 
                  className="skill-cloud-tag-compact"
                  style={{ 
                    fontSize: `${fontSizeMultiplier}em`,
                    fontWeight: index % 4 === 0 ? '600' : '400'
                  }}
                >
                  {skill}
                </span>
              );
            })}
          </div>
        </div>
      );
    }
  },

  sleek: {
    id: 'skills-sleek',
    name: 'Sleek Minimalist',
    description: 'Ultra-modern layout with perfect typography balance',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-sleek" style={{ marginBottom: '0.4cm' }}>
          <h2 style={{ 
            marginBottom: '0.3cm',
            fontSize: 'var(--font-size-h2)',
            fontWeight: '700',
            color: '#111827',
            letterSpacing: '-0.01cm'
          }}>
            {section.title}
          </h2>
          <div className="skills-sleek-content">
            {categories.map((category: any, index: number) => (
              <div key={index} style={{ 
                marginBottom: '0.25cm',
                paddingLeft: '0.1cm',
                borderLeft: '2px solid #e5e7eb'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#1f2937',
                  fontSize: '0.32cm',
                  marginBottom: '0.05cm',
                  textTransform: 'capitalize'
                }}>
                  {category.name}
                </div>
                <div style={{ 
                  fontSize: '0.31cm',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  fontWeight: '400',
                  paddingLeft: '0.05cm'
                }}>
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    return (
                      <span key={skillIndex} style={{ marginRight: '0.3cm' }}>
                        {skillName}
                        {skillIndex < category.skills.length - 1 && <span style={{ color: '#d1d5db', margin: '0 0.1cm' }}>|</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }
};
