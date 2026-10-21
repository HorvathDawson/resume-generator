import type { CSSProperties } from 'react';
import type { Page, ResumeDocument, Row } from '../model/types';
import { footerHeight } from '../model/variants';
import { themeVars } from './themeVars';
import { SectionView } from './sections';
import { Footer } from './Footer';
import './resume.css';

function RowView({ row, doc }: { row: Row; doc: ResumeDocument }) {
  const split = row.columns.length === 2;
  const sectionsById = new Map(doc.sections.map((s) => [s.id, s]));
  return (
    <div
      className={`rg-row ${split ? 'rg-row--split' : 'rg-row--full'} rg-shade-${row.shade}`}
      style={split ? { gridTemplateColumns: `${row.split}% minmax(0, 1fr)` } : undefined}
    >
      {row.columns.map((col, i) => {
        const shaded = (row.shade === 'left' && i === 0) || (row.shade === 'right' && i === 1);
        return (
          <div key={i} className={`rg-col${shaded ? ' rg-col--shaded' : ''}`}>
            {col.map((p) => {
              const section = sectionsById.get(p.sectionId);
              if (!section) return null;
              return <SectionView key={p.id} section={section} profile={doc.profile} placementId={p.id} from={p.from} to={p.to} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

export function PageView({ page, doc }: { page: Page; doc: ResumeDocument }) {
  return (
    <div
      className="rg-page"
      data-page-id={page.id}
      style={{ '--rg-footer-h': `${footerHeight(page.footer, doc.theme.customFooter)}cm` } as CSSProperties}
    >
      <div className="rg-page-body">
        {page.rows.map((row) => (
          <RowView key={row.id} row={row} doc={doc} />
        ))}
      </div>
      {page.footer !== 'none' && <Footer type={page.footer} custom={doc.theme.customFooter} />}
    </div>
  );
}

/** The resume itself: a stack of A4 pages. Used for the preview, printing and HTML export. */
export function ResumeView({ doc, pages = doc.pages, className = '' }: { doc: ResumeDocument; pages?: Page[]; className?: string }) {
  return (
    <div className={`rg-doc rg-hs-${doc.theme.headingStyle} ${className}`} style={themeVars(doc.theme)}>
      {pages.map((page) => (
        <PageView key={page.id} page={page} doc={doc} />
      ))}
    </div>
  );
}
