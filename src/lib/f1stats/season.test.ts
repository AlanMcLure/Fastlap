import { describe, expect, it } from 'vitest'

import { circuitFacts, percentage } from './records'
import { formatMillis, positionsChart, qualifyingPaceChart, share } from './season'
import type { QualifyingPace, StandingsProgression } from './schemas'

describe('positionsChart', () => {
  it('builds a row per round with the position of each driver, skipping gaps', () => {
    const progression: StandingsProgression = {
      year: 2025,
      rounds: [
        { round: 1, raceId: 10, grandPrixId: 'a', date: '2025-03-01' },
        { round: 2, raceId: 11, grandPrixId: 'b', date: '2025-03-08' },
      ],
      standings: [
        { driverId: 'max-verstappen', position: 1, points: 43, pointsByRound: [18, 43], positionsByRound: [2, 1] },
        { driverId: 'rookie', position: 2, points: 25, pointsByRound: [null, 25], positionsByRound: [null, 2] },
      ],
    }

    const chart = positionsChart(progression, new Map([['max-verstappen', 'VER']]))

    expect(chart.series).toEqual([
      { number: 1, code: 'VER', team: null },
      { number: 2, code: 'rookie', team: null },
    ])
    expect(chart.rows).toEqual([
      { lap: 1, '1': 2 },
      { lap: 2, '1': 1, '2': 2 },
    ])
  })
})

describe('qualifyingPaceChart', () => {
  it('keys each team by its rank and keeps missing rounds empty', () => {
    const pace: QualifyingPace = {
      year: 2025,
      rounds: [
        { round: 1, raceId: 10, grandPrixId: 'a', date: '2025-03-01', bestTimeMillis: 80_000 },
        { round: 2, raceId: 11, grandPrixId: 'b', date: '2025-03-08', bestTimeMillis: 90_000 },
      ],
      teams: [
        { constructorId: 'mclaren', constructorName: 'McLaren', medianGapPercent: 0, fastestCount: 2, gapPercentByRound: [0, 0] },
        { constructorId: 'haas', constructorName: null, medianGapPercent: 1, fastestCount: 0, gapPercentByRound: [null, 1] },
      ],
    }
    const chart = qualifyingPaceChart(pace)
    expect(chart.series.map((s) => s.code)).toEqual(['McLaren', 'haas'])
    expect(chart.rows).toEqual([
      { lap: 1, '1': 0 },
      { lap: 2, '1': 0, '2': 1 },
    ])
  })
})

describe('small helpers', () => {
  it('computes duel shares', () => {
    expect(share(3, 1)).toBe(0.75)
    expect(share(0, 0)).toBe(0.5)
  })

  it('formats qualifying times from millis', () => {
    expect(formatMillis(75_096)).toBe('1:15.096')
    expect(formatMillis(65_005)).toBe('1:05.005')
  })

  it('describes a circuit in Spanish', () => {
    expect(circuitFacts({ type: 'STREET', direction: 'ANTI_CLOCKWISE', length: 3.337 })).toEqual([
      'Urbano',
      'sentido antihorario',
      '3,337 km',
    ])
    expect(percentage(26, 76)).toBe(34.2)
    expect(percentage(1, 0)).toBeNull()
  })
})
