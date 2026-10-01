import { describe, expect, it } from 'vitest'

import { fixture } from './fixtures'
import { driverCode, parseStopSeconds } from './format'
import { fastestPitStop, groupPitStops, placesGained, raceSummary } from './race'
import { PitStopsResponseSchema, ResultsResponseSchema } from './schemas'

const results = ResultsResponseSchema.parse(fixture('race-results')).MRData.RaceTable.Races[0].Results
const stops = PitStopsResponseSchema.parse(fixture('pitstops')).MRData.RaceTable.Races[0].PitStops

describe('driverCode / parseStopSeconds', () => {
  it('uses the code, or the first letters of the surname for old drivers', () => {
    expect(driverCode({ code: 'HAM', familyName: 'Hamilton' })).toBe('HAM')
    expect(driverCode({ familyName: 'Fangio' })).toBe('FAN')
  })

  it('parses stop durations, including minutes', () => {
    expect(parseStopSeconds('22.4')).toBe(22.4)
    expect(parseStopSeconds('1:02.5')).toBe(62.5)
    expect(parseStopSeconds('n/a')).toBeNaN()
  })
})

describe('raceSummary', () => {
  it('finds the winner, who started first and who set the fastest lap', () => {
    const summary = raceSummary(results)
    expect(summary.winner?.Driver.driverId).toBe('norris')
    expect(summary.pole?.Driver.driverId).toBe('norris')
    expect(summary.fastestLap?.Driver.driverId).toBe('norris')
  })

  it('leaves fields empty when there is no data', () => {
    expect(raceSummary([])).toEqual({ winner: undefined, pole: undefined, fastestLap: undefined })
  })
})

describe('placesGained', () => {
  it('is grid minus finishing position', () => {
    expect(placesGained(results[1])).toBe(1) // started 3rd, finished 2nd
    expect(placesGained(results[0])).toBe(0)
  })

  it('is null for retirements and pit-lane starts', () => {
    expect(placesGained(results[2])).toBeNull() // "R"
    expect(placesGained({ ...results[0], grid: 0 })).toBeNull()
  })
})

describe('groupPitStops', () => {
  it('groups by driver in finishing order and uses driver codes', () => {
    const groups = groupPitStops([...stops].reverse(), results)
    expect(groups.map((g) => g.code)).toEqual(['NOR', 'VER'])
    expect(groups[0].stops).toEqual([{ stop: 1, lap: 22, seconds: 22.4, duration: '22.4' }])
  })

  it('sorts a driver’s stops by number and puts unknown drivers last', () => {
    const extra = [
      { driverId: 'ghost', stop: 1, lap: 5, time: '15:00:00', duration: '30.0' },
      { driverId: 'norris', stop: 2, lap: 40, time: '16:00:00', duration: '21.9' },
      { driverId: 'norris', stop: 1, lap: 20, time: '15:30:00', duration: '23.0' },
    ]
    const groups = groupPitStops(extra, results)
    expect(groups.map((g) => g.driverId)).toEqual(['norris', 'ghost'])
    expect(groups[0].stops.map((s) => s.stop)).toEqual([1, 2])
    expect(groups[0].fastest).toBe(21.9)
    expect(groups[1].code).toBe('GHO')
  })

  it('finds the fastest stop of the race and ignores unreadable durations', () => {
    expect(fastestPitStop(groupPitStops(stops, results))).toEqual({ code: 'NOR', seconds: 22.4 })
    const bad = groupPitStops([{ driverId: 'norris', stop: 1, lap: 1, time: '1', duration: 'x' }], results)
    expect(fastestPitStop(bad)).toBeNull()
    expect(fastestPitStop([])).toBeNull()
  })
})
