import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Skip WebSocket when doing SSR
            config.externals = [...(config.externals || []), 'ws'];
        }
        return config;
    }
};

export default nextConfig;