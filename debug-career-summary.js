const fs = require('fs');
const puppeteer = require('puppeteer');

async function debugCareerSummary() {
  const data = JSON.parse(fs.readFileSync('data/darcy-hybrid.json', 'utf8'));
  const careerSummarySection = data.sections.find(section => section.title === 'Career Summary');
  
  if (!careerSummarySection) {
    console.log('Career Summary section not found');
    return;
  }
  
  console.log('Career Summary data:');
  console.log(JSON.stringify(careerSummarySection, null, 2));
  
  // Get the CSS content
  const cssContent = fs.readFileSync('darcy-hybrid.css', 'utf8');
  
  // Generate simple HTML for Career Summary
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${cssContent}
        body { margin: 0; padding: 0; }
        .measurement-container { 
          width: 397px; /* Half A4 width for column */
          margin: 0; 
          padding: 1cm; 
          box-sizing: border-box;
          border: 1px solid red; /* Debug border */
        }
        .section {
          border: 1px solid blue; /* Debug border for section */
        }
      </style>
    </head>
    <body>
      <div class="measurement-container">
        <div class="cv-body columns">
          <div class="left-column">
            <div data-section="Career Summary">
              <div class="section">
                <p class="summary">
                  ${careerSummarySection.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const browser = await puppeteer.launch({ headless: false }); // Non-headless to see what's happening
  const page = await browser.newPage();
  
  // Set page size to A4
  await page.setViewport({ width: 794, height: 1123 });
  
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'career-summary-debug.png', fullPage: true });
  
  const measurements = await page.evaluate(() => {
    const container = document.querySelector('[data-section="Career Summary"]');
    if (container) {
      const rect = container.getBoundingClientRect();
      const sectionRect = container.querySelector('.section').getBoundingClientRect();
      
      return {
        containerHeight: rect.height,
        containerWidth: rect.width,
        sectionHeight: sectionRect.height,
        sectionWidth: sectionRect.width,
        containerTop: rect.top,
        containerBottom: rect.bottom,
        sectionTop: sectionRect.top,
        sectionBottom: sectionRect.bottom
      };
    }
    return null;
  });
  
  console.log('Measurements:', measurements);
  
  // Wait for user to examine
  console.log('Browser opened for inspection. Press Enter to close...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  await browser.close();
}

debugCareerSummary().catch(console.error);
