import { describe, expect, it } from 'vitest'

import {
  fastestPits,
  formatDelta,
  formatLapTime,
  gapRows,
  longRuns,
  neutralisations,
  paceRanking,
  penalties,
  sessionBestSectors,
  sessionTabs,
  strategyRows,
  tyre,
  weatherSummary,
} from './race'
import type { BestLap, DriverSummary, Pit, RaceControlMessage, Stint, StintPace, TimingSession } from './schemas'

const summary = (number: number, finish: number | null, extra: Partial<DriverSummary> = {}): DriverSummary => ({
  driverId: `d${number}`,
  driverNumber: number,
  nameAcronym: `D${number}`,
  teamName: 'Team',
  teamColour: null,
  startPosition: 1,
  finishPosition: finish,
  positionsGained: 0,
  lapsCompleted: 10,
  bestLap: 90,
  bestLapNumber: 5,
  averageLap: 91,
  topSpeed: 320,
  pitStops: 1,
  compounds: [],
  overtakesMade: 0,
  overtakesSuffered: 0,
  ...extra,
})

const rc = (lap: number, message: string, extra: Partial<RaceControlMessage> = {}): RaceControlMessage => ({
  date: new Date(Date.UTC(2025, 6, 27, 13, lap)).toISOString(),
  lapNumber: lap,
  category: 'Other',
  flag: null,
  scope: null,
  driverNumber: null,
  driverId: null,
  message,
  ...extra,
})

describe('formatting', () => {
  it('formats lap times with minutes and millis', () => {
    expect(formatLapTime(105.706)).toBe('1:45.706')
    expect(formatLapTime(60.05)).toBe('1:00.050')
    expect(formatLapTime(45.1)).toBe('45.100')
    expect(formatLapTime(null)).toBe('—')
  })

  it('formats signed deltas', () => {
    expect(formatDelta(0.0641)).toBe('+0.064')
    expect(formatDelta(-1.2)).toBe('-1.200')
    expect(formatDelta(0.0001)).toBe('0.000')
  })
})

describe('sessionTabs', () => {
  it('orders sessions by start and keeps known slugs once', () => {
    const s = (slug: string | null, day: number): TimingSession => ({
      sessionKey: day,
      sessionName: slug ?? 'Day',
      sessionType: 'x',
      slug,
      dateStart: `2025-07-${20 + day}T10:00:00Z`,
      dateEnd: null,
    })
    expect(sessionTabs([s('race', 7), s('qualifying', 6), s(null, 1), s('race', 8), s('free-practice-1', 5)])).toEqual([
      { slug: 'free-practice-1', label: 'Libres 1' },
      { slug: 'qualifying', label: 'Clasificación' },
      { slug: 'race', label: 'Carrera' },
    ])
  })
})

describe('strategyRows', () => {
  it('turns stints into lap ranges, clipping open stints to the laps completed', () => {
    const stints: Stint[] = [
      { driverNumber: 1, stintNumber: 2, driverId: 'd1', lapStart: 6, lapEnd: null, compound: 'HARD', tyreAgeAtStart: 0 },
      { driverNumber: 1, stintNumber: 1, driverId: 'd1', lapStart: 1, lapEnd: 5, compound: 'MEDIUM', tyreAgeAtStart: 3 },
    ]
    const { rows, laps } = strategyRows([summary(1, 1), summary(2, null, { lapsCompleted: 4 })], stints)

    expect(laps).toBe(10)
    expect(rows[0].stints).toEqual([
      { compound: 'MEDIUM', from: 1, to: 5, tyreAge: 3 },
      { compound: 'HARD', from: 6, to: 10, tyreAge: 0 },
    ])
    expect(rows[1].stints).toEqual([])
  })

  it('maps compounds to the Spanish letters', () => {
    expect(tyre('SOFT').letter).toBe('B')
    expect(tyre('HARD').name).toBe('Duro')
    expect(tyre(null).letter).toBe('?')
  })
})

