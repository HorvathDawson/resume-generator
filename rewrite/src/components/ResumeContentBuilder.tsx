import { useState } from 'react';
import type { ResumeData, Section } from '../types';
import './ResumeContentBuilder.css';

interface ResumeContentBuilderProps {
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

export function ResumeContentBuilder({ resumeData, onResumeDataChange }: ResumeContentBuilderProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  const availableSectionTypes = [
    { type: 'name', label: 'Name', description: 'Full name or header name' },
    { type: 'experience', label: 'Experience', description: 'Work experience, projects, volunteer work, etc.' },
    { type: 'education', label: 'Education', description: 'Schools, degrees, certifications' },
    { type: 'skills', label: 'Skills', description: 'Technical and soft skills' },
    { type: 'text', label: 'Text Section', description: 'Summary, objective, or custom text' },
    { type: 'certifications', label: 'Certifications', description: 'Professional certifications and licenses' },
    { type: 'awards', label: 'Awards & Recognition', description: 'Awards, honors, and achievements' },
    { type: 'publications', label: 'Publications', description: 'Publications, presentations, and speaking engagements' },
    { type: 'list', label: 'List Items', description: 'Simple bulleted or numbered list' },
    { type: 'references', label: 'References', description: 'Professional references and contacts' },
  ];

  const addSection = (sectionType: string) => {
    const newSection: Section = {
      id: `${sectionType}-${Date.now()}`,
      type: sectionType as any,
      title: sectionType === 'experience' ? 'Experience' : 
             sectionType === 'name' ? 'Name' :
             sectionType === 'awards' ? 'Awards & Recognition' :
             sectionType === 'publications' ? 'Publications' :
             sectionType === 'list' ? 'List' :
             sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
      templateId: sectionType === 'name' ? 'name-standard' : 'basic',
      isVisible: true,
      items: sectionType === 'skills' ? [] : 
             sectionType === 'name' ? [
        {
          id: `name-item-${Date.now()}`,
          title: resumeData.personalInfo?.fullName || 'Your Name',
          content: {
            fullName: resumeData.personalInfo?.fullName || 'Your Name'
          }
        }
      ] : [
        {
          id: `item-${Date.now()}`,
          title: sectionType === 'references' ? '' : '',
          organization: sectionType === 'experience' || sectionType === 'references' ? '' : undefined,
          dates: sectionType === 'experience' ? '' : undefined,
          details: sectionType === 'experience' ? [''] : undefined,
          description: sectionType === 'text' ? '' : undefined,
          phone: sectionType === 'references' ? '' : undefined,
          email: sectionType === 'references' ? '' : undefined,
        }
      ],
      customFields: sectionType === 'skills' ? { categories: [] } : undefined,
    };

    const updatedData = {
      ...resumeData,
      sections: [...(resumeData.sections || []), newSection]
    };

    onResumeDataChange(updatedData);
    setShowAddSection(false);
    setEditingSection(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    const updatedSections = resumeData.sections?.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    ) || [];

    onResumeDataChange({
      ...resumeData,
      sections: updatedSections
    });
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = resumeData.sections?.filter(section => section.id !== sectionId) || [];
    onResumeDataChange({
      ...resumeData,
      sections: updatedSections
    });
    setEditingSection(null);
  };

  const addItemToSection = (sectionId: string) => {
    const section = resumeData.sections?.find(s => s.id === sectionId);
    if (!section) return;

    let newItem: any = {
      id: `item-${Date.now()}`,
      title: '',
    };

    // Add fields based on section type
    switch (section.type) {
      case 'experience':
      case 'work-experience' as any:
        newItem = {
          ...newItem,
          organization: '',
          location: '',
          dates: '',
          details: ['']
        };
        break;
      case 'education':
        newItem = {
          id: `item-${Date.now()}`,
          organization: '',
          degree: '',
          location: '',
          dates: '',
          gpa: '',
          details: []
        };
        break;
      case 'certifications':
        newItem = {
          ...newItem,
          organization: '',
          dates: '',
          credentialId: '',
          details: []
        };
        break;
      case 'text':
        newItem = {
          ...newItem,
          content: '',
          description: ''
        };
        break;
      case 'references':
        newItem = {
          ...newItem,
          organization: '',
          phone: '',
          email: ''
        };
        break;
      case 'awards':
        newItem = {
          ...newItem,
          organization: '',
          dates: '',
          description: ''
        };
        break;
      case 'publications':
      case 'list':
        newItem = {
          ...newItem,
          organization: '',
          dates: '',
          type: '',
          url: '',
          details: []
        };
        break;
      default:
        newItem = {
          ...newItem,
          description: ''
        };
    }

    updateSection(sectionId, {
      items: [...(section.items || []), newItem]
    });
  };

  const updateItem = (sectionId: string, itemId: string, updates: any) => {
    const section = resumeData.sections?.find(s => s.id === sectionId);
    if (!section) return;

    const updatedItems = section.items?.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ) || [];

    updateSection(sectionId, { items: updatedItems });
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    const section = resumeData.sections?.find(s => s.id === sectionId);
    if (!section) return;

    const updatedItems = section.items?.filter(item => item.id !== itemId) || [];
    updateSection(sectionId, { items: updatedItems });
  };

