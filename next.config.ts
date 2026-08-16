import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Preview images are admin-entered URLs, videos are served from /public.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
