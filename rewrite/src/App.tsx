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
    zoom: 0.8, // Fit A4 page on screen
  });
  const [templateLibrary] = useState<TemplateLibrary>(createDefaultTemplateLibrary());
  
  // PDF export handler
  const handlePDFExport = async () => {
    try {
      setIsExportingPDF(true);
      
      // Debug: Check if element exists
      const previewElement = document.getElementById('resume-preview');
      console.log('Preview element found:', !!previewElement);
      console.log('Resume pages found:', previewElement?.querySelectorAll('.resume-page').length || 0);
      
      await generatePDF('resume-preview', 'resume.pdf');
      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExportingPDF(false);
    }
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
