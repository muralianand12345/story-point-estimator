/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
        PORT: process.env.PORT,
    },
    // Enable Edge Runtime globally or for specific paths
    experimental: {
        serverComponentsExternalPackages: ["@prisma/client"],
    },
    // Add rewrites to simplify the WebSocket URL path
    async rewrites() {
        return [
            {
                source: '/socket.io/:path*',
                destination: '/api/websocket',
            },
        ];
    },
};

module.exports = nextConfig;