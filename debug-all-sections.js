const fs = require('fs');
const puppeteer = require('puppeteer');

async function debugAllSections() {
  const data = JSON.parse(fs.readFileSync('data/darcy-hybrid.json', 'utf8'));
  const layout = data.layout[0];
  
  // Get all section titles
  const allSections = [
    ...(layout.left || []),
    ...(layout.right || []), 
    ...(layout.wholePage || [])
  ];
  
  console.log('All sections to measure:', allSections);
  
  // Get the CSS content
  const cssContent = fs.readFileSync('darcy-hybrid.css', 'utf8');
  
  // Test each section individually
  for (const title of allSections) {
    console.log(`\n=== Testing ${title} ===`);
    
    let sectionData = null;
    let templateVariant = '';
    let sectionTitle = title;
    
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
    
    // Generate section HTML (simplified version of generateSectionHtml)
    let sectionHtml = '';
    if (title === 'name') {
      sectionHtml = `<h1 class="name">${data.name}</h1>`;
    } else if (title === 'personal_info' || title === 'personal_info:wide') {
      const info = data.personal_info;
      sectionHtml = `
        <div class="section personal-info ${templateVariant}">
          <div class="contact-item"><span class="icon">📧</span> ${info.email}</div>
          <div class="contact-item"><span class="icon">📞</span> ${info.phone}</div>
          <div class="contact-item"><span class="icon">🌐</span> ${info.website}</div>
          <div class="contact-item"><span class="icon">💼</span> ${info.linkedin}</div>
          <div class="contact-item"><span class="icon">📍</span> ${info.location}</div>
        </div>
      `;
    } else if (sectionData.summary) {
      sectionHtml = `
        <div class="section">
          <p class="summary">${sectionData.summary}</p>
        </div>
      `;
    } else if (sectionData.items) {
      sectionHtml = `
        <div class="section ${templateVariant}">
          <h2>${sectionData.title}</h2>
          ${sectionData.items.map(item => `<div class="item">${JSON.stringify(item).substring(0, 100)}...</div>`).join('')}
        </div>
      `;
    }
    
    // Determine which column type to use
    let columnClass = 'whole-page-column';
    let containerWidth = '794px';
    
    if (layout.left && layout.left.includes(title)) {
      columnClass = 'left-column';
      containerWidth = '397px';
    } else if (layout.right && layout.right.includes(title)) {
      columnClass = 'right-column';  
      containerWidth = '397px';
    }
    
    const html = `
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
            border: 1px solid red;
          }
          .section {
            border: 1px solid blue;
          }
        </style>
      </head>
      <body>
        <div class="measurement-container">
          <div class="cv-body ${layout.left && layout.right ? 'columns' : 'whole-page'}">
            <div class="${columnClass}">
              <div data-section="${title}">
                ${sectionHtml}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    const measurements = await page.evaluate(() => {
      const container = document.querySelector('[data-section]');
      if (container) {
        const rect = container.getBoundingClientRect();
        const pixelToCm = 29.7 / 1123;
        
        return {
          heightPx: rect.height,
          widthPx: rect.width,
          heightCm: rect.height * pixelToCm,
          columnType: document.querySelector('.cv-body').className,
          columnClass: container.parentElement.className
        };
      }
      return null;
    });
    
    await browser.close();
    
    if (measurements) {
      console.log(`📏 ${title}:`);
      console.log(`   Column: ${measurements.columnClass}`);
      console.log(`   Size: ${measurements.heightPx.toFixed(1)}px height, ${measurements.widthPx.toFixed(1)}px width`);
      console.log(`   Height: ${measurements.heightCm.toFixed(2)}cm`);
    } else {
      console.log(`❌ Could not measure ${title}`);
    }
  }
}

debugAllSections().catch(console.error);
