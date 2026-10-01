import type { PredictionKind } from '@/lib/league'

export type NotificationType = 'POST_COMMENT' | 'COMMENT_REPLY' | 'PREDICTION_CLOSING' | 'PREDICTION_SCORED'

export interface NewNotification {
  userId: string
  type: NotificationType
  body: string
  href: string
  /** Makes the notification idempotent per user; omit for one-off events. */
  dedupeKey?: string
}

/** Hours before a deadline from which the "closing" reminder is generated. */
export const CLOSING_WINDOW_HOURS = 24
/** Scores are announced only for races this recent, so a new user is not flooded with old ones. */
export const SCORE_WINDOW_DAYS = 14

export function excerpt(text: string, max = 80): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

interface CommentEvent {
  actorId: string
  actorName: string
  commentText: string
  postId: string
  postTitle: string
  postAuthorId: string
  community: string
  /** Author of the comment being replied to, if it is a reply. */
  parentAuthorId?: string | null
}

/**
 * Who hears about a new comment: the author of the comment it replies to, and the post's
 * author. Nobody is notified of their own action, and one person never gets two notifications
 * for the same comment (a reply to the post author's own comment counts as a reply).
 */
export function commentNotifications(event: CommentEvent): NewNotification[] {
  const href = `/r/${event.community}/post/${event.postId}`
  const quote = `«${excerpt(event.commentText)}»`
  const out: NewNotification[] = []

  if (event.parentAuthorId && event.parentAuthorId !== event.actorId) {
    out.push({
      userId: event.parentAuthorId,
      type: 'COMMENT_REPLY',
      body: `${event.actorName} ha respondido a tu comentario: ${quote}`,
      href,
    })
  }
  const alreadyNotified = out.some((n) => n.userId === event.postAuthorId)
  if (event.postAuthorId !== event.actorId && !alreadyNotified) {
    out.push({
      userId: event.postAuthorId,
      type: 'POST_COMMENT',
      body: `${event.actorName} ha comentado en «${excerpt(event.postTitle, 60)}»: ${quote}`,
      href,
    })
  }
  return out
}

/** True when `deadline` is in the future but within the reminder window. */
export function closingSoon(deadline: Date, now = new Date()): boolean {
  const left = deadline.getTime() - now.getTime()
  return left > 0 && left <= CLOSING_WINDOW_HOURS * 3600 * 1000
}

const kindLabel = (kind: PredictionKind) => (kind === 'SPRINT' ? 'el sprint' : 'la carrera')

export function closingBody(community: string, raceName: string, kind: PredictionKind, deadline: Date, now = new Date()): string {
  const hours = Math.max(1, Math.round((deadline.getTime() - now.getTime()) / 3600_000))
  return `r/${community}: se cierran los pronósticos de ${kindLabel(kind)} del ${raceName} en ${hours} ${hours === 1 ? 'hora' : 'horas'} y aún no has pronosticado.`
}

export function scoredBody(community: string, raceName: string, kind: PredictionKind, points: number): string {
  return `r/${community}: tu pronóstico de ${kindLabel(kind)} del ${raceName}: ${points} ${points === 1 ? 'punto' : 'puntos'}.`
}

export const closingKey = (leagueId: string, round: number, kind: PredictionKind) => `closing:${leagueId}:${round}:${kind}`
export const scoredKey = (leagueId: string, round: number, kind: PredictionKind) => `scored:${leagueId}:${round}:${kind}`

/** True while a race is recent enough to announce its scores. */
export function recentRace(raceDate: string, now = new Date()): boolean {
  const age = now.getTime() - Date.parse(`${raceDate}T00:00:00Z`)
  return age >= 0 && age <= SCORE_WINDOW_DAYS * 24 * 3600 * 1000
}
