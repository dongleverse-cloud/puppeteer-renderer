const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// 임시 이미지 저장 폴더
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// 정적 파일 서빙
app.use('/images', express.static(tmpDir));

app.post('/render', async (req, res) => {
  const html = req.body.html || '';
  const css = req.body.css || '';
  const width = parseInt(req.body.width) || 1080;
  const height = parseInt(req.body.height) || 1350;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    const fullHtml = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}</body></html>`;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const filename = `${Date.now()}.jpg`;
    const filepath = path.join(tmpDir, filename);

    await page.screenshot({
      type: 'jpeg',
      quality: 95,
      path: filepath,
      clip: { x: 0, y: 0, width, height }
    });

    const imageUrl = `${req.protocol}://${req.get('host')}/images/${filename}`;
    res.json({ url: imageUrl });

    // 5분 후 파일 삭제
    setTimeout(() => {
      fs.unlink(filepath, () => {});
    }, 5 * 60 * 1000);

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puppeteer renderer running on port ${PORT}`));