  // Update personal info (for contact section)
  const updatePersonalInfo = (field: string, value: string) => {
    onResumeDataChange({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        [field]: value
      }
    });
  };

  // Render section editor based on type
  const renderSectionEditor = (section: Section) => {
    switch (section.type) {
      case 'name':
        return renderNameEditor(section);
      case 'text':
        return renderTextEditor(section);
      case 'personal_info':
        return renderContactEditor();
      case 'education':
        return renderEducationEditor(section);
      case 'experience':
      case 'work-experience' as any:
        return renderExperienceEditor(section);
      case 'certifications':
        return renderCertificationsEditor(section);
      case 'skills':
        return renderSkillsEditor(section);
      case 'references':
        return renderReferencesEditor(section);
      case 'awards':
        return renderAwardsEditor(section);
      case 'publications':
      case 'list':
        return renderListEditor(section);
      default:
        return renderGenericEditor(section);
    }
  };

  // Name section editor
  const renderNameEditor = (section: Section) => (
    <div className="name-section-editor">
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          value={section.items?.[0]?.content?.fullName || section.items?.[0]?.title || ''}
          onChange={(e) => {
            const itemId = section.items?.[0]?.id || `name-item-${Date.now()}`;
            const items = section.items?.length ? section.items : [{ id: itemId, title: e.target.value }];
            const updatedItems = items.map(item =>
              item.id === itemId ? { 
                ...item, 
                title: e.target.value,
                content: { ...item.content, fullName: e.target.value }
              } : item
            );
            updateSection(section.id, { items: updatedItems });
          }}
          placeholder="Enter your full name"
          className="form-input"
        />
      </div>
    </div>
  );

  // Text section editor
  const renderTextEditor = (section: Section) => (
    <div className="text-section-editor">
      <textarea
        value={section.items?.[0]?.content || section.items?.[0]?.description || ''}
        onChange={(e) => {
          const itemId = section.items?.[0]?.id || `item-${Date.now()}`;
          const items = section.items?.length ? section.items : [{ id: itemId, title: section.title }];
          const updatedItems = items.map(item =>
            item.id === itemId ? { ...item, content: e.target.value } : item
          );
          updateSection(section.id, { items: updatedItems });
        }}
        placeholder="Enter your text content..."
        rows={6}
        className="text-content-input"
      />
    </div>
  );

  // Contact/Personal info editor
  const renderContactEditor = () => (
    <div className="contact-editor">
      <div className="contact-field">
        <label>Full Name:</label>
        <input
          type="text"
          value={resumeData.personalInfo?.fullName || ''}
          onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
          className="item-input"
        />
      </div>
      <div className="contact-field">
        <label>Email:</label>
        <input
          type="email"
          value={resumeData.personalInfo?.email || ''}
          onChange={(e) => updatePersonalInfo('email', e.target.value)}
          className="item-input"
        />
      </div>
      <div className="contact-field">
        <label>Phone:</label>
        <input
          type="text"
          value={resumeData.personalInfo?.phone || ''}
          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
          className="item-input"
        />
      </div>
      <div className="contact-field">
        <label>Website:</label>
        <input
          type="text"
          value={resumeData.personalInfo?.website || ''}
          onChange={(e) => updatePersonalInfo('website', e.target.value)}
          className="item-input"
          placeholder="Leave blank to hide"
        />
      </div>
      <div className="contact-field">
        <label>LinkedIn:</label>
        <input
          type="text"
          value={resumeData.personalInfo?.linkedin || ''}
          onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
          className="item-input"
          placeholder="Username only (leave blank to hide)"
        />
      </div>
      <div className="contact-field">
        <label>GitHub:</label>
        <input
          type="text"
          value={resumeData.personalInfo?.github || ''}
          onChange={(e) => updatePersonalInfo('github', e.target.value)}
          className="item-input"
          placeholder="Username only (leave blank to hide)"
        />
      </div>
      <div className="contact-field">
        <label>Location:</label>
        <input
          type="text"
          value={resumeData.personalInfo?.location || ''}
          onChange={(e) => updatePersonalInfo('location', e.target.value)}
          className="item-input"
        />
      </div>
    </div>
  );

  // Education editor with GPA and details
  const renderEducationEditor = (section: Section) => (
    <div className="items-editor">
      {section.items?.map((item) => (
        <div key={item.id} className="item-editor">
          <div className="item-header">
            <input
              type="text"
              value={item.degree || ''}
              onChange={(e) => updateItem(section.id, item.id, { degree: e.target.value })}
              placeholder="Degree (e.g., B.ASc., Engineering Physics)"
              className="item-input"
            />
            <input
              type="text"
              value={item.organization || ''}
              onChange={(e) => updateItem(section.id, item.id, { organization: e.target.value })}
              placeholder="University/Institution"
              className="item-input"
            />
            <button className="delete-item-btn" onClick={() => deleteItem(section.id, item.id)}>🗑️</button>
          </div>
          
          <div className="item-details">
            <div className="detail-row">
              <input
                type="text"
                value={item.dates || ''}
                onChange={(e) => updateItem(section.id, item.id, { dates: e.target.value })}
                placeholder="Dates (e.g., 2018 – 2022)"
                className="item-input"
              />
              <input
                type="text"
                value={item.location || ''}
                onChange={(e) => updateItem(section.id, item.id, { location: e.target.value })}
                placeholder="Location"
                className="item-input"
              />
            </div>
            <div className="detail-row">
              <input
                type="text"
                value={item.gpa || ''}
                onChange={(e) => updateItem(section.id, item.id, { gpa: e.target.value })}
                placeholder="GPA (e.g., 3.7/4.0)"
                className="item-input"
              />
            </div>
            
            <div className="details-list">
              <label>Additional Details:</label>
              {item.details?.map((detail, index) => (
                <div key={index} className="detail-item">
                  <textarea
                    value={detail}
                    onChange={(e) => {
                      const newDetails = [...(item.details || [])];
                      newDetails[index] = e.target.value;
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    placeholder="Additional information, honors, relevant coursework, etc."
                    className="detail-textarea"
                    rows={2}
                  />
                  <button
                    onClick={() => {
                      const newDetails = item.details?.filter((_, i) => i !== index) || [];
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    className="delete-detail-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newDetails = [...(item.details || []), ''];
                  updateItem(section.id, item.id, { details: newDetails });
                }}
                className="add-detail-btn"
              >
                + Add Detail
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <button className="add-item-btn" onClick={() => addItemToSection(section.id)}>
        + Add Education
      </button>
    </div>
  );

  // Experience editor with expandable text areas
  const renderExperienceEditor = (section: Section) => (
    <div className="items-editor">
      {section.items?.map((item) => (
        <div key={item.id} className="item-editor">
          <div className="item-header">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
              placeholder="Job Title/Position"
              className="item-input"
            />
            <input
              type="text"
              value={item.organization || ''}
              onChange={(e) => updateItem(section.id, item.id, { organization: e.target.value })}
              placeholder="Company/Organization"
              className="item-input"
            />
            <button className="delete-item-btn" onClick={() => deleteItem(section.id, item.id)}>🗑️</button>
          </div>
          
          <div className="item-details">
            <div className="detail-row">
              <input
                type="text"
                value={item.location || ''}
                onChange={(e) => updateItem(section.id, item.id, { location: e.target.value })}
                placeholder="Location"
                className="item-input"
              />
              <input
                type="text"
                value={item.dates || ''}
                onChange={(e) => updateItem(section.id, item.id, { dates: e.target.value })}
                placeholder="Dates (e.g., May 2020 – Current)"
                className="item-input"
              />
            </div>
            
            <div className="details-list">
              <label>Responsibilities & Achievements:</label>
              {item.details?.map((detail, index) => (
                <div key={index} className="detail-item">
                  <textarea
                    value={detail}
                    onChange={(e) => {
                      const newDetails = [...(item.details || [])];
                      newDetails[index] = e.target.value;
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    placeholder="Describe your responsibilities, achievements, or projects"
                    className="detail-textarea"
                    rows={3}
                  />
                  <button
                    onClick={() => {
                      const newDetails = item.details?.filter((_, i) => i !== index) || [];
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    className="delete-detail-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newDetails = [...(item.details || []), ''];
                  updateItem(section.id, item.id, { details: newDetails });
                }}
                className="add-detail-btn"
              >
                + Add Detail
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <button className="add-item-btn" onClick={() => addItemToSection(section.id)}>
        + Add Experience
      </button>
    </div>
  );

  // Certifications editor
  const renderCertificationsEditor = (section: Section) => (
    <div className="items-editor">
      {section.items?.map((item) => (
        <div key={item.id} className="item-editor">
          <div className="item-header">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
              placeholder="Certification Name"
              className="item-input"
            />
            <input
              type="text"
              value={item.organization || ''}
              onChange={(e) => updateItem(section.id, item.id, { organization: e.target.value })}
              placeholder="Issuing Organization"
              className="item-input"
            />
            <button className="delete-item-btn" onClick={() => deleteItem(section.id, item.id)}>🗑️</button>
          </div>
          
          <div className="item-details">
            <div className="detail-row">
              <input
                type="text"
                value={item.dates || ''}
                onChange={(e) => updateItem(section.id, item.id, { dates: e.target.value })}
                placeholder="Date Issued/Expires"
                className="item-input"
              />
              <input
                type="text"
                value={item.credentialId || ''}
                onChange={(e) => updateItem(section.id, item.id, { credentialId: e.target.value })}
                placeholder="Credential ID (optional)"
                className="item-input"
              />
            </div>
            
            <div className="details-list">
              <label>Additional Details:</label>
              {item.details?.map((detail, index) => (
                <div key={index} className="detail-item">
                  <textarea
                    value={detail}
                    onChange={(e) => {
                      const newDetails = [...(item.details || [])];
                      newDetails[index] = e.target.value;
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    placeholder="Additional details about the certification"
                    className="detail-textarea"
                    rows={2}
                  />
                  <button
                    onClick={() => {
                      const newDetails = item.details?.filter((_, i) => i !== index) || [];
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    className="delete-detail-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newDetails = [...(item.details || []), ''];
                  updateItem(section.id, item.id, { details: newDetails });
                }}
                className="add-detail-btn"
              >
                + Add Detail
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <button className="add-item-btn" onClick={() => addItemToSection(section.id)}>
        + Add Certification
      </button>
    </div>
  );

  // Skills editor
  const renderSkillsEditor = (section: Section) => {
    // Get categories from multiple possible locations for compatibility
    const rawCategories = section.customFields?.categories || 
                          section.items?.[0]?.categories || 
                          [];
    
    // Ensure all categories have IDs for consistent management
    const categories = rawCategories.map((cat: any, index: number) => ({
      ...cat,
      id: cat.id || `category-${cat.name || index}`,
      skills: cat.skills || []
    }));

    const updateSkillsCategories = (newCategories: any[]) => {
      // Update both customFields and items for maximum compatibility
      const updatedSection = {
        ...section,
        customFields: {
          ...section.customFields,
          categories: newCategories
        },
        items: section.items?.length ? 
          section.items.map(item => 
            item.id === section.items?.[0]?.id ? 
              { ...item, categories: newCategories } : item
          ) :
          [{ 
            id: `skills-item-${Date.now()}`, 
            title: 'Skills',
            categories: newCategories 
          }]
      };
      
      updateSection(section.id, updatedSection);
    };

    const addCategory = () => {
      const newCategory = {
        id: `category-${Date.now()}`,
        name: 'New Category',
        skills: [],
        order: categories.length
      };
      updateSkillsCategories([...categories, newCategory]);
    };

    const updateCategory = (categoryId: string, updates: any) => {
      const updatedCategories = categories.map((cat: any) => {
        const catKey = cat.id || cat.name;
        return catKey === categoryId ? { ...cat, ...updates } : cat;
      });
      updateSkillsCategories(updatedCategories);
    };

    const deleteCategory = (categoryId: string) => {
      const updatedCategories = categories.filter((cat: any) => {
        const catKey = cat.id || cat.name;
        return catKey !== categoryId;
      });
      updateSkillsCategories(updatedCategories);
    };







    return (
      <div className="skills-section-editor">
        {categories.map((category: any) => (
          <div key={category.id || category.name} className="skill-category-editor">
            <div className="category-header">
              <input
                type="text"
                value={category.name}
                onChange={(e) => updateCategory(category.id || category.name, { name: e.target.value })}
                placeholder="Category Name (e.g., Programming Languages)"
                className="category-name-input"
              />
              <button
                className="delete-category-btn"
                onClick={() => deleteCategory(category.id || category.name)}
                title="Delete Category"
              >
                🗑️
              </button>
            </div>
            
            <div className="skills-list-editor">
              <input
                type="text"
                placeholder="Type skills separated by commas and press Enter (e.g., JavaScript, React, Python)..."
                className="skill-tag-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    const inputValue = e.currentTarget.value.trim();
                    
                    // Handle comma-separated skills
                    const skillsToAdd = inputValue.split(',').map(skill => skill.trim()).filter(skill => skill);
                    const currentSkills = category.skills || [];
                    const existingSkillsLower = currentSkills.map((s: string) => s.toLowerCase());
                    const newSkills = skillsToAdd.filter(skill => 
                      !existingSkillsLower.includes(skill.toLowerCase())
                    );
                    
                    if (newSkills.length > 0) {
                      const categoryKey = category.id || category.name;
                      const updatedCategories = categories.map((cat: any) => {
                        const catKey = cat.id || cat.name;
                        return catKey === categoryKey ? 
                          { ...cat, skills: [...currentSkills, ...newSkills] } : cat;
                      });
                      updateSkillsCategories(updatedCategories);
                      e.currentTarget.value = '';
                    } else if (skillsToAdd.length > 0) {
                      // All skills were duplicates - show feedback
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.backgroundColor = '#fef3c7';
                      setTimeout(() => {
                        e.currentTarget.style.borderColor = '';
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.value = '';
                      }, 1000);
                    }
                  }
                }}
              />
              <div className="skills-tags-container">
                {category.skills && category.skills.length > 0 ? (
                  category.skills.map((skill: string, skillIndex: number) => (
                    <div key={skillIndex} className="skill-tag-item">
                      <span className="skill-tag-text">{skill}</span>
                      <button
                        className="skill-tag-delete"
                        onClick={() => {
                          const categoryKey = category.id || category.name;
                          const updatedCategories = categories.map((cat: any) => {
                            const catKey = cat.id || cat.name;
                            return catKey === categoryKey ? {
                              ...cat,
                              skills: cat.skills.filter((_: any, index: number) => index !== skillIndex)
                            } : cat;
                          });
                          updateSkillsCategories(updatedCategories);
                        }}
                        title="Remove skill"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="skills-empty-state">
                    No skills added yet. Type skills in the input above and press Enter.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <button className="add-category-btn" onClick={addCategory}>
          + Add Category
        </button>
      </div>
    );
  };

  // Generic editor for other section types
  // References section editor
  const renderReferencesEditor = (section: Section) => (
    <div className="items-editor">
      {section.items?.map((item) => (
        <div key={item.id} className="item-editor">
          <div className="item-header">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
              placeholder="Reference Name"
              className="item-input"
            />
            <button className="delete-item-btn" onClick={() => deleteItem(section.id, item.id)}>🗑️</button>
          </div>
          
          <input
            type="text"
            value={item.organization || ''}
            onChange={(e) => updateItem(section.id, item.id, { organization: e.target.value })}
            placeholder="Job Title / Position"
            className="item-input"
          />
          
          <div className="contact-fields">
            <input
              type="tel"
              value={item.phone || ''}
              onChange={(e) => updateItem(section.id, item.id, { phone: e.target.value })}
              placeholder="Phone Number"
              className="item-input half-width"
            />
            <input
              type="email"
              value={item.email || ''}
              onChange={(e) => updateItem(section.id, item.id, { email: e.target.value })}
              placeholder="Email Address"
              className="item-input half-width"
            />
          </div>
        </div>
      ))}
      
      <button className="add-item-btn" onClick={() => addItemToSection(section.id)}>
        + Add Reference
      </button>
    </div>
  );

  // Awards editor with simpler, award-specific fields
  const renderAwardsEditor = (section: Section) => (
    <div className="items-editor">
      {section.items?.map((item) => (
        <div key={item.id} className="item-editor awards-item-editor">
          <div className="item-header">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
              placeholder="Award/Recognition Title"
              className="item-input"
            />
            <button className="delete-item-btn" onClick={() => deleteItem(section.id, item.id)}>🗑️</button>
          </div>
          
          <div className="awards-details">
            <input
              type="text"
              value={item.organization || ''}
              onChange={(e) => updateItem(section.id, item.id, { organization: e.target.value })}
              placeholder="Issuing Organization"
              className="item-input"
            />
            <input
              type="text"
              value={item.dates || ''}
              onChange={(e) => updateItem(section.id, item.id, { dates: e.target.value })}
              placeholder="Date Received (e.g., May 2023)"
              className="item-input"
            />
            <textarea
              value={item.description || ''}
              onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
              placeholder="Brief description or significance (optional)"
              className="detail-textarea"
              rows={2}
            />
          </div>
        </div>
      ))}
      
      <button className="add-item-btn" onClick={() => addItemToSection(section.id)}>
        + Add Award
      </button>
    </div>
  );

  // List editor for publications and general lists
  const renderListEditor = (section: Section) => (
    <div className="items-editor">
      {section.items?.map((item) => (
        <div key={item.id} className="item-editor">
          <div className="item-header">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
              placeholder="Item Title"
              className="item-input"
            />
            <input
              type="text"
              value={item.organization || ''}
              onChange={(e) => updateItem(section.id, item.id, { organization: e.target.value })}
              placeholder="Organization/Venue (optional)"
              className="item-input"
            />
            <button className="delete-item-btn" onClick={() => deleteItem(section.id, item.id)}>🗑️</button>
          </div>
          
          <div className="item-details">
            <div className="detail-row">
              <input
                type="text"
                value={item.dates || ''}
                onChange={(e) => updateItem(section.id, item.id, { dates: e.target.value })}
                placeholder="Date (optional)"
                className="item-input"
              />
              <input
                type="text"
                value={item.type || ''}
                onChange={(e) => updateItem(section.id, item.id, { type: e.target.value })}
                placeholder="Type (e.g., Conference, Journal)"
                className="item-input"
              />
            </div>
            
            {item.url && (
              <input
                type="url"
                value={item.url || ''}
                onChange={(e) => updateItem(section.id, item.id, { url: e.target.value })}
                placeholder="URL (optional)"
                className="item-input"
              />
            )}
            
            <div className="details-list">
              <label>Additional Details:</label>
              {item.details?.map((detail, index) => (
                <div key={index} className="detail-item">
                  <textarea
                    value={detail}
                    onChange={(e) => {
                      const newDetails = [...(item.details || [])];
                      newDetails[index] = e.target.value;
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    placeholder="Description or additional information"
                    className="detail-textarea"
                    rows={2}
                  />
                  <button
                    onClick={() => {
                      const newDetails = item.details?.filter((_, i) => i !== index) || [];
                      updateItem(section.id, item.id, { details: newDetails });
                    }}
                    className="delete-detail-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newDetails = [...(item.details || []), ''];
                  updateItem(section.id, item.id, { details: newDetails });
                }}
                className="add-detail-btn"
              >
                + Add Detail
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <button className="add-item-btn" onClick={() => addItemToSection(section.id)}>
        + Add Item
      </button>
    </div>
  );

  const renderGenericEditor = (section: Section) => (
    <div className="items-editor">
      {section.items?.map((item) => (
        <div key={item.id} className="item-editor">
          <div className="item-header">
            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
              placeholder="Title"
              className="item-input"
            />
            <button className="delete-item-btn" onClick={() => deleteItem(section.id, item.id)}>🗑️</button>
          </div>
          
          <textarea
            value={item.description || ''}
            onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
            placeholder="Description"
            className="detail-textarea"
            rows={3}
          />
        </div>
      ))}
      
      <button className="add-item-btn" onClick={() => addItemToSection(section.id)}>
        + Add Item
      </button>
    </div>
  );

  return (
    <div className="resume-content-builder">
      <div className="content-header">
        <h2>📝 Resume Content</h2>
        <button 
          className="add-section-btn"
          onClick={() => setShowAddSection(!showAddSection)}
        >
          + Add Section
        </button>
      </div>

      {showAddSection && (
        <div className="add-section-dropdown">
          <h3>Choose Section Type:</h3>
          {availableSectionTypes.map(sectionType => (
            <button
              key={sectionType.type}
              className="section-type-option"
              onClick={() => addSection(sectionType.type)}
            >
              <div className="section-type-label">{sectionType.label}</div>
              <div className="section-type-description">{sectionType.description}</div>
            </button>
          ))}
        </div>
      )}

      <div className="sections-viewport">
        <div className="sections-list">
          {resumeData.sections?.map((section) => (
          <div key={section.id} className="section-card">
            <div className="section-header">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                className="section-title-input"
                placeholder="Section Title"
              />
              <div className="section-actions">
                <button
                  className="toggle-edit-btn"
                  onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                >
                  {editingSection === section.id ? '▲' : '▼'}
                </button>
                <button
                  className="delete-section-btn"
                  onClick={() => deleteSection(section.id)}
                >
                  🗑️
                </button>
              </div>
            </div>

            {editingSection === section.id && (
              <div className="section-content">
                {renderSectionEditor(section)}
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
