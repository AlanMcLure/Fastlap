/* eslint-disable @typescript-eslint/no-explicit-any -- the tests mutate raw JSON on purpose */
import { describe, expect, it } from 'vitest'

import { fixture } from './fixtures'
import {
  ConstructorStandingsResponseSchema,
  DriverStandingsResponseSchema,
  DriversResponseSchema,
  PitStopsResponseSchema,
  RacesResponseSchema,
  ResultsResponseSchema,
} from './schemas'

describe('F1 schemas (synthetic fixtures)', () => {
  it('parses the calendar and converts numeric strings', () => {
    const { MRData } = RacesResponseSchema.parse(fixture('calendar'))
    expect(MRData.total).toBe(3)
    const [first, second, third] = MRData.RaceTable.Races
    expect(first.round).toBe(1)
    expect(first.season).toBe(2025)
    expect(first.Circuit.Location.lat).toBeCloseTo(-37.8497)
    expect(second.Sprint?.date).toBe('2025-03-22')
    // optional fields may be missing
    expect(third.time).toBeUndefined()
    expect(third.Qualifying).toBeUndefined()
  })

  it('parses driver standings, including fractional points and a missing position', () => {
    const { MRData } = DriverStandingsResponseSchema.parse(fixture('driver-standings'))
    const list = MRData.StandingsTable.StandingsLists[0]
    expect(list.round).toBe(3)
    expect(list.DriverStandings.map((s) => s.points)).toEqual([62, 61.5, 48])
    expect(list.DriverStandings[2].position).toBeUndefined()
    expect(list.DriverStandings[0].Constructors[0].constructorId).toBe('mclaren')
  })

  it('parses constructor standings', () => {
    const { MRData } = ConstructorStandingsResponseSchema.parse(fixture('constructor-standings'))
    expect(MRData.StandingsTable.StandingsLists[0].ConstructorStandings[1].Constructor.name).toBe('Red Bull')
  })

  it('parses race results, including a retirement without time', () => {
    const { MRData } = ResultsResponseSchema.parse(fixture('race-results'))
    const results = MRData.RaceTable.Races[0].Results
    expect(results[0].Time?.millis).toBe(6_000_000)
    expect(results[0].FastestLap?.AverageSpeed?.speed).toBeCloseTo(232.8)
    expect(results[2]).toMatchObject({ position: 20, positionText: 'R', status: 'Collision', laps: 3 })
    expect(results[2].Time).toBeUndefined()
  })

  it('parses drivers and pit stops', () => {
    const drivers = DriversResponseSchema.parse(fixture('drivers')).MRData.DriverTable.Drivers
    expect(drivers[1].url).toBeUndefined()
    const stops = PitStopsResponseSchema.parse(fixture('pitstops')).MRData.RaceTable.Races[0].PitStops
    expect(stops[0]).toMatchObject({ driverId: 'norris', stop: 1, lap: 22 })
  })

  it('rejects a response with a missing required field and names it', () => {
    const broken = structuredClone(fixture('calendar')) as any
    delete broken.MRData.RaceTable.Races[1].raceName
    const result = RacesResponseSchema.safeParse(broken)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toEqual(['MRData', 'RaceTable', 'Races', 1, 'raceName'])
  })

  it('rejects a numeric field that is not numeric', () => {
    const broken = structuredClone(fixture('driver-standings')) as any
    broken.MRData.StandingsTable.StandingsLists[0].DriverStandings[0].points = 'many'
    expect(DriverStandingsResponseSchema.safeParse(broken).success).toBe(false)
  })

  it('rejects an empty numeric string instead of turning it into 0', () => {
    const broken = structuredClone(fixture('race-results')) as any
    broken.MRData.RaceTable.Races[0].Results[0].grid = ''
    expect(ResultsResponseSchema.safeParse(broken).success).toBe(false)
  })
})
