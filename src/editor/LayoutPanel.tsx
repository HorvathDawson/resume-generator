import { createContext, useContext, useRef, useState } from 'react';
import type { DragEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUp, ChevronDown, GripVertical, Merge, MoreHorizontal, Pencil, Plus, Scissors, Trash2, TriangleAlert, Wand2, X } from 'lucide-react';
import type { FooterType, Page, Placement, ResumeDocument, Row, Section, Shade } from '../model/types';
import { itemCount, itemLabels, newPage, newRow } from '../model/defaults';
import { addToLayout, dropInto, findSection, joinParts, locatePlacement, move, movePlacementToPage, pagesShowing, sectionParts, splitPlacement, takePlacement } from '../model/edit';
import type { DragItem } from '../model/edit';
import { arrangeLayout, getTemplate } from '../model/templates';
import { FOOTERS, SECTION_TYPE_LABELS } from '../model/variants';
import type { Updater } from '../hooks/useHistory';
import { Segmented } from './fields';
import { Popover } from './Menu';

interface Props {
  doc: ResumeDocument;
  update: (fn: Updater, key?: string) => void;
  overflow: Record<string, number>;
  onEditSection: (id: string) => void;
  onAutoFit: () => void;
  notify: (message: string, undoable?: boolean) => void;
}

// ---- Row layouts --------------------------------------------------------------

interface RowLayout {
  id: string;
  label: string;
  columns: 1 | 2;
  split: number;
}

const ROW_LAYOUTS: RowLayout[] = [
  { id: 'one', label: 'One column', columns: 1, split: 100 },
  { id: 'narrow-left', label: 'Narrow left column', columns: 2, split: 32 },
  { id: 'even', label: 'Two equal columns', columns: 2, split: 50 },
  { id: 'narrow-right', label: 'Narrow right column', columns: 2, split: 66 },
];

function layoutOf(row: Row): string {
  if (row.columns.length === 1) return 'one';
  return row.split < 45 ? 'narrow-left' : row.split <= 55 ? 'even' : 'narrow-right';
}

function LayoutIcon({ layout }: { layout: RowLayout }) {
  return (
    <span className="layout-icon" aria-hidden>
      <i style={{ flex: layout.split }} />
      {layout.columns === 2 && <i style={{ flex: 100 - layout.split }} />}
    </span>
  );
}

function applyRowLayout(r: Row, layout: RowLayout) {
  if (layout.columns === 1) {
    r.columns = [r.columns.flat()];
    r.shade = 'none';
    return;
  }
  if (r.columns.length === 1) r.columns = [r.columns[0], []];
  r.split = layout.split;
}

const SHADES = [
  { id: 'none' as Shade, label: 'None' },
  { id: 'left' as Shade, label: 'Left' },
  { id: 'right' as Shade, label: 'Right' },
];

// ---- Drag and drop ------------------------------------------------------------------

interface DropTarget {
  pageId: string;
  rowId: string | null;
  col: number;
  index: number;
}

interface DragState {
  item: DragItem | null;
  target: DropTarget | null;
  start: (item: DragItem) => void;
  over: (target: DropTarget | null) => void;
  drop: () => void;
  end: () => void;
}

const DragContext = createContext<DragState | null>(null);
const useDrag = () => useContext(DragContext)!;

const sameTarget = (a: DropTarget | null, b: DropTarget | null) =>
  a === b || (!!a && !!b && a.pageId === b.pageId && a.rowId === b.rowId && a.col === b.col && a.index === b.index);

// ---- Panel ----------------------------------------------------------------------------

