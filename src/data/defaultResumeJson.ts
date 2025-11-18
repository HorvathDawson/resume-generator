export const defaultResumeJson = {
  "resumeData": {
    "id": "comprehensive-resume-template-2024",
    "name": "Comprehensive Professional Resume Template",
    "personalInfo": {
      "fullName": "Alex Johnson",
      "email": "alex.johnson@email.com",
      "phone": "(555) 234-5678",
      "location": "San Francisco, CA",
      "website": "www.alexjohnson.dev",
      "linkedin": "linkedin.com/in/alexjohnson",
      "github": "github.com/alexjohnson"
    },
    "sections": [
      {
        "id": "name-001",
        "type": "name",
        "title": "Name",
        "templateId": "name-standard",
        "isVisible": true,
        "items": [
          {
            "id": "name-item-001",
            "title": "Alex Johnson",
            "content": {
              "fullName": "Alex Johnson",
              "title": "Senior Software Engineer",
              "subtitle": "Full-Stack Development & Cloud Architecture"
            }
          }
        ]
      },
      {
        "id": "personal-info-001",
        "title": "Personal Information",
        "type": "personal_info",
        "templateId": "contact-header",
        "isVisible": true,
        "items": [
          {
            "id": "contact-001",
            "title": "Personal Information",
            "personalInfo": {
              "fullName": "Alex Johnson",
              "email": "alex.johnson@email.com",
              "phone": "(555) 234-5678",
              "location": "San Francisco, CA",
              "website": "www.alexjohnson.dev",
              "linkedin": "linkedin.com/in/alexjohnson",
              "github": "github.com/alexjohnson"
            }
          }
        ]
      },
      {
        "id": "summary-001",
        "title": "Professional Summary",
        "type": "text",
        "templateId": "text-paragraph",
        "isVisible": true,
        "items": [
          {
            "id": "summary-item-001",
            "title": "Professional Summary",
            "content": "Results-driven software engineer with 5+ years of experience building scalable web applications and cloud infrastructure. Passionate about creating efficient solutions and mentoring junior developers. Proven track record of delivering high-quality software products in fast-paced environments."
          }
        ]
      },
      {
        "id": "experience-001",
        "title": "Professional Experience",
        "type": "experience",
        "templateId": "experience-detailed",
        "isVisible": true,
        "items": [
          {
            "id": "exp-001",
            "title": "Senior Software Engineer",
            "organization": "TechCorp Solutions",
            "location": "San Francisco, CA",
            "dates": "March 2022 - Present",
            "details": [
              "Led development of microservices architecture serving 1M+ daily users",
              "Mentored 3 junior developers and improved team code review process",
              "Reduced API response times by 40% through database optimization",
              "Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes"
            ]
          },
          {
            "id": "exp-002",
            "title": "Full Stack Developer",
            "organization": "StartupXYZ",
            "location": "San Francisco, CA",
            "dates": "June 2020 - February 2022",
            "details": [
              "Built responsive web applications using React, Node.js, and PostgreSQL",
              "Collaborated with product team to define technical requirements",
              "Developed RESTful APIs serving mobile and web clients",
              "Increased test coverage from 60% to 95% across all services"
            ]
          },
          {
            "id": "exp-003",
            "title": "Junior Developer",
            "organization": "Digital Agency",
            "location": "Oakland, CA",
            "dates": "January 2019 - May 2020",
            "details": [
              "Created custom WordPress themes and plugins for client websites",
              "Collaborated with design team to implement pixel-perfect interfaces",
              "Optimized website performance resulting in 30% faster load times"
            ]
          }
        ]
      },
      {
        "id": "projects-001",
        "title": "Key Projects",
        "type": "experience",
        "templateId": "experience-detailed",
        "isVisible": true,
        "items": [
          {
            "id": "project-001",
            "title": "E-commerce Platform",
            "organization": "Personal Project",
            "dates": "2023",
            "description": "Full-stack e-commerce solution with React frontend and Node.js backend",
            "technologies": "React, Node.js, PostgreSQL, Stripe API",
            "details": [
              "Processed $500K+ in transactions within first 6 months",
              "Implemented real-time inventory management",
              "Built admin dashboard with analytics and reporting"
            ],
            "url": "https://github.com/alexjohnson/ecommerce-platform"
          },
          {
            "id": "project-002",
            "title": "Task Management API",
            "organization": "Open Source",
            "dates": "2022",
            "description": "RESTful API for team collaboration and project management",
            "technologies": "Express.js, MongoDB, JWT, Docker",
            "details": [
              "Supports 100+ concurrent users with sub-200ms response times",
              "Comprehensive API documentation with Swagger",
              "Deployed using Docker containers on AWS ECS"
            ],
            "url": "https://github.com/alexjohnson/task-api"
          }
        ]
      },
      {
        "id": "education-001",
        "title": "Education",
        "type": "education",
        "templateId": "education-standard",
        "isVisible": true,
        "items": [
          {
            "id": "edu-001",
            "title": "Bachelor of Science in Computer Science",
            "organization": "University of California, Berkeley",
            "degree": "Bachelor of Science",
            "fieldOfStudy": "Computer Science",
            "location": "Berkeley, CA",
            "dates": "August 2015 - May 2019",
            "gpa": "3.7/4.0",
            "details": [
              "Dean's List (Fall 2017, Spring 2018)",
              "Relevant Coursework: Data Structures, Algorithms, Database Systems, Software Engineering"
            ]
          }
        ]
      },
      {
        "id": "skills-001",
        "title": "Technical Skills",
        "type": "skills",
        "templateId": "skills-categorized",
        "isVisible": true,
        "items": [
          {
            "id": "skills-tech",
            "title": "Technical Skills",
            "categories": [
              {
                "name": "Programming Languages",
                "skills": [
                  "JavaScript",
                  "TypeScript",
                  "Python",
                  "Java",
                  "Go"
                ]
              },
              {
                "name": "Frontend Technologies",
                "skills": [
                  "React",
                  "Vue.js",
                  "HTML5/CSS3",
                  "Tailwind CSS",
                  "Webpack"
                ]
              },
              {
                "name": "Backend Technologies",
                "skills": [
                  "Node.js",
                  "Express.js",
                  "Django",
                  "Flask",
                  "RESTful APIs",
                  "GraphQL"
                ]
              },
              {
                "name": "Databases",
                "skills": [
                  "PostgreSQL",
                  "MongoDB",
                  "Redis",
                  "MySQL",
                  "Elasticsearch"
                ]
              },
              {
                "name": "Cloud & DevOps",
                "skills": [
                  "AWS",
                  "Docker",
                  "Kubernetes",
                  "Jenkins",
                  "Terraform",
                  "Git"
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "certifications-001",
        "title": "Certifications",
        "type": "list",
        "templateId": "list-simple",
        "isVisible": true,
        "items": [
          {
            "id": "cert-001",
            "title": "AWS Solutions Architect Associate",
            "organization": "Amazon Web Services",
            "dates": "March 2023 - March 2026",
            "credentialId": "AWS-SAA-123456789",
            "details": [
              "Validates expertise in designing distributed systems on AWS",
              "Covers compute, networking, storage, and database AWS services"
            ]
          },
          {
            "id": "cert-002",
            "title": "Certified Kubernetes Administrator (CKA)",
            "organization": "Cloud Native Computing Foundation",
            "dates": "August 2022 - August 2025",
            "credentialId": "CKA-789456123",
            "details": [
              "Demonstrates skills in Kubernetes administration",
              "Hands-on certification with performance-based tasks"
            ]
          }
        ]
      },
      {
        "id": "volunteer-001",
        "title": "Volunteer Experience",
        "type": "experience",
        "templateId": "experience-detailed",
        "isVisible": true,
        "items": [
          {
            "id": "vol-001",
            "title": "Volunteer Developer",
            "organization": "Code for America",
            "location": "San Francisco, CA",
            "dates": "January 2021 - Present",
            "description": "Contribute to open-source projects that help government services work better for everyone",
            "details": [
              "Built accessibility features for voter information website",
              "Mentored new volunteers in web development best practices"
            ]
          },
          {
            "id": "vol-002",
            "title": "Workshop Instructor",
            "organization": "Girls Who Code",
            "location": "San Francisco, CA",
            "dates": "September 2020 - December 2022",
            "description": "Taught coding fundamentals to high school students",
            "details": [
              "Led weekly Python and web development workshops",
              "Helped 15+ students complete their first coding projects"
            ]
          }
        ]
      },
      {
        "id": "publications-001",
        "title": "Publications & Speaking",
        "type": "publications",
        "templateId": "publications-standard",
        "isVisible": true,
        "items": [
          {
            "id": "pub-001",
            "title": "Microservices Architecture Patterns for Scalable Web Applications",
            "organization": "Tech Blog",
            "dates": "September 2023",
            "url": "https://techblog.com/microservices-patterns",
            "type": "Article",
            "details": [
              "Technical deep-dive into microservices design patterns",
              "Read by 10,000+ developers, featured in weekly newsletter"
            ]
          },
          {
            "id": "pub-002",
            "title": "Building Resilient APIs with Node.js",
            "organization": "Bay Area JavaScript Meetup",
            "dates": "June 2023",
            "type": "Conference Talk",
            "details": [
              "Presented to 200+ developers on API design best practices",
              "Covered error handling, rate limiting, and monitoring strategies"
            ]
          }
        ]
      },
      {
        "id": "awards-001",
        "title": "Awards & Recognition",
        "type": "awards",
        "templateId": "awards-standard",
        "isVisible": true,
        "items": [
          {
            "id": "award-001",
            "title": "Employee of the Quarter",
            "organization": "TechCorp Solutions",
            "dates": "Q2 2023",
            "description": "Recognized for outstanding performance in leading the API optimization project and delivering 40% performance improvement ahead of schedule"
          },
          {
            "id": "award-002",
            "title": "Best Hack for Social Good",
            "organization": "SF Hackathon 2022",
            "dates": "October 2022",
            "description": "Won first place for developing an accessibility-focused mobile application built in 48 hours with team of 4 developers"
          }
        ]
      },
      {
        "id": "languages-001",
        "title": "Languages",
        "type": "list",
        "templateId": "list-simple",
        "isVisible": true,
        "items": [
          {
            "id": "lang-001",
            "title": "English (Native)",
            "content": "English (Native)"
          },
          {
            "id": "lang-002",
            "title": "Spanish (Conversational)",
            "content": "Spanish (Conversational)"
          },
          {
            "id": "lang-003",
            "title": "French (Basic)",
            "content": "French (Basic)"
          }
        ]
      },
      {
        "id": "references-001",
        "title": "References",
        "type": "references",
        "templateId": "references-standard",
        "isVisible": true,
        "items": [
          {
            "id": "ref-001",
            "title": "Sarah Martinez - Engineering Manager",
            "name": "Sarah Martinez",
            "jobTitle": "Engineering Manager",
            "organization": "TechCorp Solutions",
            "email": "sarah.martinez@techcorp.com",
            "phone": "(555) 987-6543",
            "relationship": "Direct Manager",
            "details": [
              "Can speak to technical leadership and project management skills",
              "Worked together for 2+ years on multiple high-impact projects"
            ]
          },
          {
            "id": "ref-002",
            "title": "Michael Chen - Senior Technical Lead",
            "name": "Michael Chen",
            "jobTitle": "Senior Technical Lead",
            "organization": "StartupXYZ",
            "email": "michael.chen@startupxyz.com",
            "phone": "(555) 456-7890",
            "relationship": "Former Colleague",
            "details": [
              "Can provide insight into technical skills and team collaboration",
              "Collaborated on full-stack development projects for 18 months"
            ]
          }
        ]
      },
      {
        "id": "padding-001",
        "title": "Spacing",
        "type": "padding",
        "templateId": "padding-standard",
        "isVisible": true,
        "items": [
          {
            "id": "padding-item-001",
            "title": "Page Break Spacer",
            "content": {
              "height": "2cm",
              "purpose": "Add space between sections or force page breaks"
            }
          }
        ]
      },
      {
        "id": "custom-001",
        "title": "Additional Information",
        "type": "text",
        "templateId": "text-basic",
        "isVisible": true,
        "items": [
          {
            "id": "custom-item-001",
            "title": "Additional Information",
            "content": "This is a custom section where you can add any additional information that doesn't fit into other categories. You can include hobbies, interests, professional affiliations, or any other relevant details.",
            "details": [
              "Customize this section based on your specific needs",
              "Can include multiple paragraphs or bullet points",
              "Useful for unique achievements or personal branding"
            ]
          }
        ]
      }
    ],
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
                  "sectionId": "name-001",
                  "instanceId": "instance-name-001",
                  "template": "name-standard"
                },
                {
                  "sectionId": "personal-info-001",
                  "instanceId": "instance-personal-001",
                  "template": "contact-header"
                }
              ],
              "sectionItemOrders": {}
            },
            {
              "id": "page-1-row-1",
              "type": "wholePage",
              "sections": [
                {
                  "sectionId": "summary-001",
                  "instanceId": "instance-summary-001",
                  "template": "text-paragraph"
                }
              ],
              "sectionItemOrders": {}
            },
            {
              "id": "page-1-row-2",
              "type": "columns",
              "columns": [
                {
                  "width": "35%",
                  "sections": [
                    {
                      "sectionId": "education-001",
                      "instanceId": "instance-education-001",
                      "template": "education-standard"
                    },
                    {
                      "sectionId": "skills-001",
                      "instanceId": "instance-skills-001",
                      "template": "skills-categorized"
                    },
                    {
                      "sectionId": "certifications-001",
                      "instanceId": "instance-certifications-001",
                      "template": "list-detailed"
                    },
                    {
                      "sectionId": "languages-001",
                      "instanceId": "instance-languages-001",
                      "template": "list-simple"
                    }
                  ],
                  "sectionItemOrders": {}
                },
                {
                  "width": "65%",
                  "sections": [
                    {
                      "sectionId": "experience-001",
                      "instanceId": "instance-experience-001",
                      "template": "experience-detailed"
                    }
                  ],
                  "sectionItemOrders": {}
                }
              ]
            }
          ]
        },
        {
          "id": "page-2",
          "pageNumber": 2,
          "rows": [
            {
              "id": "page-2-row-0",
              "type": "wholePage",
              "sections": [
                {
                  "sectionId": "projects-001",
                  "instanceId": "instance-projects-001",
                  "template": "experience-detailed"
                }
              ],
              "sectionItemOrders": {}
            },
            {
              "id": "page-2-row-1",
              "type": "columns",
              "columns": [
                {
                  "width": "50%",
                  "sections": [
                    {
                      "sectionId": "volunteer-001",
                      "instanceId": "instance-volunteer-001",
                      "template": "experience-detailed"
                    },
                    {
                      "sectionId": "awards-001",
                      "instanceId": "instance-awards-001",
                      "template": "awards-standard"
                    }
                  ],
                  "sectionItemOrders": {}
                },
                {
                  "width": "50%",
                  "sections": [
                    {
                      "sectionId": "publications-001",
                      "instanceId": "instance-publications-001",
                      "template": "publications-standard"
                    },
                    {
                      "sectionId": "custom-001",
                      "instanceId": "instance-custom-001",
                      "template": "text-basic"
                    }
                  ],
                  "sectionItemOrders": {}
                }
              ]
            },
            {
              "id": "page-2-row-2",
              "type": "wholePage",
              "sections": [
                {
                  "sectionId": "references-001",
                  "instanceId": "instance-references-001",
                  "template": "references-standard"
                }
              ],
              "sectionItemOrders": {}
            }
          ]
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
        "fontFamily": "Roboto, sans-serif",
        "colorScheme": {
          "primary": "#2c5aa0",
          "secondary": "#f8f9fa",
          "text": "#333333",
          "accent": "#4a90e2",
          "textDark": "#111827",
          "textMuted": "#6b7280",
          "successColor": "#059669",
          "successBackground": "#ecfdf5",
          "hoverBackground": "#ffffff",
          "borderLight": "#e9ecef",
          "borderSubtle": "#f3f4f6"
        },
        "spacing": {
          "sectionMargin": "0.6cm",
          "itemMargin": "0.3cm",
          "pageMargin": "1.0cm"
        }
      }
    },
    "metadata": {
      "version": "2.0.0",
      "createdAt": "2024-12-19T00:00:00.000Z",
      "updatedAt": "2024-12-19T00:00:00.000Z",
      "author": "Resume Builder",
      "description": "Comprehensive professional resume template with examples of all section types",
      "tags": [
        "resume",
        "template",
        "comprehensive",
        "professional",
        "complete"
      ]
    }
  }
};

// Export with the expected name for compatibility
export const DEFAULT_RESUME_JSON = defaultResumeJson;

// Summary info for confirmation dialogs
export const DEFAULT_RESUME_SUMMARY = {
  name: "Comprehensive Professional Template",
  description: "Complete resume template with examples of all section types including experience, projects, education, skills, certifications, volunteer work, publications, awards, languages, references, and custom sections",
  sections: [
    "Name", "Personal Information", "Professional Summary", "Professional Experience", 
    "Key Projects", "Education", "Technical Skills", "Certifications", "Volunteer Experience", 
    "Publications & Speaking", "Awards & Recognition", "Languages", "References", "Custom Section"
  ],
  pages: 2,
  lastModified: "2024-12-19"
};
