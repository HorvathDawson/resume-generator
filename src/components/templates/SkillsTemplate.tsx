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
