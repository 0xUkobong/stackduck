import { Link } from 'react-router-dom'
import Logo from './Logo'
import DiscordIcon from './DiscordIcon'
import XIcon from './XIcon'

function GitHubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

/** Source and developer contact links. */
const SOCIALS: Array<{
  href: string
  label: string
  Icon: (props: { size?: number }) => React.ReactElement
}> = [
  { href: 'https://github.com/0xUkobong/stackduck', label: 'GitHub', Icon: GitHubIcon },
  { href: 'https://x.com/StackduckApp', label: 'X', Icon: XIcon },
  { href: 'https://discord.gg/stackduck', label: 'Discord', Icon: DiscordIcon },
]

const GROUPS: Array<{
  title: string
  links: Array<{ to: string; label: string; external?: boolean }>
}> = [
  {
    title: 'Product',
    links: [
      { to: '/about', label: 'About' },
      { to: '/docs', label: 'Docs' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/support', label: 'Support' },
      { to: '/feedback', label: 'Feedback' },
      { to: '/changelog', label: 'Changelog' },
      { to: 'https://github.com/0xUkobong/stackduck', label: 'GitHub', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/license', label: 'License' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
      { to: '/security', label: 'Security' },
    ],
  },
]

/** Shared public footer: brand block with weight + grouped link columns. */
export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
            {/* Brand block — more visual weight than the link columns. */}
            <div>
              <Logo />
              <p className="mt-4 max-w-xs font-inter text-sm text-ink-muted">
                Give every project a home and a heartbeat — health, users, and
                revenue in one place.
              </p>
              {/* Source and developer contacts. */}
              <div className="mt-6 flex items-center gap-1">
                {SOCIALS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={
                      label === 'GitHub'
                        ? 'Stackduck source'
                        : label === 'X'
                          ? '@StackduckApp on X'
                          : `Stackduck on ${label}`
                    }
                    title={
                      label === 'GitHub'
                        ? 'Stackduck source'
                        : label === 'X'
                          ? '@StackduckApp on X'
                          : `Stackduck on ${label}`
                    }
                    className="rounded-lg p-2 text-ink-muted transition-colors duration-150 hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {GROUPS.map((group) => (
              <nav key={group.title} aria-label={`Footer — ${group.title}`}>
                <p className="font-inter text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {group.title}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {group.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a
                          href={l.to}
                          target="_blank"
                          rel="noreferrer"
                          className="nav-link flex items-center gap-1.5 text-sm"
                          aria-label="Stackduck on GitHub"
                        >
                          <GitHubIcon />
                          {l.label}
                        </a>
                      ) : (
                        <Link to={l.to} className="nav-link text-sm">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start gap-2 border-t border-line pt-5 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
            <p className="font-inter text-xs text-ink-muted">© 2026 Stackduck</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-inter text-xs text-ink-muted">
              <span>Open source under the MIT License</span>
              <Link to="/license" className="text-link">License</Link>
              <a href="https://github.com/0xUkobong/stackduck" target="_blank" rel="noreferrer" className="text-link">
                Source on GitHub
              </a>
            </div>
          </div>
        </div>
    </footer>
  )
}
