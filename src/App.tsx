import { useState, useEffect, useRef } from 'react';
import type { ResumeData, LayoutBuilderState, TemplateLibrary } from './types';
import { ResumeEditor } from './components/ResumeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { ImportConfirmationDialog } from './components/ImportConfirmationDialog';
import { createDefaultTemplateLibrary } from './utils/defaults';
import { loadResumeData } from './utils/dataLoaderNew';
import { generatePDF } from './utils/pdfGenerator';
import './App.css';

// Print-specific styles for the print preview window
const PRINT_RESUME_STYLES = `
/* Print Resume Styles - Optimized for print preview windows */

/* Print-specific overrides for print preview window */
body {
  background: white !important;
  margin: 0;
  padding: 0;
}

/* Remove the preview panel wrapper */
.preview-panel {
  width: 100% !important;
  height: 100% !important;
  overflow: visible !important;
  border: none !important;
  padding: 0 !important;
}

/* Make resume preview take full window without overriding content styles */
#resume-preview {
  zoom: 1 !important;
  transform: none !important;
  width: 100% !important;
  height: auto !important;
  overflow: visible !important;
}

/* Ensure pages stack vertically with no gaps */
.resume-page {
  margin: 0 auto !important;
  padding: 0 !important;
  box-shadow: none !important;
  border: none !important;
  display: block !important;
  width: 21cm !important;
  box-sizing: border-box !important;
}

/* Remove margins only from specific wrapper containers, not content */
.resume-preview-wrapper,
.page-scale-wrapper,
.page-wrapper,
.preview-container {
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

/* Hide any empty elements that might be causing extra pages */
.resume-page:empty {
  display: none !important;
}

/* Ensure footers don't create overflow */
.page-footer,
footer {
  position: absolute !important;
  bottom: 0 !important;
  overflow: hidden !important;
}



/* Print media queries */
@media print {
  @page {
    margin: 0;
    padding: 0;
    size: A4;
  }
  
  body { 
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .resume-page { 
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    width: 21cm !important;
  }
  
  /* Remove any gaps or spacing */
  * {
    box-sizing: border-box !important;
  }
}
`;

