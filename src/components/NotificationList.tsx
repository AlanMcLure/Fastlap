'use client'

import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC } from 'react'

import { Button } from '@/components/ui/Button'
import { formatTimeToNow } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface NotificationItem {
  id: string
  body: string
  href: string
  read: boolean
  createdAt: string
}

const NotificationList: FC<{ items: NotificationItem[] }> = ({ items }) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mark = async (id?: string) => {
    try {
      await axios.post('/api/notifications/read', id ? { id } : {})
    } finally {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    }
  }

  const unread = items.filter((i) => !i.read).length

  return (
    <div className='space-y-4'>
      {unread > 0 && (
        <Button
          size='sm'
          variant='outline'
          onClick={async () => {
            await mark()
            router.refresh()
          }}>
          Marcar todo como leído
        </Button>
      )}

      <ul className='divide-y divide-border rounded-xl border border-input bg-card'>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={() => !item.read && mark(item.id)}
              className='flex items-start gap-3 px-5 py-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
              <span
                aria-hidden='true'
                className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-transparent' : 'bg-primary')}
              />
              <span className='min-w-0'>
                <span className={cn('block', item.read ? 'text-muted-foreground' : 'text-foreground')}>
                  {!item.read && <span className='sr-only'>Sin leer: </span>}
                  {item.body}
                </span>
                <span className='label mt-1 block'>{formatTimeToNow(new Date(item.createdAt)).toUpperCase()}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default NotificationList
