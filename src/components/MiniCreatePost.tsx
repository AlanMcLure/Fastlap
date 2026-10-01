'use client'

import { UserAvatar } from './UserAvatar'
import type { Session } from 'next-auth'
import { usePathname, useRouter } from 'next/navigation'
import { FC } from 'react'

interface MiniCreatePostProps {
  session: Session | null
}

/** A fake input at the top of a community: clicking it opens the post editor. */
const MiniCreatePost: FC<MiniCreatePostProps> = ({ session }) => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div>
      <button
        type='button'
        onClick={() => router.push(pathname + '/submit')}
        className='flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-3 text-left transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
        <UserAvatar
          user={{
            name: session?.user.name || null,
            image: session?.user.image || null,
          }}
        />
        <span className='flex-1 text-muted-foreground'>Crear publicación</span>
        <span className='label hidden sm:inline'>NUEVA</span>
      </button>
    </div>
  )
}

export default MiniCreatePost
