import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Something on the page: a `data-tour` value, a CSS selector (starting with
 * `.`, `[` or `#`), or a function that finds the element.
 */
export type TourTarget = string | (() => Element | null | undefined);

export interface TourChoice {
  label: string;
  primary?: boolean;
  run: () => void;
}

/** What a step's demo can do: a pretend cursor that moves, clicks, drags and types. */
export interface TourDemo {
  /** Glide the cursor to an element, scrolling it into view and lighting it up. */
  point(target: TourTarget): Promise<void>;
  /** Show a click where the cursor is; with `press`, click that element for real. */
  click(press?: boolean): Promise<void>;
  /** Drag from where the cursor is by (dx, dy) pixels, calling onMove with progress 0–1. */
  drag(dx: number, dy: number, onMove: (progress: number) => void): Promise<void>;
  /** Type text, calling onText with each longer prefix. */
  type(text: string, onText: (partial: string) => void): Promise<void>;
  /** Type into a text field (it must be on screen). */
  typeInto(target: TourTarget, text: string): Promise<void>;
  /** Make an element glow briefly, to show what just changed. */
  flash(target: TourTarget): Promise<void>;
  /** Close any open menu or popover, as a click elsewhere would. */
  dismiss(): Promise<void>;
  wait(ms: number): Promise<void>;
}

export interface TourStep {
  /** What to highlight. The card sits next to the first. Leave out for a centered card. */
  target?: TourTarget | TourTarget[];
  title: string;
  body: ReactNode;
  /** Runs before the step shows: switch tabs, or set the resume up as the step starts from. */
  before?: () => void;
  /** Acts the step out with the pretend cursor, after `before`. Replayable. */
  demo?: (demo: TourDemo) => Promise<void>;
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

function find(target: TourTarget): HTMLElement | null {
  if (typeof target === 'function') return (target() as HTMLElement | null | undefined) ?? null;
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

/**
 * Scroll an element into view if it isn't already fully visible. Not inside
 * menus, popovers and dialogs: those float above the page, and scrolling the
 * panel under a popover closes it.
 */
function reveal(el: HTMLElement, smooth: boolean) {
  if (el.closest('.popover, .menu-list, .dialog')) return;
  const r = el.getBoundingClientRect();
  const v = visibleBox(el);
  if (v && v.top <= r.top + 1 && v.bottom >= r.bottom - 1 && v.left <= r.left + 1 && v.right >= r.right - 1) return;
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
}

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** Thrown inside a demo when the visitor has moved on, to stop it. */
const STOPPED = Symbol('stopped');

/** Set a React-controlled input's value as if typed. */
function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * A step-by-step walkthrough. It dims the page except for the parts a step is
 * about, keeps its card clear of them, and can act each step out with a
 * pretend cursor so the change is seen happening.
 */
export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [holes, setHoles] = useState<Box[]>([]);
  const [focus, setFocus] = useState<TourTarget | null>(null);
  const [demoDone, setDemoDone] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const ripple = useRef<HTMLSpanElement>(null);
  const run = useRef(0);
  const step = steps[index];
  const last = index === steps.length - 1;

  const go = useCallback(
    (to: number) => {
      if (to < 0) return;
      if (to >= steps.length) return onClose();
      run.current++;
      steps[to].before?.();
      setFocus(null);
      setDemoDone(false);
      setIndex(to);
    },
    [steps, onClose],
  );

  // Highlight the step's targets (and whatever the cursor is on), and place
  // the card next to the first target, clear of the others.
  const place = useCallback(() => {
    const box = card.current;
    if (!box) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const own = step.target === undefined ? [] : Array.isArray(step.target) ? step.target : [step.target];
    const toBox = (t: TourTarget) => {
      const el = find(t);
      const r = el && visibleBox(el);
      return r && { top: Math.max(4, r.top - PAD), left: Math.max(4, r.left - PAD), right: Math.min(vw - 4, r.right + PAD), bottom: Math.min(vh - 4, r.bottom + PAD) };
    };
    const ownBoxes = own.map(toBox).filter((r): r is Box => !!r);
    // Inside a menu, popover or dialog, light up all of it, not just the item.
    const focused = focus ? find(focus) : null;
    const floating = focused?.closest<HTMLElement>('.popover, .menu-list, .dialog');
    const focusBox = focused ? toBox(floating ? () => floating : focus!) : null;
    const rects = focusBox ? [...ownBoxes, focusBox] : ownBoxes;
    setHoles((prev) => (JSON.stringify(prev) === JSON.stringify(rects) ? prev : rects));

    const w = box.offsetWidth;
    const h = box.offsetHeight;
    const r = ownBoxes[0] ?? focusBox;
    if (!r) {
      box.style.left = `${(vw - w) / 2}px`;
      box.style.top = `${Math.max(EDGE, (vh - h) / 2)}px`;
      return;
    }
    // Below, above, right or left of it: the first that fits and covers none
    // of the highlights. Else one that fits; else bottom-right.
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
  }, [step, focus]);

  // Keep everything placed as the app changes underneath: tabs switching,
  // panels scrolling, popovers opening.
  useLayoutEffect(() => {
    place();
    const timer = window.setInterval(place, 200);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [place]);

  // Bring the step's targets into view when it starts.
  useEffect(() => {
    const own = step.target === undefined ? [] : Array.isArray(step.target) ? step.target : [step.target];
    const frame = requestAnimationFrame(() => own.forEach((t) => find(t)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })));
    return () => cancelAnimationFrame(frame);
  }, [step]);

