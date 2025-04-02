/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "keiran.cc",
      "keiran.tech",
      "r2.keiran.cc",
      "cdn.discordapp.com",
      "localhost"
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
