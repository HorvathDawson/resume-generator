import type { Section } from '../../types/resume';

export const ListTemplates = {
  simple: {
    id: 'list-simple',
    name: 'Simple List',
    description: 'Basic bullet point list',
    component: ({ section }: { section: Section }) => (
      <div className="section list-section simple">
        <h2>{section.title}</h2>
        <ul className="simple-list">
          {section.items?.map((item, index) => (
            <li key={index}>{item.name || item.title || item.description}</li>
          ))}
        </ul>
      </div>
    )
  },
  
  compact: {
    id: 'list-compact',
    name: 'Compact List',
    description: 'Compact list with minimal spacing',
    component: ({ section }: { section: Section }) => (
      <div className="section list-section compact">
        <h2>{section.title}</h2>
        <div className="compact-list">
          {section.items?.map((item, index) => (
            <div key={index} className="compact-list-item">
              {item.name || item.title || item.description}
            </div>
          ))}
        </div>
      </div>
    )
  },
  
  inline: {
    id: 'list-inline',
    name: 'Inline List',
    description: 'Items separated by bullets on one line',
    component: ({ section }: { section: Section }) => (
      <div className="section list-section inline">
        <h2>{section.title}</h2>
        <div className="inline-list">
          {section.items?.map((item, index) => (
            <span key={index}>
              {item.name || item.title || item.description}
              {index < section.items!.length - 1 && <span className="separator"> • </span>}
            </span>
          ))}
        </div>
      </div>
    )
  },
  
  detailed: {
    id: 'list-detailed',
    name: 'Detailed List',
    description: 'List with additional details and metadata',
    component: ({ section }: { section: Section }) => (
      <div className="section list-section detailed">
        <h2>{section.title}</h2>
        <ul className="detailed-list">
          {section.items?.map((item, index) => (
            <li key={index} className="detailed-list-item">
              <div className="item-header">
                <div className="item-title">{item.title || item.name}</div>
                {item.dates && <div className="item-dates">{item.dates}</div>}
              </div>
              {item.organization && <div className="item-organization">{item.organization}</div>}
              {item.details && (
                <ul className="item-details">
                  {item.details.map((detail: string, detailIndex: number) => (
                    <li key={detailIndex}>{detail}</li>
                  ))}
                </ul>
              )}
            </li>
          )) || []}
        </ul>
      </div>
    )
  }
};