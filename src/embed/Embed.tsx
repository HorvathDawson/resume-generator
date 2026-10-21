import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ResumeDocument } from '../model/types';
import { fetchResume } from '../model/io';
import { googleFontsUrl } from '../model/variants';
import { PageView } from '../resume/ResumeView';
import { themeVars } from '../resume/themeVars';

/** An A4 page (210 × 297 mm) in CSS pixels. */
const PAGE_WIDTH_PX = (210 / 25.4) * 96;
const PAGE_HEIGHT_PX = (297 / 25.4) * 96;

/** Scale that makes a page as wide as the frame (its layout width, which unlike innerWidth ignores pinch zoom). */
function frameScale(): number {
  return (document.documentElement.clientWidth || window.innerWidth) / PAGE_WIDTH_PX;
}

/**
 * The embed's scrollbar: drag the thumb (or click the track) to move through
 * the pages; on release it settles on the nearest page. Only shown with a mouse
 * (index.html), where the frame itself doesn't scroll.
 */
/** The frame's scrolling element. */
const frame = () => document.documentElement;

function ScrollBar() {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; scroll: number } | null>(null);
  const [view, setView] = useState({ top: 0, size: 1 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const root = frame();
    const update = () => setView({ top: root.scrollTop / root.scrollHeight, size: root.clientHeight / root.scrollHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    observer.observe(document.body);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, []);

  if (view.size >= 0.999) return null;

  const settle = () => {
    const root = frame();
    const tops = [...document.querySelectorAll<HTMLElement>('.rg-embed-page')].map((p) => p.offsetTop);
    const nearest = tops.reduce((best, t) => (Math.abs(t - root.scrollTop) < Math.abs(best - root.scrollTop) ? t : best), 0);
    root.scrollTo({ top: nearest, behavior: 'smooth' });
  };
  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const box = track.current!.getBoundingClientRect();
    // On the track but off the thumb: jump there first, then drag from it.
    if (!(e.target as Element).classList.contains('rg-embed-thumb')) {
      frame().scrollTop = ((e.clientY - box.top) / box.height - view.size / 2) * frame().scrollHeight;
    }
    drag.current = { y: e.clientY, scroll: frame().scrollTop };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const height = track.current!.getBoundingClientRect().height;
    frame().scrollTop = drag.current.scroll + ((e.clientY - drag.current.y) / height) * frame().scrollHeight;
  };
  const end = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    settle();
  };

  return (
    <div
      ref={track}
      className="rg-embed-scrollbar"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`rg-embed-thumb${dragging ? ' is-dragging' : ''}`} style={{ top: `${view.top * 100}%`, height: `${view.size * 100}%` }} />
    </div>
  );
}

/** The same resume in the read-only viewer, for clicks on the embed. */
function viewerUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'view');
  return url.href;
}

/**
 * ?resume=…&mode=embed: the resume's pages, each scaled to fill the frame's
 * width, with no editor around it. For showing a resume inside another page
 * (e.g. an <iframe> on a personal site). With a mouse, a scrollbar moves
 * through the pages and the wheel scrolls the host page; on touch screens the
 * pages swipe, a page at a time. A click opens the resume in the viewer,
 * replacing the host page.
 * Renders nothing if the resume can't be loaded, so the host page's own
 * fallback stays visible.
 */
export function Embed({ url }: { url: string }) {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [scale, setScale] = useState(frameScale);

  useEffect(() => {
    let cancelled = false;
    fetchResume(url)
      .then((parsed) => !cancelled && setDoc(parsed.doc))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    const fit = () => setScale(frameScale());
    const observer = new ResizeObserver(fit);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  const fontsUrl = doc ? googleFontsUrl([doc.theme.font, doc.theme.headingFont]) : null;
  useEffect(() => {
    if (!fontsUrl) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontsUrl;
    document.head.appendChild(link);
    return () => link.remove();
  }, [fontsUrl]);

  if (!doc) return null;
  // Each page is drawn at full A4 size and scaled down inside a box of the
  // scaled size (CSS `zoom` sized pages differently in Safari). The boxes are
  // what the frame scroll-snaps to.
  return (
    <div className={`rg-embed rg-doc rg-hs-${doc.theme.headingStyle}`} style={themeVars(doc.theme)} onClick={() => window.top!.location.assign(viewerUrl())}>
      {doc.pages.map((page) => (
        <div key={page.id} className="rg-embed-page" style={{ width: PAGE_WIDTH_PX * scale, height: PAGE_HEIGHT_PX * scale, overflow: 'hidden' }}>
          <div style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <PageView page={page} doc={doc} />
          </div>
        </div>
      ))}
      <ScrollBar />
    </div>
  );
}
