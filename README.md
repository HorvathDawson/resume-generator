# Resume Builder

A browser app for building clean, printable A4 resumes. Live at
[dawsonhorvath.com/resume-generator](https://dawsonhorvath.com/resume-generator/).

## Using it

- **Content**: your details plus sections (experience, education, skills, lists, references, free text). Click any section in the preview to jump to it.
- **Layout**: each page is drawn as a small sheet. Drag sections between columns, rows and pages; pick a row shape (one column, narrow left, even, narrow right); drag the line between two columns to set their widths. Click a section for its options: edit its text, move it, or split a long one across pages by clicking between two of its items (and put it back together later). The row and page ⋯ menus hold sidebar color, reordering and delete. **Move it to the next page** fixes any page that overflows.
- **Design**: pick one of ten templates (some put the name beside the summary, some use a banner, some add a footer), then tune fonts, size, spacing, heading style and colors. Templates rearrange sections too, unless you tick "Keep my current layout".

A short guided tour runs on the first visit; the ? button in the top bar replays it. Everything autosaves in your browser. Undo/redo with Ctrl+Z / Ctrl+Shift+Z.

### Getting your resume out

| | |
|---|---|
| **PDF** | Download → PDF saves a PDF straight away. Text stays selectable and links work. |
| **Print to PDF** | The backup, with the sharpest text: opens the print dialog. Choose *Save as PDF*, margins *None*, and turn on *Background graphics*. |
| **HTML** | A single self-contained web page you can host anywhere. |
| **JSON** | The editable source. Open it again with File → Open (or drag it onto the window). |

### Linking to a resume

Add `?resume=` to the app's address to open a resume straight away, for example from a personal website:

| Link | Opens |
|---|---|
| `…/resume-generator/?resume=dawson` | `public/resumes/dawson.json` in the editor |
| `…/resume-generator/?resume=dawson&mode=view` | the same resume read-only, with Download and "Edit in the builder" buttons |
| `…/resume-generator/?resume=dawson&mode=embed` | only the first page, scaled to fit, with nothing around it (for an `<iframe>` on another page) |
| `…/resume-generator/?resume=https://example.com/me.json` | a resume from another site (that site must allow cross-origin requests) |

To publish a resume, save it as JSON (File → Save as JSON) into `public/resumes/<name>.json` and rebuild. Opening a link never silently replaces a visitor's own work: if they have a different resume saved in their browser, they're asked first.

Files saved by the previous version of the app (and the files in `data/`) still open; they're converted to the current format on import.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # import/export and layout tests
npm run lint
npm run build    # writes dist/resume-generator/
npm run preview  # build, then serve it locally at http://localhost:8787/resume-generator/
```

## Deployment

Cloudflare Workers Builds deploys `main` to the `resume-generator` Worker
(`wrangler.jsonc`), which serves `dist/` by path. dawsonhorvath.com reaches it
through the portfolio site's Worker, which forwards `/resume-generator/*` here
over a service binding, so the Worker's name must stay `resume-generator`.

The page's canonical URL and the "back to site" link default to `https://dawsonhorvath.com/resume-generator/` and `https://dawsonhorvath.com/`. Set `RG_SITE_URL` and `RG_HOME_URL` when building to change them.

## How it's put together

```
src/
├── model/          the resume document and everything that changes it
│   ├── types.ts      ResumeDocument: profile, sections, pages → rows → columns → placements, theme
│   ├── io.ts         JSON open/save, browser autosave
│   ├── normalize.ts  repairs any loaded data into a valid document
│   ├── migrate.ts    converts the old app's file formats
│   ├── templates.ts  design templates and auto-arrange
│   ├── autofit.ts    moves/splits content that runs off a page
│   └── edit.ts       layout editing helpers
├── resume/         renders a document (preview, print and HTML export share it)
├── editor/         the Content / Layout / Design panels and preview
├── export/         standalone HTML export
└── data/sample.json
```

The JSON file format is the `ResumeDocument` type in `src/model/types.ts`, tagged with
`"schema": "resume-generator"` and a `version` number.
