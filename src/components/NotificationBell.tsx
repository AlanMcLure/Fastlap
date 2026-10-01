'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Bell } from 'lucide-react'
import Link from 'next/link'

const POLL_MS = 60_000

/** Bell with the unread count; polls once a minute and when the tab regains focus. */
const NotificationBell = () => {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => (await axios.get<{ count: number }>('/api/notifications/unread')).data.count,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  })
  const count = data ?? 0

  return (
    <Link
      href='/notificaciones'
      aria-label={count > 0 ? `Notificaciones: ${count} sin leer` : 'Notificaciones'}
      className='relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
      <Bell className='h-4 w-4' aria-hidden='true' />
      {count > 0 && (
        <span className='absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] leading-4 text-primary-foreground'>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export default NotificationBell
