import { renderToStaticMarkup } from 'react-dom/server';
import type { ResumeDocument } from '../model/types';
import { googleFontsUrl } from '../model/variants';
import { ResumeView } from '../resume/ResumeView';
import resumeCss from '../resume/resume.css?inline';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// Page chrome for the standalone file: grey backdrop on screen, nothing extra on paper.
const STANDALONE_CSS = `
html, body { margin: 0; padding: 0; }
body { background: #e5e7eb; }
.rg-doc { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 24px 0; }
.rg-page { box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.08); }
@page { size: A4; margin: 0; }
@media print {
  body { background: none; }
  .rg-doc { display: block; padding: 0; }
}
@media (max-width: 820px) {
  .rg-doc { zoom: 0.45; }
}
`;

/** A self-contained HTML file of the resume that can be hosted or opened anywhere. */
export function buildStandaloneHtml(doc: ResumeDocument): string {
  const markup = renderToStaticMarkup(<ResumeView doc={doc} />);
  const fonts = googleFontsUrl([doc.theme.font, doc.theme.headingFont]);
  const title = escapeHtml(doc.profile.name ? `${doc.profile.name} – Resume` : doc.title);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${fonts ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${escapeHtml(fonts)}">` : ''}
<style>
${resumeCss}
${STANDALONE_CSS}
</style>
</head>
<body>
${markup}
</body>
</html>
`;
}