  /** Act out the current step with the pretend cursor. */
  const playDemo = useCallback(async () => {
    const demo = step.demo;
    const pointer = cursor.current;
    if (!demo || !pointer) return;
    const id = ++run.current;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const live = () => {
      if (run.current !== id) throw STOPPED;
    };
    const wait = async (ms: number) => {
      await new Promise((resolve) => setTimeout(resolve, still ? Math.min(ms, 30) : ms));
      live();
    };
    let at: HTMLElement | null = null;
    let x = 0;
    let y = 0;
    const moveTo = (nx: number, ny: number, ms: number) => {
      x = nx;
      y = ny;
      pointer.style.transition = still || !ms ? 'none' : `transform ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      pointer.style.transform = `translate(${nx}px, ${ny}px)`;
    };
    // Start from the card.
    const c = card.current?.getBoundingClientRect();
    moveTo(c ? c.left + c.width / 2 : window.innerWidth / 2, c ? c.top + 20 : window.innerHeight / 2, 0);
    pointer.classList.add('is-visible');

    const api: TourDemo = {
      async point(target) {
        const el = find(target);
        if (!el) return;
        reveal(el, !still);
        await wait(350);
        setFocus(() => target);
        const r = el.getBoundingClientRect();
        moveTo(r.left + Math.min(r.width / 2, 40), r.top + Math.min(r.height / 2, 18), 700);
        await wait(800);
        at = el;
      },
      async click(press = false) {
        pointer.classList.add('is-pressing');
        const dot = ripple.current;
        if (dot) {
          dot.style.left = `${x}px`;
          dot.style.top = `${y}px`;
          dot.classList.remove('is-on');
          void dot.offsetWidth; // restart the animation
          dot.classList.add('is-on');
        }
        await wait(160);
        pointer.classList.remove('is-pressing');
        if (press) at?.click();
        await wait(500);
      },
      async drag(dx, dy, onMove) {
        pointer.classList.add('is-pressing');
        const x0 = x;
        const y0 = y;
        const steps = still ? 1 : 24;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          moveTo(x0 + dx * t, y0 + dy * t, 0);
          onMove(t);
          await wait(35);
        }
        pointer.classList.remove('is-pressing');
        await wait(400);
      },
      async type(text, onText) {
        const chunk = still ? text.length : Math.max(1, Math.round(text.length / 40));
        for (let i = chunk; i < text.length + chunk; i += chunk) {
          onText(text.slice(0, Math.min(i, text.length)));
          await wait(35);
        }
        await wait(250);
      },
      async typeInto(target, text) {
        const el = find(target);
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
        el.focus();
        await api.type(text, (partial) => setInputValue(el, partial));
      },
      async flash(target) {
        const el = find(target);
        if (!el) return;
        reveal(el, !still);
        el.classList.remove('tour-flash');
        void el.offsetWidth;
        el.classList.add('tour-flash');
        window.setTimeout(() => el.classList.remove('tour-flash'), 1600);
        await wait(900);
      },
      async dismiss() {
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        setFocus(null);
        await wait(300);
      },
      wait,
    };

    try {
      await demo(api);
      await wait(300);
    } catch (err) {
      if (err !== STOPPED) console.error(err);
      return;
    } finally {
      if (run.current === id || !step.demo) pointer.classList.remove('is-visible');
    }
    setFocus(null);
    setDemoDone(true);
  }, [step]);

  /** Stop a running demo: it checks this counter between moves. */
  const stopDemo = useCallback(() => {
    run.current++;
  }, []);

  // Play each step's demo once its tab has rendered and scrolled.
  useEffect(() => {
    const pointer = cursor.current;
    if (!step.demo) return;
    const timer = window.setTimeout(() => void playDemo(), 650);
    return () => {
      clearTimeout(timer);
      stopDemo();
      pointer?.classList.remove('is-visible');
    };
  }, [step, playDemo, stopDemo]);

  const replay = () => {
    run.current++;
    step.before?.();
    setFocus(null);
    setDemoDone(false);
    window.setTimeout(() => void playDemo(), 400);
  };

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

  // Stop any demo when the tour closes.
  useEffect(() => stopDemo, [stopDemo]);

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
          {step.demo && demoDone && (
            <button type="button" className="link-btn tour-replay" onClick={replay}>
              Watch again
            </button>
          )}
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
      {/* The pretend cursor, and the ring a click leaves */}
      <span ref={ripple} className="tour-ripple" aria-hidden="true" />
      <div ref={cursor} className="tour-cursor" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26">
          <path d="M5 3l14 8-6 1.6L10 19z" fill="#fff" stroke="#1e1b4b" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
