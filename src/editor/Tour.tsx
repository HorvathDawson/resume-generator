import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface TourStep {
  /** `data-tour` value of the element to point at. Leave out for a centered card. */
  target?: string;
  title: string;
  body: ReactNode;
  /** Runs before the step shows, for example to switch tabs. */
  before?: () => void;
}

const GAP = 12;
const PAD = 6;

/** A step-by-step walkthrough that dims the page and highlights one part of it at a time. */
export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const spotlight = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  const go = useCallback(
    (to: number) => {
      if (to < 0) return;
      if (to >= steps.length) return onClose();
      steps[to].before?.();
      setIndex(to);
    },
    [steps, onClose],
  );

  // Position the highlight and the card. Done directly on the elements so it
  // can follow layout changes (a tab switch, a resize) without re-rendering.
  const place = useCallback(() => {
    const box = card.current;
    const light = spotlight.current;
    if (!box || !light) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
    const r = el?.getBoundingClientRect();
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    if (!r || !r.width) {
      light.style.display = 'none';
      box.style.left = `${(vw - w) / 2}px`;
      box.style.top = `${Math.max(16, (vh - h) / 2)}px`;
      return;
    }
    light.style.display = 'block';
    const top = Math.max(4, r.top - PAD);
    const left = Math.max(4, r.left - PAD);
    light.style.top = `${top}px`;
    light.style.left = `${left}px`;
    light.style.width = `${Math.min(vw - 4, r.right + PAD) - left}px`;
    light.style.height = `${Math.min(vh - 4, r.bottom + PAD) - top}px`;

    // Below, above, to the right, to the left; else overlapping the bottom.
    const clampX = (x: number) => Math.max(16, Math.min(x, vw - w - 16));
    const clampY = (y: number) => Math.max(16, Math.min(y, vh - h - 16));
    let x: number;
    let y: number;
    if (r.bottom + PAD + GAP + h < vh - 16) {
      x = clampX(r.left + r.width / 2 - w / 2);
      y = r.bottom + PAD + GAP;
    } else if (r.top - PAD - GAP - h > 16) {
      x = clampX(r.left + r.width / 2 - w / 2);
      y = r.top - PAD - GAP - h;
    } else if (r.right + PAD + GAP + w < vw - 16) {
      x = r.right + PAD + GAP;
      y = clampY(r.top + r.height / 2 - h / 2);
    } else if (r.left - PAD - GAP - w > 16) {
      x = r.left - PAD - GAP - w;
      y = clampY(r.top + r.height / 2 - h / 2);
    } else {
      x = clampX(r.left + r.width / 2 - w / 2);
      y = vh - h - 16;
    }
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
  }, [step]);

  useLayoutEffect(() => {
    place();
    // Again once a tab switched by `before` has rendered and laid out.
    const frame = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', place);
    };
  }, [place]);

  useEffect(() => {
    next.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go, onClose]);

  return (
    <div className={`tour${step.target ? '' : ' tour--center'}`}>
      <div ref={spotlight} className="tour-spotlight" />
      <div ref={card} className="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <div className="tour-count">
          Step {index + 1} of {steps.length}
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <div className="tour-body">{step.body}</div>
        <div className="tour-dots" aria-hidden>
          {steps.map((_, i) => (
            <i key={i} className={i === index ? 'is-active' : ''} />
          ))}
        </div>
        <div className="tour-actions">
          {!last && (
            <button type="button" className="link-btn tour-skip" onClick={onClose}>
              Skip tour
            </button>
          )}
          <span className="tour-spacer" />
          {index > 0 && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => go(index - 1)}>
              Back
            </button>
          )}
          <button ref={next} type="button" className="btn btn--primary btn--sm" onClick={() => go(index + 1)}>
            {last ? 'Done' : index === 0 ? 'Show me around' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
