/** Public origin of the site, without a trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/** Cuts text to `max` characters at a word boundary, adding an ellipsis when it was shortened. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** Meta-description length that search engines show without cutting. */
export const DESCRIPTION_MAX = 160

/** JSON for a `<script type="application/ld+json">`: `<` is escaped so content cannot close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
