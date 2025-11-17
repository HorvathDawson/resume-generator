import type { ResumeData, TemplateLibrary, GlobalStyles, Section, SectionType } from '../types';
import type { WholePageRow, ColumnPair } from '../types/layout';

export function createDefaultResumeData(): ResumeData {
  const resumeId = crypto.randomUUID();
  
  const defaultGlobalStyles: GlobalStyles = {
    fontFamily: 'sans-serif',
    fontSizes: {
      h1: '1.2cm',
      h2: '0.5cm',
      h3: '0.4cm',
      body: '0.35cm',
      small: '0.3cm',
      caption: '0.25cm',
    },
    colorScheme: {
      primary: '#2c5aa0',
      secondary: '#4a7ba0',
      accent: '#87ceeb',
      text: {
        primary: '#333333',
        secondary: '#374151',
        muted: '#6b7280',
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
      },
      border: '#e0e0e0',
    },
    lineHeight: 1.4,
    spacing: {
      sectionSpacing: '0.6cm',
      itemSpacing: '0.3cm',
      paragraphSpacing: '0.2cm',
    },
    borders: {
      width: '0.02cm',
      style: 'solid',
      radius: '0.1cm',
    },
  };



  const defaultSections: Section[] = [
    {
      id: crypto.randomUUID(),
      title: 'Personal Information',
      type: 'personal_info',
      items: [],
      templateId: 'personal-info-default',
      isVisible: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Education',
      type: 'education',
      items: [
        {
          id: crypto.randomUUID(),
          title: 'Your Degree',
          institution: 'Your University',
          location: 'City, State',
          dates: 'Year - Year',
          description: 'Your Major',
          details: [],
        },
      ],
      templateId: 'education-default',
      isVisible: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Experience',
      type: 'experience',
      items: [
        {
          id: crypto.randomUUID(),
          title: 'Your Job Title',
          organization: 'Your Company',
          location: 'City, State',
          dates: 'Month Year - Present',
          description: 'Brief job description',
          details: [
            'Add your accomplishments here',
            'Add another accomplishment',
          ],
        },
      ],
      templateId: 'experience-default',
      isVisible: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Skills',
      type: 'skills',
      items: [
        {
          id: crypto.randomUUID(),
          title: 'Technical Skills',
          details: ['Add your skills here'],
        },
      ],
      templateId: 'skills-default',
      isVisible: true,
    },
  ];

  return {
    id: resumeId,
    name: 'My Resume',
    personalInfo: {
      fullName: 'Your Name',
      name: 'Your Name',
      email: 'your.email@example.com',
      phone: '(555) 123-4567',
      location: 'Your City, State',
      website: 'your-website.com',
      linkedin: 'your-linkedin',
      github: 'your-github',
    },
    sections: defaultSections,
    
    // Simple layout configuration with basic row structure
    layout: {
      pages: [
        {
          id: crypto.randomUUID(),
          rows: [
            // Personal info as whole page row
            {
              id: crypto.randomUUID(),
              sections: [{ sectionId: defaultSections.find(s => s.type === 'personal_info')?.id || '', instanceId: crypto.randomUUID() }],
            } as WholePageRow,
            // Two column row with education and experience
            {
              id: crypto.randomUUID(),
              left: {
                id: crypto.randomUUID(),
                width: 40,
                sections: [{ sectionId: defaultSections.find(s => s.type === 'education')?.id || '', instanceId: crypto.randomUUID() }],
              },
              right: {
                id: crypto.randomUUID(),
                width: 60, 
                sections: [{ sectionId: defaultSections.find(s => s.type === 'experience')?.id || '', instanceId: crypto.randomUUID() }],
              },
            } as ColumnPair,
            // Skills as whole page row
            {
              id: crypto.randomUUID(),
              sections: [{ sectionId: defaultSections.find(s => s.type === 'skills')?.id || '', instanceId: crypto.randomUUID() }],
            } as WholePageRow,
          ],
          margins: {
            top: '1.0cm',
            right: '1.0cm',
            bottom: '1.0cm',
            left: '1.0cm',
          },
        },
      ],
      sectionInstances: defaultSections.map(section => ({
        id: crypto.randomUUID(),
        sectionId: section.id,
        instanceNumber: 1,
        selectedItems: section.items.map(item => item.id),
        showContinuation: false,
        title: section.title,
      })),
      globalStyles: {
        fontSizes: defaultGlobalStyles.fontSizes,
        fontFamily: defaultGlobalStyles.fontFamily,
        colorScheme: {
          primary: defaultGlobalStyles.colorScheme.primary,
          secondary: defaultGlobalStyles.colorScheme.secondary,
          text: defaultGlobalStyles.colorScheme.text.primary,
          accent: defaultGlobalStyles.colorScheme.accent,
        },
        spacing: {
          sectionMargin: defaultGlobalStyles.spacing.sectionSpacing,
          itemMargin: defaultGlobalStyles.spacing.itemSpacing,
          pageMargin: '1.0cm',
        },
      },
    },
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'Resume Builder',
      description: 'A professional resume created with Resume Builder',
      tags: ['resume', 'professional'],
      exportSettings: {
        format: 'a4',
        orientation: 'portrait',
        scale: 1.0,
        printOptimized: true,
      },
    },
  };
}

export function createDefaultTemplateLibrary(): TemplateLibrary {
  const sectionTypes: SectionType[] = [
    'personal_info',
    'education',
    'experience',
    'projects',
    'skills',
    'certifications',
    'volunteer',
    'publications',
    'awards',
    'padding',
    'custom',
  ];

  const templates = sectionTypes.reduce((acc, sectionType) => {
    acc[sectionType] = [
      {
        id: `${sectionType}-default`,
        name: 'Default',
        description: `Standard ${sectionType} template`,
        sectionType,
        variant: 'default',
        layout: {
          orientation: 'vertical',
          itemSpacing: '0.3cm',
          showBullets: true,
          showDividers: false,
          showIcons: false,
        },
        fields: {
          showDates: true,
          showLocation: true,
          showOrganization: true,
          showDescription: true,
          showDetails: true,
          showTags: false,
          showLinks: true,
          customFields: [],
        },
        isBuiltIn: true,
        category: 'professional',
        tags: ['default', 'standard'],
      },
      {
        id: `${sectionType}-compact`,
        name: 'Compact',
        description: `Space-efficient ${sectionType} template`,
        sectionType,
        variant: 'compact',
        layout: {
          orientation: 'vertical',
          itemSpacing: '0.2cm',
          showBullets: false,
          showDividers: true,
          showIcons: false,
        },
        fields: {
          showDates: true,
          showLocation: false,
          showOrganization: true,
          showDescription: false,
          showDetails: true,
          showTags: true,
          showLinks: false,
          customFields: [],
        },
        isBuiltIn: true,
        category: 'minimal',
        tags: ['compact', 'minimal'],
      },
    ];
    return acc;
  }, {} as Record<SectionType, any[]>);

  return {
    sections: templates,
    categories: {
      professional: {
        name: 'Professional',
        description: 'Clean and professional templates suitable for corporate environments',
        templates: Object.values(templates).flat().filter(t => t.category === 'professional').map(t => t.id),
      },
      minimal: {
        name: 'Minimal',
        description: 'Clean and minimalist templates that focus on content',
        templates: Object.values(templates).flat().filter(t => t.category === 'minimal').map(t => t.id),
      },
      creative: {
        name: 'Creative',
        description: 'Unique and creative templates for design-focused roles',
        templates: [],
      },
    },
  };
}
