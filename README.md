# Resume Builder

A browser app for making clean, printable A4 resumes, and keeping a version for every job you
apply to. Nothing to install and no account: your resumes stay in your browser or in a folder
on your computer.

**Try it:** [dawsonhorvath.com/resume-generator](https://dawsonhorvath.com/resume-generator/)

<table>
<tr>
<td width="62%"><img src="docs/images/editor.png" alt="The editor: sections on the left, the live page on the right"></td>
<td width="38%"><img src="docs/images/showcase.png" alt="A resume made with it: Stone template with the paraglider footer"><br><sub>Made with it: <a href="https://dawsonhorvath.com/resume-generator/?resume=dawson&mode=view">Dawson's resume</a>, Stone template.</sub></td>
</tr>
</table>

## Templates

Twelve starting points. Click one on the **Templates** tab to see your own resume in it;
nothing changes until you apply it. Every font, colour, section style and footer can be changed
afterwards on the **Design** tab.

<table>
<tr>
<td align="center" valign="top" width="25%"><img src="docs/images/template-sidebar.png" alt="Sidebar template" width="200"><br><b>Sidebar</b><br><sub>Tinted side column for contact and skills</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-split-header.png" alt="Split header template" width="200"><br><b>Split header</b><br><sub>Name beside your summary, mountain footer</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-headline.png" alt="Headline template" width="200"><br><b>Headline</b><br><sub>Short pitch, contact pills, dates in the margin</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-classic.png" alt="Classic template" width="200"><br><b>Classic</b><br><sub>One serif column, safe for any applicant system</sub></td>
</tr>
<tr>
<td align="center" valign="top" width="25%"><img src="docs/images/template-executive.png" alt="Executive template" width="200"><br><b>Executive</b><br><sub>Centered serif header, tinted right column</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-minimal.png" alt="Minimal template" width="200"><br><b>Minimal</b><br><sub>Monochrome, dates in a left margin</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-banner.png" alt="Banner template" width="200"><br><b>Banner</b><br><sub>Bold colour header and a timeline</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-slate.png" alt="Slate template" width="200"><br><b>Slate</b><br><sub>Full-height dark sidebar</sub></td>
</tr>
<tr>
<td align="center" valign="top" width="25%"><img src="docs/images/template-field-notes.png" alt="Field notes template" width="200"><br><b>Field notes</b><br><sub>Green banner and a fish footer</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-compact.png" alt="Compact template" width="200"><br><b>Compact</b><br><sub>Dense, fits a lot on one page</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-stone.png" alt="Stone template" width="200"><br><b>Stone</b><br><sub>Warm neutrals and a paraglider footer</sub></td>
<td align="center" valign="top" width="25%"><img src="docs/images/template-deep.png" alt="Deep template" width="200"><br><b>Deep</b><br><sub>Timeline column and a diver footer</sub></td>
</tr>
</table>

## Using it

- **Resumes**: keep several resumes in one library: a main one plus copies tailored to particular jobs. **Make a copy for a job** records which resume it came from and what it's for, and folders group them.
- **Content**: your details plus sections (experience, education, skills, lists, references, free text). Click any section in the preview to jump to it.
- **Templates**: preview a template on your resume, then **Apply** it or go **Back to my design**. Templates rearrange sections too, unless you tick "Keep my current layout". **Match another resume** gives this one the look of another resume in your library.
- **Layout**: each page is drawn as a small sheet. Drag sections between columns, rows and pages; pick a row shape; drag the line between two columns to set their widths. Click a section to edit it, move it, or split a long one across pages. **Move it to the next page** fixes any page that overflows.
- **Design**: fonts, size, spacing, heading style, colours, margins and the page footer, including [your own](#your-own-footer).

A short guided tour runs on the first visit; the ? button in the top bar replays it. Everything
autosaves. Undo/redo with Ctrl+Z / Ctrl+Shift+Z.

### Your own footer

Design → Footer → **Upload image…** puts any PNG, JPEG, WebP or SVG at the bottom of every page;
set its height and position (full width, left, center, right). Or choose **Write HTML or SVG…**
and draw one in code. It can use the resume's colours, so it follows the theme:

```html
<svg viewBox="0 0 600 40" preserveAspectRatio="none">
  <path d="M0 40 L120 18 L240 30 L380 6 L600 40 Z" fill="var(--rg-shade)" />
  <path d="M0 40 L200 26 L420 34 L600 22 L600 40 Z" fill="var(--rg-accent)" opacity="0.6" />
</svg>
```

Available colours: `var(--rg-accent)`, `var(--rg-text)`, `var(--rg-muted)`, `var(--rg-shade)`,
`var(--rg-shade-accent)`. The footer is saved inside the resume file, so it travels with it.
Because resume files get shared, the markup is cleaned before it's drawn: scripts, event
handlers, forms, frames, `<style>` blocks and anything loaded from another site are removed.

### Keeping resumes in a folder (git, AI agents)

In Chrome or Edge, **File → Set up a resume folder…** writes your library into a folder on your computer and keeps saving there:

```
library.json                     library name, default resume, short guide
resumes/main.resume.json         one resume per file
resumes/applications/acme.resume.json
AGENTS.md                        how an AI agent should read and edit the files
README.md                        how to open the folder, and a git workflow
resume.schema.json               JSON Schema for a .resume.json file
```

Edits made in the folder by other programs (an AI agent, an editor, `git pull`) show up in the builder within a few seconds; if the open resume was also edited in the builder, it asks which to keep. The builder never connects to GitHub or any server, so a private repo stays private. Next visit, the browser asks once to reopen the folder. Other browsers use **File → Download library** / **Open file** with a single `.library.json` file instead.

### Getting your resume out

| | |
|---|---|
| **PDF** | Download → PDF saves a PDF straight away. Text stays selectable and links work. |
| **Print to PDF** | The backup, with the sharpest text: opens the print dialog. Choose *Save as PDF*, margins *None*, and turn on *Background graphics*. |
| **HTML** | A single self-contained web page you can host anywhere. |
| **Resume file** | One resume as `.resume.json`, the editable source. Open it again with File → Open file (or drag it onto the window); it's added to your library. |
| **Library file** | File → Download library: every resume in one `.library.json` file. |

### Linking to a resume

Add `?resume=` to the app's address to open a resume straight away, for example from a personal website:

| Link | Opens |
|---|---|
| `…/resume-generator/?resume=dawson` | `public/resumes/dawson.json` in the editor |
| `…/resume-generator/?resume=dawson&mode=view` | the same resume read-only, with Download and "Edit in the builder" buttons |
| `…/resume-generator/?resume=dawson&mode=embed` | just the pages, each scaled to the frame's width and scrolling a page at a time; a click opens the viewer (for an `<iframe>` on another page) |
| `…/resume-generator/?resume=https://example.com/me.json` | a resume from another site (that site must allow cross-origin requests) |

To publish a resume, save it with File → Save this resume as a file, put it at `public/resumes/<name>.json` and rebuild. Opening a link never silently replaces a visitor's own work: if they have a different resume saved in their browser, they're asked first.

Files saved by earlier versions of the app (single `.json` resumes, and the older format) still open; they're added to your library. A resume saved in the browser by an earlier version becomes the first resume in the library.

## Make it yours (for developers)

The app is plain React + TypeScript; each of these is a small, local change.

**A template** is one entry in `TEMPLATES` (`src/model/templates.ts`): a theme (fonts, colours,
spacing), a style for each section type, a row structure built from slots (`header`, `contact`,
`about`, `main`, `side`) and a footer. It shows up on the Templates tab automatically. With
`npm run preview` running, `node scripts/readme-images.cjs` refreshes the screenshots above
(it needs Playwright).

**A built-in footer:**
1. Add its id to `FooterType` (`src/model/types.ts`).
2. Add it to `FOOTERS` and `FOOTER_HEIGHT` (`src/model/variants.ts`).
3. Draw it in `src/resume/Footer.tsx` (SVG using the `--rg-*` colour variables) and style it in `src/resume/resume.css`.

**A section style** (say, a new look for skills):
1. Add `{ id, label }` to that type in `SECTION_VARIANTS` (`src/model/variants.ts`).
2. Each section renders with the classes `rg-<type> rg-<type>--<variant>`, so often CSS in `resume.css` is enough.
3. For different markup, branch on `section.variant` in `src/resume/sections.tsx`.

The file schema, `AGENTS.md` and the editor menus are generated from these lists, so they pick up
new entries on their own. `npm test` checks that every template, footer and style still produces a
valid file.

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
│   ├── variants.ts   section styles, fonts, footers
│   ├── autofit.ts    moves/splits content that runs off a page
│   └── edit.ts       layout editing helpers
├── resume/         renders a document (preview, print and HTML export share it); sanitize.ts cleans custom footer HTML
├── editor/         the Resumes / Content / Templates / Layout / Design panels and preview
├── library/        libraries: several resumes, folders on disk, the agent guide and schema
├── export/         PDF and standalone HTML export
└── data/sample.json
scripts/readme-images.cjs   screenshots for this README
```

The JSON file format is the `ResumeDocument` type in `src/model/types.ts`, tagged with
`"schema": "resume-generator"` and a `version` number. `resume.schema.json` (written into every
resume folder) describes it for other tools.
