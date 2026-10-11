'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export interface NavItem {
  href: string
  label: string
  /** Paths that also mark this item as current (e.g. "/gp" for every GP hub). */
  match?: string
}

export const isCurrent = (pathname: string, item: NavItem) =>
  item.href === '/' ? pathname === '/' : pathname.startsWith(item.match ?? item.href)

/** Desktop navigation in the top bar; the current section is underlined. */
const NavLinks = ({ items }: { items: NavItem[] }) => {
  const pathname = usePathname()
  return (
    <nav aria-label='Secciones' className='hidden h-full items-stretch gap-5 md:flex'>
      {items.map((item) => {
        const current = isCurrent(pathname, item)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'flex items-center border-b-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors',
              current ? 'border-display text-display' : 'border-transparent text-muted-foreground hover:text-display'
            )}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default NavLinks
