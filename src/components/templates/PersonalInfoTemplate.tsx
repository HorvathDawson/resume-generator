export const PersonalInfoTemplates = {
  standard: {
    id: 'personal-info-standard',
    name: 'Standard Contact',
    description: 'Vertical contact information',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info standard">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
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
      <div className="contact-info horizontal">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },

  primaryIcons: {
    id: 'personal-info-primary-icons',
    name: 'Primary Color Icons',
    description: 'Contact info with primary color icons',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info primary-icons">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },

  coloredText: {
    id: 'personal-info-colored-text',
    name: 'Colored Text',
    description: 'Contact text in accent color',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info colored-text">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },

  minimal: {
    id: 'personal-info-minimal',
    name: 'Minimal',
    description: 'Compact minimal design',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info minimal">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },

  wideBadge: {
    id: 'personal-info-wide-badge',
    name: 'Wide Badge Style',
    description: 'Contact items in horizontal badges',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info wide-badge">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },

  wideCard: {
    id: 'personal-info-wide-card',
    name: 'Wide Card Style',
    description: 'Horizontal contact info in a card with colored icons',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info wide-card">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  },

  compact: {
    id: 'personal-info-compact',
    name: 'Ultra Compact',
    description: 'Minimal horizontal layout',
    component: ({ section: _section, personalInfo }: { section: any; personalInfo: any }) => (
      <div className="contact-info compact">
        <ul>
          {personalInfo?.email && (
            <li>
              <div className="icon"><i className="fas fa-envelope"></i></div>
              <div className="text">{personalInfo.email}</div>
            </li>
          )}
          {personalInfo?.phone && (
            <li>
              <div className="icon"><i className="fas fa-phone"></i></div>
              <div className="text">{personalInfo.phone}</div>
            </li>
          )}
          {personalInfo?.website && (
            <li>
              <div className="icon"><i className="fas fa-globe"></i></div>
              <div className="text">{personalInfo.website}</div>
            </li>
          )}
          {personalInfo?.github && (
            <li>
              <div className="icon"><i className="fab fa-github"></i></div>
              <div className="text">{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>
            </li>
          )}
          {personalInfo?.linkedin && (
            <li>
              <div className="icon"><i className="fab fa-linkedin"></i></div>
              <div className="text">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>
            </li>
          )}
          {personalInfo?.location && (
            <li>
              <div className="icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="text">{personalInfo.location}</div>
            </li>
          )}
        </ul>
      </div>
    )
  }
};