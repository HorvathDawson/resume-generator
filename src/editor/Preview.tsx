import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Maximize, TriangleAlert, ZoomIn, ZoomOut } from 'lucide-react';
import type { ResumeDocument } from '../model/types';
import { PageView } from '../resume/ResumeView';
import { themeVars } from '../resume/themeVars';
import { IconButton } from './fields';

const PAGE_PX = (210 / 25.4) * 96;

interface Props {
  doc: ResumeDocument;
  overflow: Record<string, number>;
  selectedId: string | null;
  /** Leave out for a read-only preview. */
  onSelectSection?: (id: string) => void;
}

/** Live, zoomable preview. Click a section to edit it (unless read-only). */
export function Preview({ doc, overflow, selectedId, onSelectSection }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.7);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const scale = zoom === 'fit' ? fit : zoom;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const available = el.clientWidth - 48;
      setFit(Math.max(0.3, Math.min(1, available / PAGE_PX)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const step = (delta: number) => setZoom(Math.max(0.3, Math.min(2, Math.round((scale + delta) * 10) / 10)));

  return (
    <div className="preview" data-tour="preview">
      <div className="preview-bar">
        <span className="preview-pages">
          {doc.pages.length} {doc.pages.length === 1 ? 'page' : 'pages'}
        </span>
        <div className="zoom">
          <IconButton title="Zoom out" onClick={() => step(-0.1)}>
            <ZoomOut size={16} />
          </IconButton>
          <span className="zoom-value">{Math.round(scale * 100)}%</span>
          <IconButton title="Zoom in" onClick={() => step(0.1)}>
            <ZoomIn size={16} />
          </IconButton>
          <IconButton title="Fit to width" onClick={() => setZoom('fit')}>
            <Maximize size={15} />
          </IconButton>
        </div>
      </div>
      <div
        ref={scroller}
        className={`preview-scroll${onSelectSection ? ' is-editable' : ''}`}
        onClick={(e) => {
          if (!onSelectSection) return;
          const target = (e.target as HTMLElement).closest<HTMLElement>('[data-section-id]');
          if (target?.dataset.sectionId) {
            e.preventDefault();
            onSelectSection(target.dataset.sectionId);
          }
        }}
      >
        {selectedId && (
          <style>{`.preview-scroll [data-section-id="${CSS.escape(selectedId)}"] { outline: 2px solid #6366f1; outline-offset: 3px; }`}</style>
        )}
        {doc.pages.map((page, i) => (
          <div key={page.id} className="preview-page">
            <div className="preview-page-label">
              Page {i + 1}
              {overflow[page.id] !== undefined && (
                <span className="preview-overflow" title="Content past the bottom edge will be cut off">
                  <TriangleAlert size={12} /> {overflow[page.id]} cm cut off
                </span>
              )}
            </div>
            <div
              className={`rg-doc rg-hs-${doc.theme.headingStyle}${overflow[page.id] !== undefined ? ' is-overflowing' : ''}`}
              style={{ ...themeVars(doc.theme), zoom: scale } as CSSProperties}
            >
              <PageView page={page} doc={doc} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
