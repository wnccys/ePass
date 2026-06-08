import type { NextConfig } from "next";
import "./env";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "5mb",
        },
    },
};

export default nextConfig;
