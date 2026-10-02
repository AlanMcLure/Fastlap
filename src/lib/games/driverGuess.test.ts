import { describe, expect, it } from 'vitest'
import type { DriverStanding } from '@/lib/f1/schemas'
import {
  ageOn,
  buildPool,
  dateKeyMadrid,
  EMPTY_STATS,
  feedbackFor,
  findByName,
  isSolved,
  MAX_ATTEMPTS,
  nationalityEs,
  pickDaily,
  previousDay,
  recordResult,
  shareText,
  type GameDriver,
} from './driverGuess'

const driver = (over: Partial<GameDriver> = {}): GameDriver => ({
  id: 'ham',
  name: 'Lewis Hamilton',
  code: 'HAM',
  number: 44,
  nationality: 'Británico',
  team: 'Ferrari',
  birthDate: '1985-01-07',
  wins: 1,
  points: 100,
  ...over,
})

const NOW = new Date('2026-10-02T10:00:00Z')

describe('feedbackFor', () => {
  it('marca lo que coincide y la dirección de lo numérico', () => {
    const answer = driver({ id: 'nor', nationality: 'Británico', team: 'McLaren', number: 4, birthDate: '1999-11-13', wins: 4, points: 300 })
    const f = feedbackFor(driver(), answer, NOW)
    expect(f.nationality).toBe(true)
    expect(f.team).toBe(false)
    expect(f.number).toBe('lower')
    expect(f.age).toBe('lower')
    expect(f.wins).toBe('higher')
    expect(f.points).toBe('higher')
  })

  it('igual es equal y los datos que faltan son unknown', () => {
    const a = driver({ id: 'a', number: null, team: null })
    const f = feedbackFor(driver({ id: 'b', number: 44, team: null }), a, NOW)
    expect(f.number).toBe('unknown')
    expect(f.team).toBe(false)
    expect(feedbackFor(driver(), driver(), NOW).wins).toBe('equal')
  })

  it('isSolved solo si es el mismo piloto', () => {
    const f = feedbackFor(driver(), driver(), NOW)
    expect(isSolved(f, driver(), driver())).toBe(true)
    expect(isSolved(f, driver({ id: 'x' }), driver())).toBe(false)
  })
})

describe('ageOn', () => {
  it('cuenta años cumplidos', () => {
    expect(ageOn('1985-01-07', new Date('2026-01-06T00:00:00Z'))).toBe(40)
    expect(ageOn('1985-01-07', new Date('2026-01-07T00:00:00Z'))).toBe(41)
  })
})

describe('día y piloto secreto', () => {
  it('usa el día de Madrid', () => {
    expect(dateKeyMadrid(new Date('2026-10-02T22:30:00Z'))).toBe('2026-10-03')
    expect(dateKeyMadrid(new Date('2026-10-02T21:30:00Z'))).toBe('2026-10-02')
    expect(dateKeyMadrid(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })

  it('previousDay cruza meses y años', () => {
    expect(previousDay('2026-03-01')).toBe('2026-02-28')
    expect(previousDay('2027-01-01')).toBe('2026-12-31')
  })

  it('el mismo día da el mismo piloto, sin importar el orden del pool', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => driver({ id }))
    const a = pickDaily(pool, '2026-10-02')
    const b = pickDaily([...pool].reverse(), '2026-10-02')
    expect(a?.id).toBe(b?.id)
    expect(pickDaily([], '2026-10-02')).toBeNull()
  })

  it('reparte los días entre los pilotos', () => {
    const pool = Array.from({ length: 20 }, (_, i) => driver({ id: `d${String(i).padStart(2, '0')}` }))
    const seen = new Set<string>()
    for (let day = 1; day <= 120; day++) {
      seen.add(pickDaily(pool, `2026-${String(Math.ceil(day / 28)).padStart(2, '0')}-${String(((day - 1) % 28) + 1).padStart(2, '0')}`)!.id)
    }
    expect(seen.size).toBeGreaterThanOrEqual(15)
  })
})

describe('buildPool', () => {
  const entry = (id: string, over: Record<string, unknown> = {}): DriverStanding =>
    ({
      positionText: '1',
      points: 10,
      wins: 1,
      Driver: { driverId: id, permanentNumber: '44', code: 'HAM', givenName: 'Lewis', familyName: id, dateOfBirth: '1985-01-07', nationality: 'British' },
      Constructors: [{ constructorId: 'f', name: 'Ferrari', nationality: 'Italian' }],
      ...over,
    }) as DriverStanding

  it('traduce la nacionalidad, toma el último equipo y evita duplicados', () => {
    const pool = buildPool([entry('a'), entry('a'), entry('b', { Constructors: [] })])
    expect(pool).toHaveLength(2)
    expect(pool[0]).toMatchObject({ id: 'a', nationality: 'Británico', team: 'Ferrari', number: 44, points: 10 })
    expect(pool[1].team).toBeNull()
  })

  it('nacionalidad desconocida se deja tal cual', () => {
    expect(nationalityEs('Martian')).toBe('Martian')
  })
})

describe('recordResult', () => {
  it('encadena días ganados y se rompe al fallar o saltarse un día', () => {
    let s = recordResult(EMPTY_STATS, '2026-10-01', true)
    s = recordResult(s, '2026-10-02', true)
    expect(s).toMatchObject({ streak: 2, best: 2, played: 2, wins: 2 })
    s = recordResult(s, '2026-10-04', true)
    expect(s.streak).toBe(1)
    s = recordResult(s, '2026-10-05', false)
    expect(s).toMatchObject({ streak: 0, best: 2, played: 4, wins: 3 })
  })

  it('el mismo día no cuenta dos veces', () => {
    const s = recordResult(EMPTY_STATS, '2026-10-01', true)
    expect(recordResult(s, '2026-10-01', false)).toBe(s)
  })
})

describe('shareText', () => {
  it('no revela nombres y resume los intentos', () => {
    const f = feedbackFor(driver(), driver({ id: 'x', team: 'McLaren', points: 200 }), NOW)
    const text = shareText('2026-10-02', [f], false, 'https://x.test/juegos/adivina-piloto')
    expect(text).toContain(`X/${MAX_ATTEMPTS}`)
    expect(text).toContain('🟩🟥')
    expect(text).not.toContain('Hamilton')
    expect(text.split('\n')).toHaveLength(3)
  })
})

describe('findByName', () => {
  it('ignora tildes y mayúsculas', () => {
    const pool = [{ id: 'per', name: 'Sergio Pérez' }]
    expect(findByName(pool, '  sergio PEREZ ')?.id).toBe('per')
    expect(findByName(pool, 'Checo')).toBeNull()
    expect(findByName(pool, '')).toBeNull()
  })
})
