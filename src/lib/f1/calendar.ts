import type { Race } from './schemas'

/** Hours a race weekend's main event is considered "in progress" after its start. */
export const RACE_DURATION_HOURS = 3

export interface WeekendSession {
  key: 'FirstPractice' | 'SecondPractice' | 'ThirdPractice' | 'SprintQualifying' | 'Sprint' | 'Qualifying' | 'Race'
  label: string
  start: Date
  /** false when the API gives only a date (the time is then a placeholder). */
  timeKnown: boolean
}

const LABELS: Record<WeekendSession['key'], string> = {
  FirstPractice: 'Libres 1',
  SecondPractice: 'Libres 2',
  ThirdPractice: 'Libres 3',
  SprintQualifying: 'Clasificación sprint',
  Sprint: 'Sprint',
  Qualifying: 'Clasificación',
  Race: 'Carrera',
}

/** Start of a session; falls back to noon UTC of that date when the time is unknown. */
export function sessionStart(date: string, time?: string): { start: Date; timeKnown: boolean } {
  return {
    start: new Date(`${date}T${time ?? '12:00:00Z'}`),
    timeKnown: time !== undefined,
  }
}

/** All sessions of a race weekend, in chronological order, race included. */
export function weekendSessions(race: Race): WeekendSession[] {
  const sessions: WeekendSession[] = []

  const add = (key: WeekendSession['key'], source?: { date: string; time?: string }) => {
    if (source) sessions.push({ key, label: LABELS[key], ...sessionStart(source.date, source.time) })
  }

  add('FirstPractice', race.FirstPractice)
  add('SecondPractice', race.SecondPractice)
  add('ThirdPractice', race.ThirdPractice)
  add('SprintQualifying', race.SprintQualifying)
  add('Sprint', race.Sprint)
  add('Qualifying', race.Qualifying)
  add('Race', { date: race.date, time: race.time })

  return sessions.sort((a, b) => a.start.getTime() - b.start.getTime())
}

export type RaceStatus = 'finished' | 'in-progress' | 'upcoming'

export function raceStatus(race: Race, now = new Date()): RaceStatus {
  const { start } = sessionStart(race.date, race.time)
  const end = start.getTime() + RACE_DURATION_HOURS * 3600 * 1000
  if (now.getTime() >= end) return 'finished'
  if (now.getTime() >= start.getTime()) return 'in-progress'
  return 'upcoming'
}

/** The first race that has not finished yet (so the race day itself still counts), or null. */
export function findUpcomingRace(races: Race[], now = new Date()): Race | null {
  return races.find((race) => raceStatus(race, now) !== 'finished') ?? null
}
