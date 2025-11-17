import './ImportConfirmationDialog.css';

interface ImportConfirmationDialogProps {
  isOpen: boolean;
  resumeInfo: {
    name: string;
    description: string;
    sections: string[];
    pages: number;
    lastModified?: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportConfirmationDialog({
  isOpen,
  resumeInfo,
  onConfirm,
  onCancel
}: ImportConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="import-dialog-overlay">
      <div className="import-dialog">
        <div className="import-dialog-header">
          <h3>Import Resume Confirmation</h3>
        </div>
        
        <div className="import-dialog-content">
          <div className="resume-preview-info">
            <div className="info-row">
              <strong>Resume Name:</strong> {resumeInfo.name}
            </div>
            <div className="info-row">
              <strong>Description:</strong> {resumeInfo.description}
            </div>
            <div className="info-row">
              <strong>Pages:</strong> {resumeInfo.pages}
            </div>
            {resumeInfo.lastModified && (
              <div className="info-row">
                <strong>Last Modified:</strong> {resumeInfo.lastModified}
              </div>
            )}
            <div className="info-row">
              <strong>Sections:</strong>
              <ul className="sections-list">
                {resumeInfo.sections.map((section, index) => (
                  <li key={index}>{section}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="warning-message">
            <p><strong>⚠️ Warning:</strong> This will replace your current resume data. Any unsaved changes will be lost.</p>
          </div>
        </div>
        
        <div className="import-dialog-actions">
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            Import Resume
          </button>
        </div>
      </div>
    </div>
  );
}
