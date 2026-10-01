// Integration test against a real Postgres (schema applied with `prisma db push`).
// Run: TEST_DATABASE_URL=postgresql://... yarn test accountExport
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const url = process.env.TEST_DATABASE_URL
if (url) process.env.DATABASE_URL = url

vi.mock('server-only', () => ({}))

describe('exportFileName', () => {
  it('usa el nombre de usuario y la fecha, sin caracteres raros', async () => {
    const { exportFileName } = await import('@/lib/accountExport')
    const day = new Date('2026-10-01T12:00:00Z')
    expect(exportFileName('ana_f1', day)).toBe('fastlap-datos-ana_f1-2026-10-01.json')
    expect(exportFileName('a/../b"', day)).toBe('fastlap-datos-ab-2026-10-01.json')
    expect(exportFileName(null, day)).toBe('fastlap-datos-usuario-2026-10-01.json')
  })
})

describe.skipIf(!url)('collectUserData (Postgres)', () => {
  let db: typeof import('@/lib/db').db
  let collectUserData: typeof import('@/lib/accountExport').collectUserData

  beforeAll(async () => {
    ;({ db } = await import('@/lib/db'))
    ;({ collectUserData } = await import('@/lib/accountExport'))
    await db.$executeRawUnsafe(
      'TRUNCATE "Notification","Report","ModerationLog","Prediction","PredictionLeague","DriverOfDayVote","CommentVote","Vote","Comment","RaceWeekend","Post","Subscription","Subreddit","Account","Session","User" CASCADE'
    )
  })
  afterAll(async () => {
    await db.$disconnect()
  })

  it('reúne los datos de la persona y nada de los demás ni credenciales', async () => {
    const ana = await db.user.create({ data: { email: 'ana@x.test', username: 'ana_f1', name: 'Ana' } })
    const bob = await db.user.create({ data: { email: 'bob@x.test', username: 'bob' } })
    const sub = await db.subreddit.create({ data: { name: 'f1', creatorId: ana.id } })
    await db.subscription.create({ data: { userId: ana.id, subredditId: sub.id } })
    const post = await db.post.create({ data: { title: 'Mi post', authorId: ana.id, subredditId: sub.id } })
    const bobPost = await db.post.create({ data: { title: 'De Bob', authorId: bob.id, subredditId: sub.id } })
    await db.comment.create({ data: { text: 'mío', authorId: ana.id, postId: bobPost.id } })
    await db.comment.create({ data: { text: 'de bob', authorId: bob.id, postId: post.id } })
    await db.vote.create({ data: { userId: ana.id, postId: bobPost.id, type: 'UP' } })
    await db.vote.create({ data: { userId: bob.id, postId: post.id, type: 'UP' } })
    await db.account.create({
      data: { userId: ana.id, type: 'oidc', provider: 'google', providerAccountId: 'g1', access_token: 'SECRET-A', id_token: 'SECRET-B' },
    })
    await db.driverOfDayVote.create({ data: { userId: ana.id, season: 2026, round: 3, driverId: 'norris' } })
    const league = await db.predictionLeague.create({ data: { subredditId: sub.id, season: 2026 } })
    await db.prediction.create({
      data: { userId: ana.id, leagueId: league.id, round: 3, kind: 'RACE', p1: 'norris', p2: 'piastri', p3: 'verstappen' },
    })
    await db.notification.create({ data: { userId: ana.id, type: 'POST_COMMENT', body: 'hola', href: '/' } })
    await db.notification.create({ data: { userId: bob.id, type: 'POST_COMMENT', body: 'otro', href: '/' } })
    await db.moderationLog.create({
      data: { moderatorId: bob.id, action: 'REMOVE_POST', targetKey: 'post:9', excerpt: 'x', authorId: ana.id, reportCount: 2 },
    })

    const data = await collectUserData(ana.id)
    expect(data).not.toBeNull()
    expect(data!.profile).toMatchObject({ email: 'ana@x.test', username: 'ana_f1' })
    expect(data!.communitiesFollowed).toEqual(['f1'])
    expect(data!.communitiesCreated.map((c) => c.name)).toEqual(['f1'])
    expect(data!.posts).toHaveLength(1)
    expect(data!.posts[0]).toMatchObject({ title: 'Mi post', community: 'f1' })
    expect(data!.comments.map((c) => c.text)).toEqual(['mío'])
    expect(data!.postVotes).toHaveLength(1)
    expect(data!.driverOfTheDayVotes).toHaveLength(1)
    expect(data!.predictions[0]).toMatchObject({ season: 2026, community: 'f1', p1: 'norris' })
    expect(data!.notifications.map((n) => n.body)).toEqual(['hola'])
    expect(data!.moderationDecisionsAboutYourContent).toHaveLength(1)
    expect(data!.loginMethods).toEqual([{ provider: 'google', providerAccountId: 'g1', type: 'oidc' }])

    const json = JSON.stringify(data)
    expect(json).not.toContain('SECRET')
    expect(json).not.toContain('bob@x.test')
    expect(json).not.toContain('de bob')
  })

  it('devuelve null si el usuario no existe', async () => {
    expect(await collectUserData('no-existe')).toBeNull()
  })
})
