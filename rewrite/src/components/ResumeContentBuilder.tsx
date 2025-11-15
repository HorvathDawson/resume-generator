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
    { type: 'experience', label: 'Experience', description: 'Work experience, projects, volunteer work, etc.' },
    { type: 'education', label: 'Education', description: 'Schools, degrees, certifications' },
    { type: 'skills', label: 'Skills', description: 'Technical and soft skills' },
    { type: 'text', label: 'Text Section', description: 'Summary, objective, or custom text' },
    { type: 'certifications', label: 'Certifications', description: 'Professional certifications and licenses' },
  ];

  const addSection = (sectionType: string) => {
    const newSection: Section = {
      id: `${sectionType}-${Date.now()}`,
      type: sectionType as any,
      title: sectionType === 'experience' ? 'Experience' : sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
      templateId: 'basic',
      isVisible: true,
      items: sectionType === 'skills' ? [] : [
        {
          id: `item-${Date.now()}`,
          title: '',
          organization: sectionType === 'experience' ? '' : undefined,
          dates: sectionType === 'experience' ? '' : undefined,
          details: sectionType === 'experience' ? [''] : undefined,
          description: sectionType === 'text' ? '' : undefined,
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
        return renderSkillsEditor();
      default:
        return renderGenericEditor(section);
    }
  };

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
      {section.items?.map((item, index) => (
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
  const renderSkillsEditor = () => (
    <div className="skills-section-editor">
      <p>Skills editor with categories coming in next update...</p>
      <p>Current skills data structure needs to be enhanced for full editing support.</p>
    </div>
  );

  // Generic editor for other section types
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
  );
}
