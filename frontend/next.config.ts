import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_RUNTIME === 'docker' ? 'standalone' : undefined,
};

export default nextConfig;
