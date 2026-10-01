import type { MetadataRoute } from 'next'

import { db } from '@/lib/db'
import { getCalendar } from '@/lib/f1/queries'
import { weekendStarted } from '@/lib/raceHub'
import { absoluteUrl } from '@/lib/seo'

// Built per request (and cached by crawlers): it reads the database.
export const dynamic = 'force-dynamic'

const MAX_POSTS = 5000

/**
 * Home, FAQs, every community and post, and the race weekends already started. A source that
 * fails (database, F1 API) only drops its own entries: the sitemap itself never errors.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'hourly', priority: 1 },
    { url: absoluteUrl('/faqs'), changeFrequency: 'monthly', priority: 0.3 },
    { url: absoluteUrl('/pronosticos'), changeFrequency: 'daily', priority: 0.7 },
  ]

  try {
    const [communities, posts] = await Promise.all([
      db.subreddit.findMany({ select: { name: true, updatedAt: true } }),
      db.post.findMany({
        select: { id: true, updatedAt: true, subreddit: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: MAX_POSTS,
      }),
    ])
    for (const c of communities) {
      entries.push({ url: absoluteUrl(`/r/${c.name}`), lastModified: c.updatedAt, changeFrequency: 'daily', priority: 0.8 })
    }
    for (const p of posts) {
      entries.push({
        url: absoluteUrl(`/r/${p.subreddit.name}/post/${p.id}`),
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  } catch (error) {
    console.error('Sitemap: database entries skipped', error)
  }

  try {
    const now = new Date()
    for (const race of await getCalendar('current')) {
      if (weekendStarted(race, now)) {
        entries.push({ url: absoluteUrl(`/gp/${race.season}/${race.round}`), changeFrequency: 'daily', priority: 0.7 })
      }
    }
  } catch (error) {
    console.error('Sitemap: calendar entries skipped', error)
  }

  return entries
}
