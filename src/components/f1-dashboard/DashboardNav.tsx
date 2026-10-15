'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Section {
  href: string
  label: string
  exact?: boolean
  prefixes?: string[]
}

const SECTIONS: Section[] = [
  { href: '/f1-dashboard', label: 'RESUMEN', exact: true },
  { href: '/f1-dashboard/clasificacion', label: 'CLASIFICACIÓN', prefixes: ['/f1-dashboard/clasificacion'] },
  { href: '/f1-dashboard/carreras', label: 'CARRERAS', prefixes: ['/f1-dashboard/carreras', '/f1-dashboard/carrera/'] },
  { href: '/f1-dashboard/pilotos', label: 'PILOTOS', prefixes: ['/f1-dashboard/pilotos', '/f1-dashboard/piloto/'] },
  { href: '/f1-dashboard/comparar', label: 'COMPARAR', prefixes: ['/f1-dashboard/comparar'] },
  { href: '/f1-dashboard/noticias', label: 'NOTICIAS', prefixes: ['/f1-dashboard/noticias', '/f1-dashboard/noticia/'] },
]

// Sections that need api-f1 (F1_STATS_URL): shown after CARRERAS.
const STATS_SECTIONS: Section[] = [
  { href: '/f1-dashboard/temporada', label: 'TEMPORADA', prefixes: ['/f1-dashboard/temporada'] },
  { href: '/f1-dashboard/records', label: 'RÉCORDS', prefixes: ['/f1-dashboard/records', '/f1-dashboard/circuito/'] },
]

/** Section switcher of the F1 dashboard: a scrollable row of pills, usable at any width. */
const DashboardNav = ({ stats = false }: { stats?: boolean }) => {
  const pathname = usePathname()
  const sections = stats ? [...SECTIONS.slice(0, 3), ...STATS_SECTIONS, ...SECTIONS.slice(3)] : SECTIONS

  return (
    <nav aria-label='Secciones de F1' className='-mx-1 overflow-x-auto px-1 pb-1'>
      <ul className='inline-flex min-w-max gap-1 rounded-full border border-input p-0.5'>
        {sections.map((section) => {
          const active = section.exact
            ? pathname === section.href
            : (section.prefixes ?? []).some((prefix) => pathname.startsWith(prefix))
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? 'page' : undefined}
                className={`label block whitespace-nowrap rounded-full px-4 py-2 transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'hover:text-display'
                }`}>
                {section.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default DashboardNav
