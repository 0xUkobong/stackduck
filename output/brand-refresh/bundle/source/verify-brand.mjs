import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import puppeteer from 'puppeteer-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'output/brand-refresh')
fs.mkdirSync(out, { recursive: true })
const server = await preview({ root, preview: { host: '127.0.0.1', port: 5176, strictPort: true } })
let browser
try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setRequestInterception(true)
  page.on('request', request => {
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(request.url())) request.abort()
    else request.continue()
  })
  for (const theme of ['light', 'dark']) {
    await page.evaluateOnNewDocument(theme => localStorage.setItem('stackduck-theme', theme), theme)
    for (const width of [1280, 390]) {
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 })
      for (const route of ['/', '/signin', '/docs']) {
        await page.goto('http://127.0.0.1:5176' + route, { waitUntil: 'networkidle0' })
        await page.waitForSelector('img[alt="Stackduck mark"]')
        await page.waitForFunction(() => [...document.querySelectorAll('img[alt="Stackduck mark"]')].every(i => i.complete && i.naturalWidth > 0))
        const logo = await page.$eval('img[alt="Stackduck mark"]', i => ({ src: i.currentSrc, naturalWidth: i.naturalWidth, width: i.width }))
        assert(logo.naturalWidth >= logo.width - 1 && logo.src.includes('-3d.png'), JSON.stringify({ route, theme, width, logo }))
        assert.equal(await page.$eval('html', e => e.dataset.theme), theme)
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
        if (route === '/' || route === '/signin') await page.screenshot({ path: path.join(out, `${route === '/' ? 'landing' : 'signin'}-${theme}-${width}.png`) })
      }
    }
  }
  const metadata = await page.$eval('meta[property="og:image"]', e => e.content)
  assert(metadata.endsWith('/og-image-3d.png'))
  for (const file of ['favicon.svg', 'favicon-16.png', 'favicon-32.png', 'favicon.ico', 'apple-touch-icon.png', 'logo-64-3d.png', 'logo-128-3d.png', 'logo-256-3d.png', 'og-image-3d.png']) {
    const response = await fetch('http://127.0.0.1:5176/' + file)
    assert.equal(response.status, 200, file)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (file.endsWith('.png')) assert.equal(bytes.subarray(1, 4).toString(), 'PNG', file)
    if (file.endsWith('.ico')) assert.equal(bytes.readUInt16LE(2), 1)
  }
  assert.deepEqual(errors, [])
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify({ result: 'passed', routes: ['/', '/signin', '/docs'], themes: ['light', 'dark'], widths: [1280, 390], checks: ['responsive 3D logo loaded', 'no horizontal overflow', 'theme preserved', 'favicon and touch icons served', 'new social preview served', 'no JavaScript page errors'] }, null, 2))
  console.log('PASS: production logo on landing/signin/docs at 390px and 1280px, both themes; favicon/ICO/touch/social assets; no page errors.')
} finally {
  if (browser) await browser.close()
  await new Promise(resolve => server.httpServer.close(resolve))
}
