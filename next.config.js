/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['uploadthing.com', 'lh3.googleusercontent.com', 'utfs.io'],
  },
  output: 'standalone'
}

module.exports = nextConfig
