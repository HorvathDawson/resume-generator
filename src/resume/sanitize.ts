import DOMPurify from 'dompurify';

/**
 * Clean HTML/SVG a person pasted (or that came inside a resume file someone
 * shared) so it can be drawn on the page: markup, inline SVG and style
 * attributes stay; scripts, event handlers, frames, forms, <style> blocks and
 * anything that loads from another site are removed.
 */
const purifier = DOMPurify();

// Only same-document links (#id) and inline images may stay in href/src.
const SAFE_URL = /^(#|data:image\/(png|jpeg|gif|webp);base64,)/i;
// Inline styles may not load anything (url(...) other than #fragment) or use old IE expressions.
const UNSAFE_STYLE = /url\(\s*(?!['"]?#)|expression\s*\(|@import/i;

purifier.addHook('uponSanitizeAttribute', (_node, data) => {
  const name = data.attrName.toLowerCase();
  if ((name === 'href' || name === 'xlink:href' || name === 'src') && !SAFE_URL.test(data.attrValue.trim())) data.keepAttr = false;
  if (name === 'style' && UNSAFE_STYLE.test(data.attrValue)) data.keepAttr = false;
});

export function sanitizeHtml(html: string): string {
  return purifier.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    FORBID_TAGS: ['style', 'link', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'video', 'audio', 'foreignObject'],
    FORBID_ATTR: ['srcset', 'action', 'formaction', 'ping'],
  });
}
