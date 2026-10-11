'use client'

import { useIntersection } from '@mantine/hooks'
import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FC, useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import type { FeedPage } from '@/lib/feed'
import Post from './Post'
import { SkeletonCard } from './SkeletonCard'

interface PostFeedProps {
  initialPage: FeedPage
  subredditName?: string
  username?: string
  /** `all`: the home feed without the followed-communities filter. */
  feed?: 'all'
}

/**
 * Infinite feed: the server renders the first page, the next ones load when the end of the list
 * comes near (cursor pagination, so posts published meanwhile neither repeat nor go missing).
 */
const PostFeed: FC<PostFeedProps> = ({ initialPage, subredditName, username, feed }) => {
  const { ref, entry } = useIntersection({ rootMargin: '600px' })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError } = useInfiniteQuery({
    queryKey: ['posts', { subredditName, username, feed }],
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get<FeedPage>('/api/posts', {
        params: { subredditName, username, feed, cursor: pageParam ?? undefined },
      })
      return data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] },
  })

  const visible = entry?.isIntersecting ?? false
  useEffect(() => {
    if (visible && hasNextPage && !isFetchingNextPage && !isError) fetchNextPage()
  }, [visible, hasNextPage, isFetchingNextPage, isError, fetchNextPage])

  const posts = data.pages.flatMap((page) => page.posts)

  if (posts.length === 0) {
    return (
      <p className='rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground'>
        Todavía no hay publicaciones.
      </p>
    )
  }

  return (
    <ul className='flex flex-col border-t border-border' aria-busy={isFetchingNextPage}>
      {posts.map((post) => (
        <li key={post.id}>
          <Post post={post} />
        </li>
      ))}

      <li ref={ref} className='py-6'>
        {isFetchingNextPage ? (
          <SkeletonCard />
        ) : isError ? (
          <div className='flex flex-col items-center gap-2 text-sm text-muted-foreground'>
            <p>No se han podido cargar más publicaciones.</p>
            <Button variant='outline' size='sm' onClick={() => fetchNextPage()}>
              Reintentar
            </Button>
          </div>
        ) : !hasNextPage ? (
          <p className='label text-center'>NO HAY MÁS PUBLICACIONES</p>
        ) : null}
      </li>
    </ul>
  )
}

export default PostFeed
