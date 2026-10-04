import Link from 'next/link'

import PostFeed from '@/components/PostFeed'
import { getFeedPage } from '@/lib/feed'

/** Home feed: the followed communities of a signed-in user, otherwise (or if they follow none) every post. */
const HomeFeed = async ({ viewerId }: { viewerId?: string }) => {
  const page = await getFeedPage({ scope: { kind: 'home', viewerId }, viewerId })

  return (
    <div className='space-y-4'>
      {page.showingAll && (
        <p className='rounded-xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground'>
          Aún no sigues ninguna comunidad, así que ves todas las publicaciones. Únete a las que te interesen para
          personalizar tu feed, o{' '}
          <Link href='/r/create' className='text-display underline underline-offset-2'>
            crea la tuya
          </Link>
          .
        </p>
      )}
      <PostFeed initialPage={page} />
    </div>
  )
}

export default HomeFeed
