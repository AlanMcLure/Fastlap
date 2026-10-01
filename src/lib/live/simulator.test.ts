import { describe, expect, it } from 'vitest'

import { createSimulation, seededRandom } from './simulator'

const run = (steps: number, options = {}) => {
  const sim = createSimulation(options)
  let state = sim.step()
  for (let i = 1; i < steps; i++) state = sim.step()
  return state
}

describe('seededRandom', () => {
  it('is reproducible and in [0, 1)', () => {
    const a = seededRandom(7)
    const b = seededRandom(7)
    const values = Array.from({ length: 50 }, () => a())
    expect(values).toEqual(Array.from({ length: 50 }, () => b()))
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
  })
})

describe('createSimulation', () => {
  it('is deterministic for a seed', () => {
    expect(run(60, { seed: 3 })).toEqual(run(60, { seed: 3 }))
  })

  it('numbers positions 1..n, with the leader at zero gap and non-negative, ordered gaps', () => {
    const { tower } = run(40, { drivers: 12 })
    expect(tower.map((r) => r.position)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1))
    expect(tower[0]).toMatchObject({ gap: 0, interval: 0 })
    for (let i = 1; i < tower.length; i++) {
      expect(tower[i].gap).toBeGreaterThanOrEqual(tower[i - 1].gap)
      expect(tower[i].interval).toBeGreaterThanOrEqual(0)
    }
  })

  it('increases seq on every step', () => {
    const sim = createSimulation()
    expect([sim.step().seq, sim.step().seq, sim.step().seq]).toEqual([1, 2, 3])
  })

  it('deploys and withdraws the safety car, closing the gaps meanwhile', () => {
    const sim = createSimulation({ totalLaps: 12, safetyCarLap: 3, safetyCarLaps: 2, seed: 5 })
    const statuses = new Set<string>()
    let before = 0
    let during = 0
    for (let i = 0; i < 400; i++) {
      const s = sim.step()
      statuses.add(s.status)
      if (s.status === 'green' && s.lap === 2) before = s.tower[19].gap
      if (s.status === 'safety-car') during = s.tower[19].gap
      if (s.status === 'finished') break
    }
    expect(statuses).toEqual(new Set(['green', 'safety-car', 'finished']))
    expect(during).toBeLessThan(before)
  })

  it('finishes with the chequered flag message, and keeps finishing states stable', () => {
    const sim = createSimulation({ totalLaps: 4, safetyCarLaps: 0 })
    let state = sim.step()
    for (let i = 0; i < 500 && state.status !== 'finished'; i++) state = sim.step()
    expect(state.status).toBe('finished')
    expect(state.lap).toBe(4)
    expect(state.messages[0].text).toContain('BANDERA A CUADROS')
    const again = sim.step()
    expect(again.tower.map((r) => r.driverId)).toEqual(state.tower.map((r) => r.driverId))
  })

  it('caps the message list and keeps ids increasing', () => {
    const sim = createSimulation({ totalLaps: 30, safetyCarLap: 2, safetyCarLaps: 1 })
    let state = sim.step()
    for (let i = 0; i < 1500 && state.status !== 'finished'; i++) state = sim.step()
    expect(state.messages.length).toBeLessThanOrEqual(8)
    const ids = state.messages.map((m) => m.id)
    expect(ids).toEqual([...ids].sort((a, b) => b - a))
  })
})
