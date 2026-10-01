import type { DriverEntry, Stats } from './driver'

export type Side = 'a' | 'b'

export interface CompareInput {
  stats: Stats
  titles: number
  seasons: number
}

export interface CompareRow {
  key: string
  label: string
  a: number | null
  b: number | null
  /** Text shown for each side (a number, or "1.º (×12)" for the best finish). */
  aText: string
  bText: string
  /** Who is ahead on this row; null on a tie or when the row is only informative. */
  leader: Side | null
  /** Share of side A in the bar, 0–100 (50 when both are zero). */
  aShare: number
}

interface RowDef {
  key: string
  label: string
  /** 'higher' / 'lower' decide the leader; 'info' rows are shown without one. */
  better: 'higher' | 'lower' | 'info'
  value: (c: CompareInput) => number | null
  text?: (c: CompareInput) => string
}

const oneDecimal = (n: number) => Math.round(n * 10) / 10

const ROWS: RowDef[] = [
  { key: 'seasons', label: 'TEMPORADAS', better: 'info', value: (c) => c.seasons },
  { key: 'races', label: 'CARRERAS', better: 'info', value: (c) => c.stats.races },
  { key: 'titles', label: 'TÍTULOS', better: 'higher', value: (c) => c.titles },
  { key: 'wins', label: 'VICTORIAS', better: 'higher', value: (c) => c.stats.wins },
  { key: 'podiums', label: 'PODIOS', better: 'higher', value: (c) => c.stats.podiums },
  { key: 'poles', label: 'SALIDAS DESDE LA 1.ª POSICIÓN', better: 'higher', value: (c) => c.stats.polePositions },
  { key: 'fastest', label: 'VUELTAS RÁPIDAS', better: 'higher', value: (c) => c.stats.fastestLaps },
  { key: 'points', label: 'PUNTOS EN CARRERA', better: 'higher', value: (c) => c.stats.points },
  {
    key: 'average',
    label: 'PUNTOS POR CARRERA',
    better: 'higher',
    value: (c) => (c.stats.races === 0 ? null : oneDecimal(c.stats.points / c.stats.races)),
  },
  {
    key: 'winRate',
    label: '% DE VICTORIAS',
    better: 'higher',
    value: (c) => (c.stats.races === 0 ? null : oneDecimal((c.stats.wins / c.stats.races) * 100)),
  },
  {
    key: 'retirements',
    label: 'CARRERAS SIN TERMINAR',
    better: 'lower',
    value: (c) => c.stats.retirements,
  },
  {
    key: 'best',
    label: 'MEJOR RESULTADO',
    better: 'lower',
    value: (c) => c.stats.bestFinish,
    text: (c) => (c.stats.bestFinish === null ? '–' : `${c.stats.bestFinish}.º (×${c.stats.bestFinishCount})`),
  },
]

const format = (n: number | null) => (n === null ? '–' : Number.isInteger(n) ? String(n) : n.toFixed(1))

/** Side by side numbers of two careers, with who leads each row and the share for a two-sided bar. */
export function compareDrivers(a: CompareInput, b: CompareInput): CompareRow[] {
  return ROWS.map((def) => {
    const av = def.value(a)
    const bv = def.value(b)
    let leader: Side | null = null
    if (def.better !== 'info' && av !== null && bv !== null && av !== bv) {
      leader = (def.better === 'higher' ? av > bv : av < bv) ? 'a' : 'b'
    }
    const total = (av ?? 0) + (bv ?? 0)
    return {
      key: def.key,
      label: def.label,
      a: av,
      b: bv,
      aText: def.text ? def.text(a) : format(av),
      bText: def.text ? def.text(b) : format(bv),
      leader,
      // for "lower is better" rows the bar still shows the raw amounts, not who is better
      aShare: def.key === 'best' || total === 0 ? 50 : Math.round(((av ?? 0) / total) * 100),
    }
  })
}

export interface HeadToHead {
  /** Races in which both took part (same season and round). */
  shared: number
  /** Who finished ahead in the race: a classified driver beats one who did not finish. */
  raceA: number
  raceB: number
  raceTied: number
  /** Who started ahead on the grid (pit-lane starts, grid 0, count as last). */
  gridA: number
  gridB: number
  gridTied: number
}

const classified = (e: DriverEntry) => /^\d+$/.test(e.result.positionText)
const gridSlot = (e: DriverEntry) => (e.result.grid > 0 ? e.result.grid : Number.POSITIVE_INFINITY)

/** Head-to-head over the races both drivers took part in. */
export function headToHead(a: DriverEntry[], b: DriverEntry[]): HeadToHead {
  const bByRace = new Map(b.map((e) => [`${e.race.season}:${e.race.round}`, e]))
  const out: HeadToHead = { shared: 0, raceA: 0, raceB: 0, raceTied: 0, gridA: 0, gridB: 0, gridTied: 0 }

  for (const ea of a) {
    const eb = bByRace.get(`${ea.race.season}:${ea.race.round}`)
    if (!eb) continue
    out.shared++

    const ca = classified(ea)
    const cb = classified(eb)
    if (ca && cb) {
      if (ea.result.position < eb.result.position) out.raceA++
      else if (ea.result.position > eb.result.position) out.raceB++
      else out.raceTied++
    } else if (ca) out.raceA++
    else if (cb) out.raceB++
    else out.raceTied++

    const ga = gridSlot(ea)
    const gb = gridSlot(eb)
    if (ga < gb) out.gridA++
    else if (ga > gb) out.gridB++
    else out.gridTied++
  }
  return out
}
