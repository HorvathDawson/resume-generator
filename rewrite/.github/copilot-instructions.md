# Resume Builder TypeScript React App

This is a user-friendly TypeScript React application for building resumes with a **datatype-first approach**.

## Core Features

- Template selection for each section
- Visual layout builder (left column, right column, whole page)
- Manual section item reordering with drag-and-drop
- Manual page break insertion
- Enhanced data types for complete project reload capability
- A4 page format with cm-based measurements
- Full-page preview that fits on screen

## Design Philosophy - Datatype First

**Primary Focus**: Build comprehensive TypeScript interfaces and data models first, then derive UI components from these types.

## Styling Requirements

### Page Format
- **A4 pages only** (21cm x 29.7cm)
- **All measurements in cm** (margins, spacing, font sizes, etc.)
- **Screen-optimized preview** - each page should fit entirely on screen for easy viewing

**Note**: The A4 page format and screen optimization requirements are specifically for the page preview component. The visual layout builder interface can be positioned outside or alongside the preview area - the layout builder builds the resume pages while the preview shows the final result.

### Styling Architecture
1. **Page-Level Styles**: Each page in layout should have:
   - Individual margin settings (top, bottom, left, right)
   - Footer type and configuration
   - Page-specific overrides

2. **Global Layout Styles**:
   - Font sizes for headers (H1, H2, H3, body text, small text)
   - Font family definitions
   - Primary and secondary color schemes
   - Default spacing and padding values

3. **Column-Specific Overrides**:
   - Individual column background colors
   - Column-specific font colors
   - Override capability for global styles per column

### Additional Styling Considerations
- Line heights and text spacing
- Section spacing and margins
- Border styles and colors
- Header and footer styling
- Print-ready CSS with proper page breaks
- Responsive preview scaling

## Development Guidelines

- **TypeScript-first**: Define comprehensive interfaces before building components
- Use modern React hooks and patterns
- Component-based architecture derived from data types
- Type-safe data models with complete serialization support
- Focus on user experience and intuitive interface
- Implement drag-and-drop for section reordering
- Visual page break insertion tools

## Project Structure

- React TypeScript application using Vite
- Strong type definitions in separate files
- Component architecture based on data model
- A4 page preview with zoom/fit controls
- Export/import functionality for complete resume data
