const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

const channels = {
  ko: {
    font: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap",
    fontFamily: "'Noto Sans KR', sans-serif",
    channelHandle: "APELZJF",
    followMsg: "매일 업데이트되는 최신 소식",
    cta: "팔로우하고 놓치지 마세요 →"
  },
  en: {
    font: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap",
    fontFamily: "'Inter', sans-serif",
    channelHandle: "DONGLEVERSE",
    followMsg: "Daily updates, don't miss out",
    cta: "Follow us now →"
  },
  ja: {
    font: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap",
    fontFamily: "'Noto Sans JP', sans-serif",
    channelHandle: "ONELEEMAK",
    followMsg: "毎日更新、見逃さないで",
    cta: "今すぐフォロー →"
  }
};

const baseCSS = (fontFamily) => `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; }
  :root {
    --accent: #00e5ff;
    --accent-dim: rgba(0,229,255,0.15);
    --white: #ffffff;
    --white-60: rgba(255,255,255,0.6);
    --white-40: rgba(255,255,255,0.4);
    --black: #000000;
    --card-w: 1080px;
    --card-h: 1350px;
    --pad: 88px;
    --font: ${fontFamily};
  }
  .card {
    width: var(--card-w);
    height: var(--card-h);
    position: relative;
    overflow: hidden;
    font-family: var(--font);
  }
`;

function slideTitle(ch, data) {
  const headline = (data.headline || '').replace(/\*\*(.*?)\*\*/g, '<em>$1</em>');
  const tag = data.tag || '';
  return {
    html: `
      <link href='${ch.font}' rel='stylesheet'>
      <div class='card'>
        <div class='bg-wrap'>
          <img src='${data.image_url || ""}' class='bg-img'/>
          <div class='bg-overlay'></div>
        </div>
        <div class='top-bar'>
          <span class='channel-handle'>• ${ch.channelHandle}</span>
        </div>
        ${tag ? `<div class='tag-wrap'><span class='tag'>${tag}</span></div>` : ''}
        <div class='bottom-content'>
          <h1 class='headline'>${headline}</h1>
        </div>
      </div>`,
    css: baseCSS(ch.fontFamily) + `
      .bg-wrap { position: absolute; inset: 0; }
      .bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; filter: brightness(0.65); }
      .bg-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.0) 100%); }
      .top-bar { position: absolute; top: 52px; left: var(--pad); right: var(--pad); display: flex; align-items: center; justify-content: space-between; }
      .channel-handle { color: var(--white-60); font-size: 28px; font-weight: 500; letter-spacing: 0.04em; }
      .tag-wrap { position: absolute; top: 50%; left: var(--pad); transform: translateY(-120px); }
      .tag { display: inline-block; background: var(--accent); color: #000; font-size: 26px; font-weight: 700; padding: 8px 22px; letter-spacing: 0.04em; }
      .bottom-content { position: absolute; bottom: 100px; left: var(--pad); right: var(--pad); }
      .headline { color: var(--white); font-size: 96px; font-weight: 900; line-height: 1.2; letter-spacing: -0.02em; word-break: keep-all; white-space: pre-line; }
      .headline em { color: var(--accent); font-style: normal; }
    `
  };
}

