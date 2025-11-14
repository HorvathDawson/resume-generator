import type { ResumeData, TemplateLibrary, GlobalStyles, PageStyles, Section, SectionType } from '../types';
import { createDefaultLayoutConfig } from './layoutDefaults';

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

  const defaultPageStyles: PageStyles[] = [
    {
      pageNumber: 1,
      margins: {
        top: '1.0cm',
        right: '1.0cm',
        bottom: '1.0cm',
        left: '1.0cm',
      },
      footer: {
        type: 'none',
        height: '0cm',
      },
      columns: {
        left: {
          backgroundColor: '#f8f9fa',
          textColor: '#333333',
        },
        right: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
        wholePage: {
          backgroundColor: '#ffffff',
          textColor: '#333333',
        },
      },
    },
  ];

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
          title: 'Bachelor of Science',
          institution: 'University of Example',
          location: 'City, State',
          dates: '2020 - 2024',
          description: 'Computer Science',
          details: [
            'Relevant coursework: Data Structures, Algorithms, Software Engineering',
            'GPA: 3.8/4.0',
          ],
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
          title: 'Software Developer',
          organization: 'Tech Company Inc.',
          location: 'City, State',
          dates: 'Jan 2024 - Present',
          description: 'Full-stack development using modern technologies',
          details: [
            'Developed responsive web applications using React and Node.js',
            'Collaborated with cross-functional teams to deliver high-quality software',
            'Implemented automated testing and CI/CD pipelines',
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
          title: 'Programming Languages',
          details: ['JavaScript', 'TypeScript', 'Python', 'Java'],
        },
        {
          id: crypto.randomUUID(),
          title: 'Frameworks',
          details: ['React', 'Node.js', 'Express', 'Django'],
        },
      ],
      templateId: 'skills-default',
      isVisible: true,
    },
    {
      id: crypto.randomUUID(),
      title: 'Vertical Spacing',
      type: 'padding',
      items: [],
      templateId: 'padding-medium',
      isVisible: true,
      customFields: {
        height: '1cm'
      }
    },
  ];

  return {
    id: resumeId,
    name: 'My Resume',
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'City, State',
      website: 'https://johndoe.dev',
      linkedin: 'johndoe',
      github: 'johndoe',
    },
    sections: defaultSections,
    
    // New layout configuration system
    layoutConfig: createDefaultLayoutConfig(),
    sectionPlacements: defaultSections.map((section, index) => ({
      sectionId: section.id,
      position: {
        column: index < 2 ? 'left' : 'right',
        pageNumber: 1,
        order: index,
      },
      pageBreaks: [],
      isVisible: true,
    })),
    
    // Legacy layout (will be deprecated)
    layout: defaultSections.map((section, index) => ({
      sectionId: section.id,
      position: {
        column: index < 2 ? 'left' : 'right',
        pageNumber: 1,
        order: index,
      },
      pageBreaks: [],
      isVisible: true,
    })),
    globalStyles: defaultGlobalStyles,
    pageStyles: defaultPageStyles,
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
