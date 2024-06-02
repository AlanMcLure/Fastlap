/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['uploadthing.com', 'lh3.googleusercontent.com', 'utfs.io'],
  },
  output: 'standalone',
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
