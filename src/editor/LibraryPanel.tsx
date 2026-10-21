import { useState } from 'react';
import { Copy, FilePlus, Folder, FolderOpen, HardDrive, Star, Trash2 } from 'lucide-react';
import type { ResumeDocument } from '../model/types';
import type { Updater } from '../hooks/useHistory';
import type { LibraryApi } from '../library/useLibrary';
import { findById, folderOf, foldersOf, sortedPaths } from '../library/library';
import { canUseFolders } from '../library/storage';
import { Dialog } from './Dialog';
import { IconButton, TextArea, TextField } from './fields';

interface Props {
  library: LibraryApi;
  doc: ResumeDocument;
  update: (fn: Updater, key?: string) => void;
  onNew: () => void;
  onPickFolder: (intent: 'open' | 'setup') => void;
}

/** A text box that only reports its value when editing ends (Enter or leaving it). */
function CommitField({ label, value, onCommit, placeholder, hint, list }: { label: string; value: string; onCommit: (v: string) => void; placeholder?: string; hint?: string; list?: string }) {
  const [state, setState] = useState({ draft: value, base: value });
  // Take on a new value from outside (another resume opened, a rename) without an effect.
  if (state.base !== value) setState({ draft: value, base: value });
  const draft = state.draft;
  const setDraft = (d: string) => setState({ draft: d, base: value });
  const commit = () => draft.trim() !== value && onCommit(draft);
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="text"
        value={draft}
        placeholder={placeholder}
        list={list}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setDraft(value);
        }}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

const folderLabel = (folder: string) => (folder ? folder.split('/').join(' / ') : 'Top level');

