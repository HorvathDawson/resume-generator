import type { ResumeData } from '../types';

// Load the new format JSON data with proper error handling
export async function loadResumeData(): Promise<ResumeData> {
  const response = await fetch('/data/dawson-hybrid-new.json');
  if (!response.ok) {
    throw new Error(`Failed to load resume data: ${response.status} ${response.statusText}`);
  }
  
  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(`Invalid JSON in resume data file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Validate required fields
  if (!data.personalInfo?.fullName) {
    throw new Error('Resume data is missing required field: personalInfo.fullName');
  }
  if (!Array.isArray(data.sections)) {
    throw new Error('Resume data is missing required field: sections (must be array)');
  }
  if (!data.globalStyles) {
    throw new Error('Resume data is missing required field: globalStyles');
  }
  
  try {
    // Convert the simplified JSON format to ResumeData structure with flexible typing
    const resumeData: any = {
      id: 'dawson-hybrid',
      name: data.personalInfo.fullName,
      personalInfo: {
        name: data.personalInfo.fullName,
        fullName: data.personalInfo.fullName,
        email: data.personalInfo.email,
        phone: data.personalInfo.phone,
        website: data.personalInfo.website,
        linkedin: data.personalInfo.linkedin,
        github: data.personalInfo.github,
        location: data.personalInfo.location,
      },
      sections: data.sections.map((section: any, index: number) => {
        if (!section.id || section.title === undefined || !section.type) {
          throw new Error(`Section ${index} is missing required fields (id, title, type)`);
        }
        return {
          ...section,
          isVisible: true,
          customFields: {},
        };
      }),
      // Pass through the layout structure as-is since PreviewPanel expects this format
      layout: data.layout,
      // Add globalStyles at top level for PreviewPanel
      globalStyles: data.globalStyles,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '2.0.0',
        author: data.personalInfo.fullName,
        description: 'Resume with flexible layout',
        tags: ['professional', 'engineering'],
        exportSettings: {
          format: 'a4' as const,
          orientation: 'portrait' as const,
          scale: 0.7,
          printOptimized: true
        }
      }
    };
    
    return resumeData as ResumeData;
  } catch (error) {
    throw new Error(`Failed to convert resume data: ${error instanceof Error ? error.message : 'Unknown conversion error'}`);
  }
}
