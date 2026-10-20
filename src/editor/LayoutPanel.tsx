import { useState } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUp, Plus, Scissors, SlidersHorizontal, Trash2, TriangleAlert, Wand2, X } from 'lucide-react';
import type { FooterType, Page, Placement, ResumeDocument, Row, Shade } from '../model/types';
import { itemCount, newPage, newPlacement, newRow } from '../model/defaults';
import { addToLayout, findSection, locatePlacement, move, movePlacementToPage, pagesShowing, splitPlacement, takePlacement } from '../model/edit';
import { arrangeLayout, getTemplate } from '../model/templates';
import { FOOTERS, SECTION_TYPE_LABELS } from '../model/variants';
import type { Option } from '../model/variants';
import type { Updater } from '../hooks/useHistory';
import { IconButton, Segmented, SelectField } from './fields';

interface Props {
  doc: ResumeDocument;
  update: (fn: Updater, key?: string) => void;
  overflow: Record<string, number>;
  onEditSection: (id: string) => void;
  onAutoFit: () => void;
  notify: (message: string, undoable?: boolean) => void;
}

const SPLITS: Option[] = [25, 30, 32, 35, 40, 50, 60, 65, 68, 70, 75].map((n) => ({ id: String(n), label: `${n}% / ${100 - n}%` }));
const SHADES: Option<Shade>[] = [
  { id: 'none', label: 'No sidebar color' },
  { id: 'left', label: 'Color left column' },
  { id: 'right', label: 'Color right column' },
];

