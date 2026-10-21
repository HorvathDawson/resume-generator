import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { ResumeDocument } from '../model/types';
import { TEMPLATES, applyTemplate, arrangeLayout } from '../model/templates';
import { PageView } from '../resume/ResumeView';
import { themeVars } from '../resume/themeVars';
import { Checkbox } from './fields';

interface Props {
  doc: ResumeDocument;
  /** The template being tried in the preview, not yet applied. */
  trialId: string | null;
  onTry: (templateId: string, keepLayout: boolean) => void;
  onApplyTrial: () => void;
  onCancelTrial: () => void;
  /** Other resumes in the library, whose design can be copied onto this one. */
  others: { path: string; title: string }[];
  onCopyDesign: (path: string) => void;
}

export function TemplatesPanel({ doc, trialId, onTry, onApplyTrial, onCancelTrial, others, onCopyDesign }: Props) {
  const t = doc.theme;
  const [keepLayout, setKeepLayout] = useState(false);
  const trial = TEMPLATES.find((tpl) => tpl.id === trialId);

  return (
    <div className="panel-stack">
      {trial && (
        <div className="trial-bar" role="status">
          <p>
            Previewing <strong>{trial.name}</strong>. Your resume hasn't changed: try others, then apply the one you like.
          </p>
          <div className="trial-bar-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onCancelTrial}>Back to my design</button>
            <button type="button" className="btn btn--primary btn--sm" onClick={onApplyTrial}>Apply {trial.name}</button>
          </div>
        </div>
      )}
      <section className="card">
        <div className="card-head">
          <span className="card-title">Template</span>
          <span className="card-sub">Click one to preview it; nothing changes until you apply it</span>
        </div>
        <div className="card-body">
          <Checkbox
            label="Keep my current layout (only change the look)"
            checked={keepLayout}
            onChange={(v) => {
              setKeepLayout(v);
              if (trialId) onTry(trialId, v);
            }}
          />
          <div className="template-grid">
            {TEMPLATES.map((tpl) => {
              const preview = keepLayout ? applyTemplate(doc, tpl.id) : arrangeLayout(doc, tpl.id);
              return (
                <button
                  key={tpl.id}
                  type="button"
                  className={`template-card${(trialId ?? t.template) === tpl.id ? ' is-active' : ''}`}
                  aria-pressed={(trialId ?? t.template) === tpl.id}
                  onClick={() => (tpl.id === trialId ? undefined : onTry(tpl.id, keepLayout))}
                >
                  <div className="template-thumb" aria-hidden="true">
                    <div className={`rg-doc rg-hs-${preview.theme.headingStyle}`} style={{ ...themeVars(preview.theme), zoom: 0.15 } as CSSProperties}>
                      {preview.pages[0] && <PageView page={preview.pages[0]} doc={preview} />}
                    </div>
                  </div>
                  <span className="template-name">{tpl.name}</span>
                  <span className="template-desc">{tpl.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      {others.length > 0 && (
        <section className="card">
          <div className="card-head">
            <span className="card-title">Match another resume</span>
            <span className="card-sub">Use its template, fonts, colours and footer; your content stays</span>
          </div>
          <div className="card-body copy-design">
            {others.map((o) => (
              <button key={o.path} type="button" className="btn btn--ghost btn--sm" onClick={() => onCopyDesign(o.path)}>
                {o.title}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
