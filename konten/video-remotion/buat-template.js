// Render template Story Date Night (konten/template-story/template.html?t=1..4) ke PNG 1080×1920.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const f = 'file://' + path.resolve(__dirname, '../template-story/template.html');
  for (const t of [1, 2, 3, 4]) { await p.goto(f + '?t=' + t); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300); await p.screenshot({ path: path.resolve(__dirname, `../template-story/story-${t}.png`) }); console.log('ok', t); }
  await b.close();
})();
