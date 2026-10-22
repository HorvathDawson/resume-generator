import { useRef, useState } from 'react';
import { Code, ImagePlus, Trash2 } from 'lucide-react';
import type { CustomFooter, FooterType, HeadingStyle, ResumeDocument, Theme } from '../model/types';
import { FONTS, FOOTERS, HEADING_STYLES } from '../model/variants';
import { CUSTOM_FOOTER_HTML_MAX, CUSTOM_FOOTER_MAX } from '../model/normalize';
import type { Updater } from '../hooks/useHistory';
import { ColorField, Segmented, SelectField, SliderField } from './fields';

interface Props {
  doc: ResumeDocument;
  update: (fn: Updater, key?: string) => void;
}

const ACCENTS = ['#2c5aa0', '#0f766e', '#7c3aed', '#be123c', '#c2410c', '#1f2937', '#0e7490', '#15803d'];
const FONT_OPTIONS = FONTS.map((f) => ({ id: f.id, label: f.label }));

export function DesignPanel({ doc, update }: Props) {
  const t = doc.theme;
  const set = <K extends keyof Theme>(key: K, value: Theme[K]) => update((d) => void (d.theme[key] = value), `theme.${key}`);
  const fontOptions = FONT_OPTIONS.some((f) => f.id === t.font) ? FONT_OPTIONS : [...FONT_OPTIONS, { id: t.font, label: t.font }];
  const headingOptions = FONT_OPTIONS.some((f) => f.id === t.headingFont) ? FONT_OPTIONS : [...FONT_OPTIONS, { id: t.headingFont, label: t.headingFont }];

  return (
    <div className="panel-stack">
      <section className="card">
        <div className="card-head">
          <span className="card-title">Text</span>
        </div>
        <div className="card-body grid-2">
          <SelectField label="Body font" value={t.font} options={fontOptions} onChange={(v) => set('font', v)} />
          <SelectField label="Heading font" value={t.headingFont} options={headingOptions} onChange={(v) => set('headingFont', v)} />
          <SliderField label="Font size" value={t.fontSize} min={7.5} max={12} step={0.25} onChange={(v) => set('fontSize', v)} format={(v) => `${v} pt`} />
          <SliderField label="Line height" value={t.lineHeight} min={1.1} max={1.8} step={0.05} onChange={(v) => set('lineHeight', v)} format={(v) => v.toFixed(2)} />
          <SliderField label="Spacing" value={t.spacing} min={0.5} max={1.8} step={0.05} onChange={(v) => set('spacing', v)} format={(v) => `${Math.round(v * 100)}%`} />
          <SelectField<HeadingStyle> label="Section headings" value={t.headingStyle} options={HEADING_STYLES} onChange={(v) => set('headingStyle', v)} />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <span className="card-title">Colors</span>
        </div>
        <div className="card-body grid-2">
          <ColorField label="Accent" value={t.accent} swatches={ACCENTS} onChange={(v) => update((d) => {
            // Keep the sidebar accent in step unless it was set separately.
            if (d.theme.shadeAccent === d.theme.accent) d.theme.shadeAccent = v;
            d.theme.accent = v;
          }, 'theme.accent')} />
          <ColorField label="Text" value={t.text} onChange={(v) => set('text', v)} />
          <ColorField label="Secondary text" value={t.muted} onChange={(v) => set('muted', v)} />
          <ColorField label="Sidebar background" value={t.shade} onChange={(v) => set('shade', v)} />
          <ColorField label="Sidebar text" value={t.shadeText} onChange={(v) => set('shadeText', v)} />
          <ColorField label="Sidebar accent" value={t.shadeAccent} onChange={(v) => set('shadeAccent', v)} />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <span className="card-title">Page</span>
          <span className="card-sub">A4, 21 × 29.7 cm</span>
        </div>
        <div className="card-body grid-2">
          <SliderField label="Margins" value={t.margin} min={0.5} max={2.5} step={0.1} onChange={(v) => set('margin', v)} format={(v) => `${v.toFixed(1)} cm`} />
          <SliderField label="Column gap" value={t.columnGap} min={0.2} max={1.5} step={0.05} onChange={(v) => set('columnGap', v)} format={(v) => `${v.toFixed(2)} cm`} />
        </div>
      </section>

      <FooterCard doc={doc} update={update} />
    </div>
  );
}

