// Integration test against a real Postgres (schema applied with `prisma db push`).
// Run: TEST_DATABASE_URL=postgresql://... yarn test accountDeletion
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const url = process.env.TEST_DATABASE_URL
if (url) process.env.DATABASE_URL = url

vi.mock('server-only', () => ({}))
vi.mock('@/lib/redis', () => ({ invalidatePostCache: vi.fn(async () => undefined) }))

describe.skipIf(!url)('deleteAccount (Postgres)', () => {
  let db: typeof import('@/lib/db').db
  let deleteAccount: typeof import('@/lib/accountDeletion').deleteAccount

  beforeAll(async () => {
    ;({ db } = await import('@/lib/db'))
    ;({ deleteAccount } = await import('@/lib/accountDeletion'))
    await db.$executeRawUnsafe(
      'TRUNCATE "Notification","Report","ModerationLog","Prediction","PredictionLeague","DriverOfDayVote","CommentVote","Vote","Comment","RaceWeekend","Post","Subscription","Subreddit","Account","Session","User" CASCADE'
    )
  })
  afterAll(async () => {
    await db.$disconnect()
  })

  it('anonimiza lo escrito y borra lo personal', async () => {
    const ana = await db.user.create({ data: { email: 'ana@x.test', username: 'ana_f1', name: 'Ana' } })
    const bob = await db.user.create({ data: { email: 'bob@x.test', username: 'bob', name: 'Bob' } })
    const sub = await db.subreddit.create({ data: { name: 'f1', creatorId: ana.id } })
    await db.subscription.create({ data: { userId: ana.id, subredditId: sub.id } })
    const post = await db.post.create({ data: { title: 'Hola', authorId: ana.id, subredditId: sub.id } })
    const bobPost = await db.post.create({ data: { title: 'De Bob', authorId: bob.id, subredditId: sub.id } })
    const root = await db.comment.create({ data: { text: 'raíz', authorId: ana.id, postId: bobPost.id } })
    await db.comment.create({ data: { text: 'respuesta de bob', authorId: bob.id, postId: bobPost.id, replyToId: root.id } })
    await db.vote.create({ data: { userId: ana.id, postId: bobPost.id, type: 'UP' } })
    await db.commentVote.create({ data: { userId: ana.id, commentId: root.id, type: 'UP' } })
    await db.account.create({
      data: { userId: ana.id, type: 'oidc', provider: 'google', providerAccountId: 'g1' },
    })
    await db.notification.create({
      data: { userId: bob.id, type: 'COMMENT_REPLY', body: 'u/ana_f1 ha respondido: «x»', href: '/' },
    })
    await db.moderationLog.create({
      data: { moderatorId: bob.id, action: 'DISMISS', targetKey: 'post:1', excerpt: 'x', authorId: ana.id, reportCount: 1 },
    })

    expect(await deleteAccount(ana.id)).toBe(true)

    expect(await db.user.findUnique({ where: { id: ana.id } })).toBeNull()
    expect(await db.account.count()).toBe(0)
    expect(await db.vote.count()).toBe(0)
    expect(await db.commentVote.count()).toBe(0)
    expect(await db.subscription.count()).toBe(0)

    const ghost = await db.user.findUniqueOrThrow({ where: { email: 'eliminado@fastlap.invalid' } })
    expect(ghost.username).toBe('eliminado')
    expect((await db.post.findUniqueOrThrow({ where: { id: post.id } })).authorId).toBe(ghost.id)
    const kept = await db.comment.findUniqueOrThrow({ where: { id: root.id } })
    expect(kept.authorId).toBe(ghost.id)
    expect(await db.comment.count()).toBe(2)
    expect((await db.subreddit.findUniqueOrThrow({ where: { id: sub.id } })).creatorId).toBeNull()

    const note = await db.notification.findFirstOrThrow({ where: { userId: bob.id } })
    expect(note.body).toBe('Un usuario ha respondido: «x»')
    const log = await db.moderationLog.findFirstOrThrow()
    expect(log.authorId).toBeNull()
  })

  it('segunda baja reutiliza al usuario eliminado y un usuario inexistente da false', async () => {
    const eve = await db.user.create({ data: { email: 'eve@x.test', username: 'eve' } })
    expect(await deleteAccount(eve.id)).toBe(true)
    expect(await db.user.count({ where: { email: 'eliminado@fastlap.invalid' } })).toBe(1)
    expect(await deleteAccount(eve.id)).toBe(false)
  })
})