export function LayoutPanel({ doc, update, overflow, onEditSection, onAutoFit, notify }: Props) {
  const unplaced = doc.sections.filter((s) => pagesShowing(doc, s.id).length === 0);
  const template = getTemplate(doc.theme.template);

  return (
    <div className="panel-stack">
      <p className="hint">
        Pages are made of rows. A row has one column or two side by side. Click any section in the preview to edit its text.
      </p>

      {unplaced.length > 0 && (
        <div className="notice notice--warn">
          <TriangleAlert size={16} />
          <div>
            <strong>Not on any page:</strong>{' '}
            {unplaced.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ', '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => update((d) => addToLayout(d, s.id))}
                >
                  {s.title || SECTION_TYPE_LABELS[s.type]} +
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

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
          title={`Put every section on one page using the ${template.name} template's structure`}
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
  const editPage = (fn: (p: Page) => void) =>
    update((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (p) fn(p);
    });

  return (
    <div className="card page-card">
      <div className="card-head">
        <span className="card-title">Page {index + 1}</span>
        <label className="inline-select">
          <span>Footer</span>
          <select value={page.footer} onChange={(e) => editPage((p) => void (p.footer = e.target.value as FooterType))}>
            {FOOTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <div className="card-actions">
          <IconButton title="Move page up" disabled={index === 0} onClick={() => update((d) => move(d.pages, index, -1))}>
            <ArrowUp size={15} />
          </IconButton>
          <IconButton title="Move page down" disabled={index === doc.pages.length - 1} onClick={() => update((d) => move(d.pages, index, 1))}>
            <ArrowDown size={15} />
          </IconButton>
          <IconButton title="Delete page" tone="danger" disabled={doc.pages.length === 1} onClick={() => update((d) => void d.pages.splice(index, 1))}>
            <Trash2 size={15} />
          </IconButton>
        </div>
      </div>
      <div className="card-body">
        {overflow !== undefined && (
          <div className="notice notice--error">
            <TriangleAlert size={16} />
            <span>
              About {overflow} cm of content is cut off at the bottom.{' '}
              <button type="button" className="link-btn" onClick={onAutoFit}>
                Move it to the next page
              </button>
              , or rearrange it yourself, or shrink the font size or spacing on the Design tab.
            </span>
          </div>
        )}
        {page.rows.map((row, ri) => (
          <RowCard key={row.id} doc={doc} page={page} pageIndex={index} row={row} rowIndex={ri} update={update} onEditSection={onEditSection} />
        ))}
        <div className="row-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => editPage((p) => void p.rows.push(newRow(1)))}>
            <Plus size={14} /> One-column row
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => editPage((p) => void p.rows.push(newRow(2)))}>
            <Plus size={14} /> Two-column row
          </button>
        </div>
      </div>
    </div>
  );
}

function RowCard({ doc, page, pageIndex, row, rowIndex, update, onEditSection }: {
  doc: ResumeDocument;
  page: Page;
  pageIndex: number;
  row: Row;
  rowIndex: number;
  update: Props['update'];
  onEditSection: (id: string) => void;
}) {
  const editRow = (fn: (r: Row) => void) =>
    update((d) => {
      const r = d.pages[pageIndex]?.rows.find((x) => x.id === row.id);
      if (r) fn(r);
    });
  const two = row.columns.length === 2;

  return (
    <div className="row-card">
      <div className="row-head">
        <Segmented
          label="Columns"
          value={two ? '2' : '1'}
          options={[
            { id: '1', label: '1 column' },
            { id: '2', label: '2 columns' },
          ]}
          onChange={(v) =>
            editRow((r) => {
              if (v === '2' && r.columns.length === 1) r.columns = [r.columns[0], []];
              if (v === '1' && r.columns.length === 2) {
                r.columns = [[...r.columns[0], ...r.columns[1]]];
                r.shade = 'none';
              }
            })
          }
        />
        <div className="card-actions">
          <IconButton title="Move row up" disabled={rowIndex === 0} onClick={() => update((d) => move(d.pages[pageIndex].rows, rowIndex, -1))}>
            <ArrowUp size={14} />
          </IconButton>
          <IconButton title="Move row down" disabled={rowIndex === page.rows.length - 1} onClick={() => update((d) => move(d.pages[pageIndex].rows, rowIndex, 1))}>
            <ArrowDown size={14} />
          </IconButton>
          <IconButton title="Delete row (its sections stay in Content)" tone="danger" onClick={() => update((d) => void d.pages[pageIndex].rows.splice(rowIndex, 1))}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
      {two && (
        <div className="grid-2 row-options">
          <SelectField label="Column widths" value={String(row.split)} options={SPLITS.some((s) => s.id === String(row.split)) ? SPLITS : [...SPLITS, { id: String(row.split), label: `${row.split}% / ${100 - row.split}%` }]} onChange={(v) => editRow((r) => void (r.split = Number(v)))} />
          <SelectField label="Sidebar color" value={row.shade} options={SHADES} onChange={(v) => editRow((r) => void (r.shade = v))} />
        </div>
      )}
      <div className="columns">
        {row.columns.map((col, ci) => (
          <div key={ci} className={`column${(row.shade === 'left' && ci === 0) || (row.shade === 'right' && ci === 1) ? ' column--shaded' : ''}`}>
            {two && (
              <div className="column-label">
                {ci === 0 ? 'Left' : 'Right'} column · {ci === 0 ? row.split : 100 - row.split}%
              </div>
            )}
            {col.length === 0 && <div className="column-empty">Empty</div>}
            {col.map((p, idx) => (
              <PlacementChip key={p.id} doc={doc} placement={p} pageIndex={pageIndex} index={idx} count={col.length} two={two} col={ci} update={update} onEditSection={onEditSection} />
            ))}
            <AddToColumn
              doc={doc}
              onAdd={(sectionId) =>
                update((d) => {
                  d.pages[pageIndex].rows[rowIndex].columns[ci].push(newPlacement(sectionId));
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AddToColumn({ doc, onAdd }: { doc: ResumeDocument; onAdd: (sectionId: string) => void }) {
  const unplaced = doc.sections.filter((s) => pagesShowing(doc, s.id).length === 0);
  const placed = doc.sections.filter((s) => pagesShowing(doc, s.id).length > 0);
  return (
    <select
      className="add-select"
      value=""
      aria-label="Add a section to this column"
      onChange={(e) => {
        if (e.target.value) onAdd(e.target.value);
      }}
    >
      <option value="">+ Add section here…</option>
      {unplaced.length > 0 && (
        <optgroup label="Not on a page yet">
          {unplaced.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title || SECTION_TYPE_LABELS[s.type]}
            </option>
          ))}
        </optgroup>
      )}
      {placed.length > 0 && (
        <optgroup label="Already placed (adds another copy)">
          {placed.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title || SECTION_TYPE_LABELS[s.type]}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

function PlacementChip({ doc, placement, pageIndex, index, count, two, col, update, onEditSection }: {
  doc: ResumeDocument;
  placement: Placement;
  pageIndex: number;
  index: number;
  count: number;
  two: boolean;
  col: number;
  update: Props['update'];
  onEditSection: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const section = findSection(doc, placement.sectionId);
  if (!section) return null;
  const total = itemCount(section);
  const from = placement.from ?? 0;
  const to = Math.min(placement.to ?? total, total);
  const partial = total > 0 && (from > 0 || to < total);

  const editPlacement = (fn: (p: Placement) => void) =>
    update((d) => {
      const loc = locatePlacement(d, placement.id);
      if (loc) fn(d.pages[loc.page].rows[loc.row].columns[loc.col][loc.index]);
    });
  const shift = (delta: number) =>
    update((d) => {
      const loc = locatePlacement(d, placement.id);
      if (loc) move(d.pages[loc.page].rows[loc.row].columns[loc.col], loc.index, delta);
    });

  return (
    <div className={`chip${open ? ' is-open' : ''}`}>
      <div className="chip-head">
        <button type="button" className="chip-title" title="Edit content" onClick={() => onEditSection(section.id)}>
          {section.title || SECTION_TYPE_LABELS[section.type]}
          {partial && <span className="chip-range"> {to - from === 1 ? `item ${to}` : `items ${from + 1}–${to}`}</span>}
        </button>
        <IconButton title="Move up" disabled={index === 0} onClick={() => shift(-1)}>
          <ArrowUp size={13} />
        </IconButton>
        <IconButton title="Move down" disabled={index === count - 1} onClick={() => shift(1)}>
          <ArrowDown size={13} />
        </IconButton>
        {two && (
          <IconButton
            title={col === 0 ? 'Move to right column' : 'Move to left column'}
            onClick={() =>
              update((d) => {
                const loc = locatePlacement(d, placement.id);
                const p = takePlacement(d, placement.id);
                if (loc && p) d.pages[loc.page].rows[loc.row].columns[1 - loc.col].push(p);
              })
            }
          >
            <ArrowLeftRight size={13} />
          </IconButton>
        )}
        <IconButton title="More options" onClick={() => setOpen(!open)}>
          <SlidersHorizontal size={13} />
        </IconButton>
        <IconButton title="Remove from page (keeps the content)" tone="danger" onClick={() => update((d) => void takePlacement(d, placement.id))}>
          <X size={13} />
        </IconButton>
      </div>
      {open && (
        <div className="chip-body">
          <label className="inline-select">
            <span>Move to</span>
            <select
              value={pageIndex}
              onChange={(e) => {
                const target = Number(e.target.value);
                update((d) => movePlacementToPage(d, placement.id, target));
              }}
            >
              {doc.pages.map((_, i) => (
                <option key={i} value={i}>
                  Page {i + 1}
                </option>
              ))}
              <option value={doc.pages.length}>New page</option>
            </select>
          </label>
          {total > 1 && (
            <>
              <label className="inline-select">
                <span>Show items</span>
                <select value={from} onChange={(e) => editPlacement((p) => void (p.from = Number(e.target.value) || undefined))}>
                  {Array.from({ length: to }, (_, i) => (
                    <option key={i} value={i}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <span>to</span>
                <select value={to} onChange={(e) => editPlacement((p) => void (p.to = Number(e.target.value) >= total ? undefined : Number(e.target.value)))}>
                  {Array.from({ length: total - from }, (_, i) => from + i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>of {total}</span>
              </label>
              {to - from > 1 && (
                <label className="inline-select">
                  <Scissors size={13} />
                  <span>Continue on next page after item</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const at = Number(e.target.value);
                      if (at) update((d) => splitPlacement(d, placement.id, at));
                      setOpen(false);
                    }}
                  >
                    <option value="">…</option>
                    {Array.from({ length: to - from - 1 }, (_, i) => from + i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
