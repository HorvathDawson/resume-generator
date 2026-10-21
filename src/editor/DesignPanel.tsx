import type { HeadingStyle, ResumeDocument, Theme } from '../model/types';
import { FONTS, HEADING_STYLES } from '../model/variants';
import type { Updater } from '../hooks/useHistory';
import { ColorField, SelectField, SliderField } from './fields';

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
    </div>
  );
}
