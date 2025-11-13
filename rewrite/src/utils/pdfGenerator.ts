import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (elementId: string, filename: string = 'resume.pdf'): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Get all resume pages within the element
    const pages = element.querySelectorAll('.resume-page');
    if (pages.length === 0) {
      throw new Error('No resume pages found');
    }

    // Create PDF with A4 dimensions (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      
      // Temporarily remove transform for PDF generation
      const originalTransform = page.style.transform;
      const originalTransformOrigin = page.style.transformOrigin;
      page.style.transform = 'none';
      page.style.transformOrigin = 'initial';
      
      // Capture the page as canvas with high quality
      const canvas = await html2canvas(page, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: page.scrollWidth,
        height: page.scrollHeight,
        // Ensure CSS backgrounds are rendered
        foreignObjectRendering: true,
        logging: false
      });

      // Restore original transform
      page.style.transform = originalTransform;
      page.style.transformOrigin = originalTransformOrigin;

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate dimensions to fit A4
      const canvasAspectRatio = canvas.width / canvas.height;
      const a4AspectRatio = pdfWidth / pdfHeight;
      
      let imgWidth, imgHeight;
      
      if (canvasAspectRatio > a4AspectRatio) {
        // Canvas is wider, fit by width
        imgWidth = pdfWidth;
        imgHeight = pdfWidth / canvasAspectRatio;
      } else {
        // Canvas is taller, fit by height
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * canvasAspectRatio;
      }

      // Center the image on the page
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = (pdfHeight - imgHeight) / 2;

      // Add new page if not the first page
      if (i > 0) {
        pdf.addPage();
      }

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generatePDFFromElement = async (element: HTMLElement, filename: string = 'resume.pdf'): Promise<void> => {
  try {
    // Create PDF with A4 dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm

    // Capture the entire element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      foreignObjectRendering: true
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeight / pdfHeight);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const yPosition = -(i * pdfHeight);
      pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
