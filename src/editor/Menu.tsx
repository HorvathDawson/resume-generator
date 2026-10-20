import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** A dropdown menu that closes on outside click, Escape or picking an item. */
export function Menu({ label, icon, primary, children }: { label: string; icon?: ReactNode; primary?: boolean; children: ReactNode }) {
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
    <div className="menu" ref={ref}>
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
 * A small floating panel opened from an icon button. It is positioned against
 * the viewport so it is never clipped by a narrow column or a scrolling panel.
 * `children` gets a `close` function for actions that should dismiss it.
 */
export function Popover({ title, icon, children, width = 260 }: { title: string; icon: ReactNode; children: (close: () => void) => ReactNode; width?: number }) {
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

  const toggle = () => {
    if (pos) return setPos(null);
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
    const below = r.bottom + 4;
    // Open upwards when there is little room below.
    setPos({ top: below + 280 > window.innerHeight ? Math.max(8, r.top - 284) : below, left });
  };

  return (
    <>
      <button ref={button} type="button" className="icon-btn" title={title} aria-label={title} aria-haspopup="dialog" aria-expanded={!!pos} onClick={toggle}>
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
