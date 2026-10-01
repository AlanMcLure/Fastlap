import { describe, expect, it } from 'vitest'

import { fixture } from './fixtures'
import { findUpcomingRace, raceStatus, sessionStart, weekendSessions } from './calendar'
import { RacesResponseSchema } from './schemas'

const races = RacesResponseSchema.parse(fixture('calendar')).MRData.RaceTable.Races
const [australia, china, japan] = races

describe('sessionStart', () => {
  it('uses the given UTC time', () => {
    expect(sessionStart('2025-03-16', '04:00:00Z')).toEqual({ start: new Date('2025-03-16T04:00:00Z'), timeKnown: true })
  })

  it('falls back to noon UTC and says the time is unknown', () => {
    expect(sessionStart('2025-04-06')).toEqual({ start: new Date('2025-04-06T12:00:00Z'), timeKnown: false })
  })
})

describe('weekendSessions', () => {
  it('lists a normal weekend in chronological order, race last', () => {
    expect(weekendSessions(australia).map((s) => s.label)).toEqual(['Libres 1', 'Clasificación', 'Carrera'])
  })

  it('orders a sprint weekend by time, not by declaration', () => {
    expect(weekendSessions(china).map((s) => s.label)).toEqual(['Clasificación sprint', 'Sprint', 'Carrera'])
  })

  it('flags a race whose time is unknown', () => {
    const [race] = weekendSessions(japan)
    expect(race).toMatchObject({ label: 'Carrera', timeKnown: false })
  })
})

describe('raceStatus', () => {
  it('is upcoming before the start, in progress during the race and finished after it', () => {
    expect(raceStatus(australia, new Date('2025-03-16T03:59:00Z'))).toBe('upcoming')
    expect(raceStatus(australia, new Date('2025-03-16T05:00:00Z'))).toBe('in-progress')
    expect(raceStatus(australia, new Date('2025-03-16T07:00:00Z'))).toBe('finished')
  })
})

describe('findUpcomingRace', () => {
  it('returns the first race that has not finished', () => {
    expect(findUpcomingRace(races, new Date('2025-03-17T10:00:00Z'))?.round).toBe(2)
    expect(findUpcomingRace(races, new Date('2025-01-01T00:00:00Z'))?.round).toBe(1)
  })

  it('still returns the race that is being run right now', () => {
    expect(findUpcomingRace(races, new Date('2025-03-16T05:00:00Z'))?.round).toBe(1)
  })

  it('returns null once the season is over', () => {
    expect(findUpcomingRace(races, new Date('2025-12-31T00:00:00Z'))).toBeNull()
  })
})
