import type { Metadata, Viewport } from 'next'
import MobileNav from '@/components/MobileNav'
import Navbar from '@/components/Navbar'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { getAuthSession } from '@/lib/auth'
import { siteUrl } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { Doto, Space_Grotesk, Space_Mono } from 'next/font/google'
import Providers from '@/components/Providers'
import { Toaster } from '@/components/ui/Toaster'

import '@/styles/globals.css'

const sans = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-mono', display: 'swap' })
const display = Doto({ weight: ['700'], subsets: ['latin'], variable: '--font-display', display: 'swap' })

const description = 'La red social para los aficionados de la Fórmula 1: comunidades, hilos de cada Gran Premio, ligas de pronósticos y datos de la temporada.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'FastLap · la red social de la Fórmula 1', template: '%s · FastLap' },
  description,
  applicationName: 'FastLap',
  openGraph: { type: 'website', siteName: 'FastLap', locale: 'es_ES', title: 'FastLap', description },
  twitter: { card: 'summary_large_image' },
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'FastLap', statusBarStyle: 'black-translucent' },
}

// The app is dark by default: the browser chrome matches it.
export const viewport: Viewport = { themeColor: '#000000', colorScheme: 'dark light' }

// Applies the saved theme before first paint so there is no light/dark flash. Dark is the default.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`

export default async function RootLayout({
  children,
  authModal,
}: {
  children: React.ReactNode
  authModal: React.ReactNode
}) {
  const session = await getAuthSession()
  const username = session?.user ? session.user.username ?? '' : null

  return (
    <html
      lang='es'
      data-theme='dark'
      suppressHydrationWarning
      className={cn(sans.variable, mono.variable, display.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* browser extensions (e.g. ColorZilla) add attributes to <body> before React hydrates */}
      <body className='min-h-screen bg-background pb-16 pt-24 text-foreground antialiased md:pb-0' suppressHydrationWarning>
        <Providers>
          <a
            href='#contenido'
            className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground'>
            Saltar al contenido
          </a>
          <Navbar />
          {authModal}

          <main id='contenido' tabIndex={-1} className='container max-w-7xl mx-auto h-full pt-6 focus:outline-none'>
            {children}
          </main>
          <MobileNav username={username} />
        </Providers>
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
