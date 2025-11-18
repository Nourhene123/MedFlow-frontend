// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/appointments/:path*',
        destination: 'http://localhost:8000/api/appointments/:path*',
      },
    ];
  },
};

export default nextConfig;