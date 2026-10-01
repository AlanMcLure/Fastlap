import { z } from 'zod'

export type ReportReason = 'SPAM' | 'ABUSE' | 'OFF_TOPIC' | 'OTHER'
export type TargetType = 'POST' | 'COMMENT'

export const REPORT_REASONS: { value: ReportReason; label: string; help: string }[] = [
  { value: 'SPAM', label: 'Spam o publicidad', help: 'Mensajes repetidos, enlaces comerciales o estafas.' },
  { value: 'ABUSE', label: 'Insultos o acoso', help: 'Ataques personales, discriminación o amenazas.' },
  { value: 'OFF_TOPIC', label: 'Fuera de tema', help: 'No tiene relación con la Fórmula 1 ni con la comunidad.' },
  { value: 'OTHER', label: 'Otro motivo', help: 'Cuéntanos qué ocurre en los detalles.' },
]

export const reasonLabel = (reason: ReportReason) => REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason

export const DETAILS_MAX = 300

export const ReportValidator = z.object({
  type: z.enum(['POST', 'COMMENT']),
  id: z.string().min(1).max(64),
  reason: z.enum(['SPAM', 'ABUSE', 'OFF_TOPIC', 'OTHER']),
  details: z.string().trim().max(DETAILS_MAX).optional(),
})

export const ResolveValidator = z.object({
  type: z.enum(['POST', 'COMMENT']),
  id: z.string().min(1).max(64),
  action: z.enum(['remove', 'dismiss']),
})

export const targetKey = (type: TargetType, id: string) => `${type === 'POST' ? 'post' : 'comment'}:${id}`

export interface ReportRow {
  targetKey: string
  reason: ReportReason
  details?: string | null
  createdAt: Date
}

export interface ReportGroup {
  targetKey: string
  type: TargetType
  id: string
  count: number
  reasons: { reason: ReportReason; count: number }[]
  /// Details written by reporters, newest first, empty ones left out.
  details: string[]
  firstReportedAt: Date
  lastReportedAt: Date
}

/** Reports of the same target become one queue entry; the most reported (then the oldest) first. */
export function groupReports(rows: ReportRow[]): ReportGroup[] {
  const groups = new Map<string, ReportRow[]>()
  for (const row of rows) groups.set(row.targetKey, [...(groups.get(row.targetKey) ?? []), row])

  return [...groups.entries()]
    .map(([key, list]): ReportGroup => {
      const [kind, ...rest] = key.split(':')
      const byReason = new Map<ReportReason, number>()
      for (const r of list) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1)
      const dates = list.map((r) => r.createdAt.getTime())
      return {
        targetKey: key,
        type: kind === 'post' ? 'POST' : 'COMMENT',
        id: rest.join(':'),
        count: list.length,
        reasons: [...byReason.entries()]
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason)),
        details: [...list]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((r) => r.details?.trim())
          .filter((d): d is string => !!d),
        firstReportedAt: new Date(Math.min(...dates)),
        lastReportedAt: new Date(Math.max(...dates)),
      }
    })
    .sort((a, b) => b.count - a.count || a.firstReportedAt.getTime() - b.firstReportedAt.getTime())
}

export const removedBody = (type: TargetType, excerpt: string) =>
  `Un moderador ha eliminado tu ${type === 'POST' ? 'publicación' : 'comentario'} «${excerpt}» por incumplir las normas de la comunidad.`
