import { describe, expect, it } from 'vitest'

import {
  classifyControl, clock, compoundOn, decodeDeltas, encodeDeltas, fastestUntil, formatGap, indexAt, lapOf, lapTime, lastLap,
  positionsAt, resample, thin, trackStatusAt, valueAt, type Replay,
} from './format'

describe('resample', () => {
  const t0 = 1_000_000
  it('interpolates linearly onto the frame grid', () => {
    const { x, y } = resample(
      [
        { t: t0, x: 0, y: 0 },
        { t: t0 + 1000, x: 100, y: -50 },
      ],
      t0,
      3,
      2
    )
    expect(x).toEqual([0, 50, 100])
    expect(y).toEqual([0, -25, -50])
  })
  it('leaves frames outside the samples and across long gaps empty', () => {
    const { x } = resample(
      [
        { t: t0 + 500, x: 10, y: 0 },
        { t: t0 + 1000, x: 20, y: 0 },
        { t: t0 + 9000, x: 90, y: 0 },
      ],
      t0,
      6,
      2
    )
    expect(x).toEqual([null, 10, 20, null, null, null])
  })
  it('accepts samples in any order', () => {
    const { x } = resample(
      [
        { t: t0 + 1000, x: 2, y: 0 },
        { t: t0, x: 0, y: 0 },
      ],
      t0,
      3,
      2
    )
    expect(x).toEqual([0, 1, 2])
  })
})

describe('delta encoding', () => {
  it('round-trips values with gaps', () => {
    const values = [120, 125, null, 130, -40, null, null, -38]
    expect(encodeDeltas(values)).toEqual([120, 5, null, 5, -170, null, null, 2])
    expect(decodeDeltas(encodeDeltas(values))).toEqual(values)
  })
})

describe('reading the replay at a time', () => {
  const positions: Replay['positions'] = [
    [0, 1, 1],
    [0, 16, 2],
    [30.5, 16, 1],
    [30.5, 1, 2],
  ]
  it('positionsAt applies the events up to t', () => {
    expect(Object.fromEntries(positionsAt(positions, 10))).toEqual({ 1: 1, 16: 2 })
    expect(Object.fromEntries(positionsAt(positions, 31))).toEqual({ 1: 2, 16: 1 })
  })
  it('valueAt returns the last value before t', () => {
    const laps: [number, number][] = [
      [0, 1],
      [95, 2],
      [188, 3],
    ]
    expect(valueAt(laps, -1, 0)).toBe(0)
    expect(valueAt(laps, 100, 0)).toBe(2)
  })
  it('trackStatusAt follows SC, VSC, red flag and the all clear', () => {
    const control: Replay['control'] = [
      [100, 'sc', 'SAFETY CAR DEPLOYED'],
      [200, 'info', 'SAFETY CAR IN THIS LAP'],
      [260, 'green', 'TRACK CLEAR'],
      [400, 'red', 'RED FLAG'],
    ]
    expect(trackStatusAt(control, 50)).toBe('green')
    expect(trackStatusAt(control, 210)).toBe('sc')
    expect(trackStatusAt(control, 300)).toBe('green')
    expect(trackStatusAt(control, 500)).toBe('red')
  })
  it('the chequered flag ends a safety car period', () => {
    const control: Replay['control'] = [
      [100, 'sc', 'SAFETY CAR DEPLOYED'],
      [200, 'chequered', 'CHEQUERED FLAG'],
    ]
    expect(trackStatusAt(control, 250)).toBe('green')
  })
  it('lapOf and compoundOn give the tyre a driver is on', () => {
    const driver = { laps: [10, 100, 190] }
    expect(lapOf(driver, 5)).toBe(0)
    expect(lapOf(driver, 150)).toBe(2)
    const stints: Replay['stints'] = [
      [1, 1, 20, 'MEDIUM'],
      [1, 21, 57, 'HARD'],
    ]
    expect(compoundOn(stints, 1, 2)).toBe('MEDIUM')
    expect(compoundOn(stints, 1, 30)).toBe('HARD')
    expect(compoundOn(stints, 4, 30)).toBeNull()
  })
})

describe('classifyControl', () => {
  it('recognises the track-wide events', () => {
    expect(classifyControl('SAFETY CAR DEPLOYED', null)).toBe('sc')
    expect(classifyControl('VIRTUAL SAFETY CAR DEPLOYED', null)).toBe('vsc')
    expect(classifyControl('VIRTUAL SAFETY CAR ENDING', null)).toBe('info')
    expect(classifyControl('RED FLAG', 'RED')).toBe('red')
    expect(classifyControl('CHEQUERED FLAG', 'CHEQUERED')).toBe('chequered')
    expect(classifyControl('TRACK CLEAR', 'CLEAR')).toBe('green') // as OpenF1 sends it
    expect(classifyControl('TRACK CLEAR', 'GREEN')).toBe('green')
    expect(classifyControl('CLEAR IN TRACK SECTOR 12', 'CLEAR')).toBe('info')
    expect(classifyControl('YELLOW IN TRACK SECTOR 4', 'YELLOW')).toBe('info')
  })
})

describe('small helpers', () => {
  it('thin keeps at most max points', () => {
    expect(thin([1, 2, 3, 4, 5, 6], 3)).toEqual([1, 3, 5])
    expect(thin([1, 2], 3)).toEqual([1, 2])
  })
  it('clock formats the replay time', () => {
    expect(clock(65)).toBe('1:05')
    expect(clock(3725)).toBe('1:02:05')
  })
})

describe('gaps and lap times', () => {
  it('indexAt finds the last event at or before t', () => {
    const events: [number, string][] = [
      [0, 'a'],
      [10, 'b'],
      [20, 'c'],
    ]
    expect(indexAt(events, -1)).toBe(-1)
    expect(indexAt(events, 10)).toBe(1)
    expect(indexAt(events, 15)).toBe(1)
    expect(indexAt(events, 99)).toBe(2)
  })
  it('formatGap shows seconds or lapped cars', () => {
    expect(formatGap(3.456)).toBe('+3.5')
    expect(formatGap('+1 LAP')).toBe('+1 V')
    expect(formatGap('+2 LAPS')).toBe('+2 V')
    expect(formatGap(null)).toBe('')
  })
  it('lapTime formats minutes, seconds and thousandths', () => {
    expect(lapTime(76.123)).toBe('1:16.123')
    expect(lapTime(59.5)).toBe('59.500')
    expect(lapTime(null)).toBe('')
  })
  it('lastLap and fastestUntil only count laps already finished', () => {
    const a = { number: 1, laps: [0, 80, 158], lapTimes: [80, 78, 77] }
    const b = { number: 4, laps: [0, 81, 157.5], lapTimes: [81, 76.5, 79] }
    expect(lastLap(a, 100)).toEqual({ lap: 1, time: 80 })
    expect(lastLap(a, 10)).toBeNull()
    expect(fastestUntil([a, b], 100)).toEqual({ number: 1, time: 80 })
    expect(fastestUntil([a, b], 160)).toEqual({ number: 4, time: 76.5 })
  })
})
