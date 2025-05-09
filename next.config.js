/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
        PORT: process.env.PORT,
    },
};

module.exports = nextConfig;