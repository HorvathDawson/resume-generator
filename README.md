# Resume Builder

A browser app for building clean, printable A4 resumes. Live at
[dawsonhorvath.com/resume-generator](https://dawsonhorvath.com/resume-generator/).

## Using it

- **Content**: your details plus sections (experience, education, skills, lists, references, free text). Click any section in the preview to jump to it.
- **Layout**: each page is drawn as a small sheet. Drag sections between columns, rows and pages; pick a row shape (one column, narrow left, even, narrow right); drag the line between two columns to set their widths. Click a section for its options: edit its text, move it, or split a long one across pages by clicking between two of its items (and put it back together later). The row and page ⋯ menus hold sidebar color, reordering and delete. **Move it to the next page** fixes any page that overflows.
- **Templates**: click a template to preview it on your resume; nothing changes until you click **Apply**, and **Back to my design** returns to how it was. Templates rearrange sections too, unless you tick "Keep my current layout". **Match another resume** gives this one the look of another resume in your library.
- **Design**: tune fonts, size, spacing, heading style, colors and the page footer.
- **Resumes**: keep several resumes in one library: a main one plus copies tailored to particular jobs. **Make a copy for a job** records which resume it came from and what it's for, and folders group them.

A short guided tour runs on the first visit; the ? button in the top bar replays it. Everything autosaves in your browser (or in your folder, below). Undo/redo with Ctrl+Z / Ctrl+Shift+Z.

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

To publish a resume, save it as JSON (File → Save as JSON) into `public/resumes/<name>.json` and rebuild. Opening a link never silently replaces a visitor's own work: if they have a different resume saved in their browser, they're asked first.

Files saved by earlier versions of the app (single `.json` resumes, and the older format) still open; they're added to your library. A resume saved in the browser by an earlier version becomes the first resume in the library.

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
├── editor/         the Resumes / Content / Templates / Layout / Design panels and preview
├── library/        libraries: several resumes, folders on disk, the agent guide and schema
├── export/         standalone HTML export
└── data/sample.json
```

The JSON file format is the `ResumeDocument` type in `src/model/types.ts`, tagged with
`"schema": "resume-generator"` and a `version` number.
