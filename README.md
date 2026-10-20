# Resume Builder

A browser app for building clean, printable A4 resumes. Live at
[dawsonhorvath.com/resume-generator](https://dawsonhorvath.com/resume-generator/).

## Using it

- **Content**: your details plus sections (experience, education, skills, lists, references, free text). Click any section in the preview to jump to it.
- **Layout**: pages are made of rows; a row has one column or two. Move sections between columns and pages, split a long section across pages, or let **Move it to the next page** fix any page that overflows.
- **Design**: pick a template (Sidebar, Classic, Minimal, Banner, Slate), then tune fonts, size, spacing, heading style and colors. Templates change the look only; "Use its layout too" rearranges sections as well.

Everything autosaves in your browser. Undo/redo with Ctrl+Z / Ctrl+Shift+Z.

### Getting your resume out

| | |
|---|---|
| **PDF** | Download → PDF opens the print dialog. Choose *Save as PDF*, margins *None*, and turn on *Background graphics*. Text stays selectable and links work. |
| **HTML** | A single self-contained web page you can host anywhere. |
| **JSON** | The editable source. Open it again with File → Open (or drag it onto the window). |

Files saved by the previous version of the app (and the files in `data/`) still open; they're converted to the current format on import.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # import/export and layout tests
npm run lint
npm run build    # writes the GitHub Pages build to docs/
```

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