export function LibraryPanel({ library, doc, update, onNew, onPickFolder }: Props) {
  const { lib, activePath, place } = library;
  const [copying, setCopying] = useState<{ title: string; target: string; folder: string; notes: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const folders = foldersOf(lib);
  const count = Object.keys(lib.files).length;
  const basedOnPath = doc.meta.basedOn ? findById(lib, doc.meta.basedOn) : undefined;

  const startCopy = () => setCopying({ title: `${doc.title} – `, target: '', folder: folderOf(activePath) || 'applications', notes: '' });

  return (
    <div className="panel-stack">
      <div className="card">
        <div className="card-body library-head">
          <CommitField label="Library" value={lib.name} onCommit={library.setName} />
          {place.kind === 'folder' ? (
            <div className="library-place">
              <FolderOpen size={16} />
              <p className="hint">
                Saving to the folder <strong>{place.name}</strong>. Changes made there by other programs (an AI agent, git) show up here.
              </p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={library.disconnect}>Close folder</button>
            </div>
          ) : (
            <div className="library-place">
              <HardDrive size={16} />
              {canUseFolders() ? (
                <>
                  <p className="hint">Saved in this browser. Keep your resumes as files instead, to use git or an AI agent:</p>
                  <div className="library-place-actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => onPickFolder('setup')}>Set up a folder…</button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => onPickFolder('open')}>Open a folder…</button>
                  </div>
                </>
              ) : (
                <p className="hint">
                  Saved in this browser. Use File → Download library to keep a copy. To save straight into a folder (for git or an AI agent), open this
                  page in Chrome or Edge.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="library-actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={startCopy}>
          <Copy size={15} /> Make a copy for a job
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onNew}>
          <FilePlus size={15} /> New blank resume
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="library-current-head">
            <span className="card-title">This resume</span>
            {lib.defaultPath === activePath ? (
              <span className="badge">
                <Star size={11} /> Default
              </span>
            ) : (
              <button type="button" className="link-btn" onClick={() => library.setDefault(activePath)}>
                Make default
              </button>
            )}
          </div>
          <div className="grid-2">
            <CommitField label="Name" value={doc.title} onCommit={(v) => library.rename(activePath, v)} hint={activePath} />
            <CommitField label="Folder" value={folderOf(activePath)} onCommit={(v) => library.move(activePath, v)} placeholder="Top level" list="library-folders" />
            <TextField
              label="Made for"
              value={doc.meta.target}
              placeholder="e.g. Robotics roles, or Acme – Controls Engineer"
              onChange={(v) => update((d) => void (d.meta.target = v), 'meta.target')}
              wide
            />
          </div>
          <TextArea label="Notes" value={doc.meta.notes} placeholder="The posting, what you changed, when you sent it" onChange={(v) => update((d) => void (d.meta.notes = v), 'meta.notes')} rows={2} />
          {doc.meta.basedOn && (
            <p className="hint">
              Copied from{' '}
              {basedOnPath ? (
                <button type="button" className="link-btn" onClick={() => library.open(basedOnPath)}>
                  {lib.files[basedOnPath].title}
                </button>
              ) : (
                'a resume that is no longer in this library'
              )}
              .
            </p>
          )}
          <div className="library-current-foot">
            <button type="button" className="btn btn--ghost btn--sm library-delete" disabled={count < 2} onClick={() => setConfirmDelete(true)} title={count < 2 ? 'A library needs at least one resume' : undefined}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      <datalist id="library-folders">
        {folders.filter(Boolean).map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <div className="library-list" role="list" aria-label="Resumes in this library">
        {folders.map((folder) => (
          <div key={folder || '.'} className="library-folder">
            <div className="library-folder-name">
              <Folder size={13} /> {folderLabel(folder)}
            </div>
            {sortedPaths(lib)
              .filter((p) => folderOf(p) === folder)
              .map((path) => {
                const resume = lib.files[path];
                const source = resume.meta.basedOn ? findById(lib, resume.meta.basedOn) : undefined;
                return (
                  <div key={path} role="listitem" className={`library-item${path === activePath ? ' is-active' : ''}`}>
                    <button type="button" className="library-item-main" onClick={() => library.open(path)} aria-current={path === activePath}>
                      <span className="library-item-title">
                        {resume.title}
                        {path === lib.defaultPath && <Star size={11} className="library-star" aria-label="Default" />}
                      </span>
                      <span className="library-item-sub">
                        {resume.meta.target || (source ? `Copy of ${lib.files[source].title}` : path.split('/').pop())}
                      </span>
                    </button>
                    <IconButton
                      title={`Make a copy of “${resume.title}”`}
                      onClick={() => {
                        library.open(path);
                        setCopying({ title: `${resume.title} – `, target: '', folder: folderOf(path) || 'applications', notes: '' });
                      }}
                    >
                      <Copy size={15} />
                    </IconButton>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {copying && (
        <Dialog
          title={`Make a copy of “${doc.title}”`}
          onClose={() => setCopying(null)}
          actions={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setCopying(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!copying.title.trim() || copying.title.trim() === `${doc.title} –`}
                onClick={() => {
                  library.duplicate(activePath, copying);
                  setCopying(null);
                }}
              >
                Make copy
              </button>
            </>
          }
        >
          <p className="hint">Tailor the copy for one job or kind of job. The original stays as it is, and the copy remembers where it came from.</p>
          <div className="grid-2">
            <label className="field field--wide">
              <span className="field-label">Name</span>
              <input type="text" autoFocus value={copying.title} placeholder="Acme – Controls Engineer" onChange={(e) => setCopying({ ...copying, title: e.target.value })} />
            </label>
            <TextField label="Made for" value={copying.target} placeholder="Controls Engineer at Acme" onChange={(v) => setCopying({ ...copying, target: v })} />
            <label className="field">
              <span className="field-label">Folder</span>
              <input type="text" list="library-folders" value={copying.folder} placeholder="Top level" onChange={(e) => setCopying({ ...copying, folder: e.target.value })} />
            </label>
          </div>
          <TextArea label="Notes" value={copying.notes} placeholder="Link to the posting, what to emphasise" onChange={(v) => setCopying({ ...copying, notes: v })} rows={2} />
        </Dialog>
      )}

      {confirmDelete && (
        <Dialog
          title={`Delete “${doc.title}”?`}
          onClose={() => setConfirmDelete(false)}
          actions={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  setConfirmDelete(false);
                  library.remove(activePath);
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <p>
            {place.kind === 'folder' ? (
              <>
                This deletes <strong>{activePath}</strong> from the folder. If the folder is in git, you can still get it back from there.
              </>
            ) : (
              <>This removes it from the library in this browser. You can undo right after.</>
            )}
          </p>
        </Dialog>
      )}
    </div>
  );
}
