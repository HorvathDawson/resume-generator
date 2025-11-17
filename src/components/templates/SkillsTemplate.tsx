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
  categorized: {
    id: 'skills-categorized',
    name: 'Categorized Skills',
    description: 'Skills organized by category',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-section categorized">
          <h2>{section.title}</h2>
          <div className="skills-content">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category">
                <h3 className="category-name">{category.name}</h3>
                <div className="skills-list">
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    return (
                      <span key={skillIndex} className="skill-tag">
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
  
  wide: {
    id: 'skills-wide',
    name: 'Grid Layout',
    description: 'Skills in a responsive grid layout',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-wide">
          <h2>{section.title}</h2>
          <div className="skills-grid">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-wide">
                <h3>{category.name}</h3>
                <div className="tags-grid">
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    return (
                      <span key={skillIndex} className="cvtag-wide">
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
  
  wide2: {
    id: 'skills-wide2',
    name: 'Inline Layout',
    description: 'Skills in horizontal lines by category',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-wide2">
          <h2>{section.title}</h2>
          <div className="skills-list">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-line">
                <span className="category-label">{category.name}:</span>
                <div className="tags-inline">
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    return (
                      <span key={skillIndex} className="skill-tag">
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

  compact: {
    id: 'skills-compact',
    name: 'Compact',
    description: 'Ultra-compact skills layout with minimal spacing',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
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
                {category.skills.map((skill: any) => 
                  typeof skill === 'string' ? skill : skill.name || skill
                ).join(', ')}
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
                  lineHeight: '1.4' 
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

  columns: {
    id: 'skills-columns',
    name: 'Columns Layout',
    description: 'Clean columns of skills by category',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-section columns">
          <h2>{section.title}</h2>
          <div className="skills-columns-grid">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-column-simple">
                <h3 className="column-title">{category.name}</h3>
                <ul className="column-skill-list">
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    return (
                      <li key={skillIndex} className="column-skill">{skillName}</li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  proficiency: {
    id: 'skills-proficiency',
    name: 'Proficiency Dots',
    description: 'Skills with dot-based proficiency indicators',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-section proficiency">
          <h2>{section.title}</h2>
          <div className="skills-proficiency-list">
            {categories.map((category: any, index: number) => (
              <div key={index} className="proficiency-category">
                <h3 className="proficiency-title">{category.name}</h3>
                <div className="proficiency-skills">
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    const skillProficiency = typeof skill === 'object' && skill.proficiency ? skill.proficiency : 85;
                    const filledDots = Math.ceil(skillProficiency / 20);
                    
                    return (
                      <div key={skillIndex} className="proficiency-item">
                        <span className="proficiency-name">{skillName}</span>
                        <div className="proficiency-dots">
                          {[1, 2, 3, 4, 5].map(dot => (
                            <div 
                              key={dot} 
                              className={`dot ${dot <= filledDots ? 'filled' : 'empty'}`}
                            />
                          ))}
                        </div>
                      </div>
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
  
  bars: {
    id: 'skills-bars',
    name: 'Progress Bars',
    description: 'Skills with progress indicators',
    component: ({ section }: { section: Section }) => {
      const categories = (section as any).categories || section.customFields?.categories || section.items?.[0]?.categories || [];
      return (
        <div className="section skills-section bars">
          <h2>{section.title}</h2>
          <div className="skills-bars">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-bars">
                <h3 className="category-name">{category.name}</h3>
                <div className="skills-bar-list">
                  {category.skills.slice(0, 6).map((skill: any, skillIndex: number) => {
                    // Handle both string skills and skill objects with proficiency
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    const proficiency = typeof skill === 'object' && skill.proficiency ? skill.proficiency : (85 + (skillIndex * 3) % 15);
                    
                    return (
                      <div key={skillIndex} className="skill-bar-item">
                        <span className="skill-name">{skillName}</span>
                        <div className="skill-progress">
                          <div className="skill-bar" style={{ width: `${proficiency}%` }}></div>
                        </div>
                        <span className="skill-percentage">{proficiency}%</span>
                      </div>
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
  
  cloud: {
    id: 'skills-cloud',
    name: 'Skills Cloud',
    description: 'Tag cloud style skills',
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
              const fontSizeMultiplier = 0.7 + (index % 5) * 0.15; // Varies from 0.7 to 1.3
              return (
                <span 
                  key={index} 
                  className="skill-cloud-tag"
                  style={{ 
                    fontSize: `${fontSizeMultiplier}em`,
                    fontWeight: index % 3 === 0 ? '600' : '400'
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
  }
};
