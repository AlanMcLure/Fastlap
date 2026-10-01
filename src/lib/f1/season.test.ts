import { describe, expect, it } from 'vitest'

import { resolveSeason, seasonOptions } from './season'

const now = new Date('2026-10-01T00:00:00Z')

describe('resolveSeason', () => {
  it('accepts a valid year', () => {
    expect(resolveSeason('2024', now)).toBe(2024)
    expect(resolveSeason('1950', now)).toBe(1950)
    expect(resolveSeason('2027', now)).toBe(2027) // next season's calendar may already exist
  })

  it.each([undefined, '', 'abc', '1949', '2028', '2024.5', '20 24', '-2024'])('falls back to the current year for %j', (raw) => {
    expect(resolveSeason(raw, now)).toBe(2026)
  })
})

describe('seasonOptions', () => {
  it('goes from the current year down to 1950', () => {
    const years = seasonOptions(2026, now)
    expect(years[0]).toBe(2026)
    expect(years[years.length - 1]).toBe(1950)
    expect(years).toHaveLength(77)
  })

  it('includes a selected season newer than the current one', () => {
    expect(seasonOptions(2027, now)[0]).toBe(2027)
  })
})
