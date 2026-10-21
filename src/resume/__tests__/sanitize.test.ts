// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from '../sanitize';

describe('sanitizeHtml (custom footers)', () => {
  it('keeps drawings: inline SVG, theme colours and inline styles', () => {
    const svg = '<svg viewBox="0 0 10 10"><path d="M0 10 L5 0 L10 10 Z" fill="var(--rg-accent)"></path></svg><p style="color: var(--rg-muted)">Built by hand</p>';
    const out = sanitizeHtml(svg);
    expect(out).toContain('<path d="M0 10 L5 0 L10 10 Z" fill="var(--rg-accent)">');
    expect(out).toContain('style="color: var(--rg-muted)"');
  });

  it('removes anything that runs code or loads from elsewhere', () => {
    const nasty = [
      '<script>alert(1)</script>',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">x</a>',
      '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>',
      '<iframe src="https://example.com"></iframe>',
      '<img src="https://tracker.example/pixel.png">',
      '<div style="background: url(https://tracker.example/a.png)">x</div>',
      '<style>body { display: none }</style>',
      '<svg><foreignObject><div onclick="alert(1)">x</div></foreignObject></svg>',
      '<form action="https://example.com"><input name="q"></form>',
    ].join('');
    const out = sanitizeHtml(nasty);
    for (const bad of ['<script', 'onerror', 'onclick', 'javascript:', '<iframe', 'tracker.example', '<style', '<form', '<input', 'foreignObject']) expect(out).not.toContain(bad);
  });

  it('keeps inline images', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(sanitizeHtml(`<img src="${png}">`)).toContain(png);
  });
});
