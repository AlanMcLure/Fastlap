import { describe, expect, it } from 'vitest'

import { assembleReplay, pickRaceSession, type OF1Lap, type OF1Location, type ReplayInput } from './assemble'
import { decodeDeltas, REPLAY_HZ } from './format'

const T0 = '2025-06-01T13:00:00.000Z'
const at = (seconds: number) => new Date(Date.parse(T0) + seconds * 1000).toISOString()

/** A car going round a 100-second lap, sampled every 0.5 s. */
const drive = (driver: number, offset: number, seconds: number): OF1Location[] =>
  Array.from({ length: seconds * 2 + 1 }, (_, i) => ({
    date: at(i / 2),
    driver_number: driver,
    x: Math.round(1000 * Math.cos(((i / 2 + offset) / 100) * 2 * Math.PI)),
    y: Math.round(1000 * Math.sin(((i / 2 + offset) / 100) * 2 * Math.PI)),
  }))

const laps = (driver: number, starts: number[]): OF1Lap[] =>
  starts.map((s, i) => ({ driver_number: driver, lap_number: i + 1, date_start: i === 0 ? null : at(s), lap_duration: 100 }))

const input = (): ReplayInput => ({
  season: 2025,
  round: 9,
  name: 'Spanish Grand Prix',
  session: { session_key: 9999, date_start: T0, date_end: at(1000) },
  drivers: [
    { driver_number: 1, name_acronym: 'VER', full_name: 'Max Verstappen', team_name: 'Red Bull Racing', team_colour: '3671C6' },
    { driver_number: 81, name_acronym: 'PIA', full_name: 'Oscar Piastri', team_name: 'McLaren', team_colour: null },
  ],
  locations: new Map([
    [1, drive(1, 0, 600)],
    [81, drive(81, -5, 600)],
  ]),
  positions: [
    { date: at(0), driver_number: 1, position: 1 },
    { date: at(0), driver_number: 81, position: 2 },
    { date: at(250.04), driver_number: 81, position: 1 },
    { date: at(250.04), driver_number: 1, position: 2 },
  ],
  laps: [...laps(1, [0, 100, 200, 300, 400]), ...laps(81, [5, 105, 205, 305])],
  control: [
    { date: at(150), category: 'SafetyCar', flag: null, message: 'SAFETY CAR DEPLOYED' },
    { date: at(160), category: 'Flag', flag: 'YELLOW', message: 'YELLOW IN TRACK SECTOR 2' },
    { date: at(230), category: 'Flag', flag: 'CLEAR', message: 'CLEAR IN TRACK SECTOR 12' },
    { date: at(240), category: 'Flag', flag: 'CLEAR', message: 'TRACK CLEAR' },
    { date: at(440), category: 'Flag', flag: 'CHEQUERED', message: 'CHEQUERED FLAG' },
  ],
  intervals: [
    { date: at(10), driver_number: 81, gap_to_leader: 1.23456, interval: 1.23456 },
    { date: at(14), driver_number: 81, gap_to_leader: 1.5, interval: 1.5 },
    { date: at(20), driver_number: 81, gap_to_leader: '+1 LAP', interval: null },
  ],
  stints: [
    { driver_number: 1, lap_start: 1, lap_end: 3, compound: 'MEDIUM' },
    { driver_number: 1, lap_start: 4, lap_end: null, compound: 'HARD' },
  ],
})

describe('pickRaceSession', () => {
  it('takes the session on the race date', () => {
    const sessions = [
      { session_key: 1, date_start: '2025-05-25T13:00:00Z' },
      { session_key: 2, date_start: '2025-06-01T13:00:00Z' },
    ]
    expect(pickRaceSession(sessions, '2025-06-01')?.session_key).toBe(2)
    expect(pickRaceSession(sessions, '2025-07-06')).toBeNull()
  })
})

describe('assembleReplay', () => {
  const replay = assembleReplay(input())

  it('runs from the session start to two minutes after the chequered flag', () => {
    expect(replay.t0).toBe(Date.parse(T0))
    expect(replay.frames).toBe((440 + 120) * REPLAY_HZ)
  })

  it('stops at the last sample when the data ends earlier', () => {
    const short = input()
    short.locations = new Map([[1, drive(1, 0, 300)]])
    expect(assembleReplay(short).frames).toBe(300 * REPLAY_HZ)
  })

  it('stores each car on the frame grid, delta-encoded', () => {
    const ver = replay.drivers.find((d) => d.number === 1)!
    const x = decodeDeltas(ver.x)
    expect(x).toHaveLength(replay.frames)
    expect(x[0]).toBe(1000)
    expect(ver.color).toBe('#3671C6')
    expect(replay.drivers.find((d) => d.number === 81)!.color).toBe('#999999')
  })

  it('derives lap 1 from lap 2 and the leader laps from the first car through', () => {
    expect(replay.drivers[0].laps).toEqual([0, 100, 200, 300, 400])
    expect(replay.leaderLaps.slice(0, 2)).toEqual([
      [0, 1],
      [100, 2],
    ])
  })

  it('keeps one gap every 8 s per driver, rounded, and the lap times', () => {
    const pia = replay.drivers.find((d) => d.number === 81)!
    expect(pia.gaps).toEqual([
      [10, 1.235, 1.235],
      [20, '+1 LAP', null],
    ])
    expect(replay.drivers[0].lapTimes).toEqual([100, 100, 100, 100, 100])
  })

  it('keeps positions in seconds from the start, rounded to tenths', () => {
    expect(replay.positions.at(-1)).toEqual([250, 1, 2])
  })

  it('keeps safety car, all-clear and flag-end messages, not sector yellows', () => {
    expect(replay.control.map(([t, kind]) => [t, kind])).toEqual([
      [150, 'sc'],
      [240, 'green'],
      [440, 'chequered'],
    ])
  })

  it('draws the track from one lap and keeps open-ended stints', () => {
    expect(replay.track.length).toBeGreaterThan(100)
    expect(replay.stints).toContainEqual([1, 4, 999, 'HARD'])
  })
})
