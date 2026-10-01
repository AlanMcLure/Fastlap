import type { Result } from '@/lib/f1/schemas'
import type { LeaderboardEntry } from '@/lib/league'

export interface CardRow {
  /** Position or marker shown first ("1", "VR"). */
  rank: string
  label: string
  /** Right-hand text: team, points... */
  detail?: string
}

export interface CardStat {
  label: string
  value: string
}

const fullName = (r: Result) => `${r.Driver.givenName} ${r.Driver.familyName}`

/** The podium of a race (classified drivers only) plus the fastest lap when known. */
export function podiumRows(results: Result[]): CardRow[] {
  const podium = results
    .filter((r) => /^\d+$/.test(r.positionText))
    .sort((a, b) => a.position - b.position)
    .slice(0, 3)
    .map((r) => ({ rank: String(r.position), label: fullName(r), detail: r.Constructor.name }))
  const fastest = results.find((r) => r.FastestLap?.rank === 1)
  const time = fastest?.FastestLap?.Time?.time
  return fastest && podium.length > 0
    ? [...podium, { rank: 'VR', label: fullName(fastest), detail: time ?? fastest.Constructor.name }]
    : podium
}

/** Top of a prediction table as card rows ("12 pts"). */
export function leaderboardRows(board: LeaderboardEntry[], names: ReadonlyMap<string, string>, limit = 3): CardRow[] {
  return board.slice(0, limit).map((e) => ({
    rank: String(e.rank),
    label: names.get(e.userId) ?? 'usuario',
    detail: `${e.total} ${e.total === 1 ? 'punto' : 'puntos'}`,
  }))
}

/** Cuts a card text so it fits one line: whole words and an ellipsis. */
export function fit(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** File name for a downloaded card: lower case ASCII words joined by dashes. */
export function cardFileName(...parts: (string | number)[]): string {
  const slug = parts
    .join(' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `fastlap-${slug || 'tarjeta'}.png`
}
