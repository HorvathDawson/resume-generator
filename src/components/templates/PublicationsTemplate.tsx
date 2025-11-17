import type { Section } from '../../types/resume';

export const PublicationsTemplates = {
  simple: {
    id: 'publications-simple',
    name: 'Simple',
    description: 'Super simple bullet point list',
    component: ({ section }: { section: Section }) => (
      <div className="section publications-section simple">
        <h2>{section.title}</h2>
        <ul className="publications-simple-list">
          {section.items?.map((item, index) => (
            <li key={index} className="publication-item-simple">
              {item.title || item.name || item.description}
            </li>
          ))}
        </ul>
      </div>
    )
  },
  
  modern: {
    id: 'publications-modern',
    name: 'Modern',
    description: 'Modern clean design with cards',
    component: ({ section }: { section: Section }) => (
      <div className="section publications-section modern">
        <h2>{section.title}</h2>
        <div className="publications-modern-grid">
          {section.items?.map((item, index) => (
            <div key={index} className="publication-card-modern">
              <div className="publication-content">
                <h3 className="publication-title-modern">{item.title || item.name}</h3>
                {item.organization && (
                  <div className="publication-venue-modern">{item.organization}</div>
                )}
                {item.dates && (
                  <div className="publication-date-modern">{item.dates}</div>
                )}
                {item.description && (
                  <p className="publication-description-modern">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  
  elegant: {
    id: 'publications-elegant',
    name: 'Elegant',
    description: 'Elegant timeline-style layout',
    component: ({ section }: { section: Section }) => (
      <div className="section publications-section elegant">
        <h2>{section.title}</h2>
        <div className="publications-elegant-list">
          {section.items?.map((item, index) => (
            <div key={index} className="publication-item-elegant">
              <div className="publication-marker"></div>
              <div className="publication-content-elegant">
                <div className="publication-header-elegant">
                  <h3 className="publication-title-elegant">{item.title || item.name}</h3>
                  {item.dates && (
                    <span className="publication-date-elegant">{item.dates}</span>
                  )}
                </div>
                {item.organization && (
                  <div className="publication-venue-elegant">{item.organization}</div>
                )}
                {item.location && (
                  <div className="publication-location-elegant">{item.location}</div>
                )}
                {item.description && (
                  <p className="publication-description-elegant">{item.description}</p>
                )}
                {item.details && item.details.length > 0 && (
                  <ul className="publication-details-elegant">
                    {item.details.map((detail: string, detailIndex: number) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },

  minimal: {
    id: 'publications-minimal',
    name: 'Minimal',
    description: 'Clean minimal design with subtle accents',
    component: ({ section }: { section: Section }) => (
      <div className="section publications-section minimal">
        <h2>{section.title}</h2>
        <div className="publications-minimal-list">
          {section.items?.map((item, index) => (
            <div key={index} className="publication-item-minimal">
              <div className="publication-main-minimal">
                <h3 className="publication-title-minimal">{item.title || item.name}</h3>
                <div className="publication-meta-minimal">
                  {item.organization && (
                    <span className="publication-venue-minimal">{item.organization}</span>
                  )}
                  {item.organization && item.dates && <span className="separator-minimal"> • </span>}
                  {item.dates && (
                    <span className="publication-date-minimal">{item.dates}</span>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="publication-description-minimal">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },

  academic: {
    id: 'publications-academic',
    name: 'Academic',
    description: 'Academic citation style format',
    component: ({ section }: { section: Section }) => (
      <div className="section publications-section academic">
        <h2>{section.title}</h2>
        <div className="publications-academic-list">
          {section.items?.map((item, index) => (
            <div key={index} className="publication-item-academic">
              <div className="publication-number-academic">{index + 1}.</div>
              <div className="publication-content-academic">
                <div className="publication-citation-academic">
                  <span className="publication-title-academic">"{item.title || item.name}"</span>
                  {item.organization && (
                    <span className="publication-venue-academic"> {item.organization}</span>
                  )}
                  {item.dates && (
                    <span className="publication-date-academic"> ({item.dates})</span>
                  )}
                  {item.location && (
                    <span className="publication-location-academic">, {item.location}</span>
                  )}
                </div>
                {item.description && (
                  <p className="publication-description-academic">{item.description}</p>
                )}
                {item.details && item.details.length > 0 && (
                  <div className="publication-details-academic">
                    {item.details.map((detail: string, detailIndex: number) => (
                      <div key={detailIndex} className="publication-detail-academic">
                        {detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
};