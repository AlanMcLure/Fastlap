import { RACE_DURATION_HOURS, type WeekendSession } from '@/lib/f1/calendar'

export type CommentSort = 'top' | 'new'

/** `?orden=` of a post page; race threads read newest first unless asked otherwise. */
export function parseCommentSort(value: string | undefined, isRaceThread: boolean): CommentSort {
  if (value === 'mejores') return 'top'
  if (value === 'nuevos') return 'new'
  return isRaceThread ? 'new' : 'top'
}

/** Best (highest score, then oldest) or newest first. Does not mutate the input. */
export function sortComments<T extends { score: number; createdAt: Date }>(items: T[], sort: CommentSort): T[] {
  return [...items].sort((a, b) =>
    sort === 'new'
      ? b.createdAt.getTime() - a.createdAt.getTime()
      : b.score - a.score || a.createdAt.getTime() - b.createdAt.getTime()
  )
}

/** Hours a session is shown as running before it counts as done (practice and qualifying ~1 h, sprint ~1 h). */
const SESSION_HOURS = 1.5

export type SessionState = 'done' | 'live' | 'upcoming'

/** Whether a weekend session is over, on now, or still to come (the race lasts longer). */
export function sessionState(session: Pick<WeekendSession, 'key' | 'start'>, now = new Date()): SessionState {
  const hours = session.key === 'Race' ? RACE_DURATION_HOURS : SESSION_HOURS
  const start = session.start.getTime()
  if (now.getTime() < start) return 'upcoming'
  return now.getTime() < start + hours * 3600 * 1000 ? 'live' : 'done'
}
