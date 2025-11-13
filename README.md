# Resume Builder — Local preview & development

This repository builds a printable resume (HTML/CSS) from Handlebars templates and JSON data. It includes a small preview server that compiles SCSS/templates and shows the result in an iframe with live-reload support.

## Requirements
- Node.js (v18+ recommended)
- npm

## Setup
1. Install dependencies:

```bash
npm install
# or
make init
```

## Build
- Build a single resume file (example `data/service.json`):

```bash
make build resume=service
# or
node build.js data/service.json
```

- Build all resumes in `data/`:

```bash
make build-all
```

## Preview server (recommended for development)
Start the preview server which compiles SCSS and templates, serves the generated HTML, and notifies the preview UI on changes:

```bash
npm run preview
# or (alias)
make preview
```

Open:

```
http://localhost:4000/preview
```

Controls in the preview UI:
- Select a JSON from the dropdown or upload one.
- Click **Start Preview** to build and watch for changes.
- **Reload Preview** forces the iframe to refresh.
- The preview tries to auto-scale the generated HTML to fit the iframe for easy PDF viewing.

While the preview server is running and watching, edits to `data/*.json`, `templates/*.hbs`, or `scss/*.scss` will trigger a rebuild and reload.

## Developing your resume
- Templates: `templates/*.hbs`
- Styles: `scss/main.scss` (Sass)
- Data: `data/*.json`

Edit any file and the preview will rebuild (if you clicked Start Preview).

## Advanced Features

### 1. Footer Customization
You can now customize or disable the footer by adding a `footerType` field to your JSON data:

```json
{
  "name": "Your Name",
  "footerType": "modern",
  // ... rest of your data
}
```

Available footer types:
- `"default"`: Original footer with geometric shapes
- `"modern"`: Clean footer with line, professional text, and gradient
- `"minimal"`: Simple footer with just a colored dot
- `"mountains"`: Mountain silhouette footer with triangular shapes
- `"none"`: No footer (clean page ending)

### Footer Margin
Prevent content from overlapping footers by adding bottom margin:

```json
{
  "footerType": "mountains",
  "footerMargin": "2.5cm"
}
```

Or configure per layout:

```json
{
  "layout": [
    {
      "autoPageBreak": true,
      "footerMargin": "2.5cm",
      "wholePage": ["Work Experience", "Projects"]
    }
  ]
}
```

The footer margin reduces the effective page height, causing sections to break earlier and leave space for the footer.

### 2. Automatic Page Breaking
For multi-page resumes, enable automatic page breaking with intelligent section splitting:

```json
{
  "layout": [
    {
      "autoPageBreak": true,
      "left": ["name"],
      "right": ["Career Summary"],
      "wholePage": [
        "Education:wide",
        "Work Experience",
        "Projects"
      ]
    }
  ]
}
```

Features:
- **Intelligent splitting**: Only splits complex sections with multiple items and details
- **Individual chunk measurement**: Each split chunk is measured individually for accuracy with asymmetric content
- **Browser-based measurement**: Uses Puppeteer for pixel-perfect height calculations
- **No fallback estimates**: Throws clear errors when measurements fail to ensure accuracy

### 3. Column Layout Measurement
The system now measures left and right columns together for proper layout context, ensuring accurate height calculations that account for how content actually renders in the final layout.

### 4. CM-Based Measurements
All measurements now use centimeters instead of pixel conversions for more accurate and consistent sizing across different rendering contexts.

### 5. Error Handling
The build system now throws clear errors instead of using fallback estimates when:
- Section data is missing
- Templates cannot be found
- Measurements fail
- Invalid configuration is provided

This ensures your resume builds are always accurate and alerts you to configuration issues immediately.

## JSON Configuration Examples

### Basic Single-Page Layout
```json
{
  "name": "Your Name",
  "footerType": "minimal",
  "layout": [
    {
      "left": ["name", "personal_info", "Education", "Skills"],
      "right": ["Career Summary", "Projects", "Work Experience"]
    }
  ],
  "sections": [
    // ... your sections
  ]
}
```

### Multi-Page Layout with Auto-Breaking
```json
{
  "name": "Your Name",
  "pageMargins": "1.0cm",
  "footerType": "mountains",
  "layout": [
    {
      "autoPageBreak": true,
      "left": ["name"],
      "right": ["Career Summary"],
      "wholePage": [
        "personal_info:wide",
        "Education:wide",
        "Skills:wide2",
        "Projects",
        "Work Experience",
        "Volunteer Experience",
        "Professional Certifications:wide",
        "Academic Awards:wide"
      ]
    }
  ],
  "sections": [
    // ... your sections
  ]
}
```

### Template Variants
Use template variants to apply different styling to sections:
- `:wide` - Wider layout for sections
- `:wide2` - Alternative wide layout
- Add custom variants by creating new templates

### Configuration Options
- `footerType`: Controls footer appearance (see Footer Customization above)
- `footerMargin`: Bottom margin for footer in cm (e.g., "2.5cm") - reduces effective page height
- `pageMargins`: Set page margins in cm (e.g., "1.0cm")
- `autoPageBreak`: Enable intelligent page splitting
- `layout[].left`: Left column sections
- `layout[].right`: Right column sections  
- `layout[].wholePage`: Full-width sections (used with autoPageBreak)
- `layout[].padding`: Page padding for whole page sections
- `layout[].footerMargin`: Footer margin per layout (overrides global setting)

### Tips
- If port 4000 is in use, start the server on another port:

```bash
PORT=5000 npm run preview
```

- If icons (Font Awesome) don't render: ensure the icon font is loaded in `templates/head.hbs` and that no global `font-size:0` hides the icon font.

## Troubleshooting

### Build Errors
- **"Section data not found for title"**: Check that all sections referenced in your layout exist in the `sections` array
- **"No base height defined for section"**: Add the section to the base heights in `estimateContentHeight` function
- **"Failed to measure section heights"**: Ensure Puppeteer can launch (check Chrome/Chromium installation)
- **"Could not measure chunk"**: Browser measurement failed - check section data structure

### Page Layout Issues
- **Content overlapping footer**: Reduce content or adjust page margins
- **Sections not splitting**: Ensure sections have `items` array with `details` sub-arrays for splitting eligibility
- **Incorrect measurements**: Clear browser cache and rebuild, check that all templates compile correctly

### Footer Issues
- **Footer not changing**: Check `footerType` spelling in JSON, rebuild after changes
- **Footer overlapping content**: Adjust page margins or reduce content height
- **Custom footer not working**: Ensure template file exists in `templates/` directory

## Example Files

The `data/` directory contains several example configurations:

- **`example-basic.json`**: Simple single-page layout with modern footer
- **`darcy-hybrid.json`**: Advanced multi-page layout with auto-breaking and mountains footer  
- **`darcy-main.json`**: Traditional two-column layout
- **`service.json`**: Service-oriented resume layout

Copy and modify these examples to create your own resume configuration.

## Makefile
The `Makefile` includes convenience targets: `init`, `build`, `build-all`, `watch`, `preview`, and `clean`. Run `make help` for details.

## Optional next steps I can do for you
- Add a printable "Print" button that enters fit mode and triggers print.
- Add Monaco editor for richer in-browser editing.
- Add backup copies before saving edits to `data/`.

### Save as PDF from the preview
The preview UI now includes a **Save as PDF** button. It briefly enters Fit Preview (so the resume fits the page), triggers the browser print dialog for the iframe content, then exits fit mode.

Use it from the preview page after clicking **Start Preview**.

---
Updated README to cover setup, running, and straightforward development workflow.