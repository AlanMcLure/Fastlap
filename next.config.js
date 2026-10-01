/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'utfs.io' },
    ],
  },
  output: 'standalone',
  // Metadata (title, description, canonical, Open Graph) is always in <head>, never streamed into <body>:
  // link-preview scrapers and SEO tools that do not run JavaScript read it there.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        // basic hardening on every response (a Content-Security-Policy is still pending: see docs/DESPLIEGUE.md)
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // only honoured over HTTPS, ignored on plain http
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
      {
        // the service worker must always be revalidated, or a bad version could stick
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true, // Cambia a false si prefieres una redirección temporal
      },
    ];
  },
}

module.exports = nextConfig
