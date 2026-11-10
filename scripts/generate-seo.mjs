import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const origin = 'https://stackduck.app'
const pages = JSON.parse(await readFile(join(root, 'src/lib/seo-pages.json'), 'utf8'))
const template = await readFile(join(root, 'dist/index.html'), 'utf8')
const socialImage = `${origin}/og-image.png`
const organization = {
  '@type': 'Organization',
  name: 'Stackduck',
  url: `${origin}/`,
  logo: `${origin}/logo-512-3d.png`,
  sameAs: ['https://github.com/0xUkobong/stackduck', 'https://x.com/StackduckApp'],
}

function setMeta(html, attribute, key, content) {
  const escaped = content.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*\\/?\\s*>`, 'i')
  const tag = `<meta ${attribute}="${key}" content="${escaped}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function renderMetadata(html, page) {
  const canonical = `${origin}${page.path === '/' ? '/' : page.path}`
  const pageSchema = page.kind === 'home'
    ? { '@type': 'SoftwareApplication', name: 'Stackduck', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: page.description, url: canonical, publisher: organization }
    : page.kind === 'techArticle'
      ? { '@type': 'TechArticle', headline: page.title, description: page.description, url: canonical, mainEntityOfPage: canonical, publisher: organization }
      : { '@type': 'WebPage', name: page.title, description: page.description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'Stackduck', url: `${origin}/` } }
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, pageSchema] }).replaceAll('</', '<\\/')
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${page.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</title>`)
  html = setMeta(html, 'name', 'description', page.description)
  html = setMeta(html, 'name', 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
  html = setMeta(html, 'property', 'og:type', 'website')
  html = setMeta(html, 'property', 'og:url', canonical)
  html = setMeta(html, 'property', 'og:title', page.title)
  html = setMeta(html, 'property', 'og:description', page.description)
  html = setMeta(html, 'property', 'og:image', socialImage)
  html = setMeta(html, 'property', 'og:image:alt', 'Stackduck portfolio overview showing project health, revenue, deployments, and errors.')
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image')
  html = setMeta(html, 'name', 'twitter:title', page.title)
  html = setMeta(html, 'name', 'twitter:description', page.description)
  html = setMeta(html, 'name', 'twitter:image', socialImage)
  html = setMeta(html, 'name', 'twitter:image:alt', 'Stackduck portfolio overview showing project health, revenue, deployments, and errors.')
  const canonicalTag = `<link rel="canonical" href="${canonical}" />`
  html = /<link\s+rel="canonical"[^>]*\/?\s*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*\/?\s*>/i, canonicalTag)
    : html.replace('</head>', `    ${canonicalTag}\n  </head>`)
  const schemaTag = `<script id="stackduck-seo-jsonld" type="application/ld+json">${schema}</script>`
  html = /<script\s+id="stackduck-seo-jsonld"[^>]*>[\s\S]*?<\/script>/i.test(html)
    ? html.replace(/<script\s+id="stackduck-seo-jsonld"[^>]*>[\s\S]*?<\/script>/i, schemaTag)
    : html.replace('</head>', `    ${schemaTag}\n  </head>`)
  return html
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(page => page.index).map(page => `  <url><loc>${origin}${page.path === '/' ? '/' : page.path}</loc></url>`).join('\n')}\n</urlset>\n`
await writeFile(join(root, 'public/sitemap.xml'), sitemap)
await writeFile(join(root, 'dist/sitemap.xml'), sitemap)

for (const page of pages.filter(item => item.index)) {
  const destination = page.path === '/' ? join(root, 'dist/index.html') : join(root, 'dist', page.path.slice(1), 'index.html')
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, renderMetadata(template, page))
}

console.log(`Generated SEO metadata for ${pages.filter(page => page.index).length} public routes.`)
