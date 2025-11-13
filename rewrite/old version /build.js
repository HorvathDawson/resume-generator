// Node.js modules for file system (fs) and path manipulation.
const fs = require('fs');
const path = require('path');
// Handlebars templating engine.
const Handlebars = require('handlebars');
// Require the sass module for SCSS compilation.
const sass = require('sass');

// --- CONFIGURATION ---

// Get the JSON filename from the command-line arguments.
const resumeJsonFile = process.argv[2];

const filename = resumeJsonFile ? path.basename(resumeJsonFile, path.extname(resumeJsonFile)) : 'resume';

// Safety check: Exit if no filename is provided.
if (!resumeJsonFile) {
  console.error('❌ Error: Please provide the path to your resume JSON file.');
  console.log('Usage: node build.js <your-resume-file>.json');
  process.exit(1); // Exit with an error code.
}

// Resolve dataPath: if the caller passed an absolute path, use it directly;
// otherwise treat it as relative to the project directory.
const dataPath = path.isAbsolute(resumeJsonFile) ? resumeJsonFile : path.join(__dirname, resumeJsonFile);

// Check if the resolved resume JSON file exists.
if (!fs.existsSync(dataPath)) {
  console.error(`❌ Error: File "${dataPath}" does not exist.`);
  process.exit(1);
}
const templatesDir = path.join(__dirname, 'templates');
const scssPath = path.join(__dirname, 'scss', 'main.scss'); // Input: Your main SCSS file.
const cssOutputPath = path.join(__dirname, `${filename}.css`);     // Output: The compiled CSS file.
const htmlOutputPath = path.join(__dirname, `${filename}.html`);   // Output: The final HTML file.


/**
 * Main function to generate the resume.
 * It reads data, compiles templates, and assembles the final HTML.
 */
