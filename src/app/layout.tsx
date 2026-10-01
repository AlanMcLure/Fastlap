import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
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
}

// Applies the saved theme before first paint so there is no light/dark flash. Dark is the default.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('theme')==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`

export default function RootLayout({
  children,
  authModal,
}: {
  children: React.ReactNode
  authModal: React.ReactNode
}) {
  return (
    <html
      lang='es'
      data-theme='dark'
      suppressHydrationWarning
      className={cn(sans.variable, mono.variable, display.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className='min-h-screen pt-12 bg-background text-foreground antialiased'>
        <Providers>
          <Navbar />
          {authModal}

          <div className='container max-w-7xl mx-auto h-full pt-12'>
            {children}
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