function slideText(ch, data) {
  const text = (data.text || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  const subtitle = data.subtitle || '';
  return {
    html: `
      <link href='${ch.font}' rel='stylesheet'>
      <div class='card'>
        <div class='bg-wrap'>
          <img src='${data.image_url || ""}' class='bg-img'/>
          <div class='bg-overlay'></div>
        </div>
        <div class='content'>
          ${subtitle ? `<div class='subtitle'>${subtitle}</div>` : ''}
          <div class='body-text'>${text}</div>
          <div class='channel-name'>• ${ch.channelHandle}</div>
        </div>
      </div>`,
    css: baseCSS(ch.fontFamily) + `
      .bg-wrap { position: absolute; inset: 0; }
      .bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center; filter: brightness(0.35) blur(28px); transform: scale(1.12); }
      .bg-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.25); }
      .content { position: relative; z-index: 2; padding: 100px var(--pad); width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; }
      .subtitle { color: var(--accent); font-size: 32px; font-weight: 700; letter-spacing: 0.03em; margin-bottom: 36px; text-transform: uppercase; }
      .body-text { color: var(--white); font-size: 62px; font-weight: 700; line-height: 1.55; word-break: keep-all; white-space: pre-line; }
      .body-text b { color: var(--accent); font-weight: 900; }
      .channel-name { margin-top: 70px; color: var(--white-40); font-size: 28px; font-weight: 500; }
    `
  };
}

function slideList(ch, data) {
  const items = (data.items || []).map((item, i) => {
    const txt = item.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    return `<div class='list-item'><div class='num'>${String(i + 1).padStart(2, '0')}</div><div class='item-text'>${txt}</div></div>`;
  }).join('');
  return {
    html: `
      <link href='${ch.font}' rel='stylesheet'>
      <div class='card'>
        <div class='bg'></div>
        <div class='accent-line'></div>
        <div class='content'>
          ${data.subtitle ? `<div class='subtitle'>${data.subtitle}</div>` : ''}
          <div class='list'>${items}</div>
          <div class='channel-name'>• ${ch.channelHandle}</div>
        </div>
      </div>`,
    css: baseCSS(ch.fontFamily) + `
      .bg { position: absolute; inset: 0; background: linear-gradient(160deg, #060d18 0%, #0a1e2e 55%, #061510 100%); }
      .accent-line { position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: linear-gradient(to bottom, var(--accent) 0%, transparent 100%); }
      .content { position: relative; z-index: 2; padding: 90px var(--pad); width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; }
      .subtitle { color: var(--white); font-size: 52px; font-weight: 900; line-height: 1.3; margin-bottom: 64px; word-break: keep-all; }
      .list { display: flex; flex-direction: column; gap: 40px; }
      .list-item { display: flex; align-items: flex-start; gap: 32px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .list-item:last-child { border-bottom: none; padding-bottom: 0; }
      .num { color: var(--accent); font-size: 32px; font-weight: 900; min-width: 52px; line-height: 1.5; letter-spacing: 0.02em; }
      .item-text { color: var(--white); font-size: 44px; font-weight: 700; line-height: 1.45; word-break: keep-all; }
      .item-text b { color: var(--accent); }
      .channel-name { margin-top: 60px; color: var(--white-40); font-size: 28px; font-weight: 500; }
    `
  };
}

function slideQuote(ch, data) {
  return {
    html: `
      <link href='${ch.font}' rel='stylesheet'>
      <div class='card'>
        <div class='bg-wrap'>
          <img src='${data.image_url || ""}' class='bg-img'/>
          <div class='bg-overlay'></div>
        </div>
        <div class='content'>
          <div class='quote-mark'>"</div>
          <div class='quote-text'>${data.quote || ''}</div>
          ${data.source ? `<div class='source'>— ${data.source}</div>` : ''}
          <div class='channel-name'>• ${ch.channelHandle}</div>
        </div>
      </div>`,
    css: baseCSS(ch.fontFamily) + `
      .bg-wrap { position: absolute; inset: 0; }
      .bg-img { width: 100%; height: 100%; object-fit: cover; object-position: center; filter: brightness(0.25) blur(8px); transform: scale(1.05); }
      .bg-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,20,40,0.7) 0%, rgba(0,0,0,0.5) 100%); }
      .content { position: relative; z-index: 2; padding: 100px var(--pad); width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; }
      .quote-mark { color: var(--accent); font-size: 200px; font-weight: 900; line-height: 0.7; margin-bottom: 30px; opacity: 0.5; }
      .quote-text { color: var(--white); font-size: 66px; font-weight: 700; line-height: 1.5; word-break: keep-all; white-space: pre-line; margin-bottom: 48px; }
      .source { color: var(--accent); font-size: 34px; font-weight: 700; }
      .channel-name { margin-top: 60px; color: var(--white-40); font-size: 28px; font-weight: 500; }
    `
  };
}

function slideData(ch, data) {
  const stats = (data.stats || []).map(s => `
    <div class='stat'><div class='stat-num'>${s.number}</div><div class='stat-desc'>${s.desc}</div></div>
  `).join('');
  return {
    html: `
      <link href='${ch.font}' rel='stylesheet'>
      <div class='card'>
        <div class='bg'></div>
        <div class='content'>
          ${data.subtitle ? `<div class='subtitle'>${data.subtitle}</div>` : ''}
          <div class='stats'>${stats}</div>
          <div class='channel-name'>• ${ch.channelHandle}</div>
        </div>
      </div>`,
    css: baseCSS(ch.fontFamily) + `
      .bg { position: absolute; inset: 0; background: linear-gradient(160deg, #04080f 0%, #081826 100%); }
      .content { position: relative; z-index: 2; padding: 90px var(--pad); width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; }
      .subtitle { color: var(--white); font-size: 50px; font-weight: 900; line-height: 1.3; margin-bottom: 72px; word-break: keep-all; }
      .stats { display: flex; flex-direction: column; gap: 52px; }
      .stat { padding-left: 44px; border-left: 5px solid var(--accent); }
      .stat-num { color: var(--accent); font-size: 100px; font-weight: 900; line-height: 1; letter-spacing: -0.02em; }
      .stat-desc { color: rgba(255,255,255,0.75); font-size: 38px; font-weight: 500; margin-top: 12px; word-break: keep-all; }
      .channel-name { margin-top: 64px; color: var(--white-40); font-size: 28px; font-weight: 500; }
    `
  };
}

function slideFollow(ch, data) {
  return {
    html: `
      <link href='${ch.font}' rel='stylesheet'>
      <div class='card'>
        <div class='bg'></div>
        <div class='noise'></div>
        <div class='content'>
          <div class='handle'>@${ch.channelHandle.toLowerCase()}</div>
          <div class='divider'></div>
          <div class='msg'>${ch.followMsg}</div>
          <div class='cta'>${ch.cta}</div>
        </div>
      </div>`,
    css: baseCSS(ch.fontFamily) + `
      .bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 40%, #0a2a3a 0%, #040a14 60%, #000 100%); }
      .noise { position: absolute; inset: 0; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
      .content { position: relative; z-index: 2; padding: 0 var(--pad); width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; }
      .handle { color: var(--accent); font-size: 40px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 40px; }
      .divider { width: 60px; height: 4px; background: var(--accent); margin-bottom: 56px; }
      .msg { color: var(--white); font-size: 80px; font-weight: 900; line-height: 1.3; word-break: keep-all; margin-bottom: 64px; }
      .cta { color: var(--white-60); font-size: 36px; font-weight: 500; letter-spacing: 0.02em; }
    `
  };
}

function renderSlide(ch, slide) {
  switch (slide.type) {
    case 'title':  return slideTitle(ch, slide);
    case 'text':   return slideText(ch, slide);
    case 'list':   return slideList(ch, slide);
    case 'quote':  return slideQuote(ch, slide);
    case 'data':   return slideData(ch, slide);
    case 'follow': return slideFollow(ch, slide);
    default:       return slideText(ch, slide);
  }
}

async function screenshot(html, css) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
    const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`;
    await page.setContent(full, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    return await page.screenshot({ type: 'jpeg', quality: 100, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  } finally {
    await browser.close();
  }
}

app.post('/render', async (req, res) => {
  console.log('render:', JSON.stringify(req.body).slice(0, 200));
  const { slot, lang, headline, slide2_text, image_url, slide2_image_url } = req.body;
  const ch = channels[lang] || channels.ko;
  let slideData;
  if (slot === '1')      slideData = { type: 'title', headline, image_url };
  else if (slot === '2') slideData = { type: 'text', text: slide2_text, image_url: slide2_image_url };
  else if (slot === '3') slideData = { type: 'follow' };
  else return res.status(400).json({ error: 'Invalid slot' });
  try {
    const { html, css } = renderSlide(ch, slideData);
    const buf = await screenshot(html, css);
    res.set('Content-Type', 'image/jpeg');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/render-all', async (req, res) => {
  const { lang, slides: rawSlides, image_url } = req.body;

  // 상세 디버그 로그
  console.log('render-all lang:', lang);
  console.log('render-all rawSlides type:', typeof rawSlides);
  console.log('render-all rawSlides isArray:', Array.isArray(rawSlides));
  console.log('render-all rawSlides length:', rawSlides ? rawSlides.length : 'null');
  if (rawSlides && rawSlides.length > 0) {
    console.log('render-all slide[0] type:', typeof rawSlides[0]);
    console.log('render-all slide[0] value:', JSON.stringify(rawSlides[0]).slice(0, 500));
  }

  if (!rawSlides || !Array.isArray(rawSlides)) return res.status(400).json({ error: 'slides array required' });

  let slides = [];
  for (const slide of rawSlides) {
    if (typeof slide === 'string') {
      // 문자열인 경우 파싱 시도
      const trimmed = slide.trim();
      try {
        // 단일 객체 시도
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          slides = slides.concat(parsed);
        } else {
          slides.push(parsed);
        }
      } catch(e1) {
        try {
          // 배열로 감싸서 시도
          const parsed = JSON.parse('[' + trimmed + ']');
          slides = slides.concat(parsed);
        } catch(e2) {
          console.log('parse error e1:', e1.message);
          console.log('parse error e2:', e2.message);
          console.log('failed to parse:', trimmed.slice(0, 200));
        }
      }
    } else if (typeof slide === 'object' && slide !== null) {
      slides.push(slide);
    }
  }

  console.log('render-all parsed slides count:', slides.length);

  const ch = channels[lang] || channels.ko;
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  try {
    const images = [];
    for (const slide of slides) {
      if (slide.type === 'title' && image_url && !slide.image_url) {
        slide.image_url = image_url;
      }
      const { html, css } = renderSlide(ch, slide);
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
      const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`;
      await page.setContent(full, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));
      const buf = await page.screenshot({ type: 'jpeg', quality: 100, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      images.push(buf.toString('base64'));
      await page.close();
    }
    res.json({ images });
  } catch (e) {
    console.error('render error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puppeteer renderer on port ${PORT}`));
