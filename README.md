# Resume Builder - TypeScript React Application

A modern, user-friendly resume builder built with TypeScript and React. This application follows a **datatype-first approach** where comprehensive TypeScript interfaces drive the entire application architecture.

## 🎯 Key Features

- **Visual Layout Builder**: Drag-and-drop interface for organizing sections into left column, right column, or whole page layouts
- **Template System**: Multiple templates for each section type (education, experience, projects, etc.)
- **Manual Page Breaks**: User-controlled section splitting with visual page break insertion
- **A4 Optimized**: All measurements in cm, optimized for A4 paper (21cm x 29.7cm)
- **Live Preview**: Real-time preview that fits entire A4 page on screen
- **Type-Safe**: Comprehensive TypeScript types for all data structures
- **Serializable**: Complete project state can be saved and reloaded

## 🏗️ Architecture

### Datatype-First Design

The application is built around comprehensive TypeScript interfaces that define:

- **Resume Data**: Complete resume content with sections, items, and metadata
- **Styling System**: Global styles, page-specific styles, and column overrides
- **Template System**: Configurable templates for different section types
- **Layout System**: Visual layout builder with drag-and-drop support

### Core Types

- `ResumeData` - Complete resume structure
- `Section` & `SectionItem` - Content organization
- `GlobalStyles` & `PageStyles` - Styling system with cm-based measurements
- `LayoutBuilderState` - Visual layout management
- `TemplateLibrary` - Template system for sections

### Styling System

- **A4 Format**: 21cm x 29.7cm pages
- **CM Measurements**: All spacing, fonts, and margins in centimeters
- **Screen Optimized**: Preview scaled to fit on screen while maintaining A4 proportions
- **Flexible Styling**: Global styles with page and column-specific overrides

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Edit Content**: Use the left panel to manage sections and content
2. **Arrange Layout**: Drag sections between columns and pages
3. **Insert Page Breaks**: Add manual breaks to split sections across pages
4. **Preview**: View real-time A4-formatted preview on the right
5. **Export**: Generate PDF when ready

## 📁 Project Structure

```
src/
├── types/           # Comprehensive TypeScript definitions
│   ├── resume.ts    # Core resume data types
│   ├── styles.ts    # Styling system types
│   ├── template.ts  # Template system types
│   ├── layout.ts    # Layout builder types
│   └── index.ts     # Type exports
├── components/      # React components
│   ├── ResumeEditor.tsx
│   └── PreviewPanel.tsx
├── utils/           # Utility functions
│   └── defaults.ts  # Default data generators
└── App.tsx          # Main application
```

## 🎨 Design Philosophy

1. **Type Safety**: Every data structure is strongly typed
2. **Serializability**: Complete application state can be saved/loaded
3. **Flexibility**: Templates and layouts are configurable
4. **User Control**: Manual page breaks and layout control
5. **Professional Output**: A4-optimized for print quality

## 🔧 Development

The application is built with:

- **Vite** - Fast build tool
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better DX
- **CSS** - Custom styling with cm measurements

## Current Status

✅ **Complete**: Core TypeScript types and data structures
✅ **Complete**: Basic application architecture
✅ **Complete**: Development environment setup
✅ **Complete**: Basic preview functionality
🔄 **In Progress**: Visual layout builder
🔄 **In Progress**: Template selection system
🔄 **In Progress**: Section management UI

## Next Steps

1. Implement drag-and-drop layout builder
2. Build template selection interface
3. Add section editing capabilities
4. Implement manual page break insertion
5. Add PDF export functionality

## 📄 License

This project is part of a resume generator system.
