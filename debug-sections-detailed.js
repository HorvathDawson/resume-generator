const fs = require('fs');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');

// Load and compile all templates
const templateDir = './templates/';
const templates = {};

// Register templates
const templateFiles = fs.readdirSync(templateDir);
templateFiles.forEach(file => {
  if (file.endsWith('.hbs')) {
    const templateName = file.replace('.hbs', '');
    const templateContent = fs.readFileSync(`${templateDir}${file}`, 'utf8');
    templates[templateName] = Handlebars.compile(templateContent);
  }
});

// Helper functions from build.js
function getSection(title) {
  const data = JSON.parse(fs.readFileSync('data/darcy-hybrid.json', 'utf8'));
  return data.sections.find(section => section.title === title);
}

function generateSectionHtml(sectionData, templateVariant = '') {
  const data = JSON.parse(fs.readFileSync('data/darcy-hybrid.json', 'utf8'));
  
  if (sectionData.title === 'name') {
    return templates.name({ name: data.name });
  }
  
  if (sectionData.title === 'personal_info') {
    const context = {
      personal_info: data.personal_info,
      variant: templateVariant
    };
    return templates.personal_info(context);
  }
  
  // For other sections, find the right template
  const templateName = sectionData.title.toLowerCase().replace(/\s+/g, '_');
  const template = templates[templateName];
  
  if (!template) {
    console.warn(`⚠️ No template found for "${templateName}"`);
    return `<div class="section"><h2>${sectionData.title}</h2><p>Template not found</p></div>`;
  }
  
  const context = {
    ...sectionData,
    variant: templateVariant
  };
  
  return template(context);
}

async function debugSectionBySection() {
  const data = JSON.parse(fs.readFileSync('data/darcy-hybrid.json', 'utf8'));
  const layout = data.layout[0];
  
  // Get all whole page sections (the ones that were measuring wrong)
  const wholePageSections = layout.wholePage || [];
  
  console.log('Debugging whole page sections:', wholePageSections);
  
  // Get the CSS content
  const cssContent = fs.readFileSync('darcy-hybrid.css', 'utf8');
  
  const browser = await puppeteer.launch({ headless: false }); // Show browser for visual inspection
  
  for (const title of wholePageSections) {
    console.log(`\n=== Debugging ${title} ===`);
    
    let sectionData = null;
    let templateVariant = '';
    let sectionTitle = title;
    
    // Parse section title and variant
    if (title.includes(':')) {
      [sectionTitle, templateVariant] = title.split(':');
      if (sectionTitle === 'personal_info') {
        sectionData = { title: 'personal_info' };
      } else {
        sectionData = data.sections.find(section => section.title === sectionTitle);
      }
    } else if (title === 'name') {
      sectionData = { title: 'name' };
    } else if (title === 'personal_info') {
      sectionData = { title: 'personal_info' };
    } else {
      sectionData = data.sections.find(section => section.title === title);
    }
    
    if (!sectionData) {
      console.log(`❌ No data found for ${title}`);
      continue;
    }
    
    console.log('Section data:', JSON.stringify(sectionData, null, 2));
    
    // Generate HTML using the same function as build.js
    let sectionHtml;
    try {
      sectionHtml = generateSectionHtml(sectionData, templateVariant);
      console.log('Generated HTML length:', sectionHtml.length);
      console.log('HTML preview:', sectionHtml.substring(0, 200) + '...');
    } catch (error) {
      console.log('❌ Error generating HTML:', error.message);
      continue;
    }
    
    // Create HTML exactly like measureSectionHeights does
    const measurementHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${cssContent}
          body { margin: 0; padding: 0; }
          .measurement-container { 
            width: 794px; 
            margin: 0; 
            padding: 1cm; 
            box-sizing: border-box;
            border: 2px solid red;
          }
          .section {
            border: 1px solid blue;
          }
          [data-section] {
            border: 1px solid green;
          }
        </style>
      </head>
      <body>
        <div class="measurement-container">
          <div class="cv-body whole-page">
            <div class="whole-page-column">
              <div data-section="${title}">${sectionHtml}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    
    try {
      await page.setContent(measurementHtml, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Take screenshot for visual inspection
      await page.screenshot({ path: `debug-${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`, fullPage: true });
      
      const measurements = await page.evaluate((sectionTitle) => {
        const pixelToCm = 29.7 / 1123;
        const container = document.querySelector(`[data-section="${sectionTitle}"]`);
        
        if (container) {
          const rect = container.getBoundingClientRect();
          const sectionElement = container.querySelector('.section');
          const sectionRect = sectionElement ? sectionElement.getBoundingClientRect() : null;
          
          return {
            containerHeight: rect.height,
            containerWidth: rect.width,
            containerHeightCm: rect.height * pixelToCm,
            sectionHeight: sectionRect ? sectionRect.height : 'no .section found',
            sectionWidth: sectionRect ? sectionRect.width : 'no .section found',
            sectionHeightCm: sectionRect ? sectionRect.height * pixelToCm : 'no .section found',
            containerTop: rect.top,
            containerBottom: rect.bottom,
            innerHTML: container.innerHTML.substring(0, 500)
          };
        }
        return { error: 'Container not found' };
      }, title);
      
      console.log('Measurements:', measurements);
      console.log(`📏 Container: ${measurements.containerHeight}px = ${measurements.containerHeightCm?.toFixed(2)}cm`);
      if (measurements.sectionHeight !== 'no .section found') {
        console.log(`📏 Section: ${measurements.sectionHeight}px = ${measurements.sectionHeightCm?.toFixed(2)}cm`);
      }
      
      // Wait for user input to continue
      console.log(`\nScreenshot saved as debug-${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
      console.log('Press Enter to continue to next section...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
      
    } catch (error) {
      console.log('❌ Error measuring:', error.message);
    }
    
    await page.close();
  }
  
  await browser.close();
  console.log('\nDebugging complete!');
}

debugSectionBySection().catch(console.error);
