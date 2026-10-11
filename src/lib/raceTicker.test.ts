import { describe, expect, it } from 'vitest'

import type { Race } from '@/lib/f1/schemas'
import { compactCountdown, tickerState } from './raceTicker'

const race = {
  season: 2026,
  round: 16,
  raceName: 'Bahrain Grand Prix in Malaysia',
  date: '2026-10-04',
  time: '07:00:00Z',
  FirstPractice: { date: '2026-10-02', time: '04:30:00Z' },
  Qualifying: { date: '2026-10-03', time: '08:00:00Z' },
} as unknown as Race

describe('tickerState', () => {
  it('is the next GP before the weekend starts', () => {
    expect(tickerState(race, new Date('2026-09-30T12:00:00Z'))).toBe('next')
  })
  it('is the weekend from the first session', () => {
    expect(tickerState(race, new Date('2026-10-02T04:30:00Z'))).toBe('weekend')
  })
  it('is race day on the Madrid calendar day of the start', () => {
    expect(tickerState(race, new Date('2026-10-03T22:30:00Z'))).toBe('today') // 00:30 in Madrid
    expect(tickerState(race, new Date('2026-10-03T21:30:00Z'))).toBe('weekend') // 23:30 in Madrid
  })
  it('is live from the start until the race counts as finished', () => {
    expect(tickerState(race, new Date('2026-10-04T07:00:00Z'))).toBe('live')
    expect(tickerState(race, new Date('2026-10-04T09:59:00Z'))).toBe('live')
  })
})

describe('compactCountdown', () => {
  it('shows days and hours:minutes a day or more out', () => {
    expect(compactCountdown(3 * 86400 + 4 * 3600 + 12 * 60 + 9)).toBe('3 D 04:12')
  })
  it('shows hours:minutes:seconds on the last day', () => {
    expect(compactCountdown(6 * 3600 + 23 * 60 + 25)).toBe('06:23:25')
    expect(compactCountdown(0)).toBe('00:00:00')
    expect(compactCountdown(-5)).toBe('00:00:00')
  })
})
