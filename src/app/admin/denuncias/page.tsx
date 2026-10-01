import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import ModerationActions from '@/components/ModerationActions'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { groupReports, reasonLabel } from '@/lib/moderation'
import { excerpt } from '@/lib/notifications'
import { postPreview } from '@/lib/postPreview'
import { formatTimeToNow } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Moderación', robots: { index: false, follow: false } }

const LOG_SIZE = 15
const ACTION_LABEL: Record<string, string> = {
  REMOVE_POST: 'Publicación eliminada',
  REMOVE_COMMENT: 'Comentario eliminado',
  DISMISS: 'Denuncias descartadas',
}

/** Moderation queue for admins. Anyone else gets a 404, so the page does not reveal itself. */
const ModerationPage = async () => {
  const session = await getAuthSession()
  if (session?.user?.role !== 'ADMIN') notFound()

  const [reports, log] = await Promise.all([
    db.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
      include: {
        post: { select: { id: true, title: true, content: true, author: { select: { username: true } }, subreddit: { select: { name: true } } } },
        comment: {
          select: { id: true, text: true, author: { select: { username: true } }, post: { select: { id: true, title: true, subreddit: { select: { name: true } } } } },
        },
      },
    }),
    db.moderationLog.findMany({ orderBy: { createdAt: 'desc' }, take: LOG_SIZE }),
  ])

  const groups = groupReports(reports)
  const byKey = new Map(reports.map((r) => [r.targetKey, r]))

  return (
    <div className='mx-auto max-w-3xl space-y-8 py-6'>
      <header>
        <p className='label'>ADMINISTRACIÓN</p>
        <h1 className='mt-2 text-3xl font-bold text-display'>Moderación</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          {groups.length === 0 ? 'No hay denuncias pendientes.' : `${groups.length} ${groups.length === 1 ? 'contenido denunciado' : 'contenidos denunciados'}, los más denunciados primero.`}
        </p>
      </header>

      <ul className='space-y-4'>
        {groups.map((group) => {
          const report = byKey.get(group.targetKey)!
          const isPost = group.type === 'POST'
          const author = (isPost ? report.post?.author.username : report.comment?.author.username) ?? 'desconocido'
          const community = isPost ? report.post?.subreddit.name : report.comment?.post.subreddit.name
          const postId = isPost ? report.post?.id : report.comment?.post.id
          const text = isPost ? report.post?.title ?? '' : report.comment?.text ?? ''
          const body = isPost ? postPreview(report.post?.content, 280).text : ''

          return (
            <li key={group.targetKey} className='space-y-4 rounded-xl border border-input bg-card p-5'>
              <div className='flex flex-wrap items-baseline justify-between gap-2'>
                <p className='label'>{isPost ? 'PUBLICACIÓN' : 'COMENTARIO'} · r/{community} · u/{author}</p>
                <p className='label'>
                  {group.count} {group.count === 1 ? 'DENUNCIA' : 'DENUNCIAS'} · {formatTimeToNow(group.firstReportedAt).toUpperCase()}
                </p>
              </div>

              <div>
                <p className='whitespace-pre-wrap break-words text-foreground'>{isPost ? text : excerpt(text, 400)}</p>
                {body && <p className='mt-1 line-clamp-3 text-sm text-muted-foreground'>{body}</p>}
                <Link
                  href={`/r/${community}/post/${postId}`}
                  className='mt-2 inline-block text-sm text-display underline underline-offset-4'>
                  Ver en contexto
                </Link>
              </div>

              <ul className='flex flex-wrap gap-2' aria-label='Motivos'>
                {group.reasons.map((r) => (
                  <li key={r.reason} className='label rounded-full border border-input px-3 py-1.5'>
                    {reasonLabel(r.reason).toUpperCase()} · {r.count}
                  </li>
                ))}
              </ul>

              {group.details.length > 0 && (
                <ul className='space-y-1 border-l border-input pl-4 text-sm text-muted-foreground'>
                  {group.details.slice(0, 3).map((d, i) => <li key={i}>«{d}»</li>)}
                </ul>
              )}

              <ModerationActions type={group.type} id={group.id} />
            </li>
          )
        })}
      </ul>

      {log.length > 0 && (
        <section aria-labelledby='log-title' className='space-y-3'>
          <h2 id='log-title' className='label'>REGISTRO RECIENTE</h2>
          <ul className='divide-y divide-border rounded-xl border border-input bg-card'>
            {log.map((entry) => (
              <li key={entry.id} className='flex items-baseline justify-between gap-4 px-5 py-3 text-sm'>
                <span className='min-w-0'>
                  <span className='block text-foreground'>{ACTION_LABEL[entry.action] ?? entry.action}</span>
                  <span className='block truncate text-muted-foreground'>«{entry.excerpt}»</span>
                </span>
                <span className='label shrink-0'>{formatTimeToNow(entry.createdAt).toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default ModerationPage
