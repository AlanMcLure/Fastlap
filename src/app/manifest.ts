import type { MetadataRoute } from 'next'

/** Web app manifest: lets FastLap be installed on the home screen / desktop. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'FastLap · la red social de la Fórmula 1',
    short_name: 'FastLap',
    description: 'Comunidades, hilos de cada Gran Premio, ligas de pronósticos y datos de la temporada.',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    categories: ['sports', 'social'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Pronósticos', short_name: 'Pronósticos', url: '/pronosticos', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Notificaciones', short_name: 'Avisos', url: '/notificaciones', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
