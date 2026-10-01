import { describe, expect, it } from 'vitest'

import type { Race } from '@/lib/f1/schemas'
import { dotdState, raceThreadContent, raceThreadTitle, tally, weekendStarted } from './raceHub'

const race = {
  season: 2025,
  round: 2,
  raceName: 'Chinese Grand Prix',
  Circuit: { circuitId: 'shanghai', circuitName: 'Shanghai International Circuit', Location: { lat: '1', long: '2', locality: 'Shanghai', country: 'China' } },
  date: '2025-03-23',
  time: '07:00:00Z',
  FirstPractice: { date: '2025-03-21', time: '03:30:00Z' },
} as unknown as Race

describe('dotdState', () => {
  it('is not open until the race has ended', () => {
    expect(dotdState(race, true, new Date('2025-03-23T09:59:00Z'))).toBe('not-open')
  })
  it('is not open without results even after the race', () => {
    expect(dotdState(race, false, new Date('2025-03-23T12:00:00Z'))).toBe('not-open')
  })
  it('is open for 48 hours after the race', () => {
    expect(dotdState(race, true, new Date('2025-03-23T10:00:00Z'))).toBe('open')
    expect(dotdState(race, true, new Date('2025-03-25T09:59:00Z'))).toBe('open')
  })
  it('closes afterwards', () => {
    expect(dotdState(race, true, new Date('2025-03-25T10:00:00Z'))).toBe('closed')
  })
})

describe('weekendStarted', () => {
  it('starts with the first session', () => {
    expect(weekendStarted(race, new Date('2025-03-21T03:29:00Z'))).toBe(false)
    expect(weekendStarted(race, new Date('2025-03-21T03:30:00Z'))).toBe(true)
  })
})

describe('thread text', () => {
  it('has a title within the validator limit and an EditorJS paragraph', () => {
    expect(raceThreadTitle(race)).toBe('Hilo del GP: Chinese Grand Prix 2025')
    expect(raceThreadTitle({ ...race, raceName: 'x'.repeat(200) }).length).toBe(128)
    const content = raceThreadContent(race)
    expect(content.blocks[0].type).toBe('paragraph')
    expect(content.blocks[0].data.text).toContain('Shanghai')
  })
})

describe('tally', () => {
  it('orders by votes and computes percentages', () => {
    expect(tally([{ driverId: 'b', votes: 1 }, { driverId: 'a', votes: 3 }])).toEqual([
      { driverId: 'a', votes: 3, percent: 75 },
      { driverId: 'b', votes: 1, percent: 25 },
    ])
  })
  it('handles no votes', () => {
    expect(tally([])).toEqual([])
    expect(tally([{ driverId: 'a', votes: 0 }])[0].percent).toBe(0)
  })
})
