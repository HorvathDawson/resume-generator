import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Plus, Trash2, TriangleAlert } from 'lucide-react';
import type { Entry, EntriesSection, Profile, ResumeDocument, Section, SectionType } from '../model/types';
import { newEntry, newReference, newSection, newSkillGroup, uid } from '../model/defaults';
import { addToLayout, findSection, move, pagesShowing, removeSection } from '../model/edit';
import { SECTION_TYPE_LABELS, SECTION_VARIANTS } from '../model/variants';
import type { Updater } from '../hooks/useHistory';
import { Checkbox, CommaField, IconButton, LinesField, SelectField, TextArea, TextField } from './fields';

interface Props {
  doc: ResumeDocument;
  update: (fn: Updater, key?: string) => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  notify: (message: string, undoable?: boolean) => void;
}

type Edit = (fn: (s: Section) => void, key?: string) => void;

const PROFILE_FIELDS: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
  { key: 'headline', label: 'Headline', placeholder: 'Software Engineer' },
  { key: 'email', label: 'Email', placeholder: 'jane@example.com' },
  { key: 'phone', label: 'Phone', placeholder: '(555) 123-4567' },
  { key: 'location', label: 'Location', placeholder: 'Vancouver, BC' },
  { key: 'website', label: 'Website', placeholder: 'janedoe.com' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/janedoe or janedoe' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/janedoe or janedoe' },
];

const ADDABLE: SectionType[] = ['experience', 'education', 'skills', 'text', 'list', 'references', 'contact', 'header', 'spacer'];

