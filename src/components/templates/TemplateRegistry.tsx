import React from 'react';
import { AwardsTemplates } from './AwardsTemplate';
import { PublicationsTemplates } from './PublicationsTemplate';
import { TextTemplates } from './TextTemplate';
import { EducationTemplates } from './EducationTemplate';
import { ExperienceTemplates } from './WorkExperienceTemplate';
import { SkillsTemplates } from './SkillsTemplate';
import { ReferencesTemplates } from './ReferencesTemplate';
import { NameTemplates } from './NameTemplate';
import { PersonalInfoTemplates } from './PersonalInfoTemplate'; 
import { PaddingTemplates } from './PaddingTemplate';
import { ListTemplates } from './ListTemplate';
import './AwardsTemplate.css';

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

// Name templates are imported from NameTemplate.tsx

// Personal info templates are imported from PersonalInfoTemplate.tsx

// Padding templates are imported from PaddingTemplate.tsx

// References templates are imported from ReferencesTemplate.tsx
// List templates are imported from ListTemplate.tsx

// Main template registry
export const TEMPLATE_REGISTRY: TemplateRegistry = {
  text: Object.values(TextTemplates),
  education: Object.values(EducationTemplates),
  experience: Object.values(ExperienceTemplates), 
  skills: Object.values(SkillsTemplates),
  name: Object.values(NameTemplates),
  personal_info: Object.values(PersonalInfoTemplates),
  padding: Object.values(PaddingTemplates),
  references: Object.values(ReferencesTemplates),
  awards: Object.values(AwardsTemplates),
  publications: Object.values(PublicationsTemplates),
  list: Object.values(ListTemplates)
};

// Export individual template sets for direct use
export {
  TextTemplates,
  EducationTemplates, 
  ExperienceTemplates,
  SkillsTemplates,
  AwardsTemplates,
  PublicationsTemplates
};