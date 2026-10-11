import Link from 'next/link'

import PostFeed from '@/components/PostFeed'
import { getFeedPage } from '@/lib/feed'

/**
 * Home feed: the followed communities of a signed-in user, otherwise (or if they follow none) every
 * post. `all` shows every post (the "Todo" tab).
 */
const HomeFeed = async ({ viewerId, all = false }: { viewerId?: string; all?: boolean }) => {
  const page = await getFeedPage({ scope: all ? { kind: 'all' } : { kind: 'home', viewerId }, viewerId })

  return (
    <div>
      {page.showingAll && (
        <p className='border-t border-border py-4 text-sm text-muted-foreground'>
          Aún no sigues ninguna comunidad, así que ves todas las publicaciones. Únete a las que te interesen para
          personalizar tu feed, o{' '}
          <Link href='/r/create' className='text-display underline underline-offset-2'>
            crea la tuya
          </Link>
          .
        </p>
      )}
      <PostFeed initialPage={page} feed={all ? 'all' : undefined} />
    </div>
  )
}

export default HomeFeed
