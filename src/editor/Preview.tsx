import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Maximize, Merge, Scissors, TriangleAlert, ZoomIn, ZoomOut } from 'lucide-react';
import type { ResumeDocument } from '../model/types';
import { locatePlacement } from '../model/edit';
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
  /** Split a section part so items from `at` on continue on the next page. Leave out to turn splitting off. */
  onSplit?: (placementId: string, at: number) => void;
  /** Put a split section back together. */
  onJoin?: (placementId: string) => void;
}

/** The split (or join) button shown where the pointer is, in the scroller's own coordinates. */
type SplitTool =
  | { kind: 'split'; placementId: string; at: number; top: number; left: number; width: number }
  | { kind: 'join'; placementId: string; top: number; left: number; width: number };

/** How near (in screen pixels) the pointer must be to the gap between two items to offer a split there. */
const GAP_REACH = 22;

/** Live, zoomable preview. Click a section to edit it (unless read-only). */
export function Preview({ doc, overflow, selectedId, onSelectSection, onSplit, onJoin }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<SplitTool | null>(null);

  // Hovering between two items of a section offers to split it there; hovering
  // the heading of a part that continues from another page offers to join it.
  const findTool = (e: ReactMouseEvent): SplitTool | null => {
    const root = scroller.current;
    const section = (e.target as HTMLElement).closest<HTMLElement>('[data-placement-id]');
    const placementId = section?.dataset.placementId;
    if (!root || !section || !placementId || !onSplit) return null;
    const loc = locatePlacement(doc, placementId);
    if (!loc) return null;
    const from = doc.pages[loc.page].rows[loc.row].columns[loc.col][loc.index].from ?? 0;
    const base = root.getBoundingClientRect();
    const box = section.getBoundingClientRect();
    const left = box.left - base.left + root.scrollLeft;
    const local = (y: number) => y - base.top + root.scrollTop;
    const heading = section.querySelector('.rg-heading')?.getBoundingClientRect();
    if (from > 0 && onJoin && heading && e.clientY >= heading.top - 4 && e.clientY <= heading.bottom + 4) {
      return { kind: 'join', placementId, top: local(heading.top + heading.height / 2), left, width: box.width };
    }
    const items = [...section.querySelectorAll('[data-item]')].map((el) => el.getBoundingClientRect());
    let best: { i: number; y: number; d: number } | null = null;
    for (let i = 0; i < items.length - 1; i++) {
      const y = (items[i].bottom + items[i + 1].top) / 2;
      const d = Math.abs(e.clientY - y);
      if (d < GAP_REACH && (!best || d < best.d)) best = { i, y, d };
    }
    return best && { kind: 'split', placementId, at: from + best.i + 1, top: local(best.y), left, width: box.width };
  };

  const onMove = (e: ReactMouseEvent) => {
    // Moving onto the button itself keeps it.
    if ((e.target as HTMLElement).closest('.split-tool')) return;
    const next = findTool(e);
    setTool((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  };
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
        onMouseMove={onSplit ? onMove : undefined}
        onMouseLeave={() => setTool(null)}
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
        {tool && (
          <div className={`split-tool split-tool--${tool.kind}`} style={{ top: tool.top, left: tool.left, width: tool.width }}>
            {tool.kind === 'split' && <span className="split-tool-line" />}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (tool.kind === 'split') onSplit?.(tool.placementId, tool.at);
                else onJoin?.(tool.placementId);
                setTool(null);
              }}
            >
              {tool.kind === 'split' ? (
                <>
                  <Scissors size={13} /> Continue on next page
                </>
              ) : (
                <>
                  <Merge size={13} /> Join back
                </>
              )}
            </button>
          </div>
        )}
        {doc.pages.map((page, i) => (
          <div key={page.id} className="preview-page">
            <div className="preview-page-label">
              Page {i + 1}
              {overflow[page.id] !== undefined && (
                <span className="preview-overflow" title="Content past the bottom edge will be cut off. Hover between two items of a section to continue it on the next page.">
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
