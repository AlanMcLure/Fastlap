import { RACE_DURATION_HOURS, sessionStart, weekendSessions } from '@/lib/f1/calendar'
import type { Race } from '@/lib/f1/schemas'

/** Community that hosts the automatic race threads. */
export const RACE_THREAD_COMMUNITY = 'formula1'
/** Hours after the race ends during which "Driver of the Day" can be voted. */
export const DOTD_WINDOW_HOURS = 48

const HOUR = 3600 * 1000

export type DotdState = 'not-open' | 'open' | 'closed'

/** Driver of the Day opens when the race ends (and has results) and closes 48 h later. */
export function dotdState(race: Race, hasResults: boolean, now = new Date()): DotdState {
  const end = sessionStart(race.date, race.time).start.getTime() + RACE_DURATION_HOURS * HOUR
  if (now.getTime() < end || !hasResults) return 'not-open'
  return now.getTime() < end + DOTD_WINDOW_HOURS * HOUR ? 'open' : 'closed'
}

/** The weekend thread exists from the first session onwards. */
export function weekendStarted(race: Race, now = new Date()): boolean {
  const first = weekendSessions(race)[0]
  return now.getTime() >= first.start.getTime()
}

export const raceThreadTitle = (race: Race) => `Hilo del GP: ${race.raceName} ${race.season}`.slice(0, 128)

/** EditorJS content of the thread's first post. */
export function raceThreadContent(race: Race) {
  const { locality, country } = race.Circuit.Location
  return {
    time: 0,
    version: '2.30.0',
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: `Ronda ${race.round} de la temporada ${race.season}: ${race.raceName} en ${race.Circuit.circuitName} (${locality}, ${country}). Comentad aquí las sesiones del fin de semana, la carrera y el resultado.`,
        },
      },
    ],
  }
}

export interface Tally {
  driverId: string
  votes: number
  /** Share of all votes, 0–100, rounded. */
  percent: number
}

/** Orders votes high to low (ties by driver id) and adds the percentage of the total. */
export function tally(counts: { driverId: string; votes: number }[]): Tally[] {
  const total = counts.reduce((sum, c) => sum + c.votes, 0)
  return [...counts]
    .sort((a, b) => b.votes - a.votes || a.driverId.localeCompare(b.driverId))
    .map((c) => ({ ...c, percent: total === 0 ? 0 : Math.round((c.votes / total) * 100) }))
}
