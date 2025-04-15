import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/:path*", // Match all routes
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*", // Allow all origins
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS", // Allow specific HTTP methods
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "X-Requested-With, Content-Type, Authorization", // Allow specific headers
                    },
                ],
            },
        ];
    },
};

export default nextConfig;