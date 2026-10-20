import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** A dropdown menu that closes on outside click, Escape or picking an item. */
export function Menu({ label, icon, primary, tour, children }: { label: string; icon?: ReactNode; primary?: boolean; tour?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu" ref={ref} data-tour={tour}>
      <button type="button" className={`btn${primary ? ' btn--primary' : ' btn--ghost'}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {icon}
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="menu-list" role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, hint, onClick, children }: { icon?: ReactNode; hint?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="menuitem" className="menu-item" onClick={onClick}>
      {icon}
      <span>{children}</span>
      {hint && <kbd>{hint}</kbd>}
    </button>
  );
}

/**
 * A small floating panel opened from a button. It is positioned against the
 * viewport so it is never clipped by a narrow column or a scrolling panel.
 * `children` gets a `close` function for actions that should dismiss it.
 * The trigger is an icon button unless `className` says otherwise.
 */
export function Popover({ title, icon, children, width = 260, className = 'icon-btn' }: {
  title: string;
  icon: ReactNode;
  children: (close: () => void) => ReactNode;
  width?: number;
  className?: string;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onScroll = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  // Keep the panel on screen once its height is known (it can change as it is used).
  useLayoutEffect(() => {
    const el = panel.current;
    const r = button.current?.getBoundingClientRect();
    if (!pos || !el || !r) return;
    const fit = () => {
      const h = el.offsetHeight;
      const below = r.bottom + 4;
      const top = below + h <= window.innerHeight - 8 ? below : Math.max(8, Math.min(r.top - h - 4, window.innerHeight - h - 8));
      el.style.top = `${top}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)) });
  };

  return (
    <>
      <button ref={button} type="button" className={className} title={title} aria-label={className === 'icon-btn' ? title : undefined} aria-haspopup="dialog" aria-expanded={!!pos} onClick={toggle}>
        {icon}
      </button>
      {pos && (
        <div ref={panel} className="popover" role="dialog" aria-label={title} style={{ top: pos.top, left: pos.left, width }}>
          {children(() => setPos(null))}
        </div>
      )}
    </>
  );
}