async function buildResume() {
  try {
    // --- STEP 1: READ DATA FIRST ---
    // Load the entire resume content to access metadata for SCSS compilation
    const resumeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // --- STEP 2: COMPILE SCSS to CSS ---
    // Compile the SCSS file and write the output to style.css.
    console.log('🎨 Compiling SCSS...');
    
    // Extract page margins from metadata, with defaults
    const pageMargins = resumeData.pageMargins || '1.27cm';
    
    // Extract color scheme from metadata, with defaults
    const colors = resumeData.colors || {};
    const rightColumnColor = colors.rightColumnColor || 'white';
    const rightTextColor = colors.rightTextColor || '#272829';
    const leftColumnColor = colors.leftColumnColor || 'white';
    const leftTextColor = colors.leftTextColor || '#272829';
    const highlightColor = colors.highlightColor || '#5B3B8C';
    
    // Create custom SCSS variables for margins and colors
    const customScss = `
$page-margin: ${pageMargins};
$right-column-color: ${rightColumnColor};
$right-text-color: ${rightTextColor};
$left-column-color: ${leftColumnColor};
$left-text-color: ${leftTextColor};
$highlight-color: ${highlightColor};

@import "${scssPath.replace(/\\/g, '/')}";
`;
    
    const sassResult = await sass.compileStringAsync(customScss, {
      loadPaths: [path.dirname(scssPath)]
    });
    fs.writeFileSync(cssOutputPath, sassResult.css);
    console.log('✅ SCSS compiled successfully.');

    // --- STEP 3: EXTRACT LAYOUT CONFIG ---
    // Get the page layout configuration from the "layout" key in the JSON data.
    const pageConfig = resumeData.layout;

    // Safety check: Ensure the layout configuration exists and is valid.
    if (!pageConfig || !Array.isArray(pageConfig)) {
      throw new Error('Error: "layout" configuration is missing or not an array in resume.json.');
    }

    // --- STEP 4: COMPILE TEMPLATES ---
    // Find all .hbs files, compile them, and register them as "partials"
    // so they can be reused within other templates (e.g., using {{> footer}}).
    const compiledPartials = {};
    const partialFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));

    partialFiles.forEach(file => {
      const partialName = path.basename(file, '.hbs'); // e.g., "work_experience"
      const partialContent = fs.readFileSync(path.join(templatesDir, file), 'utf8');
      compiledPartials[partialName] = Handlebars.compile(partialContent);
      Handlebars.registerPartial(partialName, partialContent);
    });

    // --- FOOTER SELECTION SYSTEM ---
    // Helper function to get the appropriate footer template based on footerType in JSON
    // Available footer types:
    // - 'default': Original footer with geometric shapes
    // - 'modern': Clean footer with line, text, and gradient
    // - 'minimal': Simple footer with just a dot
    // - 'mountains': Mountain silhouette footer with triangular shapes
    // - 'mountains-random': Mountain silhouette with randomly placed mountains (seeded by page number)
    // - 'mountains-random:seed': Mountain silhouette with custom seed (e.g., 'mountains-random:12345')
    // - 'none': No footer (just closes body/html tags)
    const getFooterTemplate = () => {
      const footerType = resumeData.footerType || 'default';
      
      // Parse mountains-random with optional seed
      if (footerType.startsWith('mountains-random')) {
        const parts = footerType.split(':');
        const seed = parts.length > 1 ? parts[1] : null;
        
        // Return a function that passes the seed to the template
        return (data) => {
          const templateData = { ...data, customSeed: seed };
          return (compiledPartials['footer-mountains-random'] || compiledPartials.footer)(templateData);
        };
      }
      
      switch (footerType) {
        case 'modern':
          return compiledPartials['footer-modern'] || compiledPartials.footer;
        case 'minimal':
          return compiledPartials['footer-minimal'] || compiledPartials.footer;
        case 'mountains':
          return compiledPartials['footer-mountains'] || compiledPartials.footer;
        case 'fish':
          return compiledPartials['footer-fish'] || compiledPartials.footer;
        case 'none':
          return compiledPartials['footer-none'] || (() => '</body>\n</html>');
        case 'default':
        default:
          return compiledPartials.footer;
      }
    };

    // --- STEP 4: REGISTER HELPERS ---
    // Custom functions that can be used inside Handlebars templates.

    // {{#if (eq var1 var2)}} ... {{/if}}
    Handlebars.registerHelper('eq', (a, b) => a === b);

    // {{getHandle "https://github.com/user"}} -> "user"
    Handlebars.registerHelper('getHandle', function (url) {
      if (typeof url !== 'string' || !url) return '';
      return url.replace(/\/$/, '').split('.com').pop();
    });

    // Optimize tag ordering for maximum width utilization
    const optimizeTagOrder = (tags) => {
      if (!Array.isArray(tags) || tags.length <= 1) return tags;
      
      // Create tag objects with length information
      const tagObjects = tags.map(tag => ({
        text: tag,
        length: tag.length
      }));
      
      // Sort by length (shorter first for better packing)
      tagObjects.sort((a, b) => a.length - b.length);
      
      // Simple bin packing algorithm to arrange tags optimally
      const lines = [];
      const maxLineLength = 50; // Approximate character limit per line
      
      tagObjects.forEach(tagObj => {
        let placed = false;
        
        // Try to fit into existing lines
        for (let line of lines) {
          const currentLength = line.reduce((sum, t) => sum + t.length + 2, 0); // +2 for spacing
          if (currentLength + tagObj.length <= maxLineLength) {
            line.push(tagObj);
            placed = true;
            break;
          }
        }
        
        // If it doesn't fit anywhere, create a new line
        if (!placed) {
          lines.push([tagObj]);
        }
      });
      
      // Flatten lines back to tag array, maintaining the optimized order
      return lines.flat().map(tagObj => tagObj.text);
    };

    // Generate HTML for a single section (for measurement purposes)
    const generateSectionHtml = (sectionData, templateVariant = '') => {
      if (!sectionData) return '';
      
      // Handle special cases
      if (sectionData.title === 'personal_info') {
        let templateName = 'personal_info';
        if (templateVariant) {
          templateName = 'personal_info_' + templateVariant;
        }
        
        if (compiledPartials[templateName]) {
          return compiledPartials[templateName](resumeData.personal_info);
        } else {
          return '';
        }
      }
      
      if (sectionData.title === 'name') {
        return compiledPartials['name'] ? compiledPartials['name'](resumeData) : '';
      }
      
      // For standard sections
      let partialName = toPartialName(sectionData.title);
      if (templateVariant) {
        partialName = toPartialName(sectionData.title) + '_' + templateVariant;
      }
      
      if (sectionData && compiledPartials[partialName]) {
        // Special processing for Skills section to optimize tag order
        let processedSectionData = sectionData;
        if (sectionData.title === 'Skills' && sectionData.items) {
          processedSectionData = {
            ...sectionData,
            items: sectionData.items.map(item => ({
              ...item,
              tags: item.tags ? optimizeTagOrder(item.tags) : item.tags
            }))
          };
        }
        
        return compiledPartials[partialName](processedSectionData);
      }
      
      return '';
    };

    // --- INDIVIDUAL CHUNK MEASUREMENT SYSTEM ---
    // Measures individual content chunks by rendering them in browser
    // This provides accurate measurements for asymmetric content where items vary in size
    // Used for section splitting when proportional calculation isn't accurate enough
    const measureChunk = async (chunk, chunkTitle, templateVariant) => {
      const puppeteer = require('puppeteer');
      
      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Set page size to A4
        await page.setViewport({ width: 794, height: 1123 });
        
        // Get the CSS content
        const cssContent = fs.readFileSync(cssOutputPath, 'utf8');
        
        // Generate HTML for the chunk
        const chunkHtml = generateSectionHtml(chunk, templateVariant);
        
        // Create measurement HTML
        const measurementHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              ${cssContent}
              body { margin: 0; padding: 0; }
              .measurement-container { 
                width: 21cm; 
                margin: 0; 
                padding: 1cm; 
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="measurement-container">
              <div class="cv-body">
                ${chunkHtml}
              </div>
            </div>
          </body>
          </html>
        `;
        
        await page.setContent(measurementHtml);
        
        // Measure the chunk height
        const result = await page.evaluate(() => {
          const section = document.querySelector('.cv-body > section, .cv-body > div');
          if (section) {
            const rect = section.getBoundingClientRect();
            return { height: rect.height };
          }
          return { height: 0 };
        });
        
        await browser.close();
        
        // Convert pixels to cm (1cm = 37.795 pixels at 96 DPI)
        const heightInCm = Math.round((result.height / 37.795) * 10) / 10;
        
        return heightInCm;
        
      } catch (error) {
        console.error(`❌ Failed to measure chunk ${chunkTitle}:`, error.message);
        throw new Error(`Could not measure chunk ${chunkTitle}: ${error.message}`);
      }
    };

    // --- BROWSER-BASED MEASUREMENT SYSTEM ---
    // Measures column sections together for proper layout context using Puppeteer
    // This ensures accurate measurements by rendering both columns in the same layout
    // as they would appear in the final document (vs measuring individually)
    const measureColumnSections = async (leftSections, rightSections) => {
      const puppeteer = require('puppeteer');
      
      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Set page size to A4
        await page.setViewport({ width: 794, height: 1123 });
        
        // Get the CSS content
        const cssContent = fs.readFileSync(cssOutputPath, 'utf8');
        
        // Generate HTML for both columns together
        const leftColumnHtml = (leftSections || []).map(title => {
          let sectionData = null;
          let templateVariant = '';
          let sectionTitle = title;
          
          if (title.includes(':')) {
            [sectionTitle, templateVariant] = title.split(':');
            if (sectionTitle === 'personal_info') {
              sectionData = { title: 'personal_info' };
            } else {
              sectionData = getSection(sectionTitle);
            }
          } else if (title === 'name') {
            sectionData = { title: 'name' };
          } else if (title === 'personal_info') {
            sectionData = { title: 'personal_info' };
          } else {
            sectionData = getSection(title);
          }
          
          if (sectionData) {
            const sectionHtml = generateSectionHtml(sectionData, templateVariant);
            return `<div data-section="${title}">${sectionHtml}</div>`;
          }
          return '';
        }).join('');
        
        const rightColumnHtml = (rightSections || []).map(title => {
          let sectionData = null;
          let templateVariant = '';
          let sectionTitle = title;
          
          if (title.includes(':')) {
            [sectionTitle, templateVariant] = title.split(':');
            if (sectionTitle === 'personal_info') {
              sectionData = { title: 'personal_info' };
            } else {
              sectionData = getSection(sectionTitle);
            }
          } else if (title === 'name') {
            sectionData = { title: 'name' };
          } else if (title === 'personal_info') {
            sectionData = { title: 'personal_info' };
          } else {
            sectionData = getSection(title);
          }
          
          if (sectionData) {
            const sectionHtml = generateSectionHtml(sectionData, templateVariant);
            return `<div data-section="${title}">${sectionHtml}</div>`;
          }
          return '';
        }).join('');
        
        // Create HTML with proper column layout
        const measurementHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              ${cssContent}
              body { margin: 0; padding: 0; }
              .measurement-container { 
                width: 21cm; 
                margin: 0; 
                padding: 1cm; 
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            <div class="measurement-container">
              <div class="cv-body columns">
                <div class="left-column">
                  ${leftColumnHtml}
                </div>
                <div class="right-column">
                  ${rightColumnHtml}
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        
        // Load the HTML and measure both columns
        await page.setContent(measurementHtml, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        const measurements = await page.evaluate((leftTitles, rightTitles) => {
          const pixelToCm = 1 / 37.795; // Standard pixel to cm conversion
          const results = { left: [], right: [] };
          const debugInfo = [];
          
          (leftTitles || []).forEach(title => {
            const container = document.querySelector(`[data-section="${title}"]`);
            if (container) {
              const rect = container.getBoundingClientRect();
              const heightCm = Math.max(rect.height * pixelToCm, 0.5);
              
              debugInfo.push(`Section ${title}: ${rect.height.toFixed(1)}px height, ${rect.width.toFixed(1)}px width = ${heightCm.toFixed(2)}cm height`);
              results.left.push(Math.round(heightCm * 10) / 10);
            } else {
              throw new Error(`Left column section "${title}" not found in DOM`);
            }
          });
          
          (rightTitles || []).forEach(title => {
            const container = document.querySelector(`[data-section="${title}"]`);
            if (container) {
              const rect = container.getBoundingClientRect();
              const heightCm = Math.max(rect.height * pixelToCm, 0.5);
              
              debugInfo.push(`Section ${title}: ${rect.height.toFixed(1)}px height, ${rect.width.toFixed(1)}px width = ${heightCm.toFixed(2)}cm height`);
              results.right.push(Math.round(heightCm * 10) / 10);
            } else {
              throw new Error(`Right column section "${title}" not found in DOM`);
            }
          });
          
          return { measurements: results, debug: debugInfo };
        }, leftSections || [], rightSections || []);
        
        await browser.close();
        
        // Print debug info from browser
        measurements.debug.forEach(msg => console.log('🔍', msg));
        
        // Log measurements with section names
        (leftSections || []).forEach((title, index) => {
          console.log(`📏 Left column section ${title}: ${measurements.measurements.left[index]}cm`);
        });
        (rightSections || []).forEach((title, index) => {
          console.log(`📏 Right column section ${title}: ${measurements.measurements.right[index]}cm`);
        });
        
        return measurements.measurements;
      } catch (error) {
        console.warn('⚠️  Could not measure column heights with browser, falling back to estimates:', error.message);
        return { left: [], right: [] };
      }
    };

    // Measure actual section heights by rendering them all together
    const measureSectionHeights = async (sectionTitles, pageLayout) => {
      const puppeteer = require('puppeteer');
      
      try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Set page size to A4
        await page.setViewport({ width: 794, height: 1123 });
        
        // Get the CSS content
        const cssContent = fs.readFileSync(cssOutputPath, 'utf8');
        
        const measurements = {};
        
        // Measure each section individually to avoid layout interference
        for (const title of sectionTitles) {
          let sectionData = null;
          let templateVariant = '';
          let sectionTitle = title;
          
          if (title.includes(':')) {
            [sectionTitle, templateVariant] = title.split(':');
            if (sectionTitle === 'personal_info') {
              sectionData = { title: 'personal_info' };
            } else {
              sectionData = getSection(sectionTitle);
            }
          } else if (title === 'name') {
            sectionData = { title: 'name' };
          } else if (title === 'personal_info') {
            sectionData = { title: 'personal_info' };
          } else {
            sectionData = getSection(title);
          }
          
          if (!sectionData) {
            throw new Error(`Section data not found for title: "${title}"`);
          }
          
          const sectionHtml = generateSectionHtml(sectionData, templateVariant);
          
          // Determine correct column type and width
          let columnClass = 'whole-page-column';
          let containerWidth = '21cm'; // A4 width in cm
          let cvBodyClass = 'whole-page';
          
          if (pageLayout.left && pageLayout.left.includes(title)) {
            columnClass = 'left-column';
            containerWidth = '21cm'; // Use full width so column percentages work correctly
            cvBodyClass = 'columns';
          } else if (pageLayout.right && pageLayout.right.includes(title)) {
            columnClass = 'right-column';  
            containerWidth = '21cm'; // Use full width so column percentages work correctly
            cvBodyClass = 'columns';
          }
          
          // Create HTML for this specific section
          let measurementBody;
          if (cvBodyClass === 'columns') {
            // For column sections, create proper column structure
            if (columnClass === 'left-column') {
              measurementBody = `
                <div class="cv-body ${cvBodyClass}">
                  <div class="left-column">
                    <div data-section="${title}">${sectionHtml}</div>
                  </div>
                  <div class="right-column"></div>
                </div>
              `;
            } else {
              measurementBody = `
                <div class="cv-body ${cvBodyClass}">
                  <div class="left-column"></div>
                  <div class="right-column">
                    <div data-section="${title}">${sectionHtml}</div>
                  </div>
                </div>
              `;
            }
          } else {
            // For whole-page sections
            measurementBody = `
              <div class="cv-body ${cvBodyClass}">
                <div class="${columnClass}">
                  <div data-section="${title}">${sectionHtml}</div>
                </div>
              </div>
            `;
          }
          
          const measurementHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                ${cssContent}
                body { margin: 0; padding: 0; }
                .measurement-container { 
                  width: ${containerWidth}; 
                  margin: 0; 
                  padding: 1cm; 
                  box-sizing: border-box;
                }
              </style>
            </head>
            <body>
              <div class="measurement-container">
                ${measurementBody}
              </div>
            </body>
            </html>
          `;
          
          // Load the HTML and measure this section
          await page.setContent(measurementHtml, { waitUntil: 'domcontentloaded', timeout: 10000 });
          
          const result = await page.evaluate((sectionTitle) => {
            const pixelToCm = 1 / 37.795; // Standard pixel to cm conversion
            const container = document.querySelector(`[data-section="${sectionTitle}"]`);
            if (container) {
              const rect = container.getBoundingClientRect();
              const heightCm = Math.max(rect.height * pixelToCm, 0.5);
              return { height: heightCm };
            }
            throw new Error(`Section element not found for: ${sectionTitle}`);
          }, title);
          
          measurements[title] = Math.round(result.height * 10) / 10;
        }
        
        await browser.close();
        
        // Log measurements
        Object.entries(measurements).forEach(([title, height]) => {
          console.log(`📏 Measured ${title}: ${height}cm`);
        });
        
        return measurements;
      } catch (error) {
        console.warn('⚠️  Could not measure heights with browser, falling back to estimates:', error.message);
        return null;
      }
    };

    // --- INTELLIGENT PAGE SPLITTING SYSTEM ---
    // Automatically splits sections across pages based on actual browser measurements
    // Features:
    // - Individual chunk measurement for asymmetric content  
    // - Proper section splitting logic (only complex sections with multiple items)
    // - Pure measurement-based approach - throws errors when measurements fail
    // - Footer margin support - reduces effective page height to prevent overlap
    const splitSectionsWithMeasurements = async (sectionTitles, pageLayout) => {
      console.log('📐 Measuring section heights...');
      console.log('🔄 Starting splitSectionsWithMeasurements function');
      const measurements = await measureSectionHeights(sectionTitles, pageLayout);
      
      if (!measurements) {
        throw new Error('Failed to measure section heights - no fallback available');
      }
      
      console.log('📊 Using measured heights for page layout');
      
      // Calculate effective page height with conservative margin for whole page sections
      // Base: 29.7cm (A4) - 1cm top margin - 1cm bottom margin - 4.25cm footer = 23.45cm
      // Conservative reduction: -1.45cm safety margin for section spacing, measurement inaccuracies, and padding
      // This prevents overflow that occurs when measurements don't account for all CSS spacing
      let maxPageHeight = 22.0; // Conservative height to prevent page overflow
      const footerMargin = pageLayout.footerMargin || resumeData.footerMargin;
      if (footerMargin) {
        const footerMarginValue = parseFloat(footerMargin.replace('cm', ''));
        maxPageHeight -= footerMarginValue;
        console.log(`📏 Footer margin: ${footerMarginValue}cm, Effective page height: ${maxPageHeight}cm`);
      } else {
        console.log(`📏 Using conservative page height: ${maxPageHeight}cm (23.45cm base - 1.45cm safety margin for section spacing)`);
      }
      const pages = [];
      let currentPage = [];
      let currentHeight = 0;
      
      // Add padding height if specified
      const paddingHeight = pageLayout.padding ? parseFloat(pageLayout.padding.replace('cm', '')) : 0;
      currentHeight += paddingHeight;
      
      // Account for column content on the first page with actual measurements
      let hasColumnContent = pageLayout.left || pageLayout.right;
      let columnHeight = 0;
      if (hasColumnContent && currentPage.length === 0) {
        let leftColumnHeight = 0;
        let rightColumnHeight = 0;
        
        // Measure both columns together for proper layout context
        const columnMeasurements = await measureColumnSections(pageLayout.left, pageLayout.right);
        leftColumnHeight = columnMeasurements.left.reduce((sum, height) => sum + height, 0);
        rightColumnHeight = columnMeasurements.right.reduce((sum, height) => sum + height, 0);
        
        // Use the height of the taller column as this determines space consumed on page
        columnHeight = Math.max(leftColumnHeight, rightColumnHeight);
        currentHeight += columnHeight; // Subtract column space from available whole page space
        
        console.log(`📏 Left column: ${leftColumnHeight}cm, Right column: ${rightColumnHeight}cm`);
        console.log(`📏 Column space used: ${columnHeight}cm, Remaining space for whole page: ${maxPageHeight - currentHeight}cm`);
        console.log(`📏 Note: Using auto-break mode - sections will be placed individually`);
      }

      for (let i = 0; i < sectionTitles.length; i++) {
        const title = sectionTitles[i];
        const sectionHeight = measurements[title];
        if (!sectionHeight) {
          throw new Error(`No measurement available for section "${title}". All sections must be measured.`);
        }
        let remainingHeight = maxPageHeight - currentHeight;
        
        console.log(`📏 ${title}: ${sectionHeight}cm (remaining: ${remainingHeight}cm)`);
        
        if (sectionHeight > remainingHeight && currentPage.length > 0) {
          // Section won't fit, check if we should split it
          let sectionTitle = title;
          if (title.includes(':')) {
            [sectionTitle] = title.split(':');
          }
          const sectionData = getSection(sectionTitle);
          
          console.log(`🔍 Checking if ${title} should be split: ${sectionData ? sectionData.items?.length : 'no'} items`);
          
          // Only split complex sections with multiple items
          if (sectionData && sectionData.items && Array.isArray(sectionData.items) && 
              sectionData.items.length >= 2 && 
              sectionData.items.some(item => item.details && Array.isArray(item.details))) {
            
            console.log(`✂️  Splitting ${title} (${sectionData.items.length} items)`);
            const effectivePageHeight = maxPageHeight; // Footer margin already accounted for in maxPageHeight
            const sectionChunks = await splitSectionForPages(sectionData, title.includes(':') ? title.split(':')[1] : '', remainingHeight, effectivePageHeight);
            
            for (let chunkIndex = 0; chunkIndex < sectionChunks.length; chunkIndex++) {
              const chunk = sectionChunks[chunkIndex];
              const chunkTitle = chunkIndex === 0 ? title : `${title}__continuation_${chunkIndex}`;
              
              // Chunks are already intelligently split and measured, just measure final height for placement
              const chunkHeight = await measureChunk(chunk, chunkTitle, title.includes(':') ? title.split(':')[1] : '');
              console.log(`📏 Placing pre-split ${chunkTitle}: ${chunkHeight}cm`);
              
              // Check if chunk actually fits in remaining space  
              if (chunkHeight <= remainingHeight) {
                currentPage.push({ title: chunkTitle, data: chunk, templateVariant: title.includes(':') ? title.split(':')[1] : '' });
                currentHeight += chunkHeight;
                remainingHeight = maxPageHeight - currentHeight; // Update remaining space
                console.log(`📄 Added ${chunkTitle} chunk to current page (${chunkHeight}cm, ${remainingHeight}cm remaining)`);
              } else {
                if (currentPage.length > 0) {
                  pages.push([...currentPage]);
                  console.log(`📄 Completed page with ${currentPage.length} sections`);
                  currentPage = [];
                  currentHeight = paddingHeight;
                  remainingHeight = maxPageHeight - paddingHeight;
                }
                currentPage.push({ title: chunkTitle, data: chunk, templateVariant: title.includes(':') ? title.split(':')[1] : '' });
                currentHeight += chunkHeight;
                remainingHeight = maxPageHeight - currentHeight; // Update remaining space
                console.log(`📄 Started new page with ${chunkTitle} chunk (${chunkHeight}cm, ${remainingHeight}cm remaining)`);
              }
            }
          } else {
            // Move whole section to next page
            pages.push([...currentPage]);
            console.log(`📄 Completed page, moving ${title} to new page`);
            currentPage = [title];
            currentHeight = paddingHeight + sectionHeight;
          }
        } else {
          // Section fits
          currentPage.push(title);
          currentHeight += sectionHeight;
          console.log(`📄 Added ${title} to current page (total: ${currentHeight}cm)`);
        }
      }

      if (currentPage.length > 0) {
        pages.push(currentPage);
        console.log(`📄 Final page completed with ${currentPage.length} sections`);
      }

      return pages.length > 0 ? pages : [sectionTitles];
    };

    // --- STEP 5: UTILITY FUNCTIONS ---
    // Shorthand functions to simplify the page building logic.

    // Finds a section object in resumeData.sections by its title.
    const getSection = (title) => resumeData.sections.find(s => s.title === title);
    
    // Measure individual items in a section using browser measurement
    const measureIndividualItems = async (sectionData, templateVariant = '') => {
      if (!sectionData || !sectionData.items || !Array.isArray(sectionData.items)) {
        return []; // Can't measure non-item sections
      }

      const itemMeasurements = [];
      
      for (let i = 0; i < sectionData.items.length; i++) {
        const item = sectionData.items[i];
        
        // Create a temporary section with just this item
        const tempSection = {
          ...sectionData,
          items: [item]
        };
        
        // Measure this individual item using the same method as sections
        const itemHeight = await measureChunk(tempSection, `${sectionData.title}_item_${i}`, templateVariant);
        itemMeasurements.push({
          index: i,
          item: item,
          height: itemHeight
        });
        
        console.log(`📏 Item ${i + 1} (${item.title || item.organization || 'Item'}): ${itemHeight}cm`);
      }
      
      return itemMeasurements;
    };

    // Split a section across multiple pages based on available space
    // This function intelligently fits as many items as possible using actual measurements
    const splitSectionForPages = async (sectionData, templateVariant = '', firstPageSpace, fullPageSpace) => {
      if (!sectionData || !sectionData.items || !Array.isArray(sectionData.items)) {
        return [sectionData]; // Can't split non-item sections
      }
      
      console.log(`🔍 Intelligently splitting ${sectionData.title} with ${sectionData.items.length} items`);
      console.log(`📏 First page space: ${firstPageSpace}cm, Full page space: ${fullPageSpace}cm`);
      
      // Measure each item individually
      const itemMeasurements = await measureIndividualItems(sectionData, templateVariant);
      
      if (itemMeasurements.length === 0) {
        return [sectionData];
      }
      
      const chunks = [];
      let currentChunkItems = [];
      let remainingSpace = firstPageSpace;
      let isFirstChunk = true;
      
      for (const itemMeasurement of itemMeasurements) {
        const { item, height } = itemMeasurement;
        
        console.log(`� Trying to fit item (${height}cm) in remaining space (${remainingSpace}cm)`);
        
        // Check if combined chunk with this item fits in remaining space
        const testChunkItems = [...currentChunkItems, item];
        const testSection = {
          ...sectionData,
          items: testChunkItems
        };
        const combinedHeight = await measureChunk(testSection, `${sectionData.title}_test_chunk`, templateVariant);
        
        console.log(`📦 Testing chunk with ${testChunkItems.length} items: ${combinedHeight}cm (space: ${remainingSpace}cm)`);
        
        if (combinedHeight <= remainingSpace) {
          // Combined chunk fits - add this item
          currentChunkItems.push(item);
          console.log(`✅ Added item to chunk (${testChunkItems.length} items total)`);
        } else if (currentChunkItems.length === 0 && isFirstChunk) {
          // First item doesn't fit on first page, but we need to split anyway
          // Put as many items as possible on first page, then continue on next
          console.log(`⚠️  First item (${combinedHeight}cm) too large for first page space (${remainingSpace}cm)`);
          console.log(`� Forcing split: moving to next page and continuing split`);
          
          // Start new chunk with this item on next page
          currentChunkItems = [item];
          const newChunkHeight = await measureChunk({...sectionData, items: [item]}, `${sectionData.title}_new_chunk`, templateVariant);
          remainingSpace = fullPageSpace - newChunkHeight;
          isFirstChunk = false;
          console.log(`📄 Started chunk on new page with item (${remainingSpace}cm remaining on full page)`);
        } else if (currentChunkItems.length === 0) {
          // First item of a continuation chunk doesn't fit, force it anyway
          currentChunkItems.push(item);
          const forcedChunkHeight = await measureChunk({...sectionData, items: [item]}, `${sectionData.title}_forced_chunk`, templateVariant);
          remainingSpace = fullPageSpace - forcedChunkHeight;
          console.log(`⚠️  Forced large item to new chunk (${remainingSpace}cm remaining)`);
        } else {
          // Item doesn't fit, complete current chunk and start new one
          if (currentChunkItems.length > 0) {
            chunks.push({
              ...sectionData,
              items: [...currentChunkItems],
              isContinuation: !isFirstChunk
            });
            console.log(`📦 Completed chunk with ${currentChunkItems.length} items`);
          }
          
          // Start new chunk with this item
          currentChunkItems = [item];
          const newChunkHeight = await measureChunk({...sectionData, items: [item]}, `${sectionData.title}_new_chunk`, templateVariant);
          remainingSpace = fullPageSpace - newChunkHeight;
          isFirstChunk = false;
          console.log(`🆕 Started new chunk with item (${remainingSpace}cm remaining on full page)`);
        }
      }
      
      // Add final chunk if it has items
      if (currentChunkItems.length > 0) {
        chunks.push({
          ...sectionData,
          items: [...currentChunkItems],
          isContinuation: !isFirstChunk
        });
        console.log(`📦 Final chunk with ${currentChunkItems.length} items`);
      }
      
      console.log(`✂️  Split ${sectionData.title} into ${chunks.length} chunks based on actual measurements`);
      return chunks.length > 0 ? chunks : [sectionData];
    };
    // Converts a title like "Work Experience" to "work_experience".
    const toPartialName = (title) => title.toLowerCase().replace(/\s+/g, '_');

    // --- STEP 6: BUILD PAGES DYNAMICALLY ---
    // Process pages sequentially to handle async operations
    const pagesHtml = [];
    
    for (const pageLayout of pageConfig) {
      /**
       * Generates the complete HTML for a column by rendering a list of sections.
       * @param {string[]|object[]} sectionTitles - An array of section titles or section objects to render.
       * @returns {string} The concatenated HTML for the column.
       */
      const generateColumnHtml = (sectionTitles) => {
        return sectionTitles.map(titleOrObj => {
          let title, sectionData, templateVariant;
          
          // Handle both string titles and section objects from split sections
          if (typeof titleOrObj === 'object' && titleOrObj.title) {
            title = titleOrObj.title;
            sectionData = titleOrObj.data;
            templateVariant = titleOrObj.templateVariant || '';
          } else {
            title = titleOrObj;
            sectionData = null;
            templateVariant = '';
          }
          
          // Handle continuation markers in title
          const isFromSplit = title.includes('__continuation_');
          const actualTitle = isFromSplit ? title.split('__continuation_')[0] : title;
          
          //'name' is a special case as it's not in the 'sections' array.
          if (actualTitle === 'name') {
            return compiledPartials.name({ name: resumeData.name });
          }

          // Handle template variants (e.g., "Education:wide" or "Skills:wide")
          let sectionTitle = actualTitle;
          
          if (actualTitle.includes(':') && !templateVariant) {
            [sectionTitle, templateVariant] = actualTitle.split(':');
          }

          // 'personal_info' is a special case as it's not in the 'sections' array.
          if (sectionTitle === 'personal_info') {
            let templateName = 'personal_info';
            if (templateVariant) {
              templateName = 'personal_info_' + templateVariant;
            }
            
            if (compiledPartials[templateName]) {
              return compiledPartials[templateName](resumeData.personal_info);
            } else {
              console.warn(`⚠️ Warning: Could not find template "${templateName}" for personal_info`);
              return '';
            }
          }

          // For standard sections, find their data and matching partial.
          if (!sectionData) {
            sectionData = getSection(sectionTitle);
          }
          
          // Determine the template name based on variant
          let partialName = toPartialName(sectionTitle);
          if (templateVariant) {
            partialName = toPartialName(sectionTitle) + '_' + templateVariant;
          }

          // Only render if both the data and the template exist.
          if (sectionData && compiledPartials[partialName]) {
            // Special processing for Skills section to optimize tag order
            let processedSectionData = sectionData;
            if (sectionTitle === 'Skills' && sectionData.items) {
              processedSectionData = {
                ...sectionData,
                items: sectionData.items.map(item => ({
                  ...item,
                  tags: item.tags ? optimizeTagOrder(item.tags) : item.tags
                }))
              };
            }
            
            return compiledPartials[partialName](processedSectionData);
          }

          // If something is missing, warn the user and skip it.
          console.warn(`⚠️ Warning: Could not find data or partial for section "${actualTitle}" (looking for template "${partialName}")`);
          return '';
        }).join('');
      };

      // Check if automatic page breaks are enabled
      const autoPageBreak = pageLayout.autoPageBreak || false;
      
      // Check if this is a hybrid layout with both columns and whole page sections
      if (pageLayout.left || pageLayout.right || pageLayout.wholePage) {
        let allPages = [];
        
        // Extract padding configuration if provided
        const padding = pageLayout.padding || '0cm';
        
        // Handle whole page sections with auto page break
        if (pageLayout.wholePage) {
          let wholePageSections = pageLayout.wholePage;
          
          if (autoPageBreak) {
            // Split sections into multiple pages based on improved estimates
            console.log('📋 Using improved estimate-based splitting');
            const pageGroups = await splitSectionsWithMeasurements(wholePageSections, pageLayout);
            
            pageGroups.forEach((sectionGroup, pageIndex) => {
              let pageHtml = '';
              let pageClasses = ['has-whole-page'];
              
              // Add column sections only to the first page
              if (pageIndex === 0 && (pageLayout.left || pageLayout.right)) {
                pageClasses.push('has-columns');
                const leftColumnHtml = pageLayout.left ? generateColumnHtml(pageLayout.left) : '';
                const rightColumnHtml = pageLayout.right ? generateColumnHtml(pageLayout.right) : '';
                
                pageHtml += `
                  <div class="cv-body columns" style="padding-top: ${padding};">
                    <div class="left-column">${leftColumnHtml}</div>
                    <div class="right-column">${rightColumnHtml}</div>
                  </div>
                `;
              }
              
              // Add whole page sections
              const wholePageHtml = generateColumnHtml(sectionGroup);
              // For first page, determine padding based on whether there are columns above
              // For continuation pages, let CSS handle the page margins
              let wholePagePadding;
              if (pageIndex === 0 && (pageLayout.left || pageLayout.right)) {
                wholePagePadding = '0cm'; // No top padding when columns are above
              } else if (pageIndex === 0) {
                wholePagePadding = padding; // Use layout padding for first page
              } else {
                wholePagePadding = ''; // Let CSS handle continuation page margins
              }
              
              const paddingStyle = wholePagePadding ? ` style="padding-top: ${wholePagePadding};"` : '';
              pageHtml += `
                <div class="cv-body whole-page"${paddingStyle}>
                  <div class="whole-page-column">${wholePageHtml}</div>
                </div>
              `;
              
              const classAttr = pageClasses.length > 0 ? ` class="${pageClasses.join(' ')}"` : '';
              
              allPages.push(`
                <page size="A4"${classAttr}>
                  ${pageHtml}
                  ${getFooterTemplate()({})}
                </page>
              `);
            });
          } else {
            // Original single-page logic
            let pageHtml = '';
            let pageClasses = [];
            
            // If there are column sections, render them first
            if (pageLayout.left || pageLayout.right) {
              pageClasses.push('has-columns');
              const leftColumnHtml = pageLayout.left ? generateColumnHtml(pageLayout.left) : '';
              const rightColumnHtml = pageLayout.right ? generateColumnHtml(pageLayout.right) : '';
              
              pageHtml += `
                <div class="cv-body columns" style="padding-top: ${padding};">
                  <div class="left-column">${leftColumnHtml}</div>
                  <div class="right-column">${rightColumnHtml}</div>
                </div>
              `;
            }
            
            // Add whole page sections
            pageClasses.push('has-whole-page');
            const wholePageHtml = generateColumnHtml(wholePageSections);
            const wholePagePadding = pageLayout.left || pageLayout.right ? '0cm' : padding;
            pageHtml += `
              <div class="cv-body whole-page" style="padding-top: ${wholePagePadding};">
                <div class="whole-page-column">${wholePageHtml}</div>
              </div>
            `;
            
            const classAttr = pageClasses.length > 0 ? ` class="${pageClasses.join(' ')}"` : '';
            
            allPages.push(`
              <page size="A4"${classAttr}>
                ${pageHtml}
                ${getFooterTemplate()({})}
              </page>
            `);
          }
        } else {
          // Handle layouts with only columns (no whole page sections)
          if (autoPageBreak && (pageLayout.left || pageLayout.right)) {
            // Auto page break for column layouts - split each column independently
            console.log('📋 Using column-based auto page break');
            
            const leftSections = pageLayout.left || [];
            const rightSections = pageLayout.right || [];
            
            // Split each column independently
            const leftPageGroups = leftSections.length > 0 ? 
              await splitSectionsWithMeasurements(leftSections, pageLayout) : [[]];
            const rightPageGroups = rightSections.length > 0 ? 
              await splitSectionsWithMeasurements(rightSections, pageLayout) : [[]];
            
            // Create pages based on the maximum number of page groups needed
            const maxPages = Math.max(leftPageGroups.length, rightPageGroups.length);
            
            for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
              const leftSectionsForPage = leftPageGroups[pageIndex] || [];
              const rightSectionsForPage = rightPageGroups[pageIndex] || [];
              
              const leftColumnHtml = leftSectionsForPage.length > 0 ? 
                generateColumnHtml(leftSectionsForPage) : '';
              const rightColumnHtml = rightSectionsForPage.length > 0 ? 
                generateColumnHtml(rightSectionsForPage) : '';
              
              const pageHtml = `
                <div class="cv-body columns" style="padding-top: ${pageIndex === 0 ? padding : '0cm'};">
                  <div class="left-column">${leftColumnHtml}</div>
                  <div class="right-column">${rightColumnHtml}</div>
                </div>
              `;
              
              allPages.push(`
                <page size="A4" class="has-columns">
                  ${pageHtml}
                  ${getFooterTemplate()({})}
                </page>
              `);
            }
          } else {
            // Original single-page column logic
            let pageHtml = '';
            let pageClasses = ['has-columns'];
            
            const leftColumnHtml = pageLayout.left ? generateColumnHtml(pageLayout.left) : '';
            const rightColumnHtml = pageLayout.right ? generateColumnHtml(pageLayout.right) : '';
            
            pageHtml += `
              <div class="cv-body columns" style="padding-top: ${padding};">
                <div class="left-column">${leftColumnHtml}</div>
                <div class="right-column">${rightColumnHtml}</div>
              </div>
            `;
            
            const classAttr = pageClasses.length > 0 ? ` class="${pageClasses.join(' ')}"` : '';
            
            allPages.push(`
              <page size="A4"${classAttr}>
                ${pageHtml}
                ${getFooterTemplate()({})}
              </page>
            `);
          }
        }
        
        // Add all pages from this layout to the main array
        pagesHtml.push(...allPages);
      } else {
        // Fallback for legacy layouts (shouldn't reach here with new structure)
        console.warn('⚠️ Warning: No valid layout configuration found for page');
      }
    }

    // Join all pages
    const finalPagesHtml = pagesHtml.join('');

    // --- STEP 7: FINALIZE & WRITE FILE ---
    // Combine the head, all generated pages, and closing tags.
    // Calculate the relative path from the HTML output to the CSS file
    const cssRelativePath = path.relative(path.dirname(htmlOutputPath), cssOutputPath);

    const finalHtml = `
      ${compiledPartials.head({ styles: cssRelativePath })}
      ${finalPagesHtml}
      </body>
      </html>
    `;

    // Write the final HTML string to the output file.
    fs.writeFileSync(htmlOutputPath, finalHtml);
    console.log(`✅ Resume successfully generated and saved to ${htmlOutputPath}`);

  } catch (error) {
    // Catch and report any errors that occur during the build process.
    console.error('❌ An error occurred while generating the resume:', error);
  }
}

// --- RUN THE SCRIPT ---
// Execute the main function to start the build process.
buildResume();