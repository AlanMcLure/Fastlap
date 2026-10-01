import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture } from './fixtures'
import {
  getCalendar,
  getConstructorStandings,
  getDriver,
  getDriverResults,
  getDriverStandings,
  getNextRace,
  getPitStops,
  getRaceResults,
  getSeasonResults,
  getSeasonSprintResults,
  revalidateFor,
} from './queries'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

let fetchMock: ReturnType<typeof vi.fn>
const requested = () => fetchMock.mock.calls.map((c) => new URL(c[0] as string).pathname + new URL(c[0] as string).search)

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('revalidateFor', () => {
  it('closed seasons are cached for a week, the running one for an hour', () => {
    const now = new Date('2026-06-01T00:00:00Z')
    expect(revalidateFor(2024, now)).toBe(7 * 24 * 3600)
    expect(revalidateFor(2026, now)).toBe(3600)
    expect(revalidateFor('current', now)).toBe(3600)
  })
})

describe('queries', () => {
  it('getNextRace returns the upcoming race of the current season', async () => {
    fetchMock.mockImplementation(async () => ok(fixture('calendar')))
    const next = await getNextRace(new Date('2025-03-17T10:00:00Z'))
    expect(next?.round).toBe(2)
    expect(requested()).toEqual(['/ergast/f1/current.json?limit=100&offset=0'])
  })

  it('getNextRace falls back to the next season when the current one is over', async () => {
    fetchMock.mockImplementationOnce(async () => ok(fixture('calendar')))
    fetchMock.mockImplementationOnce(async () =>
      ok({ MRData: { total: '1', RaceTable: { Races: [{ season: '2026', round: '1', raceName: 'Australian Grand Prix', Circuit: { circuitId: 'albert_park', circuitName: 'Albert Park', Location: { lat: '-37.8', long: '144.9', locality: 'Melbourne', country: 'Australia' } }, date: '2026-03-08', time: '04:00:00Z' }] } } })
    )
    const next = await getNextRace(new Date('2025-12-31T00:00:00Z'))
    expect(next?.season).toBe(2026)
    expect(requested()[1]).toBe('/ergast/f1/2026.json?limit=100&offset=0')
  })

  it('getNextRace is null when there is no calendar at all', async () => {
    fetchMock.mockImplementation(async () => ok({ MRData: { total: '0', RaceTable: { Races: [] } } }))
    expect(await getNextRace(new Date())).toBeNull()
  })

  it('getCalendar requests the season and returns typed races', async () => {
    fetchMock.mockResolvedValueOnce(ok(fixture('calendar')))
    const races = await getCalendar(2025)
    expect(requested()).toEqual(['/ergast/f1/2025.json?limit=100&offset=0'])
    expect(races.map((r) => r.raceName)).toEqual(['Australian Grand Prix', 'Chinese Grand Prix', 'Japanese Grand Prix'])
  })

  it('getDriverStandings builds the path with and without a round', async () => {
    fetchMock.mockImplementation(async () => ok(fixture('driver-standings')))
    const latest = await getDriverStandings(2025)
    await getDriverStandings(2025, 3)
    expect(requested()).toEqual([
      '/ergast/f1/2025/driverStandings.json?limit=100',
      '/ergast/f1/2025/3/driverStandings.json?limit=100',
    ])
    expect(latest).toMatchObject({ season: 2025, round: 3 })
    expect(latest?.standings[0].Driver.driverId).toBe('norris')
  })

  it('standings return null when the season has no standings yet', async () => {
    fetchMock.mockImplementation(async () => ok({ MRData: { total: '0', StandingsTable: { StandingsLists: [] } } }))
    expect(await getDriverStandings(2030)).toBeNull()
    expect(await getConstructorStandings(2030)).toBeNull()
  })

  it('getConstructorStandings returns the constructors', async () => {
    fetchMock.mockResolvedValueOnce(ok(fixture('constructor-standings')))
    const result = await getConstructorStandings('current')
    expect(requested()[0]).toBe('/ergast/f1/current/constructorStandings.json?limit=100')
    expect(result?.standings.map((s) => s.points)).toEqual([110, 61.5])
  })

  it('getRaceResults returns the race, or null if it has not been run', async () => {
    fetchMock.mockResolvedValueOnce(ok(fixture('race-results')))
    const race = await getRaceResults(2025, 1)
    expect(race?.Results).toHaveLength(3)
    fetchMock.mockResolvedValueOnce(ok({ MRData: { total: '0', RaceTable: { Races: [] } } }))
    expect(await getRaceResults(2025, 24)).toBeNull()
  })

  it('getSeasonResults reads every page and merges a race split across them', async () => {
    const raceJson = (results: unknown[]) => ({ season: '2025', round: '1', raceName: 'A Grand Prix', Circuit: { circuitId: 'c', circuitName: 'C', Location: { lat: '0', long: '0', locality: 'L', country: 'K' } }, date: '2025-01-01', Results: results })
    const row = (id: string, pts: string) => ({ position: '1', positionText: '1', points: pts, Driver: { driverId: id, givenName: id, familyName: id, dateOfBirth: '2000-01-01', nationality: 'X' }, Constructor: { constructorId: 't', name: 'T', nationality: 'X' }, grid: '1', laps: '5', status: 'Finished' })
    fetchMock.mockImplementationOnce(async () => ok({ MRData: { total: '120', RaceTable: { Races: [raceJson(Array.from({ length: 100 }, (_, i) => row('a' + i, '1')))] } } }))
    fetchMock.mockImplementationOnce(async () => ok({ MRData: { total: '120', RaceTable: { Races: [raceJson(Array.from({ length: 20 }, (_, i) => row('b' + i, '2')))] } } }))
    const races = await getSeasonResults(2025)
    expect(races).toHaveLength(1)
    expect(races[0].Results).toHaveLength(120)
    expect(requested()).toEqual(['/ergast/f1/2025/results.json?limit=100&offset=0', '/ergast/f1/2025/results.json?limit=100&offset=100'])
  })

  it('getSeasonSprintResults is empty for a season without sprints', async () => {
    fetchMock.mockImplementationOnce(async () => ok({ MRData: { total: '0', RaceTable: { Races: [] } } }))
    expect(await getSeasonSprintResults(2019)).toEqual([])
  })

  it('getPitStops flattens the stops', async () => {
    fetchMock.mockResolvedValueOnce(ok(fixture('pitstops')))
    expect((await getPitStops(2025, 1)).map((s) => s.driverId)).toEqual(['norris', 'max_verstappen'])
  })

  it('getDriver returns null for an unknown driver', async () => {
    fetchMock.mockResolvedValueOnce(ok({ MRData: { total: '0', DriverTable: { Drivers: [] } } }))
    expect(await getDriver('nobody')).toBeNull()
  })

  it('getDriverResults returns each race of the career', async () => {
    fetchMock.mockResolvedValueOnce(ok(fixture('driver-results')))
    const races = await getDriverResults('norris')
    expect(requested()[0]).toBe('/ergast/f1/drivers/norris/results.json?limit=100&offset=0')
    expect(races.map((r) => r.Results[0].position)).toEqual([1, 2])
  })

  it('rejects values that could alter the request path, without calling the API', async () => {
    await expect(getDriver('../../admin')).rejects.toThrow(RangeError)
    await expect(getDriverResults('a/b')).rejects.toThrow(RangeError)
    await expect(getRaceResults(2025, 0)).rejects.toThrow(RangeError)
    await expect(getCalendar(1800)).rejects.toThrow(RangeError)
    await expect(getCalendar('2025/../x' as never)).rejects.toThrow(RangeError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('propagates schema errors instead of returning half-parsed data', async () => {
    fetchMock.mockResolvedValueOnce(ok({ MRData: { total: '1', RaceTable: { Races: [{ round: '1' }] } } }))
    await expect(getCalendar(2025)).rejects.toMatchObject({ name: 'F1SchemaError' })
  })
})

