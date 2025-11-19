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
        <div className="section skills-simple">
          <h2>{section.title}</h2>
          <div className="skills-simple-content">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-simple">
                <strong>
                  {category.name}:
                </strong>
                <span>
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
          <h2>{section.title}</h2>
          <div className="skills-minimal-content">
            {categories.map((category: any, index: number) => (
              <div key={index} className="skill-category-minimal">
                <span>
                  {category.name}
                </span>
                <span>
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
        <div className="section skills-clean">
          <h2>{section.title}</h2>
          <div className="skills-clean-content">
            {categories.map((category: any, index: number) => (
              <div key={index}>
                <span>
                  {category.name}
                </span>
                <span>
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
                borderBottom: index < categories.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <h3>
                  {category.name}
                </h3>
                <div>
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
        <div className="section skills-modern">
          <h2>{section.title}</h2>
          <div className="skills-modern-grid">
            {categories.map((category: any, index: number) => (
              <div key={index} className='skills-modern-category'>
                <div className="fw-bold">
                  {category.name}
                </div>
                <div>
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
        <div className="section skills-sleek">
          <h2>{section.title}</h2>
          <div className="skills-sleek-content">
            {categories.map((category: any, index: number) => (
              <div key={index}>
                <div className="fw-bold">
                  {category.name}
                </div>
                <div>
                  {category.skills.map((skill: any, skillIndex: number) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name || skill;
                    return (
                      <span key={skillIndex}>
                        {skillName}
                        {skillIndex < category.skills.length - 1 && <span>|</span>}
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