export function LayoutPanel({ doc, update, overflow, onEditSection, onAutoFit, notify }: Props) {
  const template = getTemplate(doc.theme.template);
  const [item, setItem] = useState<DragItem | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);

  const drag: DragState = {
    item,
    target,
    start: setItem,
    over: (t) => setTarget((prev) => (sameTarget(prev, t) ? prev : t)),
    drop: () => {
      if (item && target) update((d) => dropInto(d, item, target.pageId, target.rowId, target.col, target.index));
      setItem(null);
      setTarget(null);
    },
    end: () => {
      setItem(null);
      setTarget(null);
    },
  };

  return (
    <DragContext.Provider value={drag}>
      <div className="panel-stack layout-panel">
        <p className="hint">
          Drag sections to arrange them, or click one for its options, including splitting it across pages. Pick a shape for each row, and drag the line between two columns to change their widths.
        </p>

        <Tray doc={doc} update={update} />

        {doc.pages.map((page, pi) => (
          <PageCard key={page.id} doc={doc} page={page} index={pi} update={update} overflow={overflow[page.id]} onEditSection={onEditSection} onAutoFit={onAutoFit} />
        ))}

        <div className="row-actions">
          <button type="button" className="btn btn--dashed" onClick={() => update((d) => void d.pages.push(newPage()))}>
            <Plus size={16} /> Add page
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            title={`Put every section back where the ${template.name} template puts it`}
            onClick={() => {
              update((d) => arrangeLayout(d, d.theme.template));
              onAutoFit();
              notify(`Rearranged using the ${template.name} layout.`, true);
            }}
          >
            <Wand2 size={16} /> Auto-arrange
          </button>
        </div>
      </div>
    </DragContext.Provider>
  );
}

