/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    env: {
        NEXT_PUBLIC_DENO_API_URL: process.env.NEXT_PUBLIC_DENO_API_URL,
        NEXT_PUBLIC_DENO_WS_URL: process.env.NEXT_PUBLIC_DENO_WS_URL,
    },
};

module.exports = nextConfig;