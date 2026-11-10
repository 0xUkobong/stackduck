import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import pages from '../lib/seo-pages.json'

const SITE_ORIGIN = 'https://stackduck.app'
const DEFAULT_DESCRIPTION = 'Monitor project health, users, errors, revenue, deployments, and uptime from one portfolio. Connect the tools you already use.'
const SOCIAL_IMAGE = `${SITE_ORIGIN}/og-image.png`
const ORGANIZATION = {
  '@type': 'Organization',
  name: 'Stackduck',
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/logo-512-3d.png`,
  sameAs: ['https://github.com/0xUkobong/stackduck', 'https://x.com/StackduckApp'],
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = url
}

export default function SeoMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = pages.find((item) => item.path === pathname)
    const privateTitle = pathname === '/signin' ? 'Sign in | Stackduck'
      : pathname === '/portfolio' ? 'Your portfolio | Stackduck'
        : pathname === '/account' ? 'Account settings | Stackduck'
          : pathname.startsWith('/projects/') ? 'Project dashboard | Stackduck'
            : pathname === '/billing/success' ? 'Billing | Stackduck'
              : pathname.startsWith('/auth/') ? 'Authentication | Stackduck'
                : pathname === '/logo-studies' ? 'Logo studies | Stackduck'
                  : 'Page not found | Stackduck'
    const title = page?.title ?? privateTitle
    const description = page?.description ?? DEFAULT_DESCRIPTION
    const canonical = `${SITE_ORIGIN}${pathname === '/' ? '/' : pathname}`
    const indexable = page?.index === true

    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,nofollow')
    setCanonical(canonical)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', SOCIAL_IMAGE)
    setMeta('property', 'og:image:alt', 'Stackduck portfolio overview showing project health, revenue, deployments, and errors.')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', SOCIAL_IMAGE)
    setMeta('name', 'twitter:image:alt', 'Stackduck portfolio overview showing project health, revenue, deployments, and errors.')

    const pageSchema = page?.kind === 'home'
      ? { '@type': 'SoftwareApplication', name: 'Stackduck', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description, url: canonical, publisher: ORGANIZATION }
      : page?.kind === 'techArticle'
        ? { '@type': 'TechArticle', headline: title, description, url: canonical, mainEntityOfPage: canonical, publisher: ORGANIZATION }
        : { '@type': 'WebPage', name: title, description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'Stackduck', url: `${SITE_ORIGIN}/` } }
    const graph = { '@context': 'https://schema.org', '@graph': [ORGANIZATION, pageSchema] }
    let script = document.head.querySelector<HTMLScriptElement>('#stackduck-seo-jsonld')
    if (!script) {
      script = document.createElement('script')
      script.id = 'stackduck-seo-jsonld'
      script.type = 'application/ld+json'
      document.head.append(script)
    }
    script.textContent = JSON.stringify(graph)
  }, [pathname])

  return null
}
