import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (elementId: string, filename: string = 'resume.pdf'): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    console.log('PDF Generation - Element found:', element);
    console.log('PDF Generation - Element dimensions:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight
    });

    // Get all resume pages within the element
    const pages = element.querySelectorAll('.resume-page');
    console.log('PDF Generation - Pages found:', pages.length);
    
    if (pages.length === 0) {
      throw new Error('No resume pages found');
    }

    pages.forEach((page, index) => {
      const pageElement = page as HTMLElement;
      console.log(`PDF Generation - Page ${index + 1} dimensions:`, {
        width: pageElement.offsetWidth,
        height: pageElement.offsetHeight,
        scrollWidth: pageElement.scrollWidth,
        scrollHeight: pageElement.scrollHeight
      });
    });

    // Create PDF with A4 dimensions (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm

    // Create a temporary style to override CSS transforms during PDF generation
    let tempStyle: HTMLStyleElement | null = null;
    try {
      tempStyle = document.createElement('style');
      tempStyle.setAttribute('data-pdf-generation', 'true');
      tempStyle.textContent = `
        .resume-preview .a4-page,
        .resume-preview .resume-page {
          transform: none !important;
          scale: none !important;
          position: static !important;
          width: 21cm !important;
          height: 29.7cm !important;
        }
        .page-scale-wrapper {
          transform: none !important;
          scale: none !important;
        }
      `;
      document.head.appendChild(tempStyle);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      
      // Temporarily remove transform for PDF generation
      const originalTransform = page.style.transform;
      const originalTransformOrigin = page.style.transformOrigin;
      const originalPosition = page.style.position;
      const originalLeft = page.style.left;
      const originalTop = page.style.top;
      
      page.style.setProperty('transform', 'none', 'important');
      page.style.setProperty('transform-origin', 'initial', 'important');
      page.style.setProperty('position', 'static', 'important');
      page.style.setProperty('left', 'auto', 'important');
      page.style.setProperty('top', 'auto', 'important');
      
      console.log(`PDF Generation - Processing page ${i + 1}`);
      
      // Capture the page as canvas with high quality
      const canvas = await html2canvas(page, {
        scale: 2, // Good balance of quality and performance
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: page.offsetWidth,
        height: page.offsetHeight,
        // Disable foreign object rendering to use canvas-based rendering
        foreignObjectRendering: false,
        logging: true, // Enable logging for debugging
        // Add more rendering options
        ignoreElements: (element) => {
          // Skip any elements that might cause issues
          return element.classList?.contains('drag-placeholder') || 
                 element.classList?.contains('drop-zone') ||
                 element.tagName === 'SCRIPT';
        },
        onclone: (clonedDoc) => {
          console.log('PDF Generation - Cloning document');
          // Remove transforms and problematic styles from cloned elements
          const clonedPages = clonedDoc.querySelectorAll('.resume-page, .a4-page');
          clonedPages.forEach((clonedPage: any) => {
            clonedPage.style.transform = 'none !important';
            clonedPage.style.transformOrigin = 'initial !important';
            clonedPage.style.position = 'static !important';
            clonedPage.style.left = 'auto !important';
            clonedPage.style.top = 'auto !important';
            clonedPage.style.scale = 'none !important';
          });
          
          // Also check for CSS-applied transforms
          const resumePreview = clonedDoc.querySelector('.resume-preview');
          if (resumePreview) {
            const style = clonedDoc.createElement('style');
            style.textContent = `
              .resume-preview .a4-page {
                transform: none !important;
                scale: none !important;
                position: static !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
          
          // Ensure all text is visible
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              // Remove any transforms that might hide content
              if (el.style.transform && el.style.transform !== 'none') {
                el.style.transform = 'none';
              }
              // Ensure visibility
              if (el.style.visibility === 'hidden') {
                el.style.visibility = 'visible';
              }
              if (el.style.opacity === '0') {
                el.style.opacity = '1';
              }
            }
          });
          
          console.log('PDF Generation - Document cloning completed');
        }
      });
      
      console.log(`PDF Generation - Canvas created for page ${i + 1}:`, {
        width: canvas.width,
        height: canvas.height
      });
      
      // Debug: Check if canvas has content by creating a test image
      const testDataUrl = canvas.toDataURL('image/png');
      console.log(`PDF Generation - Canvas data URL length for page ${i + 1}:`, testDataUrl.length);
      
      // You can temporarily uncomment this to see the canvas content in browser
      // const testImg = new Image();
      // testImg.src = testDataUrl;
      // testImg.style.maxWidth = '200px';
      // testImg.style.border = '1px solid red';
      // document.body.appendChild(testImg);

      // Restore original transform
      page.style.transform = originalTransform;
      page.style.transformOrigin = originalTransformOrigin;
      page.style.position = originalPosition;
      page.style.left = originalLeft;
      page.style.top = originalTop;

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
      
    } finally {
      // Clean up temporary style
      if (tempStyle && tempStyle.parentNode) {
        tempStyle.parentNode.removeChild(tempStyle);
      }
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Clean up temporary style on error
    const tempStyleCleanup = document.querySelector('style[data-pdf-generation]');
    if (tempStyleCleanup && tempStyleCleanup.parentNode) {
      tempStyleCleanup.parentNode.removeChild(tempStyleCleanup);
    }
    
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