describe('race control', () => {
  it('finds safety car, virtual safety car and red flag periods', () => {
    const messages = [
      rc(3, 'SAFETY CAR DEPLOYED'),
      rc(6, 'SAFETY CAR IN THIS LAP'),
      rc(10, 'VSC DEPLOYED'),
      rc(11, 'VSC ENDING'),
      rc(15, 'RED FLAG', { flag: 'RED' }),
      rc(15, 'GREEN LIGHT - PIT EXIT OPEN', { flag: 'GREEN' }),
      rc(16, 'TRACK CLEAR', { flag: 'GREEN' }),
      rc(20, 'SAFETY CAR DEPLOYED'),
    ]
    expect(neutralisations(messages, 25)).toEqual([
      { kind: 'sc', fromLap: 3, toLap: 6 },
      { kind: 'vsc', fromLap: 10, toLap: 11 },
      { kind: 'red', fromLap: 15, toLap: 16 },
      { kind: 'sc', fromLap: 20, toLap: 25 },
    ])
  })

  it('keeps only penalties actually given', () => {
    const list = penalties([
      rc(5, 'FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 31 (OCO) - SPEEDING IN THE PIT LANE', { driverNumber: 31 }),
      rc(6, 'FIA STEWARDS: INCIDENT INVOLVING CAR 31 (OCO) UNDER INVESTIGATION - CAUSING A COLLISION'),
      rc(7, 'FIA STEWARDS: TIME PENALTY FOR CAR 4 REVIEWED - NO FURTHER ACTION'),
      rc(8, 'BLUE FLAG FOR CAR 10'),
    ])
    expect(list).toEqual([{ lap: 5, driverNumber: 31, text: '5 SECOND TIME PENALTY FOR CAR 31 (OCO) - SPEEDING IN THE PIT LANE' }])
  })
})

describe('weatherSummary', () => {
  it('uses the samples inside the session window', () => {
    const sample = (minute: number, air: number, track: number, rain = false) => ({
      date: new Date(Date.UTC(2025, 6, 27, 13, minute)).toISOString(),
      airTemperature: air,
      trackTemperature: track,
      humidity: 50,
      rainfall: rain,
      windSpeed: minute / 10,
    })
    const result = weatherSummary(
      [sample(0, 10, 20, true), sample(10, 18, 30), sample(20, 19, 33), sample(40, 25, 40)],
      new Date(Date.UTC(2025, 6, 27, 13, 5)).toISOString(),
      new Date(Date.UTC(2025, 6, 27, 13, 30)).toISOString()
    )
    expect(result).toEqual({ air: [18, 19], track: [30, 33], rain: false, maxWind: 2 })
  })
})

describe('pace', () => {
  it('ranks by average representative lap and skips short races', () => {
    const rows = paceRanking([
      summary(1, 1, { averageLap: 91.2 }),
      summary(2, 2, { averageLap: 90.9 }),
      summary(3, null, { averageLap: 80, lapsCompleted: 2 }),
      summary(4, 3, { averageLap: null }),
    ])
    expect(rows.map((r) => r.driverNumber)).toEqual([2, 1])
    expect(rows[1].delta).toBeCloseTo(0.3)
  })

  it('long runs need enough representative laps', () => {
    const stint = (driverNumber: number, laps: number, average: number): StintPace => ({
      driverId: null,
      driverNumber,
      stintNumber: 1,
      compound: 'MEDIUM',
      lapStart: 1,
      lapEnd: 10,
      tyreAgeAtStart: 0,
      representativeLaps: laps,
      averageLap: average,
      bestLap: average - 1,
      degradationPerLap: 0.05,
    })
    expect(longRuns([stint(1, 3, 80), stint(2, 8, 92), stint(3, 6, 91)]).map((s) => s.driverNumber)).toEqual([3, 2])
  })
})

describe('best laps and pits', () => {
  it('finds the best value of each sector', () => {
    const row = (s1: number | null, s2: number | null, s3: number | null) => ({ bestSector1: s1, bestSector2: s2, bestSector3: s3 }) as BestLap
    expect(sessionBestSectors([row(30, 40, null), row(29.5, 41, 20)])).toEqual([29.5, 40, 20])
  })

  it('sorts stops by stationary time and ignores impossible ones', () => {
    const pit = (driverNumber: number, stop: number | null, lane: number | null): Pit => ({
      driverNumber,
      driverId: null,
      date: '2025-07-27T14:00:00Z',
      lapNumber: 10,
      laneDuration: lane,
      stopDuration: stop,
    })
    const sorted = fastestPits([pit(1, 2.5, 22), pit(2, 0.1, 21), pit(3, 2.1, 23), pit(4, null, null)])
    expect(sorted.map((p) => p.driverNumber)).toEqual([3, 1, 2])
  })
})

describe('chart rows', () => {
  it('builds one row per lap with a key per driver', () => {
    const rows = gapRows([
      { driverId: 'a', driverNumber: 1, nameAcronym: 'A', teamColour: null, gaps: [{ lap: 1, gap: 0 }, { lap: 2, gap: 0 }] },
      { driverId: 'b', driverNumber: 4, nameAcronym: 'B', teamColour: null, gaps: [{ lap: 2, gap: 1.5 }] },
    ])
    expect(rows).toEqual([
      { lap: 1, '1': 0 },
      { lap: 2, '1': 0, '4': 1.5 },
    ])
  })
})
