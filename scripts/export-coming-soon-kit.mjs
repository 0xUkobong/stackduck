import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'output/social-kit-coming-soon')
fs.mkdirSync(out, { recursive: true })
const assets = []
const css = `
@font-face{font-family:Runde;src:url('assets/runde-400.woff2');font-weight:400}
@font-face{font-family:Runde;src:url('assets/runde-600.woff2');font-weight:600}
@font-face{font-family:Runde;src:url('assets/runde-700.woff2');font-weight:700}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}
body{font-family:Runde,sans-serif;-webkit-font-smoothing:antialiased}
.canvas{position:relative;width:100vw;height:100vh;overflow:hidden;background:#151b31;color:#f2f2f2}
.mint{background:#A8DCC4;color:#151b31}.paper{background:#f2f2f2;color:#151b31}
.pos{position:absolute}h1,h2,p{margin:0}h1,h2{font-weight:700;letter-spacing:-.052em;line-height:1.06}
.brand{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:600;letter-spacing:-1.3px}
.brand img{display:block;flex-shrink:0}.logo-only{display:block}
.tag{display:inline-flex;align-items:center;gap:10px;font-size:17px;line-height:1;font-weight:600;letter-spacing:1.9px;text-transform:uppercase;color:#A8DCC4}
.tag:before{content:'';width:8px;height:8px;border-radius:50%;background:currentColor}
.mint .tag,.paper .tag{color:#151b31}
.sub{font-size:29px;line-height:1.5;font-weight:400;color:#bbc2d1;letter-spacing:-.6px}
.mint .sub,.paper .sub{color:#3c5355}
.art{position:absolute;display:block;object-fit:contain;mask-image:radial-gradient(ellipse 64% 63% at 50% 50%,black 53%,transparent 83%)}
.rule{height:1px;background:#f2f2f229}.mint .rule,.paper .rule{background:#151b3129}
.url{font-size:31px;font-weight:600;letter-spacing:-1px}.credit{font-size:21px;color:#bbc2d1;letter-spacing:-.4px}
.mint .credit,.paper .credit{color:#3c5355}.handle{font-size:23px;letter-spacing:-.5px}
.pill{padding:12px 20px;border:1px solid #f2f2f23b;border-radius:50px;display:flex;align-items:center;gap:10px;font-size:19px}
.mint .pill,.paper .pill{border-color:#151b3140}
.pill:before{content:'';width:8px;height:8px;border-radius:50%;background:#A8DCC4}
.mint .pill:before,.paper .pill:before{background:#151b31}
.count{font-size:21px;letter-spacing:1px;color:#bbc2d1}.mint .count,.paper .count{color:#3c5355}
`
const pos = (x, y, content, style = '') => `<div class="pos" style="left:${x}px;top:${y}px;${style}">${content}</div>`
const brand = (size = 54) => `<div class="brand" style="font-size:${size * .64}px"><img src="assets/logo.svg" width="${size}" height="${size}" alt="">Stackduck</div>`
const tag = () => '<span class="tag">Coming soon</span>'
const art = (theme, x, y, size) => `<img class="art" src="assets/duck-${theme}.png" alt="Stackduck 3D duck illustration" style="left:${x}px;top:${y}px;width:${size}px;height:${size}px">`
const headline = (text, size) => `<h1 style="font-size:${size}px">${text}</h1>`
const footer = (width, y, pad = 82) => `${pos(pad, y, '<div class="rule"></div>', `width:${width - pad * 2}px`)}${pos(pad, y + 32, '<p class="url">stackduck.app</p>')}${pos(width / 2 - 100, y + 40, '<p class="handle">@StackduckApp</p>')}${pos(0, y + 41, '<p class="credit">Built by @0xUkobong</p>', `right:${pad}px;left:auto;text-align:right`)}`
const doc = (title, theme, content) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title} — Stackduck</title><style>${css}</style></head><body><main class="canvas ${theme}">${content}</main></body></html>`

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage()
page.on('pageerror', error => { throw error })

async function emit(name, width, height, theme, content, usage, jpeg = false) {
  const html = doc(name, theme, content)
  fs.writeFileSync(path.join(out, `${name}.html`), html)
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(path.join(out, `${name}.html`)).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  assert(await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)), `${name}: all images load`)
  assert(await page.evaluate(() => [...document.querySelectorAll('h1,h2,.brand,.tag,.url,.handle,.credit')].every(e => {
    const b = e.getBoundingClientRect()
    return b.left >= -1 && b.top >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1
  })), `${name}: text stays within the canvas`)
  await page.screenshot({ path: path.join(out, `${name}.png`) })
  const png = fs.readFileSync(path.join(out, `${name}.png`))
  assert.equal(png.readUInt32BE(16), width)
  assert.equal(png.readUInt32BE(20), height)
  if (jpeg) await page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 94 })
  assets.push({ name, width, height, theme: theme || 'navy', usage, bytes: png.length, jpeg })
  console.log(`${name}: ${width} x ${height}, ${Math.round(png.length / 1024)} KB`)
}

try {
  for (const size of [400, 1024]) {
    await emit(`01-profile-navy-${size}`, size, size, '', `<img class="logo-only" src="assets/logo-profile.png" width="${size * .84}" height="${size * .84}" alt="Stackduck logo" style="position:absolute;inset:8%">`, 'Primary 3D profile image, centered with circular-crop room.')
  }
  await emit('02-profile-mint-400', 400, 400, 'mint', '<img class="logo-only" src="assets/logo.svg" width="288" height="288" alt="Stackduck logo" style="position:absolute;left:56px;top:56px">', 'Alternative mint profile image with the existing navy app mark.')
  await emit('02-profile-3d-400', 400, 400, '', art('navy', 0, 0, 400), '3D campaign mascot profile alternative, centered for circular cropping.')

  for (const theme of ['navy', 'mint']) {
    const isMint = theme === 'mint'
    await emit(`03-x-header-${theme}`, 1500, 500, isMint ? 'mint' : '',
      `${art(theme, 1015, -12, 505)}${pos(342, 83, brand(44))}${pos(745, 98, '<p class="credit" style="font-size:17px">Built by @0xUkobong</p>')}${pos(342, 158, headline('Your stack.<br>One clear view.', 66), 'width:740px')}${pos(344, 334, tag())}${pos(344, 381, '<p class="url" style="font-size:25px">stackduck.app</p>')}${pos(694, 385, '<p class="handle" style="font-size:20px">@StackduckApp</p>')}`,
      'X header. Critical text avoids the lower-left avatar overlap and the top/bottom edges.', true)
  }

  for (const theme of ['navy', 'mint']) {
    await emit(`04-pinned-post-${theme}`, 1600, 900, theme === 'mint' ? 'mint' : '',
      `${art(theme, 835, 102, 775)}${pos(88, 72, brand(62))}${pos(1255, 96, tag())}${pos(88, 244, headline('Your stack.<br>One clear view.', 105), 'width:890px')}${pos(94, 520, '<p class="sub">Usage, errors, revenue,<br>deployments &amp; uptime. Together.</p>')}${footer(1600, 770, 94)}`,
      'Primary coming-soon cover for the pinned X post, LinkedIn feed, or launch announcement.', true)
  }

  for (const theme of ['navy', 'mint']) {
    await emit(`05-feed-square-${theme}`, 1080, 1080, theme === 'mint' ? 'mint' : '',
      `${art(theme, 190, 340, 700)}${pos(66, 62, brand(53))}${pos(805, 81, tag())}${pos(66, 194, headline('Less switching.<br>More building.', 85), 'width:950px')}${pos(70, 401, '<p class="sub" style="font-size:25px">Your project portfolio, in one place.</p>')}${pos(70, 958, '<div class="rule"></div>', 'width:940px')}${pos(70, 989, '<p class="url" style="font-size:29px">stackduck.app</p>')}${pos(700, 980, '<p class="handle" style="font-size:21px">@StackduckApp</p><p class="credit" style="font-size:17px;margin-top:9px">Built by @0xUkobong</p>')}`,
      'Square social announcement for Instagram, X, LinkedIn, and community posts.', true)
  }

  await emit('06-feed-portrait', 1080, 1350, '',
    `${art('navy', 105, 425, 870)}${pos(72, 68, brand(58))}${pos(800, 91, tag())}${pos(72, 229, headline('Your stack.<br>One clear view.', 94), 'width:950px')}${pos(76, 464, '<p class="sub" style="font-size:27px">Less tab-hopping. More building.</p>')}${pos(74, 1214, '<div class="rule"></div>', 'width:932px')}${pos(74, 1254, '<p class="url">stackduck.app</p>')}${pos(706, 1244, '<p class="handle">@StackduckApp</p><p class="credit" style="font-size:18px;margin-top:10px">Built by @0xUkobong</p>')}`,
    '4:5 portrait feed poster and carousel opening slide.', true)

  await emit('07-story-coming-soon', 1080, 1920, '',
    `${art('navy', 35, 595, 1010)}${pos(84, 180, brand(65))}${pos(802, 203, tag())}${pos(80, 334, headline('Your stack.<br>One clear view.', 106), 'width:940px')}${pos(86, 596, '<p class="sub" style="font-size:29px">Less switching. More building.</p>')}${pos(86, 1550, '<div class="rule"></div>', 'width:908px')}${pos(86, 1600, '<p class="url" style="font-size:41px">stackduck.app</p>')}${pos(86, 1672, '<p class="handle" style="font-size:29px">Follow @StackduckApp for the launch.</p>')}${pos(86, 1730, '<p class="credit" style="font-size:24px">Built by @0xUkobong</p>')}`,
    '9:16 Instagram/Facebook story or short-video cover. Preview overlays before uploading.', true)

  await emit('08-link-preview', 1200, 630, '',
    `${art('navy', 680, 55, 520)}${pos(62, 54, brand(47))}${pos(66, 186, headline('Your stack.<br>One clear view.', 77), 'width:700px')}${pos(68, 397, tag())}${pos(68, 468, '<p class="url" style="font-size:29px">stackduck.app</p>')}${pos(70, 546, '<p class="credit" style="font-size:19px">@StackduckApp · Built by @0xUkobong</p>')}`,
    '1200 x 630 manual link-card or press preview image. Supplied as an asset; site metadata is unchanged.', true)

  await emit('09-linkedin-personal-header', 1584, 396, 'mint',
    `${art('mint', 1190, -4, 410)}${pos(372, 73, brand(42))}${pos(800, 87, '<p class="credit" style="font-size:17px">Built by @0xUkobong</p>')}${pos(372, 149, headline('Your stack. One clear view.', 53), 'width:1050px')}${pos(376, 246, '<p class="url" style="font-size:25px">stackduck.app</p>')}${pos(724, 254, tag())}`,
    'LinkedIn personal background, not a company-page banner. Copy avoids lower-left profile overlap.', true)

  await emit('10-youtube-banner', 2560, 1440, '',
    `${pos(592, 558, brand(59))}${pos(1150, 578, '<p class="credit" style="font-size:20px">Built by @0xUkobong</p>')}${pos(594, 653, headline('Your stack.<br>One clear view.', 87), 'width:1200px')}${art('navy', 1440, 452, 575)}${pos(598, 886, '<p class="url" style="font-size:28px">stackduck.app</p>')}${pos(1020, 894, tag())}`,
    'YouTube banner. Essential content is in the central 1546 x 423 band.', true)

  await emit('11-carousel-02-workflow', 1080, 1350, 'mint',
    `${pos(70, 70, brand(55))}${pos(670, 93, tag())}${pos(920, 91, '<p class="count">02 / 03</p>')}${pos(70, 229, headline('Built for the<br>way you build.', 88), 'width:940px')}${[
      ['01', 'Create a project.', 'Give every build a home.'],
      ['02', 'Connect your stack.', 'Bring your supported sources together.'],
      ['03', 'See what matters.', 'Check metrics, project health, and alerts.'],
    ].map(([n, title, description], i) => `${pos(74, 540 + i * 179, `<p class="count" style="font-size:24px">${n}</p>`)}${pos(164, 531 + i * 179, `<h2 style="font-size:47px;letter-spacing:-2px">${title}</h2><p class="sub" style="font-size:24px;margin-top:17px">${description}</p>`)}${pos(74, 675 + i * 179, '<div class="rule"></div>', 'width:932px')}`).join('')}${pos(74, 1208, '<p class="url" style="font-size:29px">stackduck.app</p>')}${pos(707, 1206, '<p class="handle" style="font-size:21px">@StackduckApp</p><p class="credit" style="font-size:17px;margin-top:10px">Built by @0xUkobong</p>')}`,
    'Carousel slide 2. Pair after 06-feed-portrait, then 12-carousel-03-follow.', true)

  await emit('12-carousel-03-follow', 1080, 1350, '',
    `${art('navy', 228, 525, 625)}${pos(70, 70, brand(55))}${pos(920, 91, '<p class="count">03 / 03</p>')}${pos(74, 232, tag())}${pos(70, 306, headline('A clearer view<br>is on the way.', 89), 'width:940px')}${pos(74, 1094, '<h2 style="font-size:52px;letter-spacing:-2px">Follow @StackduckApp</h2>')}${pos(76, 1173, '<p class="url" style="font-size:31px">stackduck.app</p>')}${pos(76, 1230, '<p class="credit" style="font-size:22px">Built by @0xUkobong</p>')}`,
    'Carousel final slide and standalone follow/coming-soon teaser.', true)

  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ brand: 'Stackduck', campaign: 'Coming soon', account: '@StackduckApp', developer: '@0xUkobong', website: 'https://stackduck.app', assets }, null, 2))
  const thumb = (name, label) => `<article><img src="${name}.png" alt="${label}"><div><strong>${label}</strong><span>${assets.find(a => a.name === name).width} × ${assets.find(a => a.name === name).height}</span></div></article>`
  const preview = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Stackduck / Coming soon</title><style>@font-face{font-family:Runde;src:url('assets/runde-600.woff2')}*{box-sizing:border-box}body{margin:0;background:#e7ece9;color:#151b31;font-family:Runde,sans-serif}.board{width:1800px;padding:65px}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:42px}h1{font-size:44px;letter-spacing:-2px;margin:0}p{margin:10px 0 0;color:#536268;font-size:20px}.chip{background:#151b31;color:#A8DCC4;padding:18px 25px;border-radius:40px;font-size:20px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}article{margin:0;background:#fff;overflow:hidden;border-radius:16px}article img{display:block;width:100%;height:320px;object-fit:contain;background:#151b31}article div{padding:22px;display:flex;justify-content:space-between;gap:12px}strong{font-size:18px}span{font-size:16px;color:#69747c}.wide{margin-bottom:28px}.wide img{height:auto;width:100%;display:block}.wide article div{padding:20px}.bottom{display:flex;justify-content:space-between;font-size:21px;margin-top:36px}</style></head><body><main class="board"><div class="top"><div><h1>Stackduck / Coming soon.</h1><p>A coordinated launch kit. Built around your existing brand.</p></div><div class="chip">@StackduckApp</div></div><section class="wide">${thumb('03-x-header-navy','X cover banner · Navy')}</section><div class="grid">${thumb('01-profile-navy-400','Primary profile image')}${thumb('04-pinned-post-navy','Pinned-post cover · Navy')}${thumb('04-pinned-post-mint','Pinned-post cover · Mint')}${thumb('05-feed-square-navy','Square feed · Navy')}${thumb('05-feed-square-mint','Square feed · Mint')}${thumb('08-link-preview','Link / press preview')}${thumb('06-feed-portrait','Portrait / Carousel 01')}${thumb('11-carousel-02-workflow','Carousel 02 / Workflow')}${thumb('12-carousel-03-follow','Carousel 03 / Follow')}${thumb('07-story-coming-soon','Story / Vertical cover')}${thumb('03-x-header-mint','X cover banner · Mint')}${thumb('09-linkedin-personal-header','LinkedIn background')}</div><div class="bottom"><span>stackduck.app</span><span>Built by @0xUkobong</span><span>PNG + JPG + editable HTML</span></div></main></body></html>`
  fs.writeFileSync(path.join(out, 'index.html'), preview)
  await page.setViewport({ width: 1800, height: 1200, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(path.join(out, 'index.html')).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(out, 'kit-preview.png'), fullPage: true })
  console.log(`Exported ${assets.length} PNG assets and ${assets.filter(a => a.jpeg).length} JPEG alternatives.`)
} finally {
  await browser.close()
}