const ALIGN_OPTIONS: { id: CustomFooter['align']; label: string }[] = [
  { id: 'stretch', label: 'Full width' },
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
];

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** The footer on every page, including an image the person uploads. */
function FooterCard({ doc, update }: Props) {
  const custom = doc.theme.customFooter;
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const footers = new Set(doc.pages.map((p) => p.footer));
  const shared = footers.size === 1 ? doc.pages[0].footer : '';
  const options = [
    ...(shared ? [] : [{ id: '', label: 'Different on each page' }]),
    ...FOOTERS.filter((f) => f.id !== 'custom' || custom),
  ];
  const setAll = (footer: FooterType) => update((d) => d.pages.forEach((p) => void (p.footer = footer)));
  const setCustom = (patch: Partial<CustomFooter>) =>
    update((d) => void (d.theme.customFooter = d.theme.customFooter && { ...d.theme.customFooter, ...patch }), `theme.customFooter.${Object.keys(patch)[0]}`);

  const upload = async (file: File) => {
    setError('');
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return setError('Use a PNG, JPEG, WebP or SVG image.');
    const image = await readAsDataUrl(file);
    if (image.length > CUSTOM_FOOTER_MAX) return setError('That image is too large. Keep it under about 1.5 MB.');
    update((d) => {
      d.theme.customFooter = { image, html: '', height: d.theme.customFooter?.height ?? 1.6, align: d.theme.customFooter?.align ?? 'stretch' };
      d.pages.forEach((p) => void (p.footer = 'custom'));
    });
    setWriting(false);
  };

  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState({ html: '', base: '' });
  // Start the editor from the saved HTML whenever that changes from outside (undo, another resume).
  const savedHtml = custom?.html ?? '';
  if (draft.base !== savedHtml) setDraft({ html: savedHtml, base: savedHtml });
  const useHtml = () => {
    const html = draft.html.trim();
    if (!html) return;
    if (html.length > CUSTOM_FOOTER_HTML_MAX) return setError('That HTML is too long.');
    setError('');
    update((d) => {
      d.theme.customFooter = { image: '', html, height: d.theme.customFooter?.height ?? 1.6, align: d.theme.customFooter?.align ?? 'stretch' };
      d.pages.forEach((p) => void (p.footer = 'custom'));
    });
  };
  const showHtml = writing || !!custom?.html;

  return (
    <section className="card" data-tour="footer-card">
      <div className="card-head">
        <span className="card-title">Footer</span>
        <span className="card-sub">Pages can differ: see each page on the Layout tab</span>
      </div>
      <div className="card-body">
        <SelectField<string>
          label="Footer on every page"
          value={shared}
          options={options}
          onChange={(v) => v && setAll(v as FooterType)}
        />
        <div className="field">
          <span className="field-label">Your own footer</span>
          <div className="custom-footer">
            {custom?.image && <img className="custom-footer-thumb" src={custom.image} alt="Your footer image" />}
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => input.current?.click()}>
              <ImagePlus size={15} /> {custom?.image ? 'Replace image…' : 'Upload image…'}
            </button>
            {!showHtml && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setWriting(true)}>
                <Code size={15} /> Write HTML or SVG…
              </button>
            )}
            {custom && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setWriting(false);
                  update((d) => {
                    d.theme.customFooter = null;
                    d.pages.forEach((p) => void (p.footer === 'custom' && (p.footer = 'none')));
                  });
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
            <input
              ref={input}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void upload(file);
              }}
            />
          </div>
          <span className="field-hint">A drawing, a logo or a strip of photo. It's saved inside the resume file, so it goes wherever the resume goes.</span>
        </div>
        {showHtml && (
          <div className="field">
            <span className="field-label">Footer HTML or SVG</span>
            <textarea
              className="code-input"
              rows={6}
              spellCheck={false}
              value={draft.html}
              placeholder={'<svg viewBox="0 0 600 40" preserveAspectRatio="none">\n  <path d="M0 40 L150 10 L300 30 L450 5 L600 40 Z" fill="var(--rg-accent)" />\n</svg>'}
              onChange={(e) => setDraft({ html: e.target.value, base: savedHtml })}
            />
            <span className="field-hint">
              Use the resume's colours with <code>var(--rg-accent)</code>, <code>var(--rg-text)</code>, <code>var(--rg-muted)</code> and <code>var(--rg-shade)</code>. Scripts,
              forms and anything loaded from other sites are removed.
            </span>
            <div className="custom-footer">
              <button type="button" className="btn btn--primary btn--sm" disabled={!draft.html.trim() || draft.html.trim() === savedHtml} onClick={useHtml}>
                Use this footer
              </button>
            </div>
          </div>
        )}
        {error && <p className="field-error">{error}</p>}
        {custom && (
          <div className="grid-2">
            <SliderField label="Height" value={custom.height} min={0.4} max={6} step={0.1} onChange={(v) => setCustom({ height: v })} format={(v) => `${v.toFixed(1)} cm`} />
            <div className="field">
              <span className="field-label">Position</span>
              <Segmented label="Footer image position" value={custom.align} options={ALIGN_OPTIONS} onChange={(v) => setCustom({ align: v })} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
