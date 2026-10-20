import { useEffect, useState } from 'react';
import type { ResumeDocument } from '../model/types';
import { fetchResume } from '../model/io';
import { googleFontsUrl } from '../model/variants';
import { ResumeView } from '../resume/ResumeView';

/** An A4 page (210mm) in CSS pixels. */
const PAGE_WIDTH_PX = (210 / 25.4) * 96;

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
  const [zoom, setZoom] = useState(() => window.innerWidth / PAGE_WIDTH_PX);

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
    const fit = () => setZoom(window.innerWidth / PAGE_WIDTH_PX);
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
  return (
    <div className="rg-embed" style={{ zoom }} onClick={() => window.top!.location.assign(viewerUrl())}>
      <ResumeView doc={doc} />
    </div>
  );
}
