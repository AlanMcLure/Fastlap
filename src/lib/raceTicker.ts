import { raceStatus, sessionStart } from '@/lib/f1/calendar'
import type { Race } from '@/lib/f1/schemas'
import { dateKeyMadrid } from '@/lib/games/driverGuess'
import { weekendStarted } from '@/lib/raceHub'

export type TickerState = 'live' | 'today' | 'weekend' | 'next'

/** What the race ticker under the navigation says about the next (or current) Grand Prix. */
export function tickerState(race: Race, now = new Date()): TickerState {
  if (raceStatus(race, now) === 'in-progress') return 'live'
  const { start } = sessionStart(race.date, race.time)
  if (dateKeyMadrid(start) === dateKeyMadrid(now)) return 'today'
  return weekendStarted(race, now) ? 'weekend' : 'next'
}

export const TICKER_LABEL: Record<TickerState, string> = {
  live: 'EN CARRERA',
  today: 'CARRERA HOY',
  weekend: 'FIN DE SEMANA DE GP',
  next: 'PRÓXIMO GP',
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Compact countdown: "3 D 04:12" a day or more out, "04:12:09" on the last day. */
export function compactCountdown(secondsLeft: number): string {
  const left = Math.max(0, Math.floor(secondsLeft))
  const days = Math.floor(left / 86400)
  const hours = Math.floor((left % 86400) / 3600)
  const minutes = Math.floor((left % 3600) / 60)
  if (days > 0) return `${days} D ${pad(hours)}:${pad(minutes)}`
  return `${pad(hours)}:${pad(minutes)}:${pad(left % 60)}`
}
