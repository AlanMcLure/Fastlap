import { afterEach, describe, expect, it, vi } from 'vitest'

import { absoluteUrl, jsonLd, siteUrl, truncate } from './seo'

afterEach(() => vi.unstubAllEnvs())

describe('siteUrl / absoluteUrl', () => {
  it('defaults to localhost and strips trailing slashes', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(siteUrl()).toBe('http://localhost:3000')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://fastlap.example//')
    expect(siteUrl()).toBe('https://fastlap.example')
    expect(absoluteUrl('/r/formula1')).toBe('https://fastlap.example/r/formula1')
    expect(absoluteUrl('faqs')).toBe('https://fastlap.example/faqs')
  })
})

describe('truncate', () => {
  it('leaves short text alone and collapses whitespace', () => {
    expect(truncate('  hola   mundo ', 50)).toBe('hola mundo')
  })
  it('cuts at a word boundary with an ellipsis, within the limit', () => {
    const out = truncate('uno dos tres cuatro cinco seis siete ocho nueve diez', 30)
    expect(out.length).toBeLessThanOrEqual(30)
    expect(out.endsWith('…')).toBe(true)
    expect(out).toBe('uno dos tres cuatro cinco…')
  })
  it('hard cuts a single long word', () => {
    expect(truncate('x'.repeat(100), 10)).toBe('xxxxxxxxx…')
  })
})

describe('jsonLd', () => {
  it('escapes < so user text cannot close the script tag', () => {
    const out = jsonLd({ headline: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('<')
    expect(JSON.parse(out).headline).toBe('</script><script>alert(1)</script>')
  })
})
