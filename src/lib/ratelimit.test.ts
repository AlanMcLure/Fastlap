import { describe, expect, it } from 'vitest'

import { RateLimit } from './ratelimit'

const clock = (start = 1_000_000) => {
  let t = start
  return { now: () => t, advance: (ms: number) => (t += ms) }
}

describe('RateLimit', () => {
  it('allows up to max requests inside the window and refuses the next', async () => {
    const c = clock()
    const rl = new RateLimit(3, '10 s', c.now)
    for (let i = 0; i < 3; i++) expect((await rl.limit('u')).success).toBe(true)
    expect((await rl.limit('u')).success).toBe(false)
  })

  it('counts each identifier separately', async () => {
    const rl = new RateLimit(1, '1 m', clock().now)
    expect((await rl.limit('a')).success).toBe(true)
    expect((await rl.limit('b')).success).toBe(true)
    expect((await rl.limit('a')).success).toBe(false)
  })

  it('slides: old requests stop counting once they leave the window', async () => {
    const c = clock()
    const rl = new RateLimit(2, '10 s', c.now)
    await rl.limit('u')
    c.advance(6_000)
    await rl.limit('u')
    expect((await rl.limit('u')).success).toBe(false)
    c.advance(4_000) // the first request is now 10 s old
    expect((await rl.limit('u')).success).toBe(true)
    expect((await rl.limit('u')).success).toBe(false)
  })

  it('refused requests do not extend the block', async () => {
    const c = clock()
    const rl = new RateLimit(1, '1 m', c.now)
    await rl.limit('u')
    c.advance(30_000)
    expect((await rl.limit('u')).success).toBe(false)
    c.advance(30_000)
    expect((await rl.limit('u')).success).toBe(true)
  })

  it('parses hours and days', async () => {
    const c = clock()
    const rl = new RateLimit(1, '1 d', c.now)
    await rl.limit('u')
    c.advance(23 * 3_600_000)
    expect((await rl.limit('u')).success).toBe(false)
    c.advance(3_600_000)
    expect((await rl.limit('u')).success).toBe(true)
  })

  it('forgets identifiers that went idle, and still limits after the sweep', async () => {
    const c = clock()
    const rl = new RateLimit(1, '10 s', c.now)
    await rl.limit('idle')
    c.advance(120_000)
    expect((await rl.limit('other')).success).toBe(true)
    expect((rl as unknown as { hits: Map<string, number[]> }).hits.has('idle')).toBe(false)
    expect((await rl.limit('other')).success).toBe(false)
  })
})
