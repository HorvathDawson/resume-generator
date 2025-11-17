export const PersonalInfoTemplates = {
  standard: {
    id: 'personal-info-standard',
    name: 'Standard Contact',
    description: 'Vertical contact information',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info">
        <ul>
          {personalInfo?.email && (
            <li className="contact">
              <div className="icons"><i className="fas fa-envelope"></i></div>
              <div className="words">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li className="contact">
              <div className="icons"><i className="fas fa-phone"></i></div>
              <div className="words">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li className="contact">
              <div className="icons"><i className="fas fa-globe"></i></div>
              <div className="words">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li className="contact">
              <div className="icons"><i className="fab fa-github"></i></div>
              <div className="words">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li className="contact">
              <div className="icons"><i className="fab fa-linkedin"></i></div>
              <div className="words">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li className="contact">
              <div className="icons"><i className="fas fa-map-marker-alt"></i></div>
              <div className="words">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },
  
  wide: {
    id: 'personal-info-wide',
    name: 'Horizontal Contact',
    description: 'Horizontal contact information line',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info-wide">
        <div className="contact-line">
          {personalInfo?.email && (
            <span className="contact-item">
              <i className="fas fa-envelope"></i>
              <span className="contact-text">{personalInfo.email}</span>
            </span>
          )}
          {personalInfo?.phone && (
            <span className="contact-item">
              <i className="fas fa-phone"></i>
              <span className="contact-text">{personalInfo.phone}</span>
            </span>
          )}
          {personalInfo?.website && (
            <span className="contact-item">
              <i className="fas fa-globe"></i>
              <span className="contact-text">{personalInfo.website}</span>
            </span>
          )}
          {personalInfo?.github && (
            <span className="contact-item">
              <i className="fab fa-github"></i>
              <span className="contact-text">{personalInfo.github}</span>
            </span>
          )}
          {personalInfo?.linkedin && (
            <span className="contact-item">
              <i className="fab fa-linkedin"></i>
              <span className="contact-text">{personalInfo.linkedin}</span>
            </span>
          )}
          {personalInfo?.location && (
            <span className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <span className="contact-text">{personalInfo.location}</span>
            </span>
          )}
        </div>
      </div>
    )
  }
};