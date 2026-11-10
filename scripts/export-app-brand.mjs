import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pub = path.join(root, 'public')
const previewDir = path.join(root, 'output/brand-refresh')
fs.mkdirSync(previewDir, { recursive: true })
const data = (file, mime = 'image/png') => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
const master = data(path.join(pub, 'brand/stackduck-3d-master.png'))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage()
const document = html => `<!doctype html><html><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:transparent}body{font-family:Arial,sans-serif}.tile{position:relative;width:100vw;height:100vh;overflow:hidden;background:#151b31;border-radius:24%}.tile img{position:absolute;width:118%;height:118%;left:-9%;top:-9%;object-fit:contain}</style><body>${html}</body></html>`
async function render(file, width, height, html, transparent = true) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.setContent(document(html), { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  assert(await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)), `${file}: images load`)
  await page.screenshot({ path: file, omitBackground: transparent })
  const bytes = fs.readFileSync(file)
  assert.equal(bytes.readUInt32BE(16), width)
  assert.equal(bytes.readUInt32BE(20), height)
}

try {
  for (const size of [64, 128, 256, 512, 1024]) {
    await render(path.join(pub, `logo-${size}-3d.png`), size, size, `<div class="tile"><img src="${master}" alt=""></div>`)
  }
  fs.copyFileSync(path.join(pub, 'logo-512-3d.png'), path.join(pub, 'logo.png'))
  fs.copyFileSync(path.join(pub, 'logo.png'), path.join(pub, 'logo-dark.png'))
  const mark = data(path.join(pub, 'logo-256-3d.png'))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><image width="256" height="256" href="${mark}"/></svg>\n`
  fs.writeFileSync(path.join(pub, 'logo.svg'), svg)
  fs.writeFileSync(path.join(pub, 'logo-dark.svg'), svg)
  for (const dark of [false, true]) {
    const name = `logo-wordmark${dark ? '-dark' : ''}`
    const color = dark ? '#f2f2f2' : '#151b31'
    fs.writeFileSync(path.join(pub, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 204 40"><image width="40" height="40" href="${mark}"/><text x="52" y="27" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="600" fill="${color}" letter-spacing="-0.02em">Stackduck</text></svg>\n`)
    await render(path.join(pub, `${name}.png`), 816, 160, `<div style="display:flex;gap:38px;align-items:center;height:160px;color:${color};font-size:88px;font-weight:600;letter-spacing:-2px"><img src="${mark}" width="160" height="160" alt=""><span>Stackduck</span></div>`)
  }
  await render(path.join(pub, 'apple-touch-icon.png'), 180, 180, `<div class="tile" style="border-radius:0"><img src="${master}" alt=""></div>`)
  const favicon = data(path.join(pub, 'favicon.svg'), 'image/svg+xml')
  for (const size of [16, 32, 48]) await render(path.join(pub, `favicon-${size}.png`), size, size, `<img src="${favicon}" width="${size}" height="${size}" alt="">`)
  fs.copyFileSync(path.join(pub, 'favicon-32.png'), path.join(pub, 'favicon.png'))
  const sizes = [16, 32, 48]
  const header = Buffer.alloc(6 + sizes.length * 16)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  const payloads = sizes.map((size, i) => {
    const image = fs.readFileSync(path.join(pub, `favicon-${size}.png`))
    const entry = 6 + i * 16
    header[entry] = size; header[entry + 1] = size
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(image.length, entry + 8); header.writeUInt32LE(offset, entry + 12)
    offset += image.length
    return image
  })
  fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([header, ...payloads]))

  // Change only the old embedded mark, retaining existing campaign copy/layout edits.
  const kit = path.join(root, 'output/brand-kit')
  if (fs.existsSync(path.join(kit, 'manifest.json'))) {
    const manifest = JSON.parse(fs.readFileSync(path.join(kit, 'manifest.json'), 'utf8'))
    for (const asset of manifest.assets) {
      const file = path.join(kit, `${asset.name}.html`)
      if (!fs.existsSync(file)) continue
      if (/^logo-\d+$/.test(asset.name)) {
        const html = document(`<div class="tile"><img src="${master}" alt="Stackduck"></div>`)
        fs.writeFileSync(file, html)
        await render(path.join(kit, `${asset.name}.png`), asset.width, asset.height, `<div class="tile"><img src="${master}" alt="Stackduck"></div>`)
        asset.bytes = fs.statSync(path.join(kit, `${asset.name}.png`)).size
        continue
      }
      const before = fs.readFileSync(file, 'utf8')
      const html = before.replace(/data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/g, (value, encoded) => {
        const decoded = Buffer.from(encoded, 'base64').toString('utf8')
        return decoded.includes('M13 30c4 2') ? mark : value
      })
      if (html === before) continue
      fs.writeFileSync(file, html)
      await page.setViewport({ width: asset.width, height: asset.height, deviceScaleFactor: 1 })
      await page.setContent(html, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: path.join(kit, `${asset.name}.png`), omitBackground: asset.transparent })
      asset.bytes = fs.statSync(path.join(kit, `${asset.name}.png`)).size
    }
    fs.copyFileSync(path.join(pub, 'logo.svg'), path.join(kit, 'logo.svg'))
    fs.writeFileSync(path.join(kit, 'manifest.json'), JSON.stringify(manifest, null, 2))
    const index = path.join(kit, 'index.html')
    if (fs.existsSync(index)) {
      const html = fs.readFileSync(index, 'utf8').replace(/(<a href="([^"]+\.png)"><img src=")data:image\/png;base64,[^"]+/g, '$1$2')
      fs.writeFileSync(index, html)
      await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
      await page.goto(pathToFileURL(index).href, { waitUntil: 'load' })
      await page.screenshot({ path: path.join(kit, 'kit-preview.png'), fullPage: true })
    }
  }
  fs.copyFileSync(path.join(pub, 'logo.svg'), path.join(root, 'output/social-kit-coming-soon/assets/logo.svg'))
  fs.copyFileSync(path.join(pub, 'logo-1024-3d.png'), path.join(root, 'output/social-kit-coming-soon/assets/logo-profile.png'))

  const swatch = (title, bg) => `<section style="background:${bg};color:${bg === '#151b31' ? '#f2f2f2' : '#151b31'};padding:45px;border-radius:20px"><h2 style="font-size:20px;margin:0 0 36px">${title}</h2><div style="display:flex;align-items:center;gap:20px"><img src="${mark}" width="64" height="64" alt=""><strong style="font-size:38px">Stackduck</strong></div><div style="display:flex;gap:35px;align-items:end;margin-top:40px">${[16, 32, 64, 128].map(s => `<div><img src="${s <= 32 ? favicon : mark}" width="${s}" height="${s}" alt=""><p style="font-size:12px">${s}px</p></div>`).join('')}</div></section>`
  const preview = document(`<main style="width:1200px;padding:60px;background:#e8ece9"><h1 style="margin:0 0 12px;font-size:40px;letter-spacing:-1.5px">Stackduck / The new mark.</h1><p style="margin:0 0 40px;color:#52606b">Image #2 primary · Ivory duck / navy tile · Matching small-size favicon</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">${swatch('Light surfaces', '#fff')}${swatch('Dark surfaces', '#151b31')}</div><div style="display:flex;gap:40px;align-items:center;margin-top:40px"><img src="${master}" width="280" height="280" alt=""><div><h2>One identity, adapted to the size.</h2><p>Transparent 3D master → app mark → simplified favicon.</p><p>stackduck.app · @StackduckApp · Built by @0xUkobong</p></div></div></main>`)
  fs.writeFileSync(path.join(previewDir, 'index.html'), preview)
  await page.setViewport({ width: 1200, height: 1150, deviceScaleFactor: 1 })
  await page.setContent(preview, { waitUntil: 'load' })
  await page.screenshot({ path: path.join(previewDir, 'brand-preview.png'), fullPage: true })
  console.log('Updated app marks, SVG/PNG wordmarks, favicon SVG/PNG/ICO, Apple touch icon, legacy cover marks, and campaign logo source.')
} finally {
  await browser.close()
}
