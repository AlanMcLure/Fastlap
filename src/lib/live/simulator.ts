import type { LiveState, RaceMessage, TowerRow } from './types'

/** Small seeded generator (mulberry32): the simulation is reproducible, so it can be tested. */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface SimulationOptions {
  drivers?: number
  totalLaps?: number
  /** Seconds of race time per `step()`. */
  secondsPerStep?: number
  seed?: number
  /** Id of this run, copied into every state (see `LiveState.run`). */
  run?: number
  /** Lap at which the safety car comes out and how many laps it stays (0 laps = none). */
  safetyCarLap?: number
  safetyCarLaps?: number
}

const LAP_SECONDS = 90
const MAX_MESSAGES = 8

interface Car {
  driverId: string
  code: string
  /** Race distance covered, in laps. */
  distance: number
  /** Laps per second, before the safety car. */
  pace: number
}

/**
 * Simulated race with invented drivers (S01…): bounded random-walk pace per car,
 * positions from distance covered, gaps from the leader's speed, an optional
 * safety car that bunches the field, and the chequered flag.
 */
export function createSimulation(options: SimulationOptions = {}) {
  const { drivers = 20, totalLaps = 20, secondsPerStep = 5, seed = 1, run = 1, safetyCarLap = 8, safetyCarLaps = 2 } = options
  const random = seededRandom(seed)

  const cars: Car[] = Array.from({ length: drivers }, (_, i) => ({
    driverId: `sim_${String(i + 1).padStart(2, '0')}`,
    code: `S${String(i + 1).padStart(2, '0')}`,
    // Starting grid: a car further back starts further behind the line.
    distance: -i * 0.004,
    pace: (1 / LAP_SECONDS) * (1 + (random() - 0.5) * 0.02),
  }))

  let seq = 0
  let messageId = 0
  let messages: RaceMessage[] = []
  let status: LiveState['status'] = 'green'
  let safetyCarEnds = Infinity
  let safetyCarStarted = false
  const finished = new Set<string>()

  const lapOf = (distance: number) => Math.min(totalLaps, Math.max(1, Math.floor(distance) + 1))
  const say = (lap: number, text: string) => {
    messages = [{ id: ++messageId, lap, text }, ...messages].slice(0, MAX_MESSAGES)
  }

  function step(): LiveState {
    const leaderLap = lapOf(Math.max(...cars.map((c) => c.distance)))

    if (status !== 'finished') {
      if (!safetyCarStarted && safetyCarLaps > 0 && leaderLap >= safetyCarLap) {
        safetyCarStarted = true
        status = 'safety-car'
        safetyCarEnds = leaderLap + safetyCarLaps
        say(leaderLap, 'SAFETY CAR DESPLEGADO')
      } else if (status === 'safety-car' && leaderLap >= safetyCarEnds) {
        status = 'green'
        say(leaderLap, 'SAFETY CAR RETIRADO · CARRERA REANUDADA')
      }

      // Leader first, so that followers close up on where the leader is now, not a step ago.
      let leaderDistance = Math.max(...cars.map((c) => c.distance))
      const byDistance = [...cars].sort((a, b) => b.distance - a.distance || a.driverId.localeCompare(b.driverId))
      for (const [index, car] of byDistance.entries()) {
        if (finished.has(car.driverId)) continue
        // Pace wanders a little; under the safety car everyone follows the leader at 60 % speed
        // and the gaps close.
        car.pace = Math.min(
          (1 / LAP_SECONDS) * 1.015,
          Math.max((1 / LAP_SECONDS) * 0.985, car.pace + ((random() - 0.5) * 0.0002) / LAP_SECONDS)
        )
        const speed = car.pace * (status === 'safety-car' ? 0.6 : 1)
        let next = car.distance + speed * secondsPerStep
        if (status === 'safety-car') {
          // Close up behind the leader, keeping a small gap per place.
          next = Math.max(next, Math.min(leaderDistance - index * 0.003, next + 0.02))
        }
        car.distance = next
        if (index === 0) leaderDistance = next
        if (car.distance >= totalLaps) {
          car.distance = totalLaps
          finished.add(car.driverId)
          if (finished.size === 1) say(totalLaps, `BANDERA A CUADROS · GANA ${car.code}`)
        }
      }
      if (finished.size === cars.length) status = 'finished'
    }

    const ordered = [...cars].sort((a, b) => b.distance - a.distance || a.driverId.localeCompare(b.driverId))
    const leader = ordered[0]
    const tower: TowerRow[] = ordered.map((car, i) => {
      const ahead = ordered[i - 1]
      const seconds = (distance: number) => Math.max(0, ((distance - car.distance) * LAP_SECONDS))
      return {
        position: i + 1,
        driverId: car.driverId,
        code: car.code,
        gap: i === 0 ? 0 : round1(seconds(leader.distance)),
        interval: i === 0 ? 0 : round1(seconds(ahead.distance)),
        lapsDown: Math.max(0, Math.floor(leader.distance) - Math.floor(car.distance)),
      }
    })

    return {
      run,
      seq: ++seq,
      sessionName: 'Carrera simulada',
      status,
      lap: lapOf(leader.distance),
      totalLaps,
      tower,
      messages,
    }
  }

  return { step }
}

const round1 = (n: number) => Math.round(n * 10) / 10