export function ContentPanel({ doc, update, openId, setOpenId, notify }: Props) {
  const [adding, setAdding] = useState(false);

  const addSection = (type: SectionType) => {
    const s = newSection(type);
    update((d) => {
      d.sections.push(s);
      addToLayout(d, s.id);
    });
    setOpenId(s.id);
    setAdding(false);
    notify(`Added “${s.title}” to the end of the last page. Move it on the Layout tab.`);
  };

  return (
    <div className="panel-stack">
      <div className="card">
        <button type="button" className="card-head card-head--button" onClick={() => setOpenId(openId === 'profile' ? null : 'profile')} aria-expanded={openId === 'profile'}>
          {openId === 'profile' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="card-title">Your details</span>
          <span className="card-sub">{doc.profile.name || 'Name, email, links'}</span>
        </button>
        {openId === 'profile' && (
          <div className="card-body grid-2">
            {PROFILE_FIELDS.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                placeholder={f.placeholder}
                value={doc.profile[f.key]}
                onChange={(v) => update((d) => void (d.profile[f.key] = v), `profile.${f.key}`)}
              />
            ))}
            <p className="hint field--wide">These appear wherever the resume has a “Name & headline” or “Contact details” section.</p>
          </div>
        )}
      </div>

      {doc.sections.map((s, i) => (
        <SectionCard
          key={s.id}
          section={s}
          doc={doc}
          index={i}
          open={openId === s.id}
          onToggle={() => setOpenId(openId === s.id ? null : s.id)}
          update={update}
          notify={notify}
        />
      ))}

      <div className="add-section">
        {adding ? (
          <div className="card">
            <div className="card-head">
              <span className="card-title">Add a section</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
            <div className="card-body type-grid">
              {ADDABLE.map((t) => (
                <button key={t} type="button" className="type-option" onClick={() => addSection(t)}>
                  {SECTION_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn--dashed" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add section
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section, doc, index, open, onToggle, update, notify }: {
  section: Section;
  doc: ResumeDocument;
  index: number;
  open: boolean;
  onToggle: () => void;
  update: Props['update'];
  notify: Props['notify'];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pages = pagesShowing(doc, section.id);
  const edit: Edit = (fn, key) =>
    update((d) => {
      const s = findSection(d, section.id);
      if (s) fn(s);
    }, key && `${section.id}.${key}`);

  // Scroll into view when opened from the preview.
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open]);

  return (
    <div ref={ref} className={`card${open ? ' is-open' : ''}`} data-section-card={section.id}>
      <div className="card-head">
        <button type="button" className="card-head-main" onClick={onToggle} aria-expanded={open}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="card-title">{section.title || SECTION_TYPE_LABELS[section.type]}</span>
          <span className="card-sub">{SECTION_TYPE_LABELS[section.type]}</span>
        </button>
        {pages.length === 0 ? (
          <button
            type="button"
            className="badge badge--warn"
            title="This section isn't on any page, so it won't show in the resume."
            onClick={() => update((d) => addToLayout(d, section.id))}
          >
            <TriangleAlert size={12} /> Not shown · Add
          </button>
        ) : (
          <span className="badge" title="Pages this section appears on">
            p. {pages.join(', ')}
          </span>
        )}
        <div className="card-actions">
          <IconButton title="Move up in this list" disabled={index === 0} onClick={() => update((d) => move(d.sections, index, -1))}>
            <ArrowUp size={15} />
          </IconButton>
          <IconButton title="Move down in this list" disabled={index === doc.sections.length - 1} onClick={() => update((d) => move(d.sections, index, 1))}>
            <ArrowDown size={15} />
          </IconButton>
          <IconButton
            title="Delete section"
            tone="danger"
            onClick={() => {
              update((d) => removeSection(d, section.id));
              notify(`Deleted “${section.title || SECTION_TYPE_LABELS[section.type]}”.`, true);
            }}
          >
            <Trash2 size={15} />
          </IconButton>
        </div>
      </div>
      {open && (
        <div className="card-body">
          <div className="grid-2">
            {section.type !== 'header' && section.type !== 'spacer' && (
              <TextField label="Heading" value={section.title} onChange={(v) => edit((s) => void (s.title = v), 'title')} />
            )}
            {SECTION_VARIANTS[section.type].length > 1 && (
              <SelectField label="Style" value={section.variant} options={SECTION_VARIANTS[section.type]} onChange={(v) => edit((s) => void (s.variant = v))} />
            )}
            {section.type !== 'header' && section.type !== 'spacer' && (
              <Checkbox label="Show heading" checked={section.showTitle} onChange={(v) => edit((s) => void (s.showTitle = v))} />
            )}
          </div>
          <SectionFields section={section} edit={edit} />
        </div>
      )}
    </div>
  );
}

function SectionFields({ section, edit }: { section: Section; edit: Edit }) {
  switch (section.type) {
    case 'header':
      return <p className="hint">Shows the name and headline from “Your details” at the top.</p>;
    case 'contact':
      return <p className="hint">Shows the email, phone, links and location from “Your details”. Empty fields are left out.</p>;
    case 'text':
      return (
        <TextArea
          label="Text"
          rows={4}
          value={section.body}
          placeholder="A few sentences about you. Leave a blank line between paragraphs, start lines with “- ” for bullets."
          onChange={(v) => edit((s) => void (s.type === 'text' && (s.body = v)), 'body')}
        />
      );
    case 'experience':
    case 'education':
      return <EntriesEditor section={section} edit={edit} />;
    case 'skills':
      return (
        <ItemList
          items={section.groups}
          addLabel="Add skill group"
          onAdd={() => edit((s) => void (s.type === 'skills' && s.groups.push(newSkillGroup())))}
          onMove={(i, delta) => edit((s) => void (s.type === 'skills' && move(s.groups, i, delta)))}
          onRemove={(i) => edit((s) => void (s.type === 'skills' && s.groups.splice(i, 1)))}
          summary={(g) => g.name || 'Untitled group'}
          render={(g, i) => (
            <div className="grid-2">
              <TextField label="Group name" placeholder="Languages" value={g.name} onChange={(v) => edit((s) => void (s.type === 'skills' && (s.groups[i].name = v)), `g${g.id}.name`)} />
              <CommaField label="Skills" placeholder="Python, TypeScript, Go" value={g.skills} onChange={(v) => edit((s) => void (s.type === 'skills' && (s.groups[i].skills = v)), `g${g.id}.skills`)} />
            </div>
          )}
        />
      );
    case 'list':
      return (
        <LinesField
          label="Items"
          value={section.items}
          placeholder={'AWS Solutions Architect\nFirst aid certified'}
          onChange={(v) => edit((s) => void (s.type === 'list' && (s.items = v)), 'items')}
        />
      );
    case 'references':
      return (
        <>
          <ItemList
            items={section.items}
            addLabel="Add reference"
            onAdd={() => edit((s) => void (s.type === 'references' && s.items.push(newReference())))}
            onMove={(i, delta) => edit((s) => void (s.type === 'references' && move(s.items, i, delta)))}
            onRemove={(i) => edit((s) => void (s.type === 'references' && s.items.splice(i, 1)))}
            summary={(r) => r.name || 'New reference'}
            render={(r, i) => (
              <div className="grid-2">
                {(['name', 'role', 'organization', 'email', 'phone', 'note'] as const).map((k) => (
                  <TextField
                    key={k}
                    label={k[0].toUpperCase() + k.slice(1)}
                    value={r[k]}
                    onChange={(v) => edit((s) => void (s.type === 'references' && (s.items[i][k] = v)), `r${r.id}.${k}`)}
                  />
                ))}
              </div>
            )}
          />
          {section.items.length === 0 && (
            <TextField label="Text when there are no references" value={section.emptyText} onChange={(v) => edit((s) => void (s.type === 'references' && (s.emptyText = v)), 'emptyText')} wide />
          )}
        </>
      );
    case 'spacer':
      return (
        <label className="field">
          <span className="field-label">Height</span>
          <div className="slider">
            <input type="range" min={0.1} max={6} step={0.1} value={section.height} onChange={(e) => edit((s) => void (s.type === 'spacer' && (s.height = parseFloat(e.target.value))), 'height')} />
            <span className="slider-value">{section.height.toFixed(1)} cm</span>
          </div>
        </label>
      );
  }
}

const ENTRY_LABELS = {
  experience: { title: 'Role or project', subtitle: 'Organization', note: 'Extra line', titleHint: 'Senior Engineer' },
  education: { title: 'Degree', subtitle: 'School', note: 'GPA or honors', titleHint: 'B.Sc. Computer Science' },
};

function EntriesEditor({ section, edit }: { section: EntriesSection; edit: Edit }) {
  const labels = ENTRY_LABELS[section.type];
  const set = <K extends keyof Entry>(i: number, key: K, value: Entry[K], item: Entry) =>
    edit((s) => {
      if (s.type === 'experience' || s.type === 'education') s.items[i][key] = value;
    }, `e${item.id}.${key}`);
  return (
    <ItemList
      items={section.items}
      addLabel={section.type === 'education' ? 'Add school' : 'Add entry'}
      onAdd={() => edit((s) => void ((s.type === 'experience' || s.type === 'education') && s.items.push(newEntry())))}
      onMove={(i, delta) => edit((s) => void ((s.type === 'experience' || s.type === 'education') && move(s.items, i, delta)))}
      onRemove={(i) => edit((s) => void ((s.type === 'experience' || s.type === 'education') && s.items.splice(i, 1)))}
      onDuplicate={(i) =>
        edit((s) => {
          if (s.type === 'experience' || s.type === 'education') s.items.splice(i + 1, 0, { ...structuredClone(s.items[i]), id: uid('item') });
        })
      }
      summary={(e) => [e.title, e.subtitle].filter(Boolean).join(' · ') || 'New entry'}
      render={(e, i) => (
        <div className="grid-2">
          <TextField label={labels.title} placeholder={labels.titleHint} value={e.title} onChange={(v) => set(i, 'title', v, e)} />
          <TextField label={labels.subtitle} value={e.subtitle} onChange={(v) => set(i, 'subtitle', v, e)} />
          <TextField label="Dates" placeholder="2021 – Present" value={e.dates} onChange={(v) => set(i, 'dates', v, e)} />
          <TextField label="Location" value={e.location} onChange={(v) => set(i, 'location', v, e)} />
          <TextField label={labels.note} value={e.note} onChange={(v) => set(i, 'note', v, e)} />
          <TextField label="Link" placeholder="github.com/you/project" value={e.url} onChange={(v) => set(i, 'url', v, e)} />
          <TextArea label="Description" rows={2} value={e.description} onChange={(v) => set(i, 'description', v, e)} />
          <LinesField label="Bullet points" value={e.bullets} placeholder={'Led a team of 4…\nCut costs by 30%…'} onChange={(v) => set(i, 'bullets', v, e)} />
          <CommaField label="Tags" placeholder="React, AWS" value={e.tags} onChange={(v) => set(i, 'tags', v, e)} hint="Optional, shown as small chips" />
        </div>
      )}
    />
  );
}

/** A list of collapsible items with move, duplicate and delete. */
function ItemList<T extends { id: string }>({ items, render, summary, onAdd, onMove, onRemove, onDuplicate, addLabel }: {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  summary: (item: T) => string;
  onAdd: () => void;
  onMove: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onDuplicate?: (index: number) => void;
  addLabel: string;
}) {
  const [open, setOpen] = useState<string | null>(items.length === 1 ? items[0].id : null);
  const [count, setCount] = useState(items.length);
  // Open an item as soon as it is added.
  if (items.length !== count) {
    setCount(items.length);
    if (items.length > count) setOpen(items[items.length - 1].id);
  }
  return (
    <div className="item-list">
      {items.map((item, i) => (
        <div key={item.id} className={`item${open === item.id ? ' is-open' : ''}`}>
          <div className="item-head">
            <button type="button" className="item-head-main" onClick={() => setOpen(open === item.id ? null : item.id)} aria-expanded={open === item.id}>
              {open === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>{summary(item)}</span>
            </button>
            <IconButton title="Move up" disabled={i === 0} onClick={() => onMove(i, -1)}>
              <ArrowUp size={14} />
            </IconButton>
            <IconButton title="Move down" disabled={i === items.length - 1} onClick={() => onMove(i, 1)}>
              <ArrowDown size={14} />
            </IconButton>
            {onDuplicate && (
              <IconButton title="Duplicate" onClick={() => onDuplicate(i)}>
                <Copy size={14} />
              </IconButton>
            )}
            <IconButton title="Remove" tone="danger" onClick={() => onRemove(i)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
          {open === item.id && <div className="item-body">{render(item, i)}</div>}
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={onAdd}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}
