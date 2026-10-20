# Resume Builder: notes for AI assistants

- The whole app state is one `ResumeDocument` (`src/model/types.ts`). Saved JSON files, browser autosave and undo history all use it. Bump `SCHEMA_VERSION` and extend `normalize.ts`/`migrate.ts` when the shape changes.
- Anything loaded from outside goes through `parseResumeJson` (`src/model/io.ts`) so the renderer never sees malformed data.
- `src/resume/` renders the resume and is shared by the preview, printing and HTML export. Styles live in `resume.css`, driven by CSS variables from the theme; keep them scoped under `.rg-doc`.
- Pages are fixed A4 (21 × 29.7 cm). Content that doesn't fit is reported by `usePageOverflow` and can be moved by `autofit.ts`.
- PDF output is the browser's print dialog (vector text, working links). Don't reintroduce canvas screenshots.
- Run `npm test`, `npm run lint` and `npm run build` before committing.
