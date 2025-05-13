/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    async rewrites() {
        return [
            {
                source: '/server/:path*',
                destination: `${process.env.DENO_SERVER_URL || 'http://localhost:8000'}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;