import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface TourChoice {
  label: string;
  primary?: boolean;
  run: () => void;
}

export interface TourStep {
  /**
   * What to highlight: `data-tour` values, or CSS selectors (starting with
   * `.`, `[` or `#`). The card sits next to the first one. Leave out for a
   * centered card.
   */
  target?: string | string[];
  title: string;
  body: ReactNode;
  /** Runs before the step shows: switch tabs, or make the change the step is about. */
  before?: () => void;
  /** Buttons that end the tour, in place of Done (last step only). */
  choices?: TourChoice[];
}

const GAP = 12;
const PAD = 6;
const EDGE = 16;

interface Box {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

function find(target: string): HTMLElement | null {
  const selector = /^[.[#]/.test(target) ? target : `[data-tour="${target}"]`;
  return document.querySelector<HTMLElement>(selector);
}

/** The part of an element that's visible: inside the viewport and every scrolling panel around it. */
function visibleBox(el: HTMLElement): Box | null {
  const r = el.getBoundingClientRect();
  const box = { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(p);
    if (overflowX === 'visible' && overflowY === 'visible') continue;
    const c = p.getBoundingClientRect();
    box.top = Math.max(box.top, c.top);
    box.left = Math.max(box.left, c.left);
    box.right = Math.min(box.right, c.right);
    box.bottom = Math.min(box.bottom, c.bottom);
  }
  return box.bottom - box.top > 1 && box.right - box.left > 1 ? box : null;
}

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * A step-by-step walkthrough. It dims the page except for the parts a step is
 * about, scrolls them into view, and keeps its card clear of them.
 */
export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [holes, setHoles] = useState<Box[]>([]);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = steps[index];
  const last = index === steps.length - 1;
  const targets = step.target === undefined ? [] : Array.isArray(step.target) ? step.target : [step.target];

  const go = useCallback(
    (to: number) => {
      if (to < 0) return;
      if (to >= steps.length) return onClose();
      steps[to].before?.();
      setIndex(to);
    },
    [steps, onClose],
  );

  // Highlight the targets and place the card. Runs again as things scroll,
  // resize, or finish rendering after a step's change.
  const place = useCallback(() => {
    const box = card.current;
    if (!box) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const found = targets.map(find).filter((el): el is HTMLElement => !!el);
    const rects: Box[] = found
      .map(visibleBox)
      .filter((r): r is Box => !!r)
      .map((r) => ({
        top: Math.max(4, r.top - PAD),
        left: Math.max(4, r.left - PAD),
        right: Math.min(vw - 4, r.right + PAD),
        bottom: Math.min(vh - 4, r.bottom + PAD),
      }))
      .filter((r) => r.bottom > r.top && r.right > r.left);
    setHoles((prev) => (JSON.stringify(prev) === JSON.stringify(rects) ? prev : rects));

    const w = box.offsetWidth;
    const h = box.offsetHeight;
    const r = rects[0];
    if (!r) {
      box.style.left = `${(vw - w) / 2}px`;
      box.style.top = `${Math.max(EDGE, (vh - h) / 2)}px`;
      return;
    }
    // Below, above, to the right or left of the first target: the first that
    // fits on screen and covers none of the others. Else one that fits; else
    // bottom-right.
    const clampX = (x: number) => Math.max(EDGE, Math.min(x, vw - w - EDGE));
    const clampY = (y: number) => Math.max(EDGE, Math.min(y, vh - h - EDGE));
    const cx = r.left + (r.right - r.left) / 2 - w / 2;
    const cy = r.top + (r.bottom - r.top) / 2 - h / 2;
    const options = [
      { x: clampX(cx), y: r.bottom + GAP, fits: r.bottom + GAP + h < vh - EDGE },
      { x: clampX(cx), y: r.top - GAP - h, fits: r.top - GAP - h > EDGE },
      { x: r.right + GAP, y: clampY(cy), fits: r.right + GAP + w < vw - EDGE },
      { x: r.left - GAP - w, y: clampY(cy), fits: r.left - GAP - w > EDGE },
    ];
    const clear = (o: { x: number; y: number }) => rects.every((other) => !overlaps({ left: o.x, top: o.y, right: o.x + w, bottom: o.y + h }, other));
    const pick = options.find((o) => o.fits && clear(o)) ?? options.find((o) => o.fits) ?? { x: vw - w - EDGE, y: vh - h - EDGE };
    box.style.left = `${pick.x}px`;
    box.style.top = `${pick.y}px`;
    // targets is rebuilt each render from step.target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useLayoutEffect(() => {
    // Bring each target into view (the editor and the preview scroll separately).
    const reveal = () => targets.forEach((t) => find(t)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }));
    place();
    // Again once a tab switched by `before` has rendered, and once scrolling settles.
    const frame = requestAnimationFrame(() => {
      reveal();
      place();
    });
    const timers = [200, 500, 900].map((ms) => window.setTimeout(place, ms));
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place]);

  useEffect(() => {
    next.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && !step.choices) go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, go, onClose, step.choices]);

  return (
    <div className="tour">
      {/* The dimmed page, with a hole cut out for each highlighted part */}
      <svg className="tour-dim" aria-hidden="true">
        <defs>
          <mask id="tour-holes">
            <rect width="100%" height="100%" fill="#fff" />
            {holes.map((h, i) => (
              <rect key={i} x={h.left} y={h.top} width={h.right - h.left} height={h.bottom - h.top} rx="10" fill="#000" />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" mask="url(#tour-holes)" />
      </svg>
      {holes.map((h, i) => (
        <div key={i} className="tour-spotlight" style={{ top: h.top, left: h.left, width: h.right - h.left, height: h.bottom - h.top }} />
      ))}
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
          {step.choices ? (
            step.choices.map((c, i) => (
              <button key={c.label} ref={i === 0 ? next : undefined} type="button" className={`btn btn--sm ${c.primary ? 'btn--primary' : 'btn--ghost'}`} onClick={c.run}>
                {c.label}
              </button>
            ))
          ) : (
            <button ref={next} type="button" className="btn btn--primary btn--sm" onClick={() => go(index + 1)}>
              {last ? 'Done' : index === 0 ? 'Show me' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