function App() {
  // Main application state - everything derives from these data types
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  

  
  // Debug wrapper for setResumeData 
  const handleResumeDataChange = (data: ResumeData) => {
    setResumeData(data);
  };
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [layoutState, setLayoutState] = useState<LayoutBuilderState>({
    pages: [],
    selectedSection: null,
    selectedPageBreak: null,
    draggedItem: null,
    previewMode: false,
    zoom: 0.6, // Optimized for larger preview area,
  });
  
  // Popup states
  const [showImportExportMenu, setShowImportExportMenu] = useState(false);
  const [showPreviewActions, setShowPreviewActions] = useState(false);
  
  // Import confirmation dialog state
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<{
    resumeData: ResumeData;
    layoutState?: any;
    info: {
      name: string;
      description: string;
      sections: string[];
      pages: number;
      lastModified?: string;
    };
  } | null>(null);
  
  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Close menus when clicking elsewhere
  const handleAppClick = () => {
    setShowImportExportMenu(false);
    setShowPreviewActions(false);
    setShowImportConfirmation(false);
  };
  const [templateLibrary] = useState<TemplateLibrary>(createDefaultTemplateLibrary());
  
  // PDF export handler
  const handlePDFExport = async () => {
    try {
      setIsExportingPDF(true);
      
      // Debug: Check if element exists
      const previewElement = document.getElementById('resume-preview');
      console.log('PDF Export - Preview element found:', !!previewElement);
      console.log('PDF Export - Resume pages found:', previewElement?.querySelectorAll('.resume-page').length || 0);
      console.log('PDF Export - Resume data pages:', resumeData?.layout?.pages?.length || 0);
      
      if (!previewElement) {
        throw new Error('Resume preview element not found in DOM');
      }
      
      const pages = previewElement.querySelectorAll('.resume-page');
      if (pages.length === 0) {
        throw new Error('No resume pages found in preview - layout may not be rendered yet');
      }
      
      await generatePDF('resume-preview', 'resume.pdf');
      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print Preview handler - opens resume in new window for printing
  const handlePrintPreview = () => {
    if (!resumeData) {
      alert('No resume data to preview');
      return;
    }

    // Create a new window for print preview
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }

    // Get the current preview element
    const previewElement = document.getElementById('resume-preview');
    if (!previewElement) {
      alert('Resume preview not found');
      return;
    }

    // Get all stylesheets from the current document
    const stylesheets = Array.from(document.styleSheets);
    let cssRules = '';
    
    stylesheets.forEach(stylesheet => {
      try {
        const rules = Array.from(stylesheet.cssRules || []);
        rules.forEach(rule => {
          cssRules += rule.cssText + '\n';
        });
      } catch (e) {
        // Cross-origin stylesheets might not be accessible
        console.warn('Could not access stylesheet:', e);
      }
    });

    // Create the print preview HTML - just copy the existing preview but optimize for printing
    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume - Print Preview</title>
          <meta charset="utf-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Nunito+Sans:wght@300;400;600;700&family=Work+Sans:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&family=Source+Serif+Pro:wght@300;400;600;700&family=Crimson+Text:wght@400;600;700&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">
          <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
          
          <style>
            ${cssRules}
            
            ${PRINT_RESUME_STYLES}
          </style>
        </head>
        <body>
          <div class="preview-panel">
            ${previewElement.outerHTML}
          </div>
          <script>
            // Auto-focus the window
            window.focus();
            // Uncomment the next line if you want to automatically open print dialog
            // setTimeout(() => window.print(), 1000);
          </script>
        </body>
      </html>
    `;

    // Write the HTML to the new window
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  // Export to JSON handler
  const handleExportJSON = () => {
    try {
      if (!resumeData) {
        alert('No resume data to export');
        return;
      }

      // Create export data with timestamp - use current layout from resumeData
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        resumeData: {
          ...resumeData,
          layout: {
            ...resumeData.layout,
            // Ensure layout includes current state
            pages: resumeData.layout?.pages || layoutState.pages
          }
        }
      };

      // Create blob and download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(url);
      
      console.log('JSON export completed successfully');
    } catch (error) {
      console.error('JSON export failed:', error);
      alert(`JSON export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Import from JSON handler
  // Helper function to extract resume info for confirmation dialog
  const extractResumeInfo = (resumeData: ResumeData, exportDate?: string) => {
    return {
      name: resumeData.name || resumeData.personalInfo?.fullName || 'Untitled Resume',
      description: resumeData.metadata?.description || 'Imported resume data',
      sections: resumeData.sections?.map(s => s.title) || [],
      pages: resumeData.layout?.pages?.length || 1,
      lastModified: exportDate || resumeData.metadata?.updatedAt || undefined
    };
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Import started - file selected');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('File read completed');
      try {
        const jsonContent = e.target?.result as string;
        console.log('JSON content length:', jsonContent.length);
        const importedData = JSON.parse(jsonContent);
        console.log('JSON parsed successfully, keys:', Object.keys(importedData));

        // Validate imported data structure - handle multiple formats
        let resumeDataToImport: ResumeData;
        let layoutStateToImport;
        
        if (importedData.resumeData && importedData.layoutState) {
          // Standard export format - this is what we should use
          console.log('Importing standard export format');
          resumeDataToImport = importedData.resumeData;
          layoutStateToImport = importedData.layoutState;
        } else if (importedData.resumeData) {
          // Has resumeData but no layoutState 
          console.log('Importing resumeData without layoutState');
          resumeDataToImport = importedData.resumeData;
          layoutStateToImport = null;
        } else if (importedData.personalInfo || importedData.sections || importedData.name) {
          // Direct resume data format - legacy support
          
          // Ensure required properties exist for dawson-hybrid format
          resumeDataToImport = {
            id: importedData.id || `imported-${Date.now()}`,
            name: importedData.name || importedData.personalInfo?.fullName || 'Imported Resume',
            personalInfo: importedData.personalInfo || {},
            sections: (importedData.sections || []).map((section: any) => ({
              ...section,
              isVisible: section.isVisible !== undefined ? section.isVisible : true,
              items: section.items || []
            })),
            layout: importedData.layout ? {
              ...importedData.layout,
              pages: (importedData.layout.pages || []).map((page: any) => ({
                ...page,
                rows: (page.rows || []).map((row: any) => ({
                  ...row,
                  // Convert string section references to SectionReference objects
                  ...(row.sections ? {
                    sections: row.sections.map((sectionId: string) => ({
                      sectionId,
                      instanceId: `instance-${sectionId}-${Date.now()}`
                    }))
                  } : {}),
                  ...(row.columns ? {
                    columns: row.columns.map((column: any) => ({
                      ...column,
                      sections: (column.sections || []).map((sectionId: string) => ({
                        sectionId,
                        instanceId: `instance-${sectionId}-${Date.now()}`
                      }))
                    }))
                  } : {})
                }))
              }))
            } : { pages: [] },
            sectionTemplates: importedData.sectionTemplates || {},
            metadata: importedData.metadata || {
              version: '1.0.0',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              author: 'Imported Resume',
              description: 'Imported resume data'
            }
          };
          layoutStateToImport = null;
        } else {
          // Try to detect if this might be a resume with different structure
          const hasResumeFields = Object.keys(importedData).some(key => 
            ['id', 'personalInfo', 'sections', 'layout', 'metadata', 'name'].includes(key)
          );
          
          if (hasResumeFields) {
            // Assume it's a direct resume format
            resumeDataToImport = importedData;
            layoutStateToImport = null;
          } else {
            alert('Invalid JSON file: Missing resume data structure. Expected resume data with properties like personalInfo, sections, or layout.');
            event.target.value = '';
            return;
          }
        }

        // Debug logging
        console.log('Import process - resumeDataToImport:', resumeDataToImport);
        console.log('Import process - original importedData keys:', Object.keys(importedData));
        
        // Extract resume info for confirmation dialog
        const resumeInfo = extractResumeInfo(resumeDataToImport, importedData.exportDate);

        // Set pending import data and show confirmation dialog
        setPendingImportData({
          resumeData: resumeDataToImport,
          layoutState: layoutStateToImport,
          info: resumeInfo
        });
        setShowImportConfirmation(true);
        
        // Clear the file input
        event.target.value = '';
      } catch (error) {
        console.error('JSON import failed at some point:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        alert(`JSON import failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
        event.target.value = '';
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert('Failed to read file');
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  // Handle confirmed import
  const handleConfirmImport = () => {
    if (!pendingImportData) return;

    const { resumeData: resumeDataToImport, layoutState: layoutStateToImport } = pendingImportData;

    console.log('=== CONFIRMING IMPORT ===');
    console.log('Resume data:', resumeDataToImport);
    console.log('Layout state:', layoutStateToImport);

    // Ensure layout is in resumeData.layout (not separate layoutState)
    const finalResumeData = {
      ...resumeDataToImport,
      layout: layoutStateToImport && layoutStateToImport.pages ? {
        pages: layoutStateToImport.pages,
        sectionInstances: resumeDataToImport.layout?.sectionInstances || [],
        globalStyles: resumeDataToImport.layout?.globalStyles || {
          fontSizes: { h1: "1.2cm", h2: "0.5cm", h3: "0.4cm", body: "0.35cm", small: "0.3cm" },
          fontFamily: "Arial, sans-serif",
          colorScheme: { primary: "#2c5aa0", secondary: "#333333", text: "#333333", accent: "#666666" },
          spacing: { sectionMargin: "0.5cm", itemMargin: "0.3cm", pageMargin: "1.27cm" }
        }
      } : resumeDataToImport.layout
    };

    console.log('Final resume data with layout:', finalResumeData);

    // Update resume data
    setResumeData(finalResumeData);
    
    // Update layout state if available
    if (layoutStateToImport && layoutStateToImport.pages) {
      console.log('=== SETTING LAYOUT STATE ===');
      console.log('Layout pages:', layoutStateToImport.pages);
      console.log('First page rows:', layoutStateToImport.pages[0]?.rows);
      console.log('Page structure:', JSON.stringify(layoutStateToImport.pages[0], null, 2));
      
      setLayoutState(prev => ({
        ...prev,
        pages: layoutStateToImport.pages,
        zoom: layoutStateToImport.zoom || prev.zoom,
        selectedSection: null,
        selectedPageBreak: null,
        draggedItem: null,
        previewMode: false
      }));
    } else {
      console.log('No layout state to import');
    }

    console.log('JSON import completed successfully');
    
    // Reset confirmation dialog
    setShowImportConfirmation(false);
    setPendingImportData(null);
    setShowImportExportMenu(false);
  };

  // Handle cancelled import
  const handleCancelImport = () => {
    setShowImportConfirmation(false);
    setPendingImportData(null);
  };
  
  // Load resume data on mount
  useEffect(() => {
    loadResumeData()
      .then(data => {
        setResumeData(data);
        setLoadError(null);
      })
      .catch(error => {
        setLoadError(error.message || 'Failed to load resume data');
        console.error('Resume data loading failed:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Show loading or error states
  if (isLoading) {
    return (
      <div className="app">
        <div className="app-header">
          <h1>Resume Builder</h1>
        </div>
        <div className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading resume data...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app">
        <div className="app-header">
          <h1>Resume Builder</h1>
        </div>
        <div className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
            <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Failed to Load Resume Data</h2>
            <p style={{ marginBottom: '1rem', color: '#ef4444' }}>{loadError}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#2c5aa0', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="app">
        <div className="app-header">
          <h1>Resume Builder</h1>
        </div>
        <div className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>No resume data available</div>
        </div>
      </div>
    );
  }

  // Split screen: Editor on left, Preview on right
  return (
    <div className="app" onClick={handleAppClick}>
      {/* Hidden file input for JSON import - placed at top level so it doesn't get unmounted */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(e) => {
          console.log('=== FILE INPUT onChange FIRED ===');
          console.log('Event target:', e.target);
          console.log('Files:', e.target.files);
          console.log('File count:', e.target.files?.length || 0);
          
          if (e.target.files && e.target.files.length > 0) {
            console.log('File selected:', e.target.files[0].name);
            handleImportJSON(e);
          } else {
            console.log('No files selected');
          }
        }}
        style={{ display: 'none' }}
      />
      
      {/* Top Left Menu */}
      <div className="top-left-menu">
        <button 
          className="menu-button"
          onClick={(e) => {
            e.stopPropagation();
            setShowImportExportMenu(!showImportExportMenu);
          }}
          title="Import/Export Menu"
        >
          ☰
        </button>
        {showImportExportMenu && (
          <div className="dropdown-menu import-export-menu" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => {
                console.log('=== IMPORT BUTTON CLICKED ===');
                console.log('File input ref exists:', !!fileInputRef.current);
                console.log('Triggering file input click...');
                fileInputRef.current?.click();
                setShowImportExportMenu(false);
              }}
              className="menu-item"
            >
              Import JSON
            </button>
            <button 
              onClick={() => {
                handleExportJSON();
                setShowImportExportMenu(false);
              }}
              className="menu-item"
            >
              Export JSON
            </button>
          </div>
        )}
      </div>

      <div className="app-main">
        {/* Left Panel: Resume Editor */}
        <div className="editor-panel">
          <ResumeEditor
            resumeData={resumeData}
            layoutState={layoutState}
            templateLibrary={templateLibrary}
            onResumeDataChange={handleResumeDataChange}
            onLayoutStateChange={setLayoutState}
          />
        </div>
        
        {/* Right Panel: Live Preview */}
        <div className="preview-panel">
          {/* Top Right Preview Actions */}
          <div className="top-right-actions">
            <button 
              className="preview-actions-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreviewActions(!showPreviewActions);
              }}
              title="Preview Actions"
            >
              ⋮
            </button>
            {showPreviewActions && (
              <div className="dropdown-menu preview-actions-menu" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    handlePrintPreview();
                    setShowPreviewActions(false);
                  }}
                  className="menu-item"
                >
                  Print Preview
                </button>
                <button 
                  onClick={() => {
                    handlePDFExport();
                    setShowPreviewActions(false);
                  }}
                  disabled={isExportingPDF}
                  className="menu-item"
                >
                  {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
                </button>
              </div>
            )}
          </div>
          
          <PreviewPanel
            resumeData={resumeData}
            layoutState={layoutState}
            onZoomChange={(zoom: number) => setLayoutState(prev => ({ ...prev, zoom }))}
          />
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      <ImportConfirmationDialog
        isOpen={showImportConfirmation}
        resumeInfo={pendingImportData?.info || {
          name: '',
          description: '',
          sections: [],
          pages: 0
        }}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />
    </div>
  );
}

export default App;
