import { useState, useEffect } from 'react';
import type { ResumeData, LayoutBuilderState, TemplateLibrary } from './types';
import { ResumeEditor } from './components/ResumeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { createDefaultTemplateLibrary } from './utils/defaults';
import { loadResumeData } from './utils/dataLoaderNew';
import { generatePDF } from './utils/pdfGenerator';
import './App.css';

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
    zoom: 0.6, // Optimized for larger preview area
  });
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

  // Export to JSON handler
  const handleExportJSON = () => {
    try {
      if (!resumeData) {
        alert('No resume data to export');
        return;
      }

      // Create export data with timestamp
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        resumeData: resumeData,
        layoutState: {
          pages: layoutState.pages,
          zoom: layoutState.zoom
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
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const importedData = JSON.parse(jsonContent);

        // Validate imported data structure
        if (!importedData.resumeData) {
          alert('Invalid JSON file: Missing resume data');
          return;
        }

        // Update resume data
        setResumeData(importedData.resumeData);
        
        // Update layout state if available
        if (importedData.layoutState) {
          setLayoutState(prev => ({
            ...prev,
            pages: importedData.layoutState.pages || prev.pages,
            zoom: importedData.layoutState.zoom || prev.zoom
          }));
        }

        console.log('JSON import completed successfully');
        alert('Resume data imported successfully!');
        
        // Clear the file input
        event.target.value = '';
      } catch (error) {
        console.error('JSON import failed:', error);
        alert(`JSON import failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      alert('Failed to read file');
      event.target.value = '';
    };

    reader.readAsText(file);
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
    <div className="app">
      <div className="app-header">
        <h1>Resume Builder</h1>
        <div className="app-actions">
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            style={{ display: 'none' }}
            id="json-import-input"
          />
          <button 
            onClick={() => document.getElementById('json-import-input')?.click()}
            className="btn btn-secondary"
            title="Import resume from JSON file"
          >
            Import JSON
          </button>
          <button 
            onClick={handleExportJSON}
            className="btn btn-secondary"
            title="Download resume as JSON file"
          >
            Export JSON
          </button>
          <button 
            onClick={handlePDFExport}
            disabled={isExportingPDF}
            className="btn btn-primary"
          >
            {isExportingPDF ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
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
          <PreviewPanel
            resumeData={resumeData}
            layoutState={layoutState}
            onZoomChange={(zoom: number) => setLayoutState(prev => ({ ...prev, zoom }))}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