/** Sections that aren't on any page. Also a drop zone for taking a section off the page. */
function Tray({ doc, update }: { doc: ResumeDocument; update: Props['update'] }) {
  const drag = useDrag();
  const [hot, setHot] = useState(false);
  const unplaced = doc.sections.filter((s) => pagesShowing(doc, s.id).length === 0);
  const accepting = !!drag.item && 'placementId' in drag.item;

  return (
    <div
      className={`tray${hot ? ' is-hot' : ''}${accepting ? ' is-accepting' : ''}`}
      onDragOver={(e) => {
        if (!accepting) return;
        e.preventDefault();
        drag.over(null);
        setHot(true);
      }}
      onDragLeave={() => setHot(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHot(false);
        const it = drag.item;
        if (it && 'placementId' in it) update((d) => void takePlacement(d, it.placementId));
        drag.end();
      }}
    >
      <div className="tray-title">Not on a page</div>
      {unplaced.length === 0 ? (
        <div className="tray-empty">{accepting ? 'Drop here to take it off the page' : 'Every section is on a page.'}</div>
      ) : (
        <div className="tray-chips">
          {unplaced.map((s) => (
            <div
              key={s.id}
              className="chip chip--tray"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', s.id);
                e.dataTransfer.effectAllowed = 'move';
                drag.start({ sectionId: s.id });
              }}
              onDragEnd={drag.end}
            >
              <GripVertical size={13} className="chip-grip" />
              <span className="chip-name">{s.title || SECTION_TYPE_LABELS[s.type]}</span>
              <button type="button" className="icon-btn" title="Add to the last page" aria-label="Add to the last page" onClick={() => update((d) => addToLayout(d, s.id))}>
                <Plus size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageCard({ doc, page, index, update, overflow, onEditSection, onAutoFit }: {
  doc: ResumeDocument;
  page: Page;
  index: number;
  update: Props['update'];
  overflow?: number;
  onEditSection: (id: string) => void;
  onAutoFit: () => void;
}) {
  const drag = useDrag();
  const editPage = (fn: (p: Page) => void) =>
    update((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (p) fn(p);
    });
  const addRow = (layout: RowLayout) =>
    editPage((p) => {
      const row = newRow(layout.columns, layout.columns === 2 ? layout.split : undefined);
      p.rows.push(row);
    });
  const emptyTarget = drag.target?.pageId === page.id && drag.target.rowId === null;

  return (
    <section className="card page-card">
      <div className="card-head">
        <span className="card-title">Page {index + 1}</span>
        <label className="inline-select">
          <span>Footer</span>
          <select value={page.footer} onChange={(e) => editPage((p) => void (p.footer = e.target.value as FooterType))}>
            {FOOTERS.filter((f) => f.id !== 'custom' || doc.theme.customFooter || page.footer === 'custom').map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div className="card-actions">
          <Popover title="Page options" icon={<MoreHorizontal size={16} />} width={200}>
            {(close) => (
              <div className="popover-menu">
                <PopItem icon={<ArrowUp size={14} />} disabled={index === 0} onClick={() => { update((d) => move(d.pages, index, -1)); close(); }}>
                  Move page up
                </PopItem>
                <PopItem icon={<ArrowDown size={14} />} disabled={index === doc.pages.length - 1} onClick={() => { update((d) => move(d.pages, index, 1)); close(); }}>
                  Move page down
                </PopItem>
                <PopItem icon={<Trash2 size={14} />} danger disabled={doc.pages.length === 1} onClick={() => { update((d) => void d.pages.splice(index, 1)); close(); }}>
                  Delete page
                </PopItem>
              </div>
            )}
          </Popover>
        </div>
      </div>
      <div className="card-body">
        {overflow !== undefined && (
          <div className="notice notice--error">
            <TriangleAlert size={16} />
            <span>
              About {overflow} cm is cut off at the bottom.{' '}
              <button type="button" className="link-btn" onClick={onAutoFit}>
                Move it to the next page
              </button>{' '}
              or make the font or spacing smaller on the Design tab.
            </span>
          </div>
        )}
        <div className="sheet">
          {page.rows.map((row, ri) => (
            <RowView key={row.id} doc={doc} page={page} row={row} rowIndex={ri} update={update} onEditSection={onEditSection} />
          ))}
          {page.rows.length === 0 && (
            <div
              className={`sheet-empty${emptyTarget ? ' is-target' : ''}`}
              onDragOver={(e) => {
                if (!drag.item) return;
                e.preventDefault();
                drag.over({ pageId: page.id, rowId: null, col: 0, index: 0 });
              }}
              onDrop={(e) => {
                e.preventDefault();
                drag.drop();
              }}
            >
              This page is empty. Add a row below, or drop a section here.
            </div>
          )}
        </div>
        <div className="add-row">
          <span>Add row</span>
          {ROW_LAYOUTS.map((l) => (
            <button key={l.id} type="button" className="layout-btn" title={`Add a row: ${l.label.toLowerCase()}`} aria-label={`Add a row: ${l.label.toLowerCase()}`} onClick={() => addRow(l)}>
              <LayoutIcon layout={l} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopItem({ icon, onClick, disabled, danger, children }: { icon: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" className={`menu-item${danger ? ' menu-item--danger' : ''}`} disabled={disabled} onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function RowView({ doc, page, row, rowIndex, update, onEditSection }: {
  doc: ResumeDocument;
  page: Page;
  row: Row;
  rowIndex: number;
  update: Props['update'];
  onEditSection: (id: string) => void;
}) {
  const drag = useDrag();
  const grid = useRef<HTMLDivElement>(null);
  const editRow = (fn: (r: Row) => void, key?: string) =>
    update((d) => {
      const r = d.pages.find((p) => p.id === page.id)?.rows.find((x) => x.id === row.id);
      if (r) fn(r);
    }, key);
  const two = row.columns.length === 2;
  const current = layoutOf(row);
  const shadeCol = row.shade === 'left' ? 0 : row.shade === 'right' ? 1 : -1;

  const startResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = grid.current?.getBoundingClientRect();
    if (!box) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    let last = row.split;
    const onMove = (ev: PointerEvent) => {
      const split = Math.round(Math.min(80, Math.max(20, ((ev.clientX - box.left) / box.width) * 100)));
      if (split === last) return;
      last = split;
      editRow((r) => void (r.split = split), `split-${row.id}`);
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  };

  const onColumnDragOver = (e: DragEvent<HTMLDivElement>, ci: number) => {
    if (!drag.item) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const chips = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-chip]')];
    const index = chips.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.top + r.height / 2 < e.clientY;
    }).length;
    drag.over({ pageId: page.id, rowId: row.id, col: ci, index });
  };

  return (
    <div className="sheet-row">
      <div className="sheet-row-bar">
        <div className="layout-picker" role="radiogroup" aria-label="Row shape">
          {ROW_LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={current === l.id}
              className={`layout-btn${current === l.id ? ' is-active' : ''}`}
              title={l.label}
              aria-label={l.label}
              onClick={() => editRow((r) => applyRowLayout(r, l))}
            >
              <LayoutIcon layout={l} />
            </button>
          ))}
        </div>
        <Popover title="Row options" icon={<MoreHorizontal size={15} />} width={230}>
          {(close) => (
            <div className="popover-menu">
              {two && (
                <div className="popover-field">
                  <span>Sidebar color</span>
                  <Segmented label="Sidebar color" value={row.shade} options={SHADES} onChange={(v) => editRow((r) => void (r.shade = v))} />
                </div>
              )}
              <PopItem icon={<ArrowUp size={14} />} disabled={rowIndex === 0} onClick={() => { update((d) => move(d.pages.find((p) => p.id === page.id)!.rows, rowIndex, -1)); close(); }}>
                Move row up
              </PopItem>
              <PopItem icon={<ArrowDown size={14} />} disabled={rowIndex === page.rows.length - 1} onClick={() => { update((d) => move(d.pages.find((p) => p.id === page.id)!.rows, rowIndex, 1)); close(); }}>
                Move row down
              </PopItem>
              <PopItem icon={<Trash2 size={14} />} danger onClick={() => { update((d) => void d.pages.find((p) => p.id === page.id)!.rows.splice(rowIndex, 1)); close(); }}>
                Delete row (sections stay in Content)
              </PopItem>
            </div>
          )}
        </Popover>
      </div>
      <div ref={grid} className="sheet-columns" style={{ gridTemplateColumns: two ? `minmax(0, ${row.split}fr) 10px minmax(0, ${100 - row.split}fr)` : 'minmax(0, 1fr)' }}>
        {row.columns.map((col, ci) => {
          const shaded = ci === shadeCol;
          const isTarget = drag.target?.rowId === row.id && drag.target.col === ci;
          const column = (
            <div
              key={ci}
              className={`sheet-col${shaded ? ' is-shaded' : ''}${isTarget ? ' is-target' : ''}`}
              style={shaded ? { background: doc.theme.shade, color: doc.theme.shadeText } : undefined}
              onDragOver={(e) => onColumnDragOver(e, ci)}
              onDrop={(e) => {
                e.preventDefault();
                drag.drop();
              }}
            >
              {two && <div className="sheet-col-label">{ci === 0 ? row.split : 100 - row.split}%</div>}
              {col.map((p, idx) => (
                <ChipSlot key={p.id} showLine={isTarget && drag.target?.index === idx}>
                  <PlacementChip doc={doc} placement={p} pageIndex={doc.pages.indexOf(page)} index={idx} count={col.length} two={two} update={update} onEditSection={onEditSection} />
                </ChipSlot>
              ))}
              {isTarget && drag.target?.index === col.length && <div className="drop-line" />}
              {col.length === 0 && !isTarget && <div className="sheet-col-empty">Drop sections here</div>}
            </div>
          );
          if (ci === 1) {
            return [
              <div key="divider" className="sheet-divider" role="separator" aria-orientation="vertical" aria-label="Drag to change column widths" title="Drag to change column widths" onPointerDown={startResize}>
                <span />
              </div>,
              column,
            ];
          }
          return column;
        })}
      </div>
    </div>
  );
}

function ChipSlot({ showLine, children }: { showLine: boolean; children: ReactNode }) {
  return (
    <>
      {showLine && <div className="drop-line" />}
      {children}
    </>
  );
}

function PlacementChip({ doc, placement, pageIndex, index, count, two, update, onEditSection }: {
  doc: ResumeDocument;
  placement: Placement;
  pageIndex: number;
  index: number;
  count: number;
  two: boolean;
  update: Props['update'];
  onEditSection: (id: string) => void;
}) {
  const drag = useDrag();
  const section = findSection(doc, placement.sectionId);
  if (!section) return null;
  const name = section.title || SECTION_TYPE_LABELS[section.type];
  const total = itemCount(section);
  const from = placement.from ?? 0;
  const to = Math.min(placement.to ?? total, total);
  const partial = total > 0 && (from > 0 || to < total);
  const dragging = !!drag.item && 'placementId' in drag.item && drag.item.placementId === placement.id;

  const shift = (delta: number) =>
    update((d) => {
      const loc = locatePlacement(d, placement.id);
      if (loc) move(d.pages[loc.page].rows[loc.row].columns[loc.col], loc.index, delta);
    });

  return (
    <div
      className={`chip${dragging ? ' is-dragging' : ''}`}
      data-chip
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', placement.id);
        e.dataTransfer.effectAllowed = 'move';
        drag.start({ placementId: placement.id });
      }}
      onDragEnd={drag.end}
    >
      <GripVertical size={13} className="chip-grip" />
      <Popover
        title={`${name}: options`}
        className="chip-title"
        width={300}
        icon={
          <>
            <span className="chip-name">{name}</span>
            {partial && <span className="chip-range">{to - from === 1 ? `item ${to}` : `items ${from + 1}–${to}`}</span>}
            <ChevronDown size={12} className="chip-caret" />
          </>
        }
      >
        {(close) => (
          <div className="popover-menu">
            <div className="popover-head">
              <strong>{name}</strong>
              <span>{SECTION_TYPE_LABELS[section.type]}</span>
            </div>
            <PopItem icon={<Pencil size={14} />} onClick={() => { onEditSection(section.id); close(); }}>
              Edit its text
            </PopItem>
            <div className="popover-buttons">
              <button type="button" className="btn btn--ghost btn--sm" disabled={index === 0} onClick={() => shift(-1)}>
                <ArrowUp size={14} /> Up
              </button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={index === count - 1} onClick={() => shift(1)}>
                <ArrowDown size={14} /> Down
              </button>
              {two && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() =>
                    update((d) => {
                      const loc = locatePlacement(d, placement.id);
                      const p = takePlacement(d, placement.id);
                      if (loc && p) d.pages[loc.page].rows[loc.row].columns[1 - loc.col].push(p);
                    })
                  }
                >
                  <ArrowLeftRight size={14} /> Other side
                </button>
              )}
            </div>
            <label className="popover-field">
              <span>Move to</span>
              <select
                value={pageIndex}
                onChange={(e) => {
                  const targetPage = Number(e.target.value);
                  update((d) => movePlacementToPage(d, placement.id, targetPage));
                  close();
                }}
              >
                {doc.pages.map((_, i) => (
                  <option key={i} value={i}>
                    Page {i + 1}
                  </option>
                ))}
                <option value={doc.pages.length}>A new page</option>
              </select>
            </label>
            {total > 1 && <SplitControl doc={doc} section={section} placement={placement} from={from} to={to} total={total} update={update} />}
            <PopItem icon={<X size={14} />} danger onClick={() => { update((d) => void takePlacement(d, placement.id)); close(); }}>
              Take off the page (keeps the text)
            </PopItem>
          </div>
        )}
      </Popover>
    </div>
  );
}

/**
 * Splitting a section across pages: the items of this part are listed, and
 * clicking the gap between two of them moves the rest to the next page.
 */
function SplitControl({ doc, section, placement, from, to, total, update }: {
  doc: ResumeDocument;
  section: Section;
  placement: Placement;
  from: number;
  to: number;
  total: number;
  update: Props['update'];
}) {
  const labels = itemLabels(section);
  const parts = sectionParts(doc, section.id, total).filter((p) => p.to > p.from);
  const split = parts.length > 1;
  const range = (a: number, b: number) => (b - a === 1 ? `item ${b}` : `items ${a + 1}–${b}`);

  return (
    <div className="split">
      <div className="split-title">
        <Scissors size={12} /> Split across pages
      </div>
      {split && (
        <div className="split-parts">
          {parts.map((p) => (
            <div key={p.placementId} className={`split-part${p.placementId === placement.id ? ' is-current' : ''}`}>
              Page {p.page + 1}: {range(p.from, p.to)}
              {p.placementId === placement.id && <span> (this one)</span>}
            </div>
          ))}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => update((d) => joinParts(d, placement.id))}>
            <Merge size={14} /> Put it back together here
          </button>
        </div>
      )}
      {to - from > 1 ? (
        <>
          <p className="split-hint">Click between two items to move the rest to the next page.</p>
          <ol className="split-items" start={from + 1}>
            {labels.slice(from, to).map((label, i) => (
              <li key={from + i}>
                <span className="split-label">{label}</span>
                {from + i + 1 < to && (
                  <button
                    type="button"
                    className="split-gap"
                    title={`Keep ${range(from, from + i + 1)} here and continue on the next page`}
                    onClick={() => update((d) => splitPlacement(d, placement.id, from + i + 1))}
                  >
                    <Scissors size={11} /> <span>Continue on next page from here</span>
                  </button>
                )}
              </li>
            ))}
          </ol>
        </>
      ) : (
        !split && <p className="split-hint">This part has only one item.</p>
      )}
    </div>
  );
}
