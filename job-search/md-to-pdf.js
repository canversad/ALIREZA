const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const dir = '/tmp/claude-0/-home-user-ALIREZA/7dafef0c-0780-5da5-9df5-a9e5907fcbfb/scratchpad';
const files = [
  'master-resume',
  'resume-gtech-customer-solutions',
  'resume-program-management',
  'resume-google-ads-strategy',
  'resume-product-growth-marketing'
];

function mdToHtml(md) {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(?!<[hlu]|<li)(.+)$/gm, '<p>$1</p>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => '<ul>' + m + '</ul>')
    .replace(/<p><\/p>/g, '')
    .replace(/\n{2,}/g, '\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1a1a1e; margin: 0; padding: 0.4in 0.5in; }
  h1 { font-size: 18pt; color: #2D4A6F; margin: 0 0 2pt; }
  h2 { font-size: 11pt; color: #2D4A6F; border-bottom: 1.5px solid #2D4A6F; padding-bottom: 2pt; margin: 14pt 0 6pt; text-transform: uppercase; letter-spacing: 1px; }
  h3 { font-size: 10.5pt; margin: 8pt 0 2pt; }
  p { margin: 2pt 0; }
  ul { margin: 2pt 0 6pt 14pt; padding: 0; }
  li { margin-bottom: 2pt; }
  strong { font-weight: 600; }
  hr { border: none; border-top: 1px solid #ccc; margin: 6pt 0; }
</style></head><body>${html}</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  for (const f of files) {
    const md = fs.readFileSync(path.join(dir, f + '.md'), 'utf8');
    const html = mdToHtml(md);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: path.join(dir, f + '.pdf'),
      format: 'Letter',
      margin: { top: '0.4in', bottom: '0.4in', left: '0.5in', right: '0.5in' },
      printBackground: true
    });
    await page.close();
    console.log('PDF: ' + f + '.pdf done');
  }
  await browser.close();
})();
