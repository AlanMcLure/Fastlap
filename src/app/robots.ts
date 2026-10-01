import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/seo'

/** Public pages are open; account, data dashboard, API and prototypes are not for crawlers. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings', '/notificaciones', '/admin', '/f1-dashboard', '/live', '/premium', '/sign-in', '/sign-up', '/not-authorized'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
