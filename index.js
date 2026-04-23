const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/render', async (req, res) => {
  let { html, css, width = 1080, height = 1350 } = req.body;

  width = parseInt(width);
  height = parseInt(height);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>${html}</body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 95,
      clip: { x: 0, y: 0, width, height }
    });

    res.set('Content-Type', 'image/jpeg');
    res.send(screenshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puppeteer renderer running on port ${PORT}`));
