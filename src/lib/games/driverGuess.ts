import type { DriverStanding } from '@/lib/f1/schemas'

/** Attempts per day. */
export const MAX_ATTEMPTS = 8

export interface GameDriver {
  id: string
  name: string
  code: string | null
  number: number | null
  /** Demonym in Spanish ("Británico"), as shown. */
  nationality: string
  team: string | null
  /** Date of birth as `YYYY-MM-DD`. */
  birthDate: string
  /** Wins and points in the season the pool comes from. */
  wins: number
  points: number
}

/** `higher`/`lower`: the secret driver's value is higher/lower than the guess. */
export type Compare = 'equal' | 'higher' | 'lower' | 'unknown'

export interface Feedback {
  nationality: boolean
  team: boolean
  number: Compare
  age: Compare
  wins: Compare
  points: Compare
}

const NATIONALITIES_ES: Record<string, string> = {
  British: 'Británico',
  Dutch: 'Neerlandés',
  Spanish: 'Español',
  German: 'Alemán',
  French: 'Francés',
  Finnish: 'Finlandés',
  Australian: 'Australiano',
  Mexican: 'Mexicano',
  Monegasque: 'Monegasco',
  Thai: 'Tailandés',
  Canadian: 'Canadiense',
  Japanese: 'Japonés',
  Chinese: 'Chino',
  Danish: 'Danés',
  Italian: 'Italiano',
  Brazilian: 'Brasileño',
  American: 'Estadounidense',
  'New Zealander': 'Neozelandés',
  Argentine: 'Argentino',
  Austrian: 'Austríaco',
  Belgian: 'Belga',
  Swiss: 'Suizo',
  Polish: 'Polaco',
  Russian: 'Ruso',
  Indonesian: 'Indonesio',
  Venezuelan: 'Venezolano',
  Swedish: 'Sueco',
  Portuguese: 'Portugués',
  Colombian: 'Colombiano',
  Hungarian: 'Húngaro',
  Czech: 'Checo',
  Irish: 'Irlandés',
  Estonian: 'Estonio',
  'South African': 'Sudafricano',
  Chilean: 'Chileno',
  Uruguayan: 'Uruguayo',
  Malaysian: 'Malasio',
  Emirati: 'Emiratí',
}

export function nationalityEs(nationality: string): string {
  return NATIONALITIES_ES[nationality] ?? nationality
}

/** Pool of the game: the drivers of one season's standings, with what the clues use. */
export function buildPool(standings: DriverStanding[]): GameDriver[] {
  const seen = new Set<string>()
  const pool: GameDriver[] = []
  for (const entry of standings) {
    const d = entry.Driver
    if (seen.has(d.driverId)) continue
    seen.add(d.driverId)
    const number = d.permanentNumber ? Number(d.permanentNumber) : NaN
    pool.push({
      id: d.driverId,
      name: `${d.givenName} ${d.familyName}`,
      code: d.code ?? null,
      number: Number.isFinite(number) ? number : null,
      nationality: nationalityEs(d.nationality),
      team: entry.Constructors.at(-1)?.name ?? null,
      birthDate: d.dateOfBirth,
      wins: entry.wins,
      points: entry.points,
    })
  }
  return pool
}

/** Whole years between a `YYYY-MM-DD` birth date and `now` (UTC). */
export function ageOn(birthDate: string, now: Date): number {
  const [y, m, d] = birthDate.split('-').map(Number)
  let age = now.getUTCFullYear() - y
  if (now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)) age -= 1
  return age
}

function compare(guess: number | null, answer: number | null): Compare {
  if (guess === null || answer === null) return 'unknown'
  if (guess === answer) return 'equal'
  return answer > guess ? 'higher' : 'lower'
}

export function feedbackFor(guess: GameDriver, answer: GameDriver, now: Date): Feedback {
  return {
    nationality: guess.nationality === answer.nationality,
    team: guess.team !== null && guess.team === answer.team,
    number: compare(guess.number, answer.number),
    age: compare(ageOn(guess.birthDate, now), ageOn(answer.birthDate, now)),
    wins: compare(guess.wins, answer.wins),
    points: compare(guess.points, answer.points),
  }
}

/** Day key in Spain's time zone, `YYYY-MM-DD`: everybody gets the same puzzle until local midnight. */
export function dateKeyMadrid(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function previousDay(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

/** The secret driver of a day: the same for everybody, independent of the pool's order. */
export function pickDaily(pool: GameDriver[], dateKey: string): GameDriver | null {
  if (pool.length === 0) return null
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  return sorted[fnv1a(`fastlap:adivina-piloto:${dateKey}`) % sorted.length]
}

export function isSolved(feedback: Feedback, guess: GameDriver, answer: GameDriver): boolean {
  return guess.id === answer.id && feedback.nationality
}

const SYMBOL: Record<Compare, string> = { equal: '🟩', higher: '🔼', lower: '🔽', unknown: '⬜' }

/** Spoiler-free result to share (no names): one row per attempt. */
export function shareText(dateKey: string, feedbacks: Feedback[], solved: boolean, url: string): string {
  const score = solved ? `${feedbacks.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`
  const rows = feedbacks.map((f) =>
    [f.nationality ? '🟩' : '🟥', f.team ? '🟩' : '🟥', SYMBOL[f.number], SYMBOL[f.age], SYMBOL[f.wins], SYMBOL[f.points]].join('')
  )
  return [`FastLap · Adivina el piloto ${dateKey} ${score}`, ...rows, url].join('\n')
}

export interface GameStats {
  played: number
  wins: number
  streak: number
  best: number
  /** Day key of the last finished game and whether it was won. */
  lastDate: string | null
  lastWon: boolean
}

export const EMPTY_STATS: GameStats = { played: 0, wins: 0, streak: 0, best: 0, lastDate: null, lastWon: false }

/** Streak counts consecutive days won; a missed day or a loss resets it. */
export function recordResult(stats: GameStats, dateKey: string, won: boolean): GameStats {
  if (stats.lastDate === dateKey) return stats
  const continues = stats.lastWon && stats.lastDate === previousDay(dateKey)
  const streak = won ? (continues ? stats.streak + 1 : 1) : 0
  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    streak,
    best: Math.max(stats.best, streak),
    lastDate: dateKey,
    lastWon: won,
  }
}

/** Case- and accent-insensitive name lookup, so "perez" finds "Sergio Pérez". */
export function normalizeName(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export function findByName(pool: Pick<GameDriver, 'id' | 'name'>[], text: string): Pick<GameDriver, 'id' | 'name'> | null {
  const wanted = normalizeName(text)
  if (!wanted) return null
  return pool.find((d) => normalizeName(d.name) === wanted) ?? null
}
