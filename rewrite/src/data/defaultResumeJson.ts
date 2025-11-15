// Default resume data as JSON structure - matches export format exactly
export const DEFAULT_RESUME_JSON = {
  "version": "1.0",
  "exportDate": "2024-01-01T00:00:00.000Z",
  "resumeData": {
    "id": "default-resume-2024",
    "name": "Default Resume Template",
    "personalInfo": {
      "fullName": "Your Name",
      "email": "your.email@example.com",
      "phone": "(555) 123-4567",
      "location": "Your City, State",
      "website": "www.yourwebsite.com",
      "linkedin": "linkedin.com/in/yourprofile",
      "github": "github.com/yourusername"
    },
    "sections": [
      {
        "id": "personal-info-001",
        "title": "Personal Information",
        "type": "personal_info" as const,
        "templateId": "contact-header",
        "isVisible": true,
        "items": [
          {
            "id": "contact-001",
            "title": "Personal Information",
            "personalInfo": {
              "fullName": "Your Name",
              "email": "your.email@example.com",
              "phone": "(555) 123-4567",
              "location": "Your City, State",
              "website": "www.yourwebsite.com",
              "linkedin": "linkedin.com/in/yourprofile",
              "github": "github.com/yourusername"
            }
          }
        ]
      },
      {
        "id": "education-001",
        "title": "Education",
        "type": "education" as const,
        "templateId": "education-standard",
        "isVisible": true,
        "items": [
          {
            "id": "edu-001",
            "title": "Bachelor of Science",
            "organization": "Your University",
            "degree": "Bachelor of Science",
            "fieldOfStudy": "Your Major",
            "location": "City, State",
            "dates": "September 2020 - May 2024",
            "gpa": "3.8",
            "details": ["Dean's List", "Graduated Magna Cum Laude"]
          }
        ]
      },
      {
        "id": "experience-001",
        "title": "Work Experience",
        "type": "experience" as const,
        "templateId": "experience-detailed",
        "isVisible": true,
        "items": [
          {
            "id": "exp-001",
            "title": "Your Job Title",
            "organization": "Your Company",
            "location": "City, State",
            "dates": "June 2024 - Present",
            "details": [
              "Describe your key responsibilities and achievements",
              "Use action verbs and quantify results when possible",
              "Highlight skills and technologies used"
            ]
          },
          {
            "id": "exp-002",
            "title": "Previous Role",
            "organization": "Previous Company",
            "location": "City, State",
            "dates": "January 2023 - May 2024",
            "details": [
              "Another role with specific accomplishments",
              "Focus on transferable skills and growth",
              "Mention any leadership or project management experience"
            ]
          }
        ]
      },
      {
        "id": "skills-001",
        "title": "Skills",
        "type": "skills" as const,
        "templateId": "skills-categorized",
        "isVisible": true,
        "items": [
          {
            "id": "skills-tech",
            "title": "Technical Skills",
            "categories": [
              {
                "name": "Programming Languages",
                "skills": ["JavaScript", "TypeScript", "Python", "Java"]
              },
              {
                "name": "Frameworks & Libraries",
                "skills": ["React", "Node.js", "Express", "Django"]
              },
              {
                "name": "Tools & Technologies",
                "skills": ["Git", "Docker", "AWS", "PostgreSQL"]
              }
            ]
          }
        ]
      }
    ],
    "sectionTemplates": {
      "personal-info-001": "contact-header",
      "education-001": "education-standard",
      "experience-001": "experience-detailed",
      "skills-001": "skills-categorized"
    },
    "layout": {
      "pages": [
        {
          "id": "page-1",
          "pageNumber": 1,
          "rows": [
            {
              "id": "page-1-row-0",
              "type": "wholePage",
              "sections": [
                {
                  "sectionId": "personal-info-001",
                  "instanceId": "instance-personal-001"
                }
              ]
            },
            {
              "id": "page-1-row-1",
              "type": "columns",
              "columns": [
                {
                  "width": "40%",
                  "sections": [
                    {
                      "sectionId": "education-001",
                      "instanceId": "instance-education-001"
                    }
                  ]
                },
                {
                  "width": "60%",
                  "sections": [
                    {
                      "sectionId": "experience-001",
                      "instanceId": "instance-experience-001"
                    }
                  ]
                }
              ]
            },
            {
              "id": "page-1-row-2",
              "type": "wholePage",
              "sections": [
                {
                  "sectionId": "skills-001",
                  "instanceId": "instance-skills-001"
                }
              ]
            }
          ],
          "margins": {
            "top": "1.0cm",
            "right": "1.0cm",
            "bottom": "1.0cm",
            "left": "1.0cm"
          }
        }
      ],
      "sectionInstances": [
        {
          "id": "instance-personal-001",
          "sectionId": "personal-info-001",
          "instanceNumber": 1,
          "selectedItems": ["contact-001"],
          "showContinuation": false,
          "title": "Personal Information"
        },
        {
          "id": "instance-education-001",
          "sectionId": "education-001",
          "instanceNumber": 1,
          "selectedItems": ["edu-001"],
          "showContinuation": false,
          "title": "Education"
        },
        {
          "id": "instance-experience-001",
          "sectionId": "experience-001",
          "instanceNumber": 1,
          "selectedItems": ["exp-001", "exp-002"],
          "showContinuation": false,
          "title": "Work Experience"
        },
        {
          "id": "instance-skills-001",
          "sectionId": "skills-001",
          "instanceNumber": 1,
          "selectedItems": ["skills-tech"],
          "showContinuation": false,
          "title": "Skills"
        }
      ],
      "globalStyles": {
        "fontSizes": {
          "h1": "1.2cm",
          "h2": "0.5cm",
          "h3": "0.4cm",
          "body": "0.35cm",
          "small": "0.3cm",
          "caption": "0.25cm"
        },
        "fontFamily": "sans-serif",
        "colorScheme": {
          "primary": "#2c5aa0",
          "secondary": "#f8f9fa",
          "text": "#333333",
          "accent": "#87ceeb"
        },
        "spacing": {
          "sectionMargin": "0.6cm",
          "itemMargin": "0.3cm",
          "pageMargin": "1.0cm"
        }
      }
    },
    "metadata": {
      "version": "1.0.0",
      "createdAt": "2024-11-15T00:00:00.000Z",
      "updatedAt": "2024-11-15T00:00:00.000Z",
      "author": "Resume Builder",
      "description": "A professional resume template with placeholder content",
      "tags": ["resume", "template", "default"]
    }
  },
  "layoutState": {
    "pages": [
      {
        "id": "page-1",
        "pageNumber": 1,
        "rows": [
          {
            "id": "page-1-row-0",
            "type": "wholePage",
            "sections": ["personal-info-001"],
            "backgroundColor": "#ffffff",
            "textColor": "#333333"
          },
          {
            "id": "page-1-row-1",
            "type": "columns",
            "columns": [
              {
                "width": "40%",
                "sections": ["education-001"],
                "backgroundColor": "#ffffff",
                "textColor": "#333333"
              },
              {
                "width": "60%",
                "sections": ["experience-001"],
                "backgroundColor": "#ffffff",
                "textColor": "#333333"
              }
            ]
          },
          {
            "id": "page-1-row-2",
            "type": "wholePage",
            "sections": ["skills-001"],
            "backgroundColor": "#ffffff",
            "textColor": "#333333"
          }
        ]
      }
    ],
    "zoom": 0.6
  }
};

// Summary info for confirmation dialogs
export const DEFAULT_RESUME_SUMMARY = {
  name: "Default Template",
  description: "Professional resume template with placeholder content",
  sections: ["Personal Information", "Education", "Work Experience", "Skills"],
  pages: 1,
  lastModified: "2024-11-15"
};
