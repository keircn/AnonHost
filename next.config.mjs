/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'keiran.cc'
      },
      {
        protocol: 'https',
        hostname: 'r2.keiran.cc'
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com'
      },
      {
        protocol: 'http',
        hostname: 'localhost'
      },
      {
        protocol: 'https',
        hostname: 'pub-cff3d0b858c547bdac31dff45cc07939.r2.dev'
      }
    ]
  },

  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
