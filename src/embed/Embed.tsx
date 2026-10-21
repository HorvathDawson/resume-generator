import { useEffect, useState } from 'react';
import type { ResumeDocument } from '../model/types';
import { fetchResume } from '../model/io';
import { googleFontsUrl } from '../model/variants';
import { PageView } from '../resume/ResumeView';
import { themeVars } from '../resume/themeVars';

/** An A4 page (210 × 297 mm) in CSS pixels. */
const PAGE_WIDTH_PX = (210 / 25.4) * 96;
const PAGE_HEIGHT_PX = (297 / 25.4) * 96;

/** The same resume in the read-only viewer, for clicks on the embed. */
function viewerUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'view');
  return url.href;
}

/**
 * ?resume=…&mode=embed: the resume's pages, each scaled to fill the frame's
 * width, with no editor around it. For showing a resume inside another page
 * (e.g. an <iframe> on a personal site): scrolling moves a page at a time,
 * and a click opens the resume in the viewer, replacing the host page.
 * Renders nothing if the resume can't be loaded, so the host page's own
 * fallback stays visible.
 */
export function Embed({ url }: { url: string }) {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [scale, setScale] = useState(() => window.innerWidth / PAGE_WIDTH_PX);

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
    const fit = () => setScale(window.innerWidth / PAGE_WIDTH_PX);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
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
    </div>
  );
}
