const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

app.post('/render', async (req, res) => {
  console.log('받은 데이터:', JSON.stringify(req.body));
  
  const { slot, lang, headline, slide2_text, image_url, slide2_image_url } = req.body;

  const templates = {
    ko: {
      font: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;800&display=swap",
      fontFamily: "'Noto Sans KR', sans-serif",
      channel: "오늘의 뉴스",
      channelName: "APELZJF",
      followMsg: "매일 업데이트되는<br>AI 최신 소식",
      cta: "지금 팔로우하고 놓치지 마세요"
    },
    en: {
      font: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap",
      fontFamily: "'Inter', sans-serif",
      channel: "Today's News",
      channelName: "DONGLEVERSE",
      followMsg: "Daily AI News<br>Updates",
      cta: "Follow us and stay updated"
    },
    ja: {
      font: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;800&display=swap",
      fontFamily: "'Noto Sans JP', sans-serif",
      channel: "今日のニュース",
      channelName: "ONELEEMAK",
      followMsg: "毎日更新される<br>AI最新ニュース",
      cta: "フォローして見逃さないで"
    }
  };

  const t = templates[lang] || templates.ko;

  let html = '';
  let css = '';

  if (slot === '1') {
    html = `
      <link href='${t.font}' rel='stylesheet'>
      <div class='card'>
        <img src='${image_url}' class='bg'/>
        <div class='overlay'></div>
        <div class='content'>
          <div class='top-bar'><div class='dot'></div><span class='channel'>${t.channel}</span></div>
          <div class='title'>${headline}</div>
          <div class='channel-name'>• ${t.channelName}</div>
        </div>
      </div>`;
    css = `* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #000; } .card { width: 1080px; height: 1350px; position: relative; overflow: hidden; font-family: ${t.fontFamily}; } .bg { width: 100%; height: 100%; object-fit: cover; object-position: center top; position: absolute; top: 0; left: 0; filter: brightness(0.72); } .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.0) 100%); } .content { position: absolute; bottom: 110px; left: 90px; right: 90px; } .top-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; } .dot { width: 12px; height: 12px; border-radius: 50%; background: #00e5ff; } .channel { color: #00e5ff; font-size: 36px; font-weight: 700; letter-spacing: 0.03em; } .title { color: #fff; font-size: 88px; font-weight: 800; line-height: 1.25; letter-spacing: -0.02em; word-break: keep-all; white-space: pre-line; } .channel-name { margin-top: 28px; color: rgba(255,255,255,0.6); font-size: 30px; font-weight: 700; }`;
  } else if (slot === '2') {
    html = `
      <link href='${t.font}' rel='stylesheet'>
      <div class='card'>
        <img src='${slide2_image_url}' class='bg'/>
        <div class='overlay'></div>
        <div class='content'>
          <div class='top-bar'><div class='dot'></div><span class='channel'>${t.channel}</span></div>
          <div class='body-text'>${slide2_text}</div>
          <div class='channel-name'>• ${t.channelName}</div>
        </div>
      </div>`;
    css = `* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #000; } .card { width: 1080px; height: 1350px; position: relative; overflow: hidden; font-family: ${t.fontFamily}; display: flex; align-items: center; justify-content: center; } .bg { width: 100%; height: 100%; object-fit: cover; object-position: center top; position: absolute; top: 0; left: 0; filter: brightness(0.55) blur(20px); transform: scale(1.1); } .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.35); } .content { position: relative; z-index: 2; padding: 100px 90px; width: 100%; } .top-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 60px; } .dot { width: 12px; height: 12px; border-radius: 50%; background: #00e5ff; } .channel { color: #00e5ff; font-size: 36px; font-weight: 700; } .body-text { color: #fff; font-size: 68px; font-weight: 800; line-height: 1.45; word-break: keep-all; white-space: pre-line; } .body-text b { color: #00e5ff; } .channel-name { margin-top: 80px; color: rgba(255,255,255,0.5); font-size: 30px; font-weight: 700; }`;
  } else if (slot === '3') {
    html = `
      <link href='${t.font}' rel='stylesheet'>
      <div class='card'>
        <div class='content'>
          <div class='logo'>${t.channelName}</div>
          <div class='tagline'>${t.channel}</div>
          <div class='divider'></div>
          <div class='message'>${t.followMsg}</div>
          <div class='cta'><div class='cta-dot'></div><span>${t.cta}</span></div>
        </div>
      </div>`;
    css = `* { margin: 0; padding: 0; box-sizing: border-box; } body { background: #000; } .card { width: 1080px; height: 1350px; position: relative; background: linear-gradient(135deg, #0d1f2d 0%, #1a3a4a 50%, #0d2a1f 100%); font-family: ${t.fontFamily}; display: flex; align-items: center; justify-content: center; } .content { padding: 0 90px; width: 100%; } .logo { color: #fff; font-size: 52px; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 24px; } .tagline { color: #00e5ff; font-size: 36px; font-weight: 700; margin-bottom: 60px; } .divider { width: 80px; height: 4px; background: #00e5ff; margin-bottom: 60px; } .message { color: #fff; font-size: 72px; font-weight: 800; line-height: 1.35; word-break: keep-all; margin-bottom: 80px; } .cta { display: flex; align-items: center; gap: 14px; } .cta-dot { width: 14px; height: 14px; border-radius: 50%; background: #00e5ff; } .cta span { color: rgba(255,255,255,0.7); font-size: 34px; font-weight: 700; }`;
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
    const fullHtml = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}</body></html>`;
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 100,
      clip: { x: 0, y: 0, width: 1080, height: 1350 }
    });

    res.set('Content-Type', 'image/jpeg');
    res.send(screenshot);
  } catch (err) {
    console.log('에러:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puppeteer renderer running on port ${PORT}`));
