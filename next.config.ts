import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // 阿里云部署需要
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
