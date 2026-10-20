import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Option } from '../model/variants';

// Small, consistent form controls used across the editor panels.

export function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

interface TextProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
}

export function TextField({ label, value, onChange, placeholder, hint, wide }: TextProps) {
  return (
    <Field label={label} hint={hint} wide={wide}>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** Textarea that grows with its content. */
export function TextArea({ label, value, onChange, placeholder, hint, rows = 3 }: TextProps & { rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <Field label={label} hint={hint} wide>
      <textarea ref={ref} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

/** One list item per line. Blank lines are kept while typing and skipped when rendering. */
export function LinesField({ label, value, onChange, placeholder, hint }: Omit<TextProps, 'value' | 'onChange'> & { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <TextArea
      label={label}
      hint={hint ?? 'One per line'}
      placeholder={placeholder}
      value={value.join('\n')}
      onChange={(t) => onChange(t.split('\n'))}
    />
  );
}

const parseCommas = (t: string) => t.split(',').map((s) => s.trim()).filter(Boolean);

/** Comma separated values. Keeps the raw text locally so typing ", " isn't eaten. */
export function CommaField({ label, value, onChange, placeholder, hint }: Omit<TextProps, 'value' | 'onChange'> & { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(() => value.join(', '));
  const [synced, setSynced] = useState(value);
  // Pick up outside changes (undo, import) without clobbering what is being typed.
  if (synced !== value) {
    setSynced(value);
    if (parseCommas(text).join('\u0000') !== value.join('\u0000')) setText(value.join(', '));
  }
  return (
    <Field label={label} hint={hint ?? 'Separate with commas'}>
      <input
        type="text"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseCommas(e.target.value));
        }}
      />
    </Field>
  );
}

export function SelectField<T extends string>({ label, value, options, onChange, hint }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Option<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          className={o.id === value ? 'is-active' : ''}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SliderField({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <Field label={label}>
      <div className="slider">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
        <span className="slider-value">{format(value)}</span>
      </div>
    </Field>
  );
}

export function ColorField({ label, value, onChange, swatches }: { label: string; value: string; onChange: (v: string) => void; swatches?: string[] }) {
  const id = useId();
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(value);
  }
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="color-field">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} picker`} />
        <input
          id={id}
          type="text"
          value={text}
          spellCheck={false}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
        />
      </div>
      {swatches && (
        <div className="swatches">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${c === value ? ' is-active' : ''}`}
              style={{ background: c }}
              title={c}
              aria-label={`Use ${c}`}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function IconButton({ title, onClick, children, disabled, tone }: { title: string; onClick: () => void; children: ReactNode; disabled?: boolean; tone?: 'danger' }) {
  return (
    <button type="button" className={`icon-btn${tone ? ` icon-btn--${tone}` : ''}`} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
