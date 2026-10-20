// One-click PDF download. Each page is drawn to a high resolution image (so it
// looks exactly like the preview), with an invisible text layer on top so the
// text can still be selected, searched and read by applicant tracking systems,
// and clickable areas for every link. The print dialog remains the way to get
// a fully vector PDF.

const PX_TO_MM = 25.4 / 96;
const PX_TO_PT = 72 / 96;
const SCALE = 3;

interface Line {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
}

/** Group the words of every text node into visual lines, with positions relative to the page. */
function textLines(page: HTMLElement): Line[] {
  const origin = page.getBoundingClientRect();
  const lines: Line[] = [];
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const text = node.data;
    if (!text.trim()) continue;
    const style = node.parentElement ? getComputedStyle(node.parentElement) : null;
    const fontSize = style ? parseFloat(style.fontSize) : 12;
    let current: Line | null = null;
    for (const match of text.matchAll(/\S+/g)) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      const top = r.top - origin.top;
      const left = r.left - origin.left;
      if (current && Math.abs(current.top - top) < 2) {
        current.text += ` ${match[0]}`;
        current.width = left + r.width - current.left;
      } else {
        current = { text: match[0], left, top, width: r.width, height: r.height, fontSize };
        lines.push(current);
      }
    }
  }
  return lines;
}

function links(page: HTMLElement) {
  const origin = page.getBoundingClientRect();
  return [...page.querySelectorAll<HTMLAnchorElement>('a[href]')].flatMap((a) =>
    [...a.getClientRects()].map((r) => ({
      url: a.href,
      left: r.left - origin.left,
      top: r.top - origin.top,
      width: r.width,
      height: r.height,
    })),
  );
}

/**
 * Build a PDF of the pages inside `root` (the unscaled print copy).
 * `onProgress` gets the page being drawn.
 */
export async function buildPdf(root: HTMLElement, title: string, onProgress?: (page: number, total: number) => void): Promise<Blob> {
  const [{ domToCanvas }, { jsPDF }] = await Promise.all([import('modern-screenshot'), import('jspdf')]);
  await document.fonts?.ready;

  // The print copy is hidden off screen; it must be visible to be drawn.
  const previous = root.style.visibility;
  root.style.visibility = 'visible';
  try {
    const pages = [...root.querySelectorAll<HTMLElement>('.rg-page')];
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    pdf.setFont('helvetica');
    for (let i = 0; i < pages.length; i++) {
      onProgress?.(i + 1, pages.length);
      const page = pages[i];
      if (i > 0) pdf.addPage('a4');
      const canvas = await domToCanvas(page, { scale: SCALE, backgroundColor: '#ffffff' });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      for (const line of textLines(page)) {
        const size = line.fontSize * PX_TO_PT;
        pdf.setFontSize(size);
        const natural = pdf.getTextWidth(line.text);
        const width = line.width * PX_TO_MM;
        pdf.text(line.text, line.left * PX_TO_MM, (line.top + line.height * 0.78) * PX_TO_MM, {
          renderingMode: 'invisible',
          horizontalScale: natural > 0 ? width / natural : 1,
        });
      }
      for (const l of links(page)) {
        pdf.link(l.left * PX_TO_MM, l.top * PX_TO_MM, l.width * PX_TO_MM, l.height * PX_TO_MM, { url: l.url });
      }
    }
    pdf.setProperties({ title, creator: 'Resume Builder' });
    return pdf.output('blob');
  } finally {
    root.style.visibility = previous;
  }
}
