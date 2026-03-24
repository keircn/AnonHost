/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '*',
                pathname: '/**',
            },
        ],
    },

    serverExternalPackages: [],

    experimental: {
        webpackBuildWorker: true,
        parallelServerBuildTraces: true,
        parallelServerCompiles: true,
    },

    typescript: {
        ignoreBuildErrors: true,
    },

    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: '/api/upload/storage/:path*',
            },
        ];
    },

    async headers() {
        return [
            {
                source: '/uploads/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000',
                    },
                ],
            },
            {
                source: '/api/upload/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=0',
                    },
                    {
                        key: 'Connection',
                        value: 'keep-alive',
                    },
                    {
                        key: 'Keep-Alive',
                        value: 'timeout=600',
                    },
                ],
            },
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=0',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
